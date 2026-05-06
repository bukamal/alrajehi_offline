import { ICONS } from './constants.js';
import { formatNumber, formatDate, showToast, openModal } from './utils.js';
import { db, apiCall, invoicesCache, customersCache, suppliersCache } from './db.js';
import { updateEntityBalance } from './accouting.js';

/**
 * عرض قائمة الدفعات مع خيار الإضافة
 */
export async function loadPayments() {
  const payments = await apiCall('/payments', 'GET');
  const tc = document.getElementById('tab-content');
  tc.innerHTML = `<div class="card">
      <div class="card-header">
        <h3 class="card-title">الدفعات</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-pmt">${ICONS.plus} إضافة</button>
      </div>
    </div>
    <div id="pmt-list"></div>`;

  const container = document.getElementById('pmt-list');
  if (!payments.length) {
    container.innerHTML = '<div class="empty-state"><h3>لا توجد دفعات</h3></div>';
  } else {
    payments.forEach(p => {
      const isIn = !!p.customer_id;
      container.innerHTML += `<div class="card" style="border-right:3px solid ${isIn ? 'var(--success)' : 'var(--danger)'};">
        <div style="font-weight:900;font-size:20px;color:${isIn ? 'var(--success)' : 'var(--danger)'};">
          ${isIn ? '+' : '-'} ${formatNumber(p.amount)}
        </div>
        <div style="font-size:13px;color:var(--text-muted);">${formatDate(p.payment_date)} · ${p.notes || ''}</div>
      </div>`;
    });
  }

  document.getElementById('btn-add-pmt')?.addEventListener('click', () => showAddPaymentModal(loadPayments));
}

/**
 * فتح نافذة تسجيل دفعة (مرتبطة بفاتورة)
 */
async function showAddPaymentModal(refreshCallback) {
  const invoices = await apiCall('/invoices', 'GET');
  invoicesCache.length = 0;
  invoicesCache.push(...invoices);
  const customers = await apiCall('/customers', 'GET');
  customersCache.length = 0;
  customersCache.push(...customers);
  const suppliers = await apiCall('/suppliers', 'GET');
  suppliersCache.length = 0;
  suppliersCache.push(...suppliers);

  const invOptions = invoicesCache
    .filter(inv => inv.balance > 0)
    .map(inv => {
      const entityName = inv.customer_id
        ? (customersCache.find(c => c.id == inv.customer_id)?.name || 'عميل')
        : (inv.supplier_id ? (suppliersCache.find(s => s.id == inv.supplier_id)?.name || 'مورد') : '');
      return `<option value="${inv.id}" data-entity="${inv.customer_id || inv.supplier_id}" data-type="${inv.type}">
        ${inv.type === 'sale' ? 'بيع' : 'شراء'} - ${inv.reference || ''} - رصيد: ${formatNumber(inv.balance)} (${entityName})
      </option>`;
    }).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">اختر الفاتورة (غير مدفوعة بالكامل)</label>
      <select class="select" id="pmt-invoice">${invOptions}</select>
    </div>
    <div class="form-group">
      <input class="input" id="pmt-amount" type="number" placeholder="المبلغ المدفوع">
    </div>
    <div class="form-group">
      <input class="input" id="pmt-date" type="date" value="${new Date().toISOString().split('T')[0]}">
    </div>
    <div class="form-group">
      <textarea class="textarea" id="pmt-notes" placeholder="ملاحظات"></textarea>
    </div>`;

  const modal = openModal({
    title: 'تسجيل دفعة',
    bodyHTML: body,
    footerHTML: `<button class="btn btn-secondary" id="pmt-cancel">إلغاء</button>
                 <button class="btn btn-primary" id="pmt-save">${ICONS.check} حفظ</button>`
  });

  modal.element.querySelector('#pmt-cancel').onclick = () => modal.close();

  modal.element.querySelector('#pmt-save').onclick = async () => {
    const invSelect = modal.element.querySelector('#pmt-invoice');
    const selectedOption = invSelect?.selectedOptions[0];
    if (!selectedOption) return showToast('اختر فاتورة', 'error');

    const invId = parseInt(selectedOption.value);
    const amount = parseFloat(modal.element.querySelector('#pmt-amount').value);
    if (!amount || amount <= 0) return showToast('المبلغ غير صحيح', 'error');

    const inv = invoicesCache.find(i => i.id === invId);
    if (!inv) return showToast('الفاتورة غير موجودة', 'error');
    if (amount > inv.balance) return showToast('المبلغ أكبر من الرصيد المتبقي', 'error');

    const paymentDate = modal.element.querySelector('#pmt-date').value;
    const notes = modal.element.querySelector('#pmt-notes').value.trim();

    try {
      await db.transaction('rw', db.payments, db.customers, db.suppliers, async () => {
        await db.payments.add({
          invoice_id: invId,
          customer_id: inv.customer_id || null,
          supplier_id: inv.supplier_id || null,
          amount,
          payment_date: paymentDate,
          notes
        });

        if (inv.customer_id) {
          await updateEntityBalance('customer', inv.customer_id, -amount);
        } else if (inv.supplier_id) {
          await updateEntityBalance('supplier', inv.supplier_id, -amount);
        }

        inv.paid = (inv.paid || 0) + amount;
        inv.balance = inv.total - inv.paid;
      });

      modal.close();
      showToast('تم تسجيل الدفعة', 'success');
      if (refreshCallback) refreshCallback();
    } catch (e) {
      showToast('فشل: ' + e.message, 'error');
    }
  };
}

