import { ICONS } from './constants.js';
import { formatNumber, formatDate, showToast, confirmDialog, openModal } from './utils.js';
import { db, invoicesCache, refreshCaches, checkCascadeDelete, performCascadeDelete } from './db.js';

export async function loadInvoices() {
  await refreshCaches();
  const tc = document.getElementById('tab-content');

  let html = `<div class="card">
    <div class="card-header">
      <h3 class="card-title">الفواتير</h3>
      <button class="btn btn-primary btn-sm" id="btn-new-sale">فاتورة بيع</button>
      <button class="btn btn-primary btn-sm" id="btn-new-purchase">فاتورة شراء</button>
    </div>
  </div>`;

  if (!invoicesCache.length) {
    html += '<div class="empty-state"><h3>لا توجد فواتير</h3></div>';
  } else {
    html += '<div class="table-wrap"><table class="table"><thead><tr><th>رقم</th><th>النوع</th><th>التاريخ</th><th>الإجمالي</th><th>الرصيد</th><th></th></tr></thead><tbody>';
    invoicesCache.forEach(inv => {
      html += `<tr>
        <td>${inv.reference || inv.id}</td>
        <td>${inv.type === 'sale' ? 'بيع' : 'شراء'}</td>
        <td>${formatDate(inv.date)}</td>
        <td>${formatNumber(inv.total)}</td>
        <td>${formatNumber(inv.balance || 0)}</td>
        <td>
          <button class="btn btn-danger btn-sm delete-inv-btn" data-id="${inv.id}">🗑</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }

  tc.innerHTML = html;

  document.getElementById('btn-new-sale').onclick = () => showInvoiceModal('sale');
  document.getElementById('btn-new-purchase').onclick = () => showInvoiceModal('purchase');

  document.querySelectorAll('.delete-inv-btn').forEach(btn => {
    btn.onclick = () => deleteInvoice(btn.dataset.id);
  });
}

export async function deleteInvoice(id) {
  const inv = invoicesCache.find(i => i.id == id);
  if (!inv) return showToast('الفاتورة غير موجودة', 'error');

  const { counts } = await checkCascadeDelete('invoices', id);

  let msg = `حذف الفاتورة رقم ${inv.reference || id}؟`;
  if (counts.invoiceLines > 0 || counts.payments > 0) {
    msg += `\n\nسيتم حذف ${counts.invoiceLines} بند و ${counts.payments} دفعة مرتبطة.`;
  }

  const confirmed = await confirmDialog(msg);
  if (!confirmed) return;

  try {
    await performCascadeDelete('invoices', id);
    await refreshCaches();
    showToast('تم حذف الفاتورة بنجاح', 'success');
    loadInvoices();
  } catch (e) {
    console.error(e);
    showToast('فشل الحذف: ' + e.message, 'error');
  }
}

// دالة عرض الفاتورة (مختصرة)
export function showInvoiceModal(type) {
  // ... (ضع هنا كود النافذة الخاص بإنشاء الفاتورة)
  showToast(`إنشاء فاتورة ${type === 'sale' ? 'بيع' : 'شراء'}`, 'info');
}
