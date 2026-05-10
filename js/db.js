// js/db.js — قاعدة بيانات IndexedDB مع Dexie.js + apiCall المحلي
const Dexie = window.Dexie;

export const db = new Dexie('AlrajhiAccounting');

db.version(16).stores({
  items: '++id, name, category_id, base_unit_id',
  units: '++id, name, abbreviation',
  categories: '++id, name',
  customers: '++id, name, phone, balance',
  suppliers: '++id, name, phone, balance',
  invoices: '++id, type, reference, date, customer_id, supplier_id, total',
  invoiceLines: '++id, invoice_id, item_id',
  item_units: '++id, item_id, unit_id, conversion_factor',
  payments: '++id, invoice_id, customer_id, supplier_id, amount, payment_date',
  expenses: '++id, date, amount, notes',
  vouchers: '++id, type, date, amount, description, reference, customer_id, supplier_id, invoice_id'
});

// ==================== المخازن المؤقتة ====================
export let itemsCache = [];
export let unitsCache = [];
export let categoriesCache = [];
export let customersCache = [];
export let suppliersCache = [];
export let invoicesCache = [];
export let paymentsCache = [];
export let vouchersCache = [];
export let expensesCache = [];

// ==================== تحديث المخازن ====================
export async function refreshCaches() {
  const [items, units, cats, custs, supps, invs, pmts, vchs, exps] = await Promise.all([
    db.items.toArray(),
    db.units.toArray(),
    db.categories.toArray(),
    db.customers.toArray(),
    db.suppliers.toArray(),
    db.invoices.toArray(),
    db.payments.toArray(),
    db.vouchers.toArray(),
    db.expenses.toArray()
  ]);

  itemsCache.length = 0; itemsCache.push(...items);
  unitsCache.length = 0; unitsCache.push(...units);
  categoriesCache.length = 0; categoriesCache.push(...cats);
  customersCache.length = 0; customersCache.push(...custs);
  suppliersCache.length = 0; suppliersCache.push(...supps);
  invoicesCache.length = 0; invoicesCache.push(...invs);
  paymentsCache.length = 0; paymentsCache.push(...pmts);
  vouchersCache.length = 0; vouchersCache.push(...vchs);
  expensesCache.length = 0; expensesCache.push(...exps);

  invoicesCache.forEach(inv => {
    const paid = pmts.filter(p => p.invoice_id == inv.id).reduce((s, p) => s + (p.amount || 0), 0);
    inv.paid = paid;
    inv.balance = (inv.total || 0) - paid;
  });

  invoicesCache.forEach(inv => {
    if (inv.customer_id) inv.customer = customersCache.find(c => c.id == inv.customer_id) || null;
    if (inv.supplier_id) inv.supplier = suppliersCache.find(s => s.id == inv.supplier_id) || null;
  });
}

// ==================== دوال التحقق ====================
function validateCashPayment(invoiceType, entityId, paidAmount, totalAmount) {
  const isCash = (invoiceType === 'sale' && !entityId) || (invoiceType === 'purchase' && !entityId);
  if (isCash && Math.abs(paidAmount - totalAmount) > 0.01) {
    throw new Error('الفاتورة النقدية تتطلب دفع كامل المبلغ فوراً');
  }
}

// ==================== API Call المحلي ====================
export async function apiCall(endpoint, method = 'GET', body = {}) {
  await ensureDataLoaded();

  if (body && body.initData) delete body.initData;

  const [path, queryString] = endpoint.split('?');
  const params = new URLSearchParams(queryString || '');

  switch (path) {
    case '/summary':
      return getSummary();

    case '/items':
      if (method === 'GET') return getItems();
      if (method === 'POST') return addItem(body);
      if (method === 'PUT') return updateItem(body);
      if (method === 'DELETE') return deleteItem(params.get('id'));
      break;

    case '/customers':
      if (method === 'GET') return customersCache;
      if (method === 'POST') return addCustomer(body);
      if (method === 'PUT') return updateCustomer(body);
      if (method === 'DELETE') return deleteEntity('customers', params.get('id'));
      break;

    case '/suppliers':
      if (method === 'GET') return suppliersCache;
      if (method === 'POST') return addSupplier(body);
      if (method === 'PUT') return updateSupplier(body);
      if (method === 'DELETE') return deleteEntity('suppliers', params.get('id'));
      break;

    case '/definitions':
      return handleDefinitions(method, body, params);

    case '/invoices':
      if (method === 'GET') return invoicesCache;
      if (method === 'POST') return createInvoice(body);
      if (method === 'PUT') return updateInvoice(body);
      if (method === 'DELETE') return deleteInvoice(params.get('id'));
      break;

    case '/payments':
      if (params.get('voucher') === '1') return handleVouchers(method, body, params);
      if (method === 'GET') return paymentsCache;
      if (method === 'POST') return addPayment(body);
      if (method === 'DELETE') return deletePayment(params.get('id'));
      break;

    case '/expenses':
      if (method === 'GET') return expensesCache;
      if (method === 'POST') return addExpense(body);
      if (method === 'DELETE') return deleteExpense(params.get('id'));
      break;

    case '/reports':
      return handleReports(params);

    case '/accounts':
      if (method === 'GET') return getAccounts();
      break;

    default:
      console.warn('[apiCall] Unknown endpoint:', path);
      return [];
  }

  return [];
}

