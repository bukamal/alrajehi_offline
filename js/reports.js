import { ICONS } from './constants.js';
import { formatNumber, formatDate, showToast, openModal, confirmDialog } from './utils.js';
import {
  db,
  apiCall,
  itemsCache,
  customersCache,
  suppliersCache,
  unitsCache,
  invoicesCache,
  paymentsCache,  // ✅ FIXED: Now imported from db.js
  categoriesCache
} from './db.js';

/**
 * عرض صفحة التقارير الرئيسية
 */
export function loadReports() {
  const tc = document.getElementById('tab-content');
  tc.innerHTML = `
    <div class="card"><h3 class="card-title">التقارير المالية</h3></div>
    <div class="report-card" id="rpt-dash"><div class="report-icon">📊</div><div class="report-info"><h4>لوحة التحكم</h4></div></div>
    <div class="report-card" id="rpt-trial"><div class="report-icon">📋</div><div class="report-info"><h4>ميزان المراجعة</h4></div></div>
    <div class="report-card" id="rpt-income"><div class="report-icon">📈</div><div class="report-info"><h4>قائمة الدخل</h4></div></div>
    <div class="report-card" id="rpt-balance"><div class="report-icon">⚖️</div><div class="report-info"><h4>الميزانية العمومية</h4></div></div>
    <div class="report-card" id="rpt-cust"><div class="report-icon">👤</div><div class="report-info"><h4>كشف حساب عميل</h4></div></div>
    <div class="report-card" id="rpt-supp"><div class="report-icon">🏭</div><div class="report-info"><h4>كشف حساب مورد</h4></div></div>
  `;

  document.getElementById('rpt-dash').onclick = loadDashboard;
  document.getElementById('rpt-trial').onclick = loadTrialBalance;
  document.getElementById('rpt-income').onclick = loadIncomeStatement;
  document.getElementById('rpt-balance').onclick = loadBalanceSheet;
  document.getElementById('rpt-cust').onclick = loadCustomerStatementForm;
  document.getElementById('rpt-supp').onclick = loadSupplierStatementForm;
}

/**
 * ميزان المراجعة
 */
export async function loadTrialBalance() {
  const invoices = await apiCall('/invoices', 'GET');
  const expenses = await apiCall('/expenses', 'GET');
  const totalSales = invoices.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
  const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  document.getElementById('tab-content').innerHTML = `
    <div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-trial" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>ميزان المراجعة</h3>
      <div class="table-wrap"><table class="table">
        <thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr></thead>
        <tbody>
          <tr><td>المبيعات</td><td></td><td>${formatNumber(totalSales)}</td></tr>
          <tr><td>المشتريات</td><td>${formatNumber(totalPurchases)}</td><td></td></tr>
          <tr><td>المصاريف</td><td>${formatNumber(totalExpenses)}</td><td></td></tr>
        </tbody>
      </table></div>
    </div>`;

  document.getElementById('back-from-trial').onclick = () => loadReports();
}

/**
 * قائمة الدخل
 */
export async function loadIncomeStatement() {
  const invoices = await apiCall('/invoices', 'GET');
  const expenses = await apiCall('/expenses', 'GET');
  const totalSales = invoices.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
  const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const net = totalSales - totalPurchases - totalExpenses;

  document.getElementById('tab-content').innerHTML = `
    <div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-income" style="margin-bottom:12px;"> 🔙 رجوع</button>
      <h3>قائمة الدخل</h3>
      <p>الإيرادات: ${formatNumber(totalSales)}</p>
      <p>تكلفة المبيعات: ${formatNumber(totalPurchases)}</p>
      <p>المصاريف: ${formatNumber(totalExpenses)}</p>
      <hr>
      <h2 style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">صافي الربح: ${formatNumber(net)}</h2>
    </div>`;

  document.getElementById('back-from-income').onclick = () => loadReports();
}

/**
 * الميزانية العمومية المبسطة
 */
export async function loadBalanceSheet() {
  const customers = await apiCall('/customers', 'GET');
  const suppliers = await apiCall('/suppliers', 'GET');
  const custBalance = customers.reduce((s, c) => s + (c.balance || 0), 0);
  const suppBalance = suppliers.reduce((s, s2) => s + (s2.balance || 0), 0);

  document.getElementById('tab-content').innerHTML = `
    <div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-balance" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>الميزانية العمومية</h3>
      <p>ذمم مدينة: ${formatNumber(custBalance)}</p>
      <p>ذمم دائنة: ${formatNumber(suppBalance)}</p>
    </div>`;

  document.getElementById('back-from-balance').onclick = () => loadReports();
}

