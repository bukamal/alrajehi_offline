export let db;
export let itemsCache = [];
export let customersCache = [];
export let suppliersCache = [];
export let invoicesCache = [];
export let categoriesCache = [];
export let unitsCache = [];
export let paymentsCache = [];

export function initDB() {
  if (typeof Dexie === 'undefined' || !Dexie) {
    document.getElementById('loading-screen').style.display = 'none';
    const errScreen = document.getElementById('error-screen');
    errScreen.style.display = 'flex';
    document.getElementById('error-details').textContent =
      'تعذر تهيئة قاعدة البيانات. تأكد من اتصال الانترنت ثم أعد تحميل الصفحة.';
    throw new Error('Dexie not available');
  }
  db = new Dexie('AlrajhiDBv3');
  db.version(1).stores({
    items:
      '++id, name, category_id, item_type, purchase_price, selling_price, quantity, base_unit_id, item_units',
    customers: '++id, name, phone, address, balance',
    suppliers: '++id, name, phone, address, balance',
    categories: '++id, name',
    units: '++id, name, abbreviation',
    invoices: '++id, type, customer_id, supplier_id, date, reference, notes, total',
    invoiceLines: '++id, invoice_id, item_id, unit_id, quantity, unit_price, total, description',
    payments: '++id, invoice_id, customer_id, supplier_id, amount, payment_date, notes',
    expenses: '++id, amount, expense_date, description'
  });
}

export function getTable(name) {
  return db[name];
}

export async function apiCall(endpoint, method = 'GET', body = {}) {
  const [table, query] = endpoint.split('?');
  const params = new URLSearchParams(query || '');
  
  let id = null;
  const idParam = params.get('id');
  if (idParam !== null && idParam !== '') {
    const parsed = parseInt(idParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      id = parsed;
    }
  }
  
  const type = params.get('type');

  if (method === 'GET') {
    switch (table) {
      case '/items':
        return await getTable('items').toArray();
      case '/customers':
        return await getTable('customers').toArray();
      case '/suppliers':
        return await getTable('suppliers').toArray();
      case '/definitions':
        if (type === 'category') return await getTable('categories').toArray();
        if (type === 'unit') return await getTable('units').toArray();
        return [];
      case '/invoices': {
        const invs = await getTable('invoices').toArray();
        for (const inv of invs) {
          const lines = await getTable('invoiceLines').where({ invoice_id: inv.id }).toArray();
          const pmts = await getTable('payments').where({ invoice_id: inv.id }).toArray();
          inv.invoice_lines = lines;
          inv.paid = pmts.reduce((s, p) => s + p.amount, 0);
          inv.balance = inv.total - inv.paid;
        }
        return invs;
      }
      case '/payments':
        return await getTable('payments').toArray();
      case '/expenses':
        return await getTable('expenses').toArray();
      default:
        return [];
    }
  } else if (method === 'POST') {
    if (table === '/items') {
      const clean = { ...body };
      clean.purchase_price = parseFloat(clean.purchase_price) || 0;
      clean.selling_price = parseFloat(clean.selling_price) || 0;
      clean.quantity = parseFloat(clean.quantity) || 0;
      const nid = await getTable('items').add(clean);
      return { id: nid, ...clean };
    } else if (table === '/invoices') {
      const lines = body.lines;
      delete body.lines;
      const paid_amount = parseFloat(body.paid_amount) || 0;
      delete body.paid_amount;
      const invId = await getTable('invoices').add(body);
      if (lines) for (const l of lines) await getTable('invoiceLines').add({ ...l, invoice_id: invId });
      if (paid_amount > 0) {
        await getTable('payments').add({
          invoice_id: invId,
          customer_id: body.customer_id || null,
          supplier_id: body.supplier_id || null,
          amount: paid_amount,
          payment_date: body.date,
          notes: 'دفعة تلقائية'
        });
      }
      return { id: invId, ...body };
    } else if (table === '/customers') {
      const nid = await getTable('customers').add(body);
      return { id: nid, ...body };
    } else if (table === '/suppliers') {
      const nid = await getTable('suppliers').add(body);
      return { id: nid, ...body };
    } else if (table === '/definitions') {
      if (type === 'category') {
        const nid = await getTable('categories').add({ name: body.name });
        return { id: nid, ...body };
      } else if (type === 'unit') {
        const u = { name: body.name, abbreviation: body.abbreviation || body.name };
        const nid = await getTable('units').add(u);
        unitsCache.push({ id: nid, ...u });
        return { id: nid, ...u };
      }
    } else if (table === '/payments') {
      const nid = await getTable('payments').add(body);
      return { id: nid, ...body };
    } else if (table === '/expenses') {
      const nid = await getTable('expenses').add(body);
      return { id: nid, ...body };
    }
  } else if (method === 'DELETE') {
    // ✅ FIXED: Validate id before attempting delete
    if (!id) {
      throw new Error('معرّف السجل مطلوب للحذف');
    }
    
    const tbl = table.split('?')[0].replace('/', '');
    
    if (tbl === 'invoices') {
      await getTable('invoiceLines').where({ invoice_id: id }).delete();
    }

    if (tbl === 'definitions') {
      const defType = type || params.get('type');
      if (defType === 'category') await getTable('categories').delete(id);
      else if (defType === 'unit') await getTable('units').delete(id);
      else throw new Error('نوع التعريف غير معروف للحذف');
    } else {
      await getTable(tbl).delete(id);
    }
    return { success: true };
  } else if (method === 'PUT') {
    let tbl = table.split('?')[0].replace('/', '');
    
    let recordId = id;
    if (!recordId && body.id !== undefined && body.id !== null) {
      const parsedBodyId = parseInt(body.id, 10);
      if (!isNaN(parsedBodyId) && parsedBodyId > 0) {
        recordId = parsedBodyId;
      }
    }
    
    if (recordId === undefined || recordId === null) throw new Error('معرّف السجل مطلوب للتعديل');
    
    const changes = { ...body };
    delete changes.id;
    
    if (tbl === 'definitions') {
      const defType = type || changes.type;
      delete changes.type;
      if (defType === 'category') await getTable('categories').update(recordId, changes);
      else if (defType === 'unit') await getTable('units').update(recordId, changes);
      else throw new Error('نوع التعريف غير معروف');
    } else {
      await getTable(tbl).update(recordId, changes);
    }
    return { id: recordId, ...changes };
  }
}

