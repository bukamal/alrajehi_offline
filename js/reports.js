import { ICONS } from './constants.js';
import { formatNumber, formatDate, showToast, openModal, confirmDialog } from './utils.js';
import {
  db,
  apiCall,
  itemsCache,
  customersCache,
  suppliersCache,
  unitsCache,
  invoicesCache
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
      <button class="btn btn-secondary btn-sm" id="back-from-income" style="margin-bottom:12px;">🔙 رجوع</button>
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

    let html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>';
    custInvs.forEach(i => html += `<tr><td>${formatDate(i.date)}</td><td>فاتورة ${i.reference || ''}</td><td>${formatNumber(i.total)}</td></tr>`);
    custPmts.forEach(p => html += `<tr><td>${formatDate(p.payment_date)}</td><td>دفعة</td><td style="color:var(--success);">-${formatNumber(p.amount)}</td></tr>`);
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

    let html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>';
    suppInvs.forEach(i => html += `<tr><td>${formatDate(i.date)}</td><td>فاتورة ${i.reference || ''}</td><td>${formatNumber(i.total)}</td></tr>`);
    suppPmts.forEach(p => html += `<tr><td>${formatDate(p.payment_date)}</td><td>دفعة</td><td style="color:var(--danger);">-${formatNumber(p.amount)}</td></tr>`);
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
    inp.accept = '.json';
    inp.onchange = e => handleImport(e.target.files[0]);
    inp.click();
  };
}

/**
 * تصدير جميع البيانات إلى ملف JSON
 */
export async function showExportDialog() {
  const tables = ['items', 'customers', 'suppliers', 'categories', 'units', 'invoices', 'invoiceLines', 'payments', 'expenses'];
  const names = {
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

  const statsHTML = (await Promise.all(tables.map(async t => {
    const data = await db[t].toArray();
    return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span>${names[t]}</span><span style="font-weight:700;">${data.length} سجل</span></div>`;
  }))).join('');

  const supportsFilePicker = 'showSaveFilePicker' in window;

  const modal = openModal({
    title: 'تصدير البيانات',
    bodyHTML: `
      <p style="margin-bottom:12px;color:var(--text-secondary);">سيتم تصدير جميع بياناتك إلى ملف JSON.</p>
      <div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">
        <div style="font-weight:700;margin-bottom:8px;">محتوى التصدير</div>${statsHTML}
      </div>
      <p style="font-size:13px;color:var(--text-muted);">${supportsFilePicker ? '💡 المتصفح يدعم اختيار مكان الحفظ.' : '⚠️ سيتم الحفظ في مجلد "التنزيلات" الافتراضي.'}</p>`,
    footerHTML: `<button class="btn btn-secondary" id="exp-cancel">إلغاء</button><button class="btn btn-primary" id="exp-confirm">📥 بدء التصدير</button>`
  });

  modal.element.querySelector('#exp-cancel').onclick = () => modal.close();
  modal.element.querySelector('#exp-confirm').onclick = async () => {
    modal.close();
    const data = {};
    for (const t of tables) data[t] = await db[t].toArray();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const fileName = `alrajhi-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if (supportsFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'ملف JSON', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showToast(`✅ تم حفظ الملف بنجاح: ${fileName}`, 'success');
      } catch (err) {
        if (err.name !== 'AbortError') showToast('فشل التصدير: ' + err.message, 'error');
      }
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      showToast(`✅ تم تنزيل "${fileName}" إلى مجلد التنزيلات`, 'success');
    }
  };
}

/**
 * استيراد البيانات من ملف JSON مع معاملة ذرية
 */
export async function handleImport(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (typeof data !== 'object' || Array.isArray(data)) throw new Error('تنسيق الملف غير صحيح');

    const priorityOrder = ['categories', 'units', 'customers', 'suppliers', 'items', 'invoices', 'invoiceLines', 'payments', 'expenses'];
    const sortedTables = Object.keys(data).sort((a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b));
    if (!sortedTables.length) throw new Error('الملف فارغ');

    let totalRecords = 0;
    const tableDetails = sortedTables.map(t => {
      const count = Array.isArray(data[t]) ? data[t].length : 0;
      totalRecords += count;
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span>${t}</span><span style="font-weight:700;">${count} سجل</span></div>`;
    }).join('');

    const modal = openModal({
      title: 'معاينة ملف الاستيراد',
      bodyHTML: `
        <p>تم العثور على <strong>${sortedTables.length} جداول</strong> تحتوي على <strong>${totalRecords} سجل</strong>.</p>
        <div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">${tableDetails}</div>
        <p style="color:var(--danger);">⚠️ تحذير: سيتم <strong>مسح جميع بياناتك الحالية</strong> واستبدالها بهذا الملف.</p>`,
      footerHTML: `<button class="btn btn-secondary" id="imp-cancel">إلغاء</button><button class="btn btn-danger" id="imp-confirm">استيراد واستبدال</button>`
    });

    modal.element.querySelector('#imp-cancel').onclick = () => modal.close();

    modal.element.querySelector('#imp-confirm').onclick = async () => {
      modal.close();
      const tableNames = sortedTables.filter(t => Array.isArray(data[t]));
      try {
        await db.transaction('rw', tableNames, async () => {
          for (const table of tableNames) {
            const tableObj = db[table];
            await tableObj.clear();
            for (const row of data[table]) await tableObj.add(row);
          }
        });
        showToast('تم استيراد البيانات بنجاح', 'success');
      } catch (innerError) {
        showToast('فشل الاستيراد: ' + innerError.message, 'error');
        return;
      }

      // تحديث جميع الكاشات
      [itemsCache.length, customersCache.length, suppliersCache.length, invoicesCache.length, categoriesCache.length, unitsCache.length] = [0, 0, 0, 0, 0, 0];
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

      // إعادة حساب الأرصدة
      invoicesCache.forEach(inv => {
        const pmts = payments.filter(p => p.invoice_id == inv.id);
        inv.paid = pmts.reduce((s, p) => s + p.amount, 0);
        inv.balance = inv.total - inv.paid;
      });

      loadDashboard();
    };
  } catch (e) {
    showToast('فشل استيراد الملف: ' + e.message, 'error');
  }
}
