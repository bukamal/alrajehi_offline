// ========== طبقة API الموحدة - Offline-First ==========
import { localDB } from './db.js';
import { syncManager } from './sync.js';

window.APP_CONFIG = {
    API_BASE: localStorage.getItem('api_base') || '/api',
    AUTH_MODE: localStorage.getItem('auth_mode') || 'telegram',
    OFFLINE_FIRST: true
};

function isOnline() { return navigator.onLine; }

function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (window.APP_CONFIG.AUTH_MODE === 'telegram') {
        const tg = window.Telegram?.WebApp;
        if (tg) headers['X-Telegram-Init-Data'] = tg.initData;
    } else {
        const token = localStorage.getItem('auth_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function apiCall(endpoint, method = 'GET', body = {}) {
    const tableName = endpoint.split('/')[1]?.split('?')[0];
    if (isOnline() && window.APP_CONFIG.OFFLINE_FIRST) {
        try {
            const result = await makeOnlineRequest(endpoint, method, body);
            if (method === 'GET' && tableName && localDB[tableName]) {
                await updateLocalCache(tableName, result);
            }
            return result;
        } catch (err) {
            console.warn('⚠️ فشل الطلب Online، الانتقال لـ Offline:', err.message);
        }
    }
    return handleOfflineRequest(endpoint, method, body, tableName);
}

async function makeOnlineRequest(endpoint, method, body) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    let url = API_BASE + endpoint;
    if (window.APP_CONFIG.AUTH_MODE === 'telegram') {
        const tg = window.Telegram?.WebApp;
        if (tg && (method === 'GET' || method === 'DELETE')) {
            const sep = url.includes('?') ? '&' : '?';
            url += `${sep}initData=${encodeURIComponent(tg.initData)}`;
        }
    }
    const options = { method, headers: getAuthHeaders() };
    if (method !== 'GET' && method !== 'DELETE') {
        if (window.APP_CONFIG.AUTH_MODE === 'telegram') {
            const tg = window.Telegram?.WebApp;
            if (tg) body.initData = tg.initData;
        }
        options.body = JSON.stringify(body);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    options.signal = controller.signal;
    try {
        const res = await fetch(url, options);
        clearTimeout(timeout);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || `خطأ ${res.status}`);
        return json;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

async function handleOfflineRequest(endpoint, method, body, tableName) {
    console.log(`📴 Offline Mode: ${method} ${endpoint}`);
    switch(method) {
        case 'GET': return await handleOfflineGet(tableName, endpoint);
        case 'POST': return await handleOfflineCreate(tableName, body);
        case 'PUT': return await handleOfflineUpdate(tableName, body);
        case 'DELETE': return await handleOfflineDelete(tableName, endpoint);
        default: throw new Error('Method not supported offline');
    }
}

async function handleOfflineGet(tableName, endpoint) {
    if (!tableName || !localDB[tableName]) throw new Error('غير مدعوم Offline');
    const url = new URL(endpoint, 'http://localhost');
    const type = url.searchParams.get('type');
    let query = localDB[tableName];
    const results = await query.toArray();
    if (tableName === 'items') {
        for (const item of results) {
            if (item.category_id) item.category = await localDB.categories.get(item.category_id);
            if (item.base_unit_id) item.base_unit = await localDB.units.get(item.base_unit_id);
            item.item_units = await localDB.item_units.where('item_id').equals(item.id).toArray();
        }
    }
    if (tableName === 'invoices') {
        for (const inv of results) {
            inv.invoice_lines = await localDB.invoice_lines.where('invoice_id').equals(inv.id).toArray();
            if (inv.customer_id) inv.customer = await localDB.customers.get(inv.customer_id);
            if (inv.supplier_id) inv.supplier = await localDB.suppliers.get(inv.supplier_id);
            const payments = await localDB.payments.where('invoice_id').equals(inv.id).toArray();
            inv.paid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            inv.balance = inv.total - inv.paid;
        }
    }
    return results;
}

async function handleOfflineCreate(tableName, body) {
    if (!tableName || !localDB[tableName]) throw new Error('غير مدعوم Offline');
    const record = {
        ...body,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        sync_status: 'pending',
        user_id: localStorage.getItem('user_id') || 'offline_user'
    };
    const newId = await localDB[tableName].add(record);
    await syncManager.queueChange(tableName, newId, 'create', body);
    return { ...record, id: newId };
}

async function handleOfflineUpdate(tableName, body) {
    if (!tableName || !localDB[tableName]) throw new Error('غير مدعوم Offline');
    const { id, ...updates } = body;
    await localDB[tableName].update(id, { ...updates, sync_status: 'pending' });
    await syncManager.queueChange(tableName, id, 'update', body);
    return await localDB[tableName].get(id);
}

async function handleOfflineDelete(tableName, endpoint) {
    if (!tableName || !localDB[tableName]) throw new Error('غير مدعوم Offline');
    const url = new URL(endpoint, 'http://localhost');
    const id = url.searchParams.get('id');
    if (!id) throw new Error('ID مطلوب للحذف');
    await localDB[tableName].update(parseInt(id) || id, { sync_status: 'pending_delete' });
    await syncManager.queueChange(tableName, id, 'delete', {});
    return { success: true };
}

async function updateLocalCache(tableName, data) {
    if (!localDB[tableName] || !Array.isArray(data)) return;
    await localDB.transaction('rw', localDB[tableName], async () => {
        for (const record of data) {
            const exists = await localDB[tableName].get(record.id);
            if (!exists || exists.sync_status === 'synced') {
                await localDB[tableName].put({ ...record, sync_status: 'synced' });
            }
        }
    });
}

export async function loginStandalone(phone, password) {
    const API_BASE = window.APP_CONFIG.API_BASE;
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_id', data.user.id);
    localStorage.setItem('auth_mode', 'jwt');
    window.APP_CONFIG.AUTH_MODE = 'jwt';
    return data;
}

export function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_mode');
    window.location.reload();
}

export async function checkAuth() {
    if (window.APP_CONFIG.AUTH_MODE === 'telegram') {
        const tg = window.Telegram?.WebApp;
        return !!tg?.initData;
    }
    return !!localStorage.getItem('auth_token');
}

console.log('✅ طبقة API Offline-First جاهزة');