let dataLoaded = false;
async function ensureDataLoaded() {
  if (!dataLoaded) {
    await refreshCaches();
    dataLoaded = true;
  }
}

function getItems() {
  return itemsCache.map(item => ({
    ...item,
    available: item.quantity || 0,
    total_value: (item.quantity || 0) * (parseFloat(item.average_cost) || 0),
    category: categoriesCache.find(c => c.id == item.category_id) || null,
    base_unit: unitsCache.find(u => u.id == item.base_unit_id) || null,
    item_units: (item.item_units || []).map(iu => ({
      ...iu,
      unit: unitsCache.find(u => u.id == iu.unit_id) || null
    })),
    purchase_qty: 0,
    sale_qty: 0,
    purchase_count: 0,
    sale_count: 0,
    last_purchase_date: null,
    last_sale_date: null
  }));
}

async function addItem(body) {
  if (!body.name) throw new Error('اسم المادة مطلوب');
  const nameLower = body.name.trim().toLowerCase();
  const existing = itemsCache.find(i => i.name.toLowerCase() === nameLower);
  if (existing) throw new Error('توجد مادة بنفس الاسم');
  const item = {
    name: body.name.trim(),
    category_id: body.category_id || null,
    item_type: body.item_type || 'مخزون',
    purchase_price: parseFloat(body.purchase_price) || 0,
    selling_price: parseFloat(body.selling_price) || 0,
    quantity: parseFloat(body.quantity) || 0,
    base_unit_id: body.base_unit_id || null,
    average_cost: parseFloat(body.purchase_price) || 0,
    item_units: body.item_units || []
  };
  const id = await db.items.add(item);
  item.id = id;
  if (body.item_units && body.item_units.length > 0) {
    await db.item_units.bulkAdd(body.item_units.map(iu => ({
      item_id: id,
      unit_id: iu.unit_id,
      conversion_factor: iu.conversion_factor
    })));
  }
  await refreshCaches();
  return itemsCache.find(i => i.id == id) || item;
}

async function updateItem(body) {
  if (!body.id) throw new Error('معرف المادة مطلوب');
  const id = Number(body.id);
  if (body.name) {
    const nameLower = body.name.trim().toLowerCase();
    const existing = itemsCache.find(i => i.id !== id && i.name.toLowerCase() === nameLower);
    if (existing) throw new Error('توجد مادة أخرى بنفس الاسم');
  }
  const updates = {};
  if (body.name) updates.name = body.name.trim();
  if (body.category_id !== undefined) updates.category_id = body.category_id || null;
  if (body.item_type) updates.item_type = body.item_type;
  if (body.purchase_price !== undefined) updates.purchase_price = parseFloat(body.purchase_price) || 0;
  if (body.selling_price !== undefined) updates.selling_price = parseFloat(body.selling_price) || 0;
  if (body.quantity !== undefined) updates.quantity = parseFloat(body.quantity) || 0;
  if (body.base_unit_id !== undefined) updates.base_unit_id = body.base_unit_id || null;
  if (body.item_units !== undefined) updates.item_units = body.item_units;
  await db.items.update(id, updates);
  if (body.item_units !== undefined) {
    await db.item_units.where('item_id').equals(id).delete();
    if (body.item_units && body.item_units.length > 0) {
      await db.item_units.bulkAdd(body.item_units.map(iu => ({
        item_id: id,
        unit_id: iu.unit_id,
        conversion_factor: iu.conversion_factor
      })));
    }
  }
  await refreshCaches();
  return itemsCache.find(i => i.id == id) || updates;
}

async function deleteItem(id) {
  if (!id) throw new Error('معرف المادة مطلوب');
  id = Number(id);
  const usedLines = await db.invoiceLines.where('item_id').equals(id).count();
  if (usedLines > 0) throw new Error('لا يمكن حذف المادة لأنها مستخدمة في فواتير');
  await db.item_units.where('item_id').equals(id).delete();
  await db.items.delete(id);
  await refreshCaches();
  return { success: true };
}

