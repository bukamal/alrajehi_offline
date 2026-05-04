// ========== مدير المزامنة - Sync Manager ==========
import { localDB, getPendingSyncCount, setLastSyncTime } from './db.js';

class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.autoSyncInterval = null;
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 متصل بالإنترنت');
            this.showConnectionStatus(true);
            this.syncAll();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 غير متصل');
            this.showConnectionStatus(false);
        });
        this.startAutoSync();
    }
    showConnectionStatus(online) {
        const indicator = document.getElementById('connection-indicator');
        if (!indicator) return;
        if (online) {
            indicator.innerHTML = '🟢 متصل';
            indicator.className = 'connection-status online';
        } else {
            indicator.innerHTML = '🔴 Offline';
            indicator.className = 'connection-status offline';
        }
    }
    startAutoSync() {
        this.autoSyncInterval = setInterval(() => {
            if (this.isOnline && !this.syncInProgress) this.syncAll();
        }, 30000);
    }
    stopAutoSync() {
        if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
    }
    async queueChange(tableName, recordId, action, payload) {
        await localDB.sync_queue.add({
            table_name: tableName,
            record_id: recordId,
            action: action,
            timestamp: Date.now(),
            payload: JSON.stringify(payload),
            retry_count: 0
        });
        this.updatePendingBadge();
        if (this.isOnline) this.syncAll();
    }
    async updatePendingBadge() {
        const count = await getPendingSyncCount();
        const badge = document.getElementById('pending-sync-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    async syncAll() {
        if (this.syncInProgress || !this.isOnline) return;
        const authToken = localStorage.getItem('auth_token');
        if (!authToken) return;
        this.syncInProgress = true;
        try {
            const pending = await localDB.sync_queue.orderBy('timestamp').toArray();
            if (pending.length === 0) {
                await this.pullFromServer();
                return;
            }
            console.log(`🔄 بدء مزامنة ${pending.length} عملية...`);
            for (const job of pending) {
                try {
                    await this.syncRecord(job);
                    await localDB.sync_queue.delete(job.id);
                    console.log(`✅ تمت مزامنة: ${job.table_name} #${job.record_id}`);
                } catch (err) {
                    console.error(`❌ فشلت المزامنة:`, err);
                    await localDB.sync_queue.update(job.id, { retry_count: job.retry_count + 1 });
                    if (job.retry_count >= 3) {
                        console.warn('⚠️ تم تجاهل العملية بعد 3 محاولات فاشلة');
                        await localDB.sync_queue.delete(job.id);
                    }
                }
            }
            await this.pullFromServer();
            await setLastSyncTime(new Date().toISOString());
            if (typeof showToast === 'function') showToast('تمت المزامنة بنجاح', 'success');
        } catch (err) {
            console.error('❌ فشلت المزامنة الكاملة:', err);
        } finally {
            this.syncInProgress = false;
            this.updatePendingBadge();
        }
    }
    async syncRecord(job) {
        const payload = JSON.parse(job.payload);
        const API_BASE = window.APP_CONFIG?.API_BASE || '/api';
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        };
        let url = `${API_BASE}/${job.table_name}`;
        let method = 'POST';
        switch(job.action) {
            case 'create': method = 'POST'; break;
            case 'update': method = 'PUT'; url += `?id=${job.record_id}`; break;
            case 'delete': method = 'DELETE'; url += `?id=${job.record_id}`; break;
        }
        const res = await fetch(url, {
            method,
            headers,
            body: method !== 'DELETE' ? JSON.stringify(payload) : undefined
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        if (job.action !== 'delete') {
            await localDB[job.table_name].update(job.record_id, { sync_status: 'synced' });
        }
    }
    async pullFromServer() {
        const API_BASE = window.APP_CONFIG?.API_BASE || '/api';
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` };
        const tables = [
            { name: 'categories', endpoint: '/definitions?type=category' },
            { name: 'units', endpoint: '/definitions?type=unit' },
            { name: 'items', endpoint: '/items' },
            { name: 'customers', endpoint: '/customers' },
            { name: 'suppliers', endpoint: '/suppliers' },
            { name: 'invoices', endpoint: '/invoices' },
            { name: 'payments', endpoint: '/payments' },
            { name: 'expenses', endpoint: '/expenses' }
        ];
        for (const { name, endpoint } of tables) {
            try {
                const res = await fetch(`${API_BASE}${endpoint}`, { headers });
                if (!res.ok) continue;
                const serverData = await res.json();
                await localDB.transaction('rw', localDB[name], async () => {
                    for (const record of serverData) {
                        const exists = await localDB[name].get(record.id);
                        if (!exists) {
                            await localDB[name].add({ ...record, sync_status: 'synced' });
                        } else if (exists.sync_status === 'synced') {
                            await localDB[name].update(record.id, { ...record, sync_status: 'synced' });
                        }
                    }
                });
                console.log(`📥 تم سحب ${serverData.length} من ${name}`);
            } catch (err) {
                console.error(`❌ فشل سحب ${name}:`, err);
            }
        }
    }
    async syncNow() {
        if (!this.isOnline) {
            if (typeof showToast === 'function') showToast('لا يوجد اتصال بالإنترنت', 'warning');
            return;
        }
        if (typeof showToast === 'function') showToast('جاري المزامنة...', 'info');
        await this.syncAll();
    }
    async getSyncStatus() {
        const pending = await getPendingSyncCount();
        const lastSync = await localDB.settings.get('last_sync');
        return {
            isOnline: this.isOnline,
            pendingCount: pending,
            lastSync: lastSync ? lastSync.value : null,
            isSyncing: this.syncInProgress
        };
    }
}

export const syncManager = new SyncManager();
console.log('✅ مدير المزامنة جاهز');
