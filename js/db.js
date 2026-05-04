// ========== قاعدة البيانات المحلية - Dexie.js ==========
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.10/dist/dexie.mjs';

export const localDB = new Dexie('AlRajhiAccounting');

localDB.version(1).stores({
    users: 'id, first_name, username, updated_at',
    accounts: '++id, user_id, name, type, balance, sync_status, updated_at',
    categories: '++id, user_id, name, sync_status, updated_at',
    units: '++id, user_id, name, abbreviation, sync_status, updated_at',
    items: '++id, user_id, name, category_id, item_type, purchase_price, selling_price, quantity, base_unit_id, sync_status, updated_at',
    item_units: '++id, item_id, unit_id, conversion_factor, sync_status',
    customers: '++id, user_id, name, phone, address, balance, sync_status, updated_at',
    suppliers: '++id, user_id, name, phone, address, balance, sync_status, updated_at',
    invoices: '++id, user_id, type, customer_id, supplier_id, date, reference, total, status, paid, balance, sync_status, updated_at',
    invoice_lines: '++id, invoice_id, item_id, description, quantity, unit_price, total, unit_id, quantity_in_base, sync_status',
    payments: '++id, user_id, invoice_id, customer_id, supplier_id, amount, payment_date, notes, sync_status, updated_at',
    expenses: '++id, user_id, amount, expense_date, description, sync_status, updated_at',
    sync_queue: '++id, table_name, record_id, action, timestamp, payload, retry_count',
    settings: 'key, value'
});

localDB.items.hook('creating', function (primKey, obj) {
    obj.updated_at = new Date().toISOString();
    if (!obj.sync_status) obj.sync_status = 'pending';
});

localDB.items.hook('updating', function (mods, primKey, obj) {
    mods.updated_at = new Date().toISOString();
    if (obj.sync_status === 'synced') mods.sync_status = 'pending';
});

export async function getPendingSyncCount() {
    return await localDB.sync_queue.count();
}

export async function getAllPendingSync() {
    return await localDB.sync_queue.orderBy('timestamp').toArray();
}

export async function clearSyncQueue() {
    return await localDB.sync_queue.clear();
}

export async function getLastSyncTime() {
    const setting = await localDB.settings.get('last_sync');
    return setting ? setting.value : null;
}

export async function setLastSyncTime(time) {
    return await localDB.settings.put({ key: 'last_sync', value: time });
}

export async function exportAllData() {
    const data = {};
    const tables = ['accounts', 'categories', 'units', 'items', 'customers', 
                    'suppliers', 'invoices', 'payments', 'expenses'];
    for (const table of tables) {
        data[table] = await localDB[table].toArray();
    }
    return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonData) {
    const data = JSON.parse(jsonData);
    await localDB.transaction('rw', 
        localDB.accounts, localDB.categories, localDB.units, 
        localDB.items, localDB.customers, localDB.suppliers,
        localDB.invoices, localDB.payments, localDB.expenses,
        async () => {
            for (const [table, records] of Object.entries(data)) {
                await localDB[table].clear();
                await localDB[table].bulkAdd(records);
            }
        }
    );
}

console.log('✅ قاعدة البيانات المحلية جاهزة');