async function addCustomer(body) {
  if (!body.name) throw new Error('اسم العميل مطلوب');
  const nameLower = body.name.trim().toLowerCase();
  const existing = customersCache.find(c => c.name.toLowerCase() === nameLower);
  if (existing) throw new Error('يوجد عميل بنفس الاسم');
  const customer = { name: body.name.trim(), phone: body.phone || null, address: body.address || null, balance: 0 };
  const id = await db.customers.add(customer);
  await refreshCaches();
  return customersCache.find(c => c.id == id) || customer;
}

async function updateCustomer(body) {
  if (!body.id) throw new Error('معرف العميل مطلوب');
  const id = Number(body.id);
  if (body.name) {
    const nameLower = body.name.trim().toLowerCase();
    const existing = customersCache.find(c => c.id !== id && c.name.toLowerCase() === nameLower);
    if (existing) throw new Error('يوجد عميل آخر بنفس الاسم');
  }
  const updates = {};
  if (body.name) updates.name = body.name.trim();
  if (body.phone !== undefined) updates.phone = body.phone || null;
  if (body.address !== undefined) updates.address = body.address || null;
  await db.customers.update(id, updates);
  await refreshCaches();
  return customersCache.find(c => c.id == id);
}

async function addSupplier(body) {
  if (!body.name) throw new Error('اسم المورد مطلوب');
  const nameLower = body.name.trim().toLowerCase();
  const existing = suppliersCache.find(s => s.name.toLowerCase() === nameLower);
  if (existing) throw new Error('يوجد مورد بنفس الاسم');
  const supplier = { name: body.name.trim(), phone: body.phone || null, address: body.address || null, balance: 0 };
  const id = await db.suppliers.add(supplier);
  await refreshCaches();
  return suppliersCache.find(s => s.id == id) || supplier;
}

async function updateSupplier(body) {
  if (!body.id) throw new Error('معرف المورد مطلوب');
  const id = Number(body.id);
  if (body.name) {
    const nameLower = body.name.trim().toLowerCase();
    const existing = suppliersCache.find(s => s.id !== id && s.name.toLowerCase() === nameLower);
    if (existing) throw new Error('يوجد مورد آخر بنفس الاسم');
  }
  const updates = {};
  if (body.name) updates.name = body.name.trim();
  if (body.phone !== undefined) updates.phone = body.phone || null;
  if (body.address !== undefined) updates.address = body.address || null;
  await db.suppliers.update(id, updates);
  await refreshCaches();
  return suppliersCache.find(s => s.id == id);
}

async function deleteEntity(table, id) {
  if (!id) throw new Error('المعرف مطلوب');
  id = Number(id);
  if (table === 'customers') {
    const invCount = await db.invoices.where('customer_id').equals(id).count();
    if (invCount > 0) throw new Error('لا يمكن حذف العميل لارتباطه بفواتير');
    const payCount = await db.payments.where('customer_id').equals(id).count();
    if (payCount > 0) throw new Error('لا يمكن حذف العميل لارتباطه بدفعات');
  } else if (table === 'suppliers') {
    const invCount = await db.invoices.where('supplier_id').equals(id).count();
    if (invCount > 0) throw new Error('لا يمكن حذف المورد لارتباطه بفواتير');
    const payCount = await db.payments.where('supplier_id').equals(id).count();
    if (payCount > 0) throw new Error('لا يمكن حذف المورد لارتباطه بدفعات');
  }
  await db[table].delete(id);
  await refreshCaches();
  return { success: true };
}

