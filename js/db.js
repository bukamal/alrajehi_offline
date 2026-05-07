import Dexie from 'dexie';

export const db = new Dexie('AlrajhiAccounting');

db.version(12).stores({
  items: '++id, name, category_id, base_unit_id',
  units: '++id, name, abbreviation',
  categories: '++id, name',
  customers: '++id, name, phone, balance',
  suppliers: '++id, name, phone, balance',
  invoices: '++id, type, reference, date, customer_id, supplier_id, total',
  invoiceLines: '++id, invoice_id, item_id',
  payments: '++id, invoice_id, customer_id, supplier_id, amount, payment_date',
  expenses: '++id, date, amount, notes'
});

// Global Caches
export let itemsCache = [];
export let unitsCache = [];
export let categoriesCache = [];
export let customersCache = [];
export let suppliersCache = [];
export let invoicesCache = [];
export let paymentsCache = [];

export async function refreshCaches() {
  itemsCache.length = 0;
  unitsCache.length = 0;
  categoriesCache.length = 0;
  customersCache.length = 0;
  suppliersCache.length = 0;
  invoicesCache.length = 0;
  paymentsCache.length = 0;

  const [items, units, cats, custs, supps, invs, pmts] = await Promise.all([
    db.items.toArray(),
    db.units.toArray(),
    db.categories.toArray(),
    db.customers.toArray(),
    db.suppliers.toArray(),
    db.invoices.toArray(),
    db.payments.toArray()
  ]);

  itemsCache.push(...items);
  unitsCache.push(...units);
  categoriesCache.push(...cats);
  customersCache.push(...custs);
  suppliersCache.push(...supps);
  invoicesCache.push(...invs);
  paymentsCache.push(...pmts);

  // تحديث الرصيد في الفواتير
  invoicesCache.forEach(inv => {
    const paid = pmts.filter(p => p.invoice_id == inv.id).reduce((sum, p) => sum + (p.amount || 0), 0);
    inv.paid = paid;
    inv.balance = (inv.total || 0) - paid;
  });
}

export async function checkCascadeDelete(table, id) {
  id = Number(id);
  const counts = { invoiceLines: 0, payments: 0, itemsBase: 0, itemUnits: 0 };

  try {
    if (table === 'items') {
      counts.invoiceLines = await db.invoiceLines.where('item_id').equals(id).count();
    } 
    else if (table === 'invoices') {
      counts.invoiceLines = await db.invoiceLines.where('invoice_id').equals(id).count();
      counts.payments = await db.payments.where('invoice_id').equals(id).count();
    } 
    else if (table === 'units') {
      counts.itemsBase = await db.items.where('base_unit_id').equals(id).count();
      counts.itemUnits = await db.items.filter(item => 
        item.item_units && item.item_units.some(u => u.unit_id === id)
      ).count();
    }

    const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
    return { counts, canDelete: total === 0 };

  } catch (e) {
    console.error('[checkCascadeDelete]', e);
    return { counts: {}, canDelete: false };
  }
}

export async function performCascadeDelete(table, id) {
  id = Number(id);

  return db.transaction('rw', 
    db.items, db.invoices, db.invoiceLines, db.payments, db.units, 
    async () => {

    if (table === 'invoices') {
      await db.invoiceLines.where('invoice_id').equals(id).delete();
      await db.payments.where('invoice_id').equals(id).delete();
      await db.invoices.delete(id);

    } else if (table === 'items') {
      await db.invoiceLines.where('item_id').equals(id).delete();
      await db.items.delete(id);

    } else if (table === 'units') {
      const affected = await db.items.filter(item => 
        item.base_unit_id === id || 
        (item.item_units && item.item_units.some(u => u.unit_id === id))
      ).toArray();

      for (const item of affected) {
        if (item.base_unit_id === id) continue;
        item.item_units = (item.item_units || []).filter(u => u.unit_id !== id);
        await db.items.put(item);
      }

      await db.units.delete(id);
    }
  });
}

export async function apiCall(endpoint, method = 'GET', body = null) {
  console.warn('[Offline Mode] apiCall skipped');
  return [];
}

export default db;