export async function refreshCaches() {
  [itemsCache, customersCache, suppliersCache, invoicesCache, categoriesCache, unitsCache, paymentsCache] =
    await Promise.all([
      apiCall('/items', 'GET'),
      apiCall('/customers', 'GET'),
      apiCall('/suppliers', 'GET'),
      apiCall('/invoices', 'GET'),
      apiCall('/definitions?type=category', 'GET'),
      apiCall('/definitions?type=unit', 'GET'),
      apiCall('/payments', 'GET')
    ]);
}

export async function checkCascadeDelete(table, id) {
  const counts = {};
  switch (table) {
    case 'customers':
      counts.invoices = await db.invoices.where({ customer_id: id }).count();
      counts.payments = await db.payments.where({ customer_id: id }).count();
      break;
    case 'suppliers':
      counts.invoices = await db.invoices.where({ supplier_id: id }).count();
      counts.payments = await db.payments.where({ supplier_id: id }).count();
      break;
    case 'categories':
      counts.items = await db.items.where({ category_id: id }).count();
      break;
    case 'units': {
      counts.itemsBase = await db.items.where({ base_unit_id: id }).count();
      let itemUnitsCount = 0;
      const allItems = await db.items.toArray();
      for (const item of allItems) {
        if (item.item_units && Array.isArray(item.item_units)) {
          if (item.item_units.some(iu => iu.unit_id === id)) {
            itemUnitsCount++;
          }
        }
      }
      counts.itemUnits = itemUnitsCount;
      break;
    }
    case 'items':
      counts.invoiceLines = await db.invoiceLines.where({ item_id: id }).count();
      break;
  }
  return { counts };
}

export async function performCascadeDelete(table, id) {
  await db.transaction('rw', db.tables, async () => {
    switch (table) {
      case 'categories':
        await db.items.where({ category_id: id }).modify({ category_id: null });
        break;
      case 'units': {
        const items = await db.items.toArray();
        for (const item of items) {
          if (item.item_units && Array.isArray(item.item_units)) {
            const newUnits = item.item_units.filter(iu => iu.unit_id !== id);
            if (newUnits.length !== item.item_units.length) {
              await db.items.update(item.id, { item_units: newUnits });
            }
          }
          if (item.base_unit_id === id) {
            throw new Error(
              `لا يمكن حذف الوحدة لأنها الوحدة الأساسية للمادة "${item.name}". قم بتغييرها أولاً.`
            );
          }
        }
        break;
      }
    }
    await getTable(table).delete(id);
  });
}