/**
 * نموذج كشف حساب عميل
 */
export async function loadCustomerStatementForm() {
  const customers = await apiCall('/customers', 'GET');
  const opts = customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  document.getElementById('tab-content').innerHTML = `
    <div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-cust" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>كشف حساب عميل</h3>
      <select class="select" id="cust-sel">${opts}</select>
      <button class="btn btn-primary" id="btn-show-cust">عرض</button>
      <div id="stmt-result"></div>
    </div>`;

  document.getElementById('back-from-cust').onclick = () => loadReports();

  document.getElementById('btn-show-cust').onclick = async () => {
    const id = document.getElementById('cust-sel').value;
    const invoices = await apiCall('/invoices', 'GET');
    const payments = await apiCall('/payments', 'GET');
    const custInvs = invoices.filter(i => i.customer_id == id);
    const custPmts = payments.filter(p => p.customer_id == id);

    let html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>';
    let balance = 0;
    custInvs.forEach(i => {
      balance += i.total;
      html += `<tr><td>${formatDate(i.date)}</td><td>فاتورة ${i.reference || ''}</td><td>${formatNumber(i.total)}</td><td>-</td><td>${formatNumber(balance)}</td></tr>`;
    });
    custPmts.forEach(p => {
      balance -= p.amount;
      html += `<tr><td>${formatDate(p.payment_date)}</td><td>دفعة</td><td>-</td><td style="color:var(--success);">${formatNumber(p.amount)}</td><td>${formatNumber(balance)}</td></tr>`;
    });
    html += '</tbody></table></div>';
    document.getElementById('stmt-result').innerHTML = html;
  };
}

/**
 * نموذج كشف حساب مورد
 */
export async function loadSupplierStatementForm() {
  const suppliers = await apiCall('/suppliers', 'GET');
  const opts = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  document.getElementById('tab-content').innerHTML = `
    <div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-supp" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>كشف حساب مورد</h3>
      <select class="select" id="supp-sel">${opts}</select>
      <button class="btn btn-primary" id="btn-show-supp">عرض</button>
      <div id="stmt-result"></div>
    </div>`;

  document.getElementById('back-from-supp').onclick = () => loadReports();

  document.getElementById('btn-show-supp').onclick = async () => {
    const id = document.getElementById('supp-sel').value;
    const invoices = await apiCall('/invoices', 'GET');
    const payments = await apiCall('/payments', 'GET');
    const suppInvs = invoices.filter(i => i.supplier_id == id);
    const suppPmts = payments.filter(p => p.supplier_id == id);

    let html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>';
    let balance = 0;
    suppInvs.forEach(i => {
      balance += i.total;
      html += `<tr><td>${formatDate(i.date)}</td><td>فاتورة ${i.reference || ''}</td><td>${formatNumber(i.total)}</td><td>-</td><td>${formatNumber(balance)}</td></tr>`;
    });
    suppPmts.forEach(p => {
      balance -= p.amount;
      html += `<tr><td>${formatDate(p.payment_date)}</td><td>دفعة</td><td>-</td><td style="color:var(--danger);">${formatNumber(p.amount)}</td><td>${formatNumber(balance)}</td></tr>`;
    });
    html += '</tbody></table></div>';
    document.getElementById('stmt-result').innerHTML = html;
  };
}

/**
 * لوحة التحكم (نظرة عامة + أزرار تصدير/استيراد)
 */