async function handleDefinitions(method, body, params) {
  const type = params.get('type') || body?.type || 'category';
  if (method === 'GET') {
    return type === 'unit' ? unitsCache : categoriesCache;
  }
  if (method === 'POST') {
    const entry = {
      name: body.name.trim(),
      user_id: 'local',
      ...(type === 'unit' ? { abbreviation: body.abbreviation || null } : {})
    };
    if (!entry.name) throw new Error('الاسم مطلوب');
    const table = type === 'unit' ? db.units : db.categories;
    const cache = type === 'unit' ? unitsCache : categoriesCache;
    const existing = cache.find(x => x.name.toLowerCase() === entry.name.toLowerCase());
    if (existing) throw new Error(`${type === 'unit' ? 'وحدة' : 'تصنيف'} بنفس الاسم موجودة`);
    const id = await table.add(entry);
    entry.id = id;
    await refreshCaches();
    return entry;
  }
  if (method === 'PUT') {
    const id = Number(body.id);
    if (!id) throw new Error('المعرف مطلوب');
    const cache = type === 'unit' ? unitsCache : categoriesCache;
    if (body.name) {
      const nameLower = body.name.trim().toLowerCase();
      const existing = cache.find(x => x.id !== id && x.name.toLowerCase() === nameLower);
      if (existing) throw new Error(`${type === 'unit' ? 'وحدة' : 'تصنيف'} آخر بنفس الاسم موجود`);
    }
    const table = type === 'unit' ? db.units : db.categories;
    const updates = {};
    if (body.name) updates.name = body.name.trim();
    if (type === 'unit' && body.abbreviation !== undefined) updates.abbreviation = body.abbreviation || null;
    await table.update(id, updates);
    await refreshCaches();
    return cache.find(x => x.id == id);
  }
  if (method === 'DELETE') {
    const id = Number(params.get('id'));
    if (!id) throw new Error('المعرف مطلوب');
    if (type === 'category') {
      const count = await db.items.where('category_id').equals(id).count();
      if (count > 0) throw new Error('لا يمكن حذف التصنيف لاستخدامه في مواد');
    } else if (type === 'unit') {
      const baseUsed = await db.items.where('base_unit_id').equals(id).count();
      if (baseUsed > 0) throw new Error('لا يمكن حذف الوحدة لأنها وحدة أساسية لمواد');
      const subUsed = await db.item_units.where('unit_id').equals(id).count();
      if (subUsed > 0) throw new Error('لا يمكن حذف الوحدة لاستخدامها في وحدات فرعية');
    }
    const table = type === 'unit' ? db.units : db.categories;
    await table.delete(id);
    await refreshCaches();
    return { success: true };
  }
  return [];
}

async function createInvoice(body) {
  const { type, customer_id = null, supplier_id = null, date, reference, notes, lines, paid_amount = 0 } = body;
  if (!type || !['sale', 'purchase'].includes(type)) throw new Error('نوع الفاتورة غير صحيح');
  if (!lines || !Array.isArray(lines) || lines.length === 0) throw new Error('يجب إضافة بند واحد على الأقل');

  const total = lines.reduce((s, l) => s + (parseFloat(l.total) || 0), 0);
  const entityId = type === 'sale' ? customer_id : supplier_id;
  validateCashPayment(type, entityId, parseFloat(paid_amount) || 0, total);

  return db.transaction('rw', db.invoices, db.invoiceLines, db.items, db.payments, db.customers, db.suppliers, async () => {
    const invId = await db.invoices.add({
      type,
      customer_id: customer_id ? Number(customer_id) : null,
      supplier_id: supplier_id ? Number(supplier_id) : null,
      date: date || new Date().toISOString().split('T')[0],
      reference: reference || null,
      notes: notes || null,
      total,
      status: 'posted',
      created_at: new Date().toISOString()
    });

    const lineRecords = lines.map(l => ({
      invoice_id: invId,
      item_id: l.item_id || null,
      description: l.description || null,
      quantity: parseFloat(l.quantity) || 0,
      unit_price: parseFloat(l.unit_price) || 0,
      total: parseFloat(l.total) || 0,
      unit_id: l.unit_id || null,
      quantity_in_base: (parseFloat(l.quantity) || 0) * (parseFloat(l.conversion_factor) || 1),
      conversion_factor: parseFloat(l.conversion_factor) || 1
    }));
    await db.invoiceLines.bulkAdd(lineRecords);

    for (const line of lines) {
      if (line.item_id) {
        const item = await db.items.get(Number(line.item_id));
        if (item) {
          const qtyBase = (parseFloat(line.quantity) || 0) * (parseFloat(line.conversion_factor) || 1);
          const delta = type === 'sale' ? -qtyBase : qtyBase;
          await db.items.update(item.id, { quantity: (item.quantity || 0) + delta });
          if (type === 'purchase' && qtyBase > 0) {
            const oldQty = (item.quantity || 0);
            const oldCost = parseFloat(item.average_cost) || 0;
            const newCost = parseFloat(line.unit_price) || 0;
            const newQty = oldQty + qtyBase;
            const avgCost = newQty > 0 ? ((oldQty * oldCost) + (qtyBase * newCost)) / newQty : newCost;
            await db.items.update(item.id, { average_cost: avgCost });
          }
        }
      }
    }

    const paid = parseFloat(paid_amount) || 0;
    if (paid > 0) {
      await db.payments.add({
        invoice_id: invId,
        customer_id: customer_id ? Number(customer_id) : null,
        supplier_id: supplier_id ? Number(supplier_id) : null,
        amount: paid,
        payment_date: date || new Date().toISOString().split('T')[0],
        notes: 'دفعة تلقائية من الفاتورة'
      });
    }

    if (type === 'sale' && customer_id) {
      const cust = await db.customers.get(Number(customer_id));
      if (cust) await db.customers.update(cust.id, { balance: (cust.balance || 0) + total - paid });
    } else if (type === 'purchase' && supplier_id) {
      const supp = await db.suppliers.get(Number(supplier_id));
      if (supp) await db.suppliers.update(supp.id, { balance: (supp.balance || 0) + total - paid });
    }

    return invId;
  }).then(async (invId) => {
    await refreshCaches();
    return invoicesCache.find(i => i.id === invId) || { id: invId, ...body, total };
  });
}

