import { ICONS } from './constants.js';

export function formatNumber(num) {
  return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
}

export function debounce(fn, ms = 300) {
  let t;
  return (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

let scrollLockPos = 0;
export function lockScroll() {
  scrollLockPos = window.scrollY || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + scrollLockPos + 'px';
  document.body.style.width = '100%';
  document.body.classList.add('scroll-locked');
}
export function unlockScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.classList.remove('scroll-locked');
  window.scrollTo(0, scrollLockPos);
}

export function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

let activeModal = null;
export function openModal({ title, bodyHTML, footerHTML = '', onClose }) {
  const portal = document.getElementById('modal-portal');
  if (activeModal) activeModal.close();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box"><div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close">${ICONS.x}</button></div><div class="modal-body">${bodyHTML}</div>${footerHTML ? '<div class="modal-footer">' + footerHTML + '</div>' : ''}</div>`;
  portal.appendChild(overlay);
  lockScroll();
  activeModal = overlay;
  function close() {
    overlay.remove();
    activeModal = null;
    unlockScroll();
    if (onClose) onClose();
  }
  overlay.querySelector('.modal-close').onclick = close;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });
  return { close, element: overlay };
}

export function confirmDialog(msg) {
  return new Promise(resolve => {
    const m = openModal({
      title: 'تأكيد',
      bodyHTML: `<p>${msg}</p>`,
      footerHTML: '<button class="btn btn-secondary" id="cf-cancel">إلغاء</button><button class="btn btn-danger" id="cf-ok">تأكيد</button>',
      onClose: () => resolve(false)
    });
    m.element.querySelector('#cf-cancel').onclick = () => { m.close(); resolve(false); };
    m.element.querySelector('#cf-ok').onclick = () => { m.close(); resolve(true); };
  });
}

export function showFormModal({ title, fields, initialValues = {}, onSave, onSuccess }) {
  const formId = 'frm-' + Date.now();
  let body = '';
  fields.forEach(f => {
    const val = initialValues[f.id] !== undefined ? initialValues[f.id] : '';
    body += `<div class="form-group"><label class="form-label">${f.label}</label><input class="input" id="${formId}-${f.id}" type="${f.type || 'text'}" value="${val}"></div>`;
  });
  const modal = openModal({
    title,
    bodyHTML: body,
    footerHTML: `<button class="btn btn-secondary" id="${formId}-cancel">إلغاء</button><button class="btn btn-primary" id="${formId}-save">${ICONS.check} حفظ</button>`
  });
  modal.element.querySelector(`#${formId}-cancel`).onclick = () => modal.close();
  modal.element.querySelector(`#${formId}-save`).onclick = async () => {
    const values = {};
    fields.forEach(f => {
      const el = modal.element.querySelector(`#${formId}-${f.id}`);
      values[f.id] = el ? el.value.trim() : '';
    });
    try {
      await onSave(values);
      modal.close();
      showToast('تم الحفظ', 'success');
      if (onSuccess) onSuccess();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };
}

export function applyAutoTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (prefersDark) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

// ============================================
// Export / Import - Enhanced for TWA
// ============================================

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
}

export function supportsFileSystemAccess() {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
}

export async function exportData(data, filename = null) {
  const defaultName = `alrajhi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const finalName = filename || defaultName;

  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });

    if (supportsFileSystemAccess()) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: finalName,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast('✅ تم حفظ الملف', 'success');
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
        console.warn('[Export] File Picker failed:', err);
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    showToast('✅ تم تنزيل الملف - تجده في مجلد التنزيلات', 'success');
    return true;

  } catch (e) {
    console.error('[Export] Failed:', e);
    showToast('❌ فشل التصدير: ' + e.message, 'error');
    return false;
  }
}

export async function importData(options = {}) {
  const {
    onSuccess = null,
    onError = null,
    validateFn = null,
    mergeFn = null
  } = options;

  const pendingFiles = await checkPendingSharedFiles();
  if (pendingFiles && pendingFiles.length > 0) {
    showToast('📁 تم العثور على ملفات للاستيراد', 'info');
    const result = await processImportFile(pendingFiles[0], { onSuccess, onError, validateFn, mergeFn });
    await clearPendingSharedFiles();
    return result;
  }

  if (isStandalone()) {
    showStandaloneImportInstructions();
    return null;
  }

  return await importViaFileInput({ onSuccess, onError, validateFn, mergeFn });
}

function showStandaloneImportInstructions() {
  const modal = openModal({
    title: 'استيراد البيانات',
    bodyHTML: `
      <div style="text-align:center;padding:10px;">
        <div style="font-size:48px;margin-bottom:12px;">📁</div>
        <h3 style="margin-bottom:12px;">اختر طريقة الاستيراد</h3>

        <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:12px;text-align:right;border:1px solid var(--border);">
          <h4 style="color:var(--primary);margin-bottom:8px;font-size:15px;">الطريقة 1: مشاركة الملف (مُستحسنة)</h4>
          <ol style="color:var(--text-secondary);font-size:13px;line-height:1.8;padding-right:20px;">
            <li>افتح تطبيق <strong>الملفات</strong> أو <strong>Google Drive</strong></li>
            <li>ابحث عن ملف النسخ الاحتياطي (<code>.json</code>)</li>
            <li>اضغط على الملف واختر <strong>مشاركة</strong> 📤</li>
            <li>اختر <strong>الراجحي للمحاسبة</strong> من القائمة</li>
          </ol>
        </div>

        <div style="background:var(--bg);border-radius:12px;padding:14px;text-align:right;border:1px solid var(--border);">
          <h4 style="color:var(--warning);margin-bottom:8px;font-size:15px;">الطريقة 2: من المتصفح</h4>
          <ol style="color:var(--text-secondary);font-size:13px;line-height:1.8;padding-right:20px;">
            <li>افتح التطبيق في <strong>Chrome المتصفح</strong></li>
            <li>استخدم زر الاستيراد من هناك</li>
            <li>ثم شارك الملف إلى التطبيق</li>
          </ol>
        </div>

        <p style="color:var(--text-muted);font-size:12px;margin-top:12px;">
          💡 لماذا لا يعمل الاختيار المباشر؟ في تطبيق Android المُثبت،
          Chrome لا يسمح بفتح نافذة اختيار الملفات لأسباب أمنية.
        </p>
      </div>
    `,
    footerHTML: '<button class="btn btn-secondary" id="imp-close">إغلاق</button>'
  });

  modal.element.querySelector('#imp-close').onclick = () => modal.close();
}

function importViaFileInput(options) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }

      const result = await processImportFile(file, options);
      resolve(result);
    };

    input.addEventListener('cancel', () => {
      resolve(null);
    });

    input.click();
  });
}

async function processImportFile(file, options) {
  const { onSuccess, onError, validateFn, mergeFn } = options;

  const modal = openModal({
    title: 'جاري الاستيراد...',
    bodyHTML: `
      <div style="text-align:center;padding:20px;">
        <div class="loader-inline" style="width:40px;height:40px;border-color:var(--border);border-top-color:var(--primary);"></div>
        <p style="margin-top:16px;">جاري قراءة الملف...</p>
        <p id="import-filename" style="color:var(--text-muted);font-size:12px;">${file.name}</p>
      </div>
    `,
    footerHTML: ''
  });

  try {
    let text;

    if (file instanceof File || file instanceof Blob) {
      text = await file.text();
    } else if (file.data && Array.isArray(file.data)) {
      const uint8Array = new Uint8Array(file.data);
      text = new TextDecoder().decode(uint8Array);
    } else {
      throw new Error('نوع الملف غير معروف');
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('الملف تالف أو ليس JSON صالح');
    }

    modal.close();

    if (validateFn && !validateFn(data)) {
      throw new Error('ملف النسخ الاحتياطي غير صالح');
    }

    const tableCount = Object.keys(data).filter(k => Array.isArray(data[k])).length;
    const recordCount = Object.values(data).reduce((sum, arr) =>
      sum + (Array.isArray(arr) ? arr.length : 0), 0);

    const confirmed = await confirmDialog(
      `استيراد ${recordCount.toLocaleString()} سجل من ${tableCount} جداول؟\n` +
      `⚠️ سيتم استبدال البيانات الحالية.`
    );

    if (!confirmed) {
      showToast('تم إلغاء الاستيراد', 'info');
      return null;
    }

    if (mergeFn) {
      await mergeFn(data);
    }

    showToast('✅ تم الاستيراد بنجاح', 'success');

    if (onSuccess) onSuccess(data);

    return data;

  } catch (e) {
    modal.close();
    console.error('[Import] Failed:', e);
    showToast('❌ فشل الاستيراد: ' + e.message, 'error');
    if (onError) onError(e);
    return null;
  }
}

async function checkPendingSharedFiles() {
  return new Promise((resolve) => {
    const request = indexedDB.open('AlrajhiSharedFiles', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const getReq = store.get('pending_import');

      getReq.onsuccess = () => {
        const result = getReq.result;
        if (result && result.files && result.files.length > 0) {
          resolve(result.files);
        } else {
          resolve(null);
        }
      };

      getReq.onerror = () => resolve(null);
    };

    request.onerror = () => resolve(null);
  });
}

async function clearPendingSharedFiles() {
  return new Promise((resolve) => {
    const request = indexedDB.open('AlrajhiSharedFiles', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.delete('pending_import');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };

    request.onerror = () => resolve();
  });
}