export async function loadDashboard() {
  const invoices = await apiCall('/invoices', 'GET');
  const totalSales = invoices.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
  const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0);
  const expenses = await apiCall('/expenses', 'GET');
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const net = totalSales - totalPurchases - totalExpenses;

  const tc = document.getElementById('tab-content');
  tc.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value ${net >= 0 ? 'positive' : 'negative'}">${formatNumber(net)}</div></div>
      <div class="stat-card cash"><div class="stat-label">المبيعات</div><div class="stat-value">${formatNumber(totalSales)}</div></div>
      <div class="stat-card receivables"><div class="stat-label">المشتريات</div><div class="stat-value">${formatNumber(totalPurchases)}</div></div>
      <div class="stat-card payables"><div class="stat-label">المصاريف</div><div class="stat-value">${formatNumber(totalExpenses)}</div></div>
    </div>
    <div class="card">
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="btn-export">📤 تصدير البيانات</button>
        <button class="btn btn-secondary" id="btn-import">📥 استيراد البيانات</button>
      </div>
    </div>`;

  document.getElementById('btn-export').onclick = showExportDialog;
  document.getElementById('btn-import').onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = e => handleImport(e.target.files[0]);
    inp.click();
  };
}

/* ============================================================
   تصدير البيانات — نسخة محسّنة مع fallback شاملة
   ============================================================ */

const EXPORT_TABLES = ['items', 'customers', 'suppliers', 'categories', 'units', 'invoices', 'invoiceLines', 'payments', 'expenses'];
const TABLE_LABELS = {
  items: 'المواد',
  customers: 'العملاء',
  suppliers: 'الموردين',
  categories: 'التصنيفات',
  units: 'الوحدات',
  invoices: 'الفواتير',
  invoiceLines: 'بنود الفواتير',
  payments: 'الدفعات',
  expenses: 'المصاريف'
};

/** هل المتصفح يدعم File System Access API؟ */
function supportsFilePicker() {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/** تحميل ملف عبر الرابط التقليدي (fallback) */
function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

/** نسخ النص إلى الحافظة (fallback إضافي للهاتف) */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * تصدير جميع البيانات إلى ملف JSON
 */
export async function showExportDialog() {
  // 1) جمع الإحصائيات
  const stats = await Promise.all(
    EXPORT_TABLES.map(async t => {
      const rows = await db[t].toArray();
      return { table: t, count: rows.length, rows };
    })
  );

  const statsHTML = stats
    .map(s => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
      <span>${TABLE_LABELS[s.table]}</span>
      <span style="font-weight:700;">${s.count} سجل</span>
    </div>`)
    .join('');

  const totalRecords = stats.reduce((sum, s) => sum + s.count, 0);
  const hasData = totalRecords > 0;

  const modal = openModal({
    title: 'تصدير البيانات',
    bodyHTML: `
      <p style="margin-bottom:12px;color:var(--text-secondary);">
        ${hasData ? 'سيتم تصدير جميع بياناتك إلى ملف JSON.' : '⚠️ لا توجد بيانات للتصدير.'}
      </p>
      <div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">
        <div style="font-weight:700;margin-bottom:8px;">محتوى التصدير (${totalRecords} سجل)</div>
        ${statsHTML}
      </div>
      <p style="font-size:13px;color:var(--text-muted);">
        ${supportsFilePicker() ? '💡 يمكنك اختيار مكان الحفظ.' : '⚠️ سيتم الحفظ في مجلد التنزيلات.'}
      </p>`,
    footerHTML: `
      <button class="btn btn-secondary" id="exp-cancel">إلغاء</button>
      <button class="btn btn-primary" id="exp-confirm" ${!hasData ? 'disabled' : ''}>📥 بدء التصدير</button>
      ${supportsFilePicker() ? '' : '<button class="btn btn-secondary" id="exp-copy">📋 نسخ للحافظة</button>'}
    `
  });

  modal.element.querySelector('#exp-cancel').onclick = () => modal.close();

  // التصدير العادي
  modal.element.querySelector('#exp-confirm').onclick = async () => {
    modal.close();
    await doExport(stats);
  };

  // نسخ للحافظة (fallback للهاتف)
  const copyBtn = modal.element.querySelector('#exp-copy');
  if (copyBtn) {
    copyBtn.onclick = async () => {
      const data = {};
      stats.forEach(s => { data[s.table] = s.rows; });
      const json = JSON.stringify(data, null, 2);
      const ok = await copyToClipboard(json);
      showToast(ok ? '✅ تم نسخ البيانات للحافظة' : '❌ فشل النسخ', ok ? 'success' : 'error');
      modal.close();
    };
  }
}

/** تنفيذ التصدير الفعلي */
async function doExport(stats) {
  const data = {};
  stats.forEach(s => { data[s.table] = s.rows; });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const fileName = `alrajhi-backup-${new Date().toISOString().slice(0, 10)}.json`;

  // محاولة File System Access API أولاً
  if (supportsFilePicker()) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'ملف JSON',
          accept: { 'application/json': ['.json'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      showToast(`✅ تم حفظ الملف: ${fileName}`, 'success');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // المستخدم ألغى
      console.warn('[Export] File Picker failed, falling back:', err);
      // لا تُرجع خطأ، استمر للـ fallback
    }
  }

  // Fallback: تحميل تلقائي
  downloadBlob(blob, fileName);
  showToast(`✅ تم تنزيل "${fileName}"`, 'success');
}

/* ============================================================
   استيراد البيانات — نسخة محسّنة
   ============================================================ */

/**
 * استيراد البيانات من ملف JSON
 * ✅ FIXED: Now exported so it can be used by loadDashboard
 */