async function updateInvoice(body) {
  const id = Number(body.id);
  if (!id) throw new Error('معرف الفاتورة مطلوب');

  const oldInvoice = await db.invoices.get(id);
  if (!oldInvoice) throw new Error('الفاتورة غير موجودة');

  return db.transaction('rw', db.invoices, db.invoiceLines, db.items, db.payments, db.customers, db.suppliers, async () => {
    const oldLines = await db.invoiceLines.where('invoice_id').equals(id).toArray();
    for (const line of oldLines) {
      if (line.item_id) {
        const item = await db.items.get(Number(line.item_id));
        if (item) {
          const qtyBase = line.quantity_in_base || line.quantity;
          const delta = oldInvoice.type === 'sale' ? qtyBase : -qtyBase;
          await db.items.update(item.id, { quantity: (item.quantity || 0) + delta });
        }
      }
    }
    if (oldInvoice.type === 'sale' && oldInvoice.customer_id) {
      const cust = await db.customers.get(Number(oldInvoice.customer_id));
      if (cust) {
        const oldPaid = (await db.payments.where('invoice_id').equals(id).toArray()).reduce((s,p)=>s+p.amount,0);
        await db.customers.update(cust.id, { balance: (cust.balance || 0) - (oldInvoice.total - oldPaid) });
      }
    } else if (oldInvoice.type === 'purchase' && oldInvoice.supplier_id) {
      const supp = await db.suppliers.get(Number(oldInvoice.supplier_id));
      if (supp) {
        const oldPaid = (await db.payments.where('invoice_id').equals(id).toArray()).reduce((s,p)=>s+p.amount,0);
        await db.suppliers.update(supp.id, { balance: (supp.balance || 0) - (oldInvoice.total - oldPaid) });
      }
    }

    await db.invoiceLines.where('invoice_id').equals(id).delete();
    await db.payments.where('invoice_id').equals(id).delete();
    await db.invoices.delete(id);

    const newBody = { ...body };
    delete newBody.id;
    const newId = await createInvoice(newBody);
    return newId;
  }).then(async () => {
    await refreshCaches();
    return invoicesCache.find(i => i.id == id) || body;
  });
}

async function deleteInvoice(id) {
  if (!id) throw new Error('معرف الفاتورة مطلوب');
  id = Number(id);
  const invoice = await db.invoices.get(id);
  if (!invoice) throw new Error('الفاتورة غير موجودة');

  return db.transaction('rw', db.invoices, db.invoiceLines, db.items, db.payments, db.customers, db.suppliers, async () => {
    const lines = await db.invoiceLines.where('invoice_id').equals(id).toArray();
    for (const line of lines) {
      if (line.item_id) {
        const item = await db.items.get(Number(line.item_id));
        if (item) {
          const qtyBase = line.quantity_in_base || line.quantity;
          const delta = invoice.type === 'sale' ? qtyBase : -qtyBase;
          await db.items.update(item.id, { quantity: (item.quantity || 0) + delta });
        }
      }
    }

    const payments = await db.payments.where('invoice_id').equals(id).toArray();
    for (const p of payments) {
      if (p.customer_id) {
        const cust = await db.customers.get(Number(p.customer_id));
        if (cust) await db.customers.update(cust.id, { balance: (cust.balance || 0) + p.amount });
      }
      if (p.supplier_id) {
        const supp = await db.suppliers.get(Number(p.supplier_id));
        if (supp) await db.suppliers.update(supp.id, { balance: (supp.balance || 0) + p.amount });
      }
    }

    if (invoice.type === 'sale' && invoice.customer_id) {
      const cust = await db.customers.get(Number(invoice.customer_id));
      if (cust) await db.customers.update(cust.id, { balance: (cust.balance || 0) - invoice.total });
    } else if (invoice.type === 'purchase' && invoice.supplier_id) {
      const supp = await db.suppliers.get(Number(invoice.supplier_id));
      if (supp) await db.suppliers.update(supp.id, { balance: (supp.balance || 0) - invoice.total });
    }

    await db.invoiceLines.where('invoice_id').equals(id).delete();
    await db.payments.where('invoice_id').equals(id).delete();
    await db.invoices.delete(id);
  }).then(async () => {
    await refreshCaches();
    return { success: true };
  });
}

