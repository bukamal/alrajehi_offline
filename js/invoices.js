import { ICONS } from './constants.js';
import { formatNumber, formatDate, showToast, openModal, confirmDialog } from './utils.js';
import { db, apiCall, itemsCache, customersCache, suppliersCache, unitsCache, invoicesCache } from './db.js';
import { checkStockAvailability } from './items.js';
import { applyStockChanges, revertStockChanges, updateEntityBalance, netBalanceChange } from './accounting.js';

export async function showInvoiceModal(type) {
  try {
    customersCache.length = 0;
    suppliersCache.length = 0;
    itemsCache.length = 0;
    unitsCache.length = 0;
    customersCache.push(...(await apiCall('/customers', 'GET')));
    suppliersCache.push(...(await apiCall('/suppliers', 'GET')));
    itemsCache.push(...(await apiCall('/items', 'GET')));
    unitsCache.push(...(await apiCall('/definitions?type=unit', 'GET')));

    const entOpts = type === 'sale'
      ? `<option value="cash">عميل نقدي</option>${customersCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}`
      : `<option value="cash">مورد نقدي</option>${suppliersCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}`;

    const body = `
      <input type="hidden" id="inv-type" value="${type}">
      <div class="invoice-lines" id="inv-lines">
        <div class="line-row">
          <div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>${itemsCache.map(i => `<option value="${i.id}" data-price="${type === 'sale' ? i.selling_price : i.purchase_price}">${i.name}</option>`).join('')}</select></div>
          <div class="form-group"><select class="select unit-select" style="display:none;"><option value="">الوحدة</option></select></div>
          <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div>
          <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div>
          <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-add-line">${ICONS.plus} إضافة بند</button>
      <div class="form-group"><label class="form-label">${type === 'sale' ? 'العميل' : 'المورد'}</label><select class="select" id="inv-entity">${entOpts}</select></div>
      <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="inv-date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">الرقم المرجعي</label><input type="text" class="input" id="inv-ref" placeholder="رقم الفاتورة أو المرجع"></div>
      <div class="form-group"><label class="form-label">المبلغ المدفوع</label><input type="number" step="0.01" class="input" id="inv-paid" value="0"></div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="textarea" id="inv-notes" placeholder="أي ملاحظات إضافية..."></textarea></div>
      <div style="background:var(--bg);border-radius:12px;padding:16px;display:flex;justify-content:space-between;"><span>الإجمالي:</span><span id="inv-grand-total" style="font-size:22px;font-weight:900;color:var(--primary);">0.00</span></div>`;

    const modal = openModal({
      title: `فاتورة ${type === 'sale' ? 'مبيعات' : 'مشتريات'}`,
      bodyHTML: body,
      footerHTML: `<button class="btn btn-secondary" id="inv-cancel">إلغاء</button><button class="btn btn-primary" id="inv-save">${ICONS.check} حفظ</button>`
    });
    const container = modal.element;

    const updateGrandTotal = () => {
      let t = 0;
      container.querySelectorAll('.total-input').forEach(inp => t += parseFloat(inp.value) || 0);
      const gt = container.querySelector('#inv-grand-total');
      if (gt) gt.textContent = formatNumber(t);
    };

    const calc = row => {
      const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
      const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
      const tot = row.querySelector('.total-input');
      if (tot) {
        tot.value = (qty * price).toFixed(2);
        updateGrandTotal();
      }
    };

    const getUnitOptions = item => {
      if (!item) return '<option value="">اختر مادة</option>';
      const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
      const baseName = baseUnit.name || 'قطعة';
      let opts = `<option value="" data-factor="1">${baseName} (أساسية)</option>`;
      (item.item_units || []).forEach(iu => {
        const unit = unitsCache.find(u => u.id == iu.unit_id) || {};
        opts += `<option value="${iu.unit_id}" data-factor="${iu.conversion_factor}">${unit.name || unit.abbreviation || 'وحدة'} (×${iu.conversion_factor})</option>`;
      });
      return opts;
    };

    const rowHandler = row => {
      const sel = row.querySelector('.item-select');
      const pr = row.querySelector('.price-input');
      const unitSel = row.querySelector('.unit-select');

      sel.addEventListener('change', () => {
        const item = itemsCache.find(i => i.id == sel.value);
        if (item) {
          const basePrice = type === 'sale' ? (item.selling_price || 0) : (item.purchase_price || 0);
          if (unitSel) {
            unitSel.innerHTML = getUnitOptions(item);
            unitSel.style.display = 'block';
            unitSel.dataset.basePrice = basePrice;
            unitSel.dispatchEvent(new Event('change'));
          } else {
            pr.value = basePrice;
            calc(row);
          }
        } else {
          pr.value = '';
          if (unitSel) { unitSel.innerHTML = '<option value="">الوحدة</option>'; unitSel.style.display = 'none'; }
        }
      });

      row.querySelector('.qty-input')?.addEventListener('input', () => calc(row));
      row.querySelector('.price-input')?.addEventListener('input', () => calc(row));

      unitSel?.addEventListener('change', () => {
        const selectedOption = unitSel.selectedOptions[0];
        const factor = parseFloat(selectedOption?.dataset.factor || 1);
        const basePrice = parseFloat(unitSel.dataset.basePrice) || 0;
        pr.value = (basePrice * factor).toFixed(2);
        calc(row);
      });
    };

    container.querySelectorAll('.line-row').forEach(row => rowHandler(row));

    container.querySelector('#btn-add-line').addEventListener('click', () => {
      const nl = document.createElement('div');
      nl.className = 'line-row';
      nl.innerHTML = `<div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>${itemsCache.map(i => `<option value="${i.id}" data-price="${type === 'sale' ? i.selling_price : i.purchase_price}">${i.name}</option>`).join('')}</select></div>
      <div class="form-group"><select class="select unit-select" style="display:none;"><option value="">الوحدة</option></select></div>
      <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div>
      <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div>
      <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div>
      <button class="line-remove">${ICONS.trash}</button>`;
      container.querySelector('#inv-lines').appendChild(nl);
      rowHandler(nl);
      nl.querySelector('.line-remove').addEventListener('click', () => { nl.remove(); updateGrandTotal(); });
    });

    modal.element.querySelector('#inv-cancel').onclick = () => modal.close();

    modal.element.querySelector('#inv-save').onclick = async () => {
      const lines = [];
      container.querySelectorAll('.line-row').forEach(row => {
        const itemId = row.querySelector('.item-select')?.value || null;
        const unitId = row.querySelector('.unit-select')?.value || null;
        const factor = parseFloat(row.querySelector('.unit-select')?.selectedOptions[0]?.dataset.factor || 1);
        const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
        const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
        const total = parseFloat(row.querySelector('.total-input')?.value) || 0;
        if (itemId || qty > 0) {
          lines.push({
            item_id: itemId,
            unit_id: unitId,
            quantity: qty,
            unit_price: price,
            total,
            conversion_factor: factor
          });
        }
      });

      if (!lines.length) return showToast('أضف بنداً واحداً على الأقل', 'error');

      if (type === 'sale') {
        const stockMsg = checkStockAvailability(lines, type);
        if (stockMsg !== true) {
          const proceed = await confirmDialog(`${stockMsg}\n\nهل تريد المتابعة رغم نقص المخزون؟`);
          if (!proceed) return;
        }
      }

      const entity = container.querySelector('#inv-entity').value;
      const paid = parseFloat(container.querySelector('#inv-paid').value) || 0;
      const btn = container.querySelector('#inv-save');
      btn.disabled = true;
      btn.innerHTML = '⏳ جاري الحفظ...';

      try {
        await db.transaction('rw', db.items, db.invoices, db.invoiceLines, db.customers, db.suppliers, db.payments, async () => {
          const invData = {
            type,
            customer_id: type === 'sale' && entity !== 'cash' ? entity : null,
            supplier_id: type === 'purchase' && entity !== 'cash' ? entity : null,
            date: container.querySelector('#inv-date').value,
            reference: container.querySelector('#inv-ref').value.trim(),
            notes: container.querySelector('#inv-notes').value.trim(),
            total: lines.reduce((s, l) => s + l.total, 0)
          };
          const invId = await db.invoices.add(invData);

          for (const line of lines) {
            await db.invoiceLines.add({ ...line, invoice_id: invId });
          }

          if (paid > 0) {
            await db.payments.add({
              invoice_id: invId,
              customer_id: type === 'sale' && entity !== 'cash' ? entity : null,
              supplier_id: type === 'purchase' && entity !== 'cash' ? entity : null,
              amount: paid,
              payment_date: invData.date,
              notes: 'دفعة تلقائية'
            });
          }

          await applyStockChanges(lines, type);
          if (entity && entity !== 'cash') {
            const total = lines.reduce((s, l) => s + l.total, 0);
            const change = netBalanceChange(total, paid);
            await updateEntityBalance(type === 'sale' ? 'customer' : 'supplier', entity, change);
          }
        });

        modal.close();
        showToast('تم حفظ الفاتورة بنجاح', 'success');
        if (typeof loadInvoices === 'function') loadInvoices();
      } catch (e) {
        showToast('فشل حفظ الفاتورة: ' + e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = `${ICONS.check} حفظ`;
      }
    };
  } catch (e) {
    showToast('خطأ في فتح الفاتورة: ' + e.message, 'error');
  }
}

export async function loadInvoices() {
  invoicesCache.length = 0;
  invoicesCache.push(...(await apiCall('/invoices', 'GET')));
  const tc = document.getElementById('tab-content');
  tc.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">الفواتير</h3></div>
    <div class="filter-bar">
      <button class="filter-pill active" data-filter="all">الكل</button>
      <button class="filter-pill" data-filter="sale">مبيعات</button>
      <button class="filter-pill" data-filter="purchase">مشتريات</button>
    </div></div>
    <div id="inv-list"></div>`;
  document.querySelectorAll('.filter-pill').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.filter-pill').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderFilteredInvoices();
    });
  });
  renderFilteredInvoices();
}

export function renderFilteredInvoices() {
  const filt = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
  let data = invoicesCache;
  if (filt !== 'all') data = data.filter(inv => inv.type === filt);
  const container = document.getElementById('inv-list');
  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><h3>لا توجد فواتير</h3></div>';
    return;
  }

  let html = '';
  data.forEach(inv => {
    html += `<div class="card card-hover">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span>
          <span style="background:${inv.type === 'sale' ? 'var(--success-light)' : 'var(--warning-light)'};color:${inv.type === 'sale' ? 'var(--success)' : 'var(--warning)'};padding:2px 10px;border-radius:20px;font-size:12px;">${inv.type === 'sale' ? 'بيع' : 'شراء'}</span>
          ${inv.reference || ''}
        </span>
        <span style="font-weight:900;">${formatNumber(inv.total)}</span>
      </div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
        ${formatDate(inv.date)} · مدفوع: ${formatNumber(inv.paid || 0)} · باقي: ${formatNumber(inv.balance || 0)}
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm view-inv-btn" data-id="${inv.id}">${ICONS.file} عرض</button>
        <button class="btn btn-primary btn-sm print-inv-btn" data-id="${inv.id}">${ICONS.print} طباعة</button>
        <button class="btn btn-danger btn-sm delete-inv-btn" data-id="${inv.id}">${ICONS.trash} حذف</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;

  container.querySelectorAll('.view-inv-btn').forEach(b => {
    b.addEventListener('click', () => {
      const inv = invoicesCache.find(i => i.id == parseInt(b.dataset.id));
      if (inv) showInvoiceDetail(inv);
    });
  });
  container.querySelectorAll('.print-inv-btn').forEach(b => {
    b.addEventListener('click', () => {
      const inv = invoicesCache.find(i => i.id == parseInt(b.dataset.id));
      if (inv) printInvoice(inv, { preview: true, format: 'thermal' });
    });
  });
  container.querySelectorAll('.delete-inv-btn').forEach(b => {
    b.addEventListener('click', async () => {
      const invId = parseInt(b.dataset.id);
      try {
        if (await confirmDialog('حذف الفاتورة؟ سيتم إعادة المخزون وتعديل الأرصدة.')) {
          await deleteInvoice(invId);
          await loadInvoices();
        }
      } catch (e) {
        showToast('فشل حذف الفاتورة: ' + (e.message || 'خطأ غير معروف'), 'error');
      }
    });
  });
}

export function showInvoiceDetail(inv) {
  const lines = (inv.invoice_lines || []).map(l => {
    const item = itemsCache.find(i => i.id == l.item_id);
    const unit = unitsCache.find(u => u.id == l.unit_id);
    return `<tr><td>${item ? item.name : '-'}</td><td>${l.quantity} ${unit ? unit.name : ''}</td><td>${formatNumber(l.unit_price)}</td><td>${formatNumber(l.total)}</td></tr>`;
  }).join('');

  const modal = openModal({
    title: `فاتورة ${inv.type === 'sale' ? 'بيع' : 'شراء'} ${inv.reference || ''}`,
    bodyHTML: `<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${lines}</tbody></table></div>
    <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><strong>الإجمالي:</strong> ${formatNumber(inv.total)}</div>
      <div><strong>المدفوع:</strong> ${formatNumber(inv.paid || 0)}</div>
      <div><strong>المتبقي:</strong> ${formatNumber(inv.balance || 0)}</div>
    </div>`,
    footerHTML: `<button class="btn btn-secondary" id="det-close">إغلاق</button>`
  });
  modal.element.querySelector('#det-close').onclick = () => modal.close();
}

export function printInvoice(invoice, options = {}) {
  const { preview = false } = options;
  const linesHTML = (invoice.invoice_lines || []).map(l => {
    const item = itemsCache.find(i => i.id == l.item_id);
    const unit = unitsCache.find(u => u.id == l.unit_id);
    return `<div class="row"><span>${item ? item.name : '-'}</span><span>${l.quantity} ${unit ? unit.name : ''} x ${formatNumber(l.unit_price)}</span><span>${formatNumber(l.total)}</span></div>`;
  }).join('');

  const thermalHTML = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>@page{size:80mm auto;margin:0}body{width:80mm;font-size:12px;padding:4mm;font-family:sans-serif}.center{text-align:center}.bold{font-weight:900}.line{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between}.total{font-size:18px;color:#2563eb}</style></head><body><div class="center"><div class="bold">الراجحي للمحاسبة</div><div>فاتورة ${invoice.type === 'sale' ? 'بيع' : 'شراء'}</div></div><div class="line"></div><div class="row"><span>التاريخ:</span><span>${formatDate(invoice.date)}</span></div><div class="row"><span>المرجع:</span><span>${invoice.reference || '-'}</span></div>${linesHTML}<div class="line"></div><div class="row total"><span>الإجمالي</span><span>${formatNumber(invoice.total)}</span></div></body></html>`;

  if (preview) {
    const modal = openModal({
      title: 'معاينة الطباعة',
      bodyHTML: `<iframe srcdoc="${thermalHTML.replace(/"/g, '&quot;')}" style="width:100%;height:400px;"></iframe>`,
      footerHTML: `<button class="btn btn-primary" id="print-now">طباعة</button>`
    });
    modal.element.querySelector('#print-now').onclick = () => { modal.close(); window.print(); };
    return;
  }
  const w = window.open('', '_blank');
  w.document.write(thermalHTML);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

export async function deleteInvoice(invId) {
  const inv = invoicesCache.find(i => i.id == invId);
  if (!inv) {
    showToast('الفاتورة غير موجودة', 'error');
    throw new Error('Invoice not found');
  }

  try {
    const lines = await db.invoiceLines.where({ invoice_id: invId }).toArray();
    const payments = await db.payments.where({ invoice_id: invId }).toArray();
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    await db.transaction('rw', db.items, db.invoices, db.invoiceLines, db.payments, db.customers, db.suppliers, async () => {
      await revertStockChanges(lines, inv.type);

      if (inv.customer_id && inv.type === 'sale') {
        await updateEntityBalance('customer', inv.customer_id, -(inv.total - totalPaid));
      } else if (inv.supplier_id && inv.type === 'purchase') {
        await updateEntityBalance('supplier', inv.supplier_id, -(inv.total - totalPaid));
      }

      await db.payments.where({ invoice_id: invId }).delete();
      await db.invoiceLines.where({ invoice_id: invId }).delete();
      await db.invoices.delete(invId);
    });

    showToast('تم حذف الفاتورة بنجاح', 'success');
  } catch (e) {
    console.error('[Delete Invoice Error]', e);
    showToast('فشل حذف الفاتورة: ' + (e.message || 'خطأ غير معروف'), 'error');
    throw e;
  }
}
