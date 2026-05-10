// js/settings.js — إعدادات ونسخ احتياطي
import { db, refreshCaches } from './db.js';
import { showToast, confirmDialog } from './modal.js';
import { emptyState } from './core.js';

export async function loadSettings() {
  const html = `
    <div class="card">
      <h3 class="card-title">الإعدادات والنسخ الاحتياطي</h3>
      <p class="card-subtitle">تصدير واستيراد جميع بيانات التطبيق</p>
      <div style="display:flex; flex-direction:column; gap:12px; margin-top:20px;">
        <button class="btn btn-primary" id="export-all">📤 تصدير جميع البيانات</button>
        <button class="btn btn-secondary" id="import-all">📥 استيراد من ملف JSON</button>
        <input type="file" id="import-file-input" accept=".json" style="display:none;">
      </div>
      <div id="export-status" style="margin-top:20px;"></div>
    </div>`;

  document.getElementById('tab-content').innerHTML = html;

  document.getElementById('export-all').onclick = async () => {
    try {
      const data = {
        items: await db.items.toArray(),
        units: await db.units.toArray(),
        categories: await db.categories.toArray(),
        customers: await db.customers.toArray(),
        suppliers: await db.suppliers.toArray(),
        invoices: await db.invoices.toArray(),
        invoiceLines: await db.invoiceLines.toArray(),
        payments: await db.payments.toArray(),
        expenses: await db.expenses.toArray(),
        vouchers: await db.vouchers.toArray()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alrajhi-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('تم تصدير البيانات بنجاح', 'success');
    } catch (err) {
      showToast('فشل التصدير: ' + err.message, 'error');
    }
  };

  document.getElementById('import-all').onclick = () => {
    document.getElementById('import-file-input').click();
  };

  document.getElementById('import-file-input').onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!await confirmDialog('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const tables = ['items', 'units', 'categories', 'customers', 'suppliers', 'invoices', 'invoiceLines', 'payments', 'expenses', 'vouchers'];
      for (const table of tables) {
        if (data[table] && Array.isArray(data[table])) {
          await db.table(table).clear();
          await db.table(table).bulkAdd(data[table]);
        }
      }
      await refreshCaches();
      showToast('تم الاستيراد بنجاح', 'success');
    } catch (err) {
      showToast('فشل الاستيراد: ' + err.message, 'error');
    }
  };
}