async function addPayment(body) {
  const { invoice_id, customer_id, supplier_id, amount, payment_date, notes } = body;
  if (!amount || parseFloat(amount) <= 0) throw new Error('المبلغ مطلوب');
  const pmtId = await db.payments.add({
    invoice_id: invoice_id ? Number(invoice_id) : null,
    customer_id: customer_id ? Number(customer_id) : null,
    supplier_id: supplier_id ? Number(supplier_id) : null,
    amount: parseFloat(amount),
    payment_date: payment_date || new Date().toISOString().split('T')[0],
    notes: notes || null
  });
  if (customer_id) {
    const cust = await db.customers.get(Number(customer_id));
    if (cust) await db.customers.update(cust.id, { balance: (cust.balance || 0) - parseFloat(amount) });
  }
  if (supplier_id) {
    const supp = await db.suppliers.get(Number(supplier_id));
    if (supp) await db.suppliers.update(supp.id, { balance: (supp.balance || 0) - parseFloat(amount) });
  }
  await refreshCaches();
  return { id: pmtId, ...body };
}

async function deletePayment(id) {
  if (!id) throw new Error('معرف الدفعة مطلوب');
  id = Number(id);
  await db.payments.delete(id);
  await refreshCaches();
  return { success: true };
}

async function handleVouchers(method, body, params) {
  if (method === 'GET') {
    return vouchersCache.map(v => ({
      ...v,
      customer: v.customer_id ? customersCache.find(c => c.id == v.customer_id) : null,
      supplier: v.supplier_id ? suppliersCache.find(s => s.id == v.supplier_id) : null
    }));
  }
  if (method === 'POST') {
    const { type, date, amount, description, reference, customer_id, supplier_id, invoice_id } = body;
    if (!type || !['receipt', 'payment', 'expense'].includes(type)) throw new Error('نوع السند غير صحيح');
    if (!amount || parseFloat(amount) <= 0) throw new Error('المبلغ مطلوب');

    return db.transaction('rw', db.vouchers, db.payments, db.customers, db.suppliers, db.expenses, async () => {
      const prefix = type === 'receipt' ? 'SC' : type === 'payment' ? 'SP' : 'SE';
      const existingVouchers = vouchersCache.filter(v => v.type === type);
      const nextNum = existingVouchers.length + 1;
      const finalReference = reference || `${prefix}-${String(nextNum).padStart(4, '0')}`;

      const voucherId = await db.vouchers.add({
        type,
        date: date || new Date().toISOString().split('T')[0],
        amount: parseFloat(amount),
        description: description || null,
        reference: finalReference,
        customer_id: customer_id ? Number(customer_id) : null,
        supplier_id: supplier_id ? Number(supplier_id) : null,
        invoice_id: invoice_id ? Number(invoice_id) : null
      });

      const amt = parseFloat(amount);
      if (type === 'receipt' && customer_id) {
        const cust = await db.customers.get(Number(customer_id));
        if (cust) await db.customers.update(cust.id, { balance: (cust.balance || 0) - amt });
        await db.payments.add({
          invoice_id: invoice_id ? Number(invoice_id) : null,
          customer_id: Number(customer_id),
          amount: amt,
          payment_date: date || new Date().toISOString().split('T')[0],
          notes: description || 'سند قبض',
          voucher_id: voucherId
        });
      } else if (type === 'payment' && supplier_id) {
        const supp = await db.suppliers.get(Number(supplier_id));
        if (supp) await db.suppliers.update(supp.id, { balance: (supp.balance || 0) - amt });
        await db.payments.add({
          invoice_id: invoice_id ? Number(invoice_id) : null,
          supplier_id: Number(supplier_id),
          amount: amt,
          payment_date: date || new Date().toISOString().split('T')[0],
          notes: description || 'سند صرف',
          voucher_id: voucherId
        });
      } else if (type === 'expense') {
        await db.expenses.add({
          amount: amt,
          expense_date: date || new Date().toISOString().split('T')[0],
          description: description || 'سند مصروف'
        });
      }
      return voucherId;
    }).then(async (voucherId) => {
      await refreshCaches();
      return { id: voucherId, type, amount: parseFloat(amount), reference: reference || `${prefix}-${String(vouchersCache.length + 1).padStart(4, '0')}` };
    });
  }
  if (method === 'DELETE') {
    const id = Number(params.get('id'));
    if (!id) throw new Error('معرف السند مطلوب');
    await db.vouchers.delete(id);
    await refreshCaches();
    return { success: true };
  }
  return [];
}

async function addExpense(body) {
  const { amount, expense_date, description } = body;
  if (!amount || parseFloat(amount) <= 0) throw new Error('المبلغ مطلوب');
  const id = await db.expenses.add({
    amount: parseFloat(amount),
    expense_date: expense_date || new Date().toISOString().split('T')[0],
    notes: description || null
  });
  await refreshCaches();
  return { id, ...body };
}

