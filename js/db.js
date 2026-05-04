import Dexie from 'https://unpkg.com/dexie@3.2.4/dist/dexie.min.mjs';

const db = new Dexie('AlrajhiDB');
db.version(1).stores({
  items: '++id, name, category_id, item_type, purchase_price, selling_price, quantity, base_unit_id',
  customers: '++id, name, phone, address, balance',
  suppliers: '++id, name, phone, address, balance',
  categories: '++id, name',
  units: '++id, name, abbreviation',
  invoices: '++id, type, customer_id, supplier_id, date, reference, notes, total, status',
  invoiceLines: '++id, invoice_id, item_id, unit_id, quantity, unit_price, total, description',
  payments: '++id, invoice_id, customer_id, supplier_id, amount, payment_date, notes',
  expenses: '++id, amount, expense_date, description'
});

export const localDB = {
  items: db.items,
  customers: db.customers,
  suppliers: db.suppliers,
  categories: db.categories,
  units: db.units,
  invoices: db.invoices,
  invoiceLines: db.invoiceLines,
  payments: db.payments,
  expenses: db.expenses
};

export async function exportAllData() {
  const tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
  const data = {};
  for (const t of tables) {
    data[t] = await db.table(t).toArray();
  }
  return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonStr) {
  const data = JSON.parse(jsonStr);
  const tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
  for (const t of tables) {
    await db.table(t).clear();
    if (data[t]?.length) {
      await db.table(t).bulkAdd(data[t]);
    }
  }
}
