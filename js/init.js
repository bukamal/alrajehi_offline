// js/init.js — تهيئة التطبيق المحلي مع دعم المشاركة والنسخ الاحتياطي
import { initNavigation } from './navigation.js';
import { loadDashboard } from './dashboard.js';
import { refreshCaches, apiCall } from './db.js';
import { showToast } from './modal.js';

async function initApp() {
  try {
    await refreshCaches();
    document.getElementById('user-name-sidebar').textContent = 'مستخدم';
    document.getElementById('user-avatar').textContent = 'م';
    initNavigation();
    document.getElementById('loading-screen').classList.add('hidden');
    await loadDashboard();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('share-import') === 'pending') {
      await handleSharedFileImport();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    import('./db.js').then(({ apiCall }) => {
      Promise.all([
        apiCall('/items', 'GET'),
        apiCall('/customers', 'GET'),
        apiCall('/suppliers', 'GET'),
        apiCall('/invoices', 'GET'),
        apiCall('/definitions?type=category', 'GET'),
        apiCall('/definitions?type=unit', 'GET')
      ]).catch(err => console.warn('تعذّر جلب بعض البيانات الأولية:', err));
    });

  } catch (e) {
    console.error('[App Init Error]', e);
    showToast(e.message, 'error');
    document.getElementById('loading-screen').classList.add('hidden');
    const errScreen = document.getElementById('error-screen');
    const errDetails = document.getElementById('error-details');
    if (errScreen && errDetails) {
      errScreen.style.display = 'flex';
      errDetails.textContent = e.stack || e.message || 'خطأ غير معروف';
    }
  }
}

async function handleSharedFileImport() {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('AlrajhiSharedFiles', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const stored = await new Promise((resolve, reject) => {
      const getReq = store.get('pending_import');
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    });
    if (stored && stored.files) {
      for (const file of stored.files) {
        const json = new TextDecoder().decode(new Uint8Array(file.data));
        const data = JSON.parse(json);
        await importDataFromJSON(data);
      }
      showToast('تم استيراد الملفات بنجاح', 'success');
    }
    const deleteTx = db.transaction('files', 'readwrite');
    deleteTx.objectStore('files').delete('pending_import');
  } catch (err) {
    showToast('فشل استيراد الملفات: ' + err.message, 'error');
  }
}

async function importDataFromJSON(data) {
  const tables = ['items', 'units', 'categories', 'customers', 'suppliers', 'invoices', 'invoiceLines', 'payments', 'expenses', 'vouchers'];
  for (const table of tables) {
    if (data[table] && Array.isArray(data[table])) {
      await db.table(table).bulkPut(data[table]);
    }
  }
  await refreshCaches();
}

initApp();