async function deleteExpense(id) {
  if (!id) throw new Error('معرف المصروف مطلوب');
  id = Number(id);
  await db.expenses.delete(id);
  await refreshCaches();
  return { success: true };
}

async function handleReports(params) {
  const type = params.get('type');
  await refreshCaches();
  switch (type) {
    case 'trial_balance': return getTrialBalance();
    case 'income_statement': return getIncomeStatement();
    case 'balance_sheet': return getBalanceSheet();
    case 'account_ledger': return getAccountLedger();
    case 'customer_statement': return getEntityStatement('customer', params.get('customer_id'));
    case 'supplier_statement': return getEntityStatement('supplier', params.get('supplier_id'));
    default: return [];
  }
}

function getTrialBalance() {
  const totalSales = invoicesCache.filter(i => i.type === 'sale').reduce((s, i) => s + (i.total || 0), 0);
  const totalPurchases = invoicesCache.filter(i => i.type === 'purchase').reduce((s, i) => s + (i.total || 0), 0);
  const totalExpenses = expensesCache.reduce((s, e) => s + (e.amount || 0), 0);
  const cashBalance = totalSales - totalPurchases - totalExpenses;
  const receivables = customersCache.reduce((s, c) => s + (c.balance || 0), 0);
  const payables = suppliersCache.reduce((s, s2) => s + (s2.balance || 0), 0);
  return [
    { name: 'الصندوق', type: 'asset', total_debit: cashBalance > 0 ? cashBalance : 0, total_credit: cashBalance < 0 ? -cashBalance : 0, balance: cashBalance },
    { name: 'ذمم مدينة', type: 'asset', total_debit: receivables, total_credit: 0, balance: receivables },
    { name: 'ذمم دائنة', type: 'liability', total_debit: 0, total_credit: payables, balance: payables },
    { name: 'المبيعات', type: 'income', total_debit: 0, total_credit: totalSales, balance: totalSales },
    { name: 'المشتريات', type: 'expense', total_debit: totalPurchases, total_credit: 0, balance: totalPurchases },
    { name: 'مصاريف عامة', type: 'expense', total_debit: totalExpenses, total_credit: 0, balance: totalExpenses }
  ];
}

function getIncomeStatement() {
  const totalSales = invoicesCache.filter(i => i.type === 'sale').reduce((s, i) => s + (i.total || 0), 0);
  const totalPurchases = invoicesCache.filter(i => i.type === 'purchase').reduce((s, i) => s + (i.total || 0), 0);
  const totalExpenses = expensesCache.reduce((s, e) => s + (e.amount || 0), 0);
  return {
    income: [{ name: 'المبيعات', balance: totalSales }],
    total_income: totalSales,
    expenses: [
      { name: 'تكلفة المبيعات', balance: totalPurchases },
      { name: 'مصاريف عامة', balance: totalExpenses }
    ],
    total_expenses: totalPurchases + totalExpenses,
    net_profit: totalSales - totalPurchases - totalExpenses
  };
}

function getBalanceSheet() {
  const cash = invoicesCache.filter(i => i.type === 'sale').reduce((s, i) => s + (i.total || 0), 0) -
               invoicesCache.filter(i => i.type === 'purchase').reduce((s, i) => s + (i.total || 0), 0) -
               expensesCache.reduce((s, e) => s + (e.amount || 0), 0);
  const receivables = customersCache.reduce((s, c) => s + (c.balance || 0), 0);
  const payables = suppliersCache.reduce((s, s2) => s + (s2.balance || 0), 0);
  const totalAssets = cash + receivables;
  const equity = totalAssets - payables;
  return {
    assets: [{ name: 'الصندوق', balance: cash }, { name: 'ذمم مدينة', balance: receivables }],
    total_assets: totalAssets,
    liabilities: [{ name: 'ذمم دائنة', balance: payables }],
    total_liabilities: payables,
    equity: [{ name: 'رأس المال', balance: equity }],
    total_equity: equity
  };
}