export async function handleImport(file) {
  if (!file) return;

  // التحقق من نوع الملف
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    showToast('❌ يرجى اختيار ملف JSON فقط', 'error');
    return;
  }

  let data;
  try {
    const text = await file.text();
    data = JSON.parse(text);
  } catch (e) {
    showToast('❌ الملف تالف أو ليس JSON صالح: ' + e.message, 'error');
    return;
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    showToast('❌ تنسيق الملف غير صحيح (يجب أن يكون كائن JSON)', 'error');
    return;
  }

  const priorityOrder = ['categories', 'units', 'customers', 'suppliers', 'items', 'invoices', 'invoiceLines', 'payments', 'expenses'];
  const sortedTables = Object.keys(data)
    .filter(k => Array.isArray(data[k]))
    .sort((a, b) => {
      const ia = priorityOrder.indexOf(a);
      const ib = priorityOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  if (!sortedTables.length) {
    showToast('❌ الملف لا يحتوي على بيانات', 'error');
    return;
  }

  const totalRecords = sortedTables.reduce((sum, t) => sum + data[t].length, 0);

  const tableDetails = sortedTables.map(t => {
    const label = TABLE_LABELS[t] || t;
    return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);">
      <span>${label}</span>
      <span style="font-weight:700;">${data[t].length} سجل</span>
    </div>`;
  }).join('');

  const modal = openModal({
    title: 'معاينة ملف الاستيراد',
    bodyHTML: `
      <p>تم العثور على <strong>${sortedTables.length} جداول</strong> تحتوي على <strong>${totalRecords} سجل</strong>.</p>
      <div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">${tableDetails}</div>
      <p style="color:var(--danger);">⚠️ تحذير: سيتم <strong>مسح جميع بياناتك الحالية</strong> واستبدالها بهذا الملف.</p>`,
    footerHTML: `
      <button class="btn btn-secondary" id="imp-cancel">إلغاء</button>
      <button class="btn btn-danger" id="imp-confirm">استيراد واستبدال</button>
    `
  });

  modal.element.querySelector('#imp-cancel').onclick = () => modal.close();

  modal.element.querySelector('#imp-confirm').onclick = async () => {
    modal.close();
    await doImport(sortedTables, data);
  };
}

/** تنفيذ الاستيراد الفعلي */
async function doImport(tableNames, data) {
  const btn = document.getElementById('btn-import');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ جاري الاستيراد...';
  }

  try {
    // استخدام معاملة Dexie على جميع الجداول
    const tables = tableNames.map(t => db[t]);
    await db.transaction('rw', tables, async () => {
      for (const table of tableNames) {
        await db[table].clear();
        // إضافة دفعة واحدة أسرع من إضافة فردية
        if (data[table].length > 0) {
          await db[table].bulkAdd(data[table]);
        }
      }
    });

    showToast('✅ تم استيراد البيانات بنجاح', 'success');

    // تحديث الكاشات
    await refreshAllCaches();

    // إعادة تحميل لوحة التحكم
    loadDashboard();

  } catch (e) {
    console.error('[Import Error]', e);
    showToast('❌ فشل الاستيراد: ' + e.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📥 استيراد البيانات';
    }
  }
}

/** تحديث جميع الكاشات بعد الاستيراد
 * ✅ FIXED: Now uses paymentsCache from db.js
 */
async function refreshAllCaches() {
  itemsCache.length = 0;
  customersCache.length = 0;
  suppliersCache.length = 0;
  invoicesCache.length = 0;
  categoriesCache.length = 0;
  unitsCache.length = 0;
  paymentsCache.length = 0;  // ✅ FIXED: Clear payments cache too

  const [items, customers, suppliers, invoices, categories, units, payments] = await Promise.all([
    apiCall('/items', 'GET'),
    apiCall('/customers', 'GET'),
    apiCall('/suppliers', 'GET'),
    apiCall('/invoices', 'GET'),
    apiCall('/definitions?type=category', 'GET'),
    apiCall('/definitions?type=unit', 'GET'),
    apiCall('/payments', 'GET')
  ]);

  itemsCache.push(...items);
  customersCache.push(...customers);
  suppliersCache.push(...suppliers);
  categoriesCache.push(...categories);
  unitsCache.push(...units);
  invoicesCache.push(...invoices);
  paymentsCache.push(...payments);  // ✅ FIXED: Populate payments cache

  // إعادة حساب أرصدة الفواتير
  invoicesCache.forEach(inv => {
    const pmts = payments.filter(p => p.invoice_id == inv.id);
    inv.paid = pmts.reduce((s, p) => s + p.amount, 0);
    inv.balance = inv.total - inv.paid;
  });
}
