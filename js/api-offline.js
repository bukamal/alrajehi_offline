import { localDB } from './db.js';

export async function apiCall(endpoint, method = 'GET', body = {}) {
  const [resource, queryString] = endpoint.split('?');
  const parts = resource.split('/').filter(Boolean);
  const tableName = parts[0];
  const params = new URLSearchParams(queryString || '');
  const id = parts[1] || params.get('id');

  if (method === 'GET') {
    switch (tableName) {
      case 'items': return await localDB.items.toArray();
      case 'customers': return await localDB.customers.toArray();
      case 'suppliers': return await localDB.suppliers.toArray();
      case 'definitions':
        if (params.get('type') === 'category') return await localDB.categories.toArray();
        if (params.get('type') === 'unit') return await localDB.units.toArray();
        break;
      case 'invoices': {
        const invs = await localDB.invoices.toArray();
        for (const inv of invs) {
          const pmts = await localDB.payments.where({ invoice_id: inv.id }).toArray();
          inv.paid = pmts.reduce((s, p) => s + (p.amount || 0), 0);
          inv.balance = (inv.total || 0) - inv.paid;
        }
        return invs;
      }
      case 'payments': return await localDB.payments.toArray();
      case 'expenses': return await localDB.expenses.toArray();
      default: return [];
    }
  }

  if (method === 'POST') {
    const payload = { ...body };
    delete payload.initData;
    switch (tableName) {
      case 'items': {
        const newId = await localDB.items.add(payload);
        return { id: newId, ...payload };
      }
      case 'customers': {
        const newId = await localDB.customers.add({ ...payload, balance: payload.balance || 0 });
        return { id: newId, ...payload };
      }
      case 'suppliers': {
        const newId = await localDB.suppliers.add({ ...payload, balance: 0 });
        return { id: newId, ...payload };
      }
      case 'definitions': {
        const type = params.get('type') || body.type;
        if (type === 'category') {
          const newId = await localDB.categories.add({ name: payload.name });
          return { id: newId, name: payload.name };
        }
        if (type === 'unit') {
          const newId = await localDB.units.add({ name: payload.name, abbreviation: payload.abbreviation });
          return { id: newId, name: payload.name, abbreviation: payload.abbreviation };
        }
        break;
      }
      case 'invoices': {
        const { lines, paid_amount, ...invData } = payload;
        const invId = await localDB.invoices.add(invData);
        if (lines?.length) {
          for (const l of lines) {
            await localDB.invoiceLines.add({ ...l, invoice_id: invId });
          }
        }
        if (paid_amount > 0) {
          await localDB.payments.add({
            invoice_id: invId,
            customer_id: invData.customer_id || null,
            supplier_id: invData.supplier_id || null,
            amount: paid_amount,
            payment_date: invData.date,
            notes: 'دفعة تلقائية'
          });
        }
        return { id: invId, ...invData };
      }
      case 'payments': {
        const newId = await localDB.payments.add(payload);
        return { id: newId, ...payload };
      }
      case 'expenses': {
        const newId = await localDB.expenses.add(payload);
        return { id: newId, ...payload };
      }
      default: throw new Error('جدول غير معروف');
    }
  }

  if (method === 'PUT') {
    const upd = { ...body };
    delete upd.initData;
    switch (tableName) {
      case 'items': await localDB.items.update(parseInt(id), upd); break;
      case 'customers': await localDB.customers.update(parseInt(id), upd); break;
      case 'suppliers': await localDB.suppliers.update(parseInt(id), upd); break;
      case 'definitions': {
        const type = params.get('type') || body.type;
        if (type === 'category') {
          await localDB.categories.update(parseInt(id), { name: upd.name });
        } else {
          await localDB.units.update(parseInt(id), { name: upd.name, abbreviation: upd.abbreviation });
        }
        break;
      }
      default: throw new Error('تحديث غير مدعوم لهذا الجدول');
    }
    return { id: parseInt(id), ...upd };
  }

  if (method === 'DELETE') {
    switch (tableName) {
      case 'items': await localDB.items.delete(parseInt(id)); break;
      case 'customers': await localDB.customers.delete(parseInt(id)); break;
      case 'suppliers': await localDB.suppliers.delete(parseInt(id)); break;
      case 'definitions': {
        const type = params.get('type') || body.type;
        if (type === 'category') await localDB.categories.delete(parseInt(id));
        else await localDB.units.delete(parseInt(id));
        break;
      }
      case 'invoices': {
        await localDB.invoices.delete(parseInt(id));
        await localDB.invoiceLines.where({ invoice_id: parseInt(id) }).delete();
        await localDB.payments.where({ invoice_id: parseInt(id) }).delete();
        break;
      }
      case 'payments': await localDB.payments.delete(parseInt(id)); break;
      case 'expenses': await localDB.expenses.delete(parseInt(id)); break;
      default: throw new Error('حذف غير مدعوم');
    }
    return { success: true };
  }

  throw new Error('Method not allowed');
}