function getAccountLedger() {
  const lines = [];
  invoicesCache.forEach(inv => {
    const type = inv.type === 'sale' ? 'مبيعات' : 'مشتريات';
    lines.push({
      date: inv.date,
      description: `فاتورة ${type} ${inv.reference || ''}`,
      debit: inv.type === 'sale' ? 0 : (inv.total || 0),
      credit: inv.type === 'sale' ? (inv.total || 0) : 0,
      balance: 0
    });
  });
  paymentsCache.forEach(p => {
    lines.push({
      date: p.payment_date,
      description: p.notes || 'دفعة',
      debit: p.supplier_id ? (p.amount || 0) : 0,
      credit: p.customer_id ? (p.amount || 0) : 0,
      balance: 0
    });
  });
  expensesCache.forEach(ex => {
    lines.push({
      date: ex.expense_date,
      description: ex.notes || 'مصروف',
      debit: ex.amount || 0,
      credit: 0,
      balance: 0
    });
  });
  vouchersCache.forEach(v => {
    lines.push({
      date: v.date,
      description: `${v.type === 'receipt' ? 'سند قبض' : v.type === 'payment' ? 'سند دفع' : 'سند مصروف'} ${v.reference || ''}`,
      debit: v.type === 'payment' ? (v.amount || 0) : 0,
      credit: v.type === 'receipt' ? (v.amount || 0) : 0,
      balance: 0
    });
  });
  lines.sort((a, b) => a.date.localeCompare(b.date));
  let balance = 0;
  lines.forEach(line => {
    balance = balance + line.debit - line.credit;
    line.balance = balance;
  });
  return lines;
}

async function getEntityStatement(entityType, entityId) {
  if (!entityId) return [];
  const id = Number(entityId);
  const lines = [];
  const isCustomer = entityType === 'customer';
  const invs = invoicesCache.filter(i => isCustomer ? i.customer_id == id : i.supplier_id == id);
  const pmts = paymentsCache.filter(p => isCustomer ? p.customer_id == id : p.supplier_id == id);
  let balance = 0;
  invs.forEach(inv => {
    balance += inv.total || 0;
    lines.push({
      date: inv.date,
      description: `فاتورة ${inv.type === 'sale' ? 'بيع' : 'شراء'} ${inv.reference || ''}`,
      debit: isCustomer ? (inv.total || 0) : 0,
      credit: isCustomer ? 0 : (inv.total || 0),
      balance
    });
  });
  pmts.forEach(p => {
    balance -= p.amount || 0;
    lines.push({
      date: p.payment_date,
      description: `دفعة ${p.notes || ''}`,
      debit: isCustomer ? 0 : (p.amount || 0),
      credit: isCustomer ? (p.amount || 0) : 0,
      balance
    });
  });
  return lines.sort((a, b) => a.date.localeCompare(b.date));
}

function getSummary() {
  const totalSales = invoicesCache.filter(i => i.type === 'sale').reduce((s, i) => s + (i.total || 0), 0);
  const totalPurchases = invoicesCache.filter(i => i.type === 'purchase').reduce((s, i) => s + (i.total || 0), 0);
  const totalExpenses = expensesCache.reduce((s, e) => s + (e.amount || 0), 0);
  const netProfit = totalSales - totalPurchases - totalExpenses;
  const cashBalance = totalSales - totalPurchases - totalExpenses;
  const receivables = customersCache.reduce((s, c) => s + (c.balance || 0), 0);
  const payables = suppliersCache.reduce((s, s2) => s + (s2.balance || 0), 0);
  const monthly = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = { sales: 0, purchases: 0, expenses: 0 };
  }
  invoicesCache.forEach(inv => {
    if (!inv.date) return;
    const key = inv.date.substring(0, 7);
    if (monthly[key]) {
      if (inv.type === 'sale') monthly[key].sales += inv.total || 0;
      else monthly[key].purchases += inv.total || 0;
    }
  });
  expensesCache.forEach(ex => {
    if (!ex.expense_date) return;
    const key = ex.expense_date.substring(0, 7);
    if (monthly[key]) monthly[key].expenses += ex.amount || 0;
  });
  const months = Object.keys(monthly).sort();
  return {
    net_profit: netProfit,
    cash_balance: cashBalance,
    receivables,
    payables,
    total_sales: totalSales,
    total_purchases: totalPurchases,
    total_expenses: totalExpenses,
    monthly: {
      labels: months,
      sales: months.map(m => monthly[m].sales),
      purchases: months.map(m => monthly[m].purchases),
      net_profit: months.map(m => monthly[m].sales - monthly[m].purchases - monthly[m].expenses),
      expenses: months.map(m => monthly[m].expenses)
    },
    daily: { dates: [], profits: [] }
  };
}

function getAccounts() {
  return [
    { id: 1, name: 'الصندوق', type: 'asset' },
    { id: 2, name: 'المبيعات', type: 'income' },
    { id: 3, name: 'المشتريات', type: 'expense' },
    { id: 4, name: 'المخزون', type: 'asset' },
    { id: 5, name: 'مصاريف عامة', type: 'expense' },
    { id: 6, name: 'رأس المال', type: 'equity' },
    { id: 7, name: 'ذمم مدينة', type: 'asset' },
    { id: 8, name: 'ذمم دائنة', type: 'liability' }
  ];
}

export default db;
