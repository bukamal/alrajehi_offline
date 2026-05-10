// public/js/invoices.js
import { apiCall, formatNumber, formatDate, debounce, ICONS, initData, generateLineRowHtml, getUnitOptionsForItem, animateEntry } from './core.js';
import { get as storeGet } from './store.js';
import { showToast, openModal, confirmDialog, closeActiveModal } from './modal.js';
import { currentTab, navigateTo } from './navigation.js';
import { subscribe } from './store.js';

export async function editInvoice(invoiceId) {
  const invoices = storeGet('invoices') || [];
  const invoice = invoices.find(inv => inv.id === invoiceId);
  if (!invoice) {
    showToast('الفاتورة غير موجودة', 'error');
    return;
  }
  showInvoiceModal(invoice.type, { mode: 'edit', invoiceData: invoice });
}

export async function showInvoiceModal(type, options = {}) {
  try {
    let customers = storeGet('customers');
    let suppliers = storeGet('suppliers');
    let items = storeGet('items');
    let units = storeGet('units');

    if (!customers) customers = await apiCall('/customers', 'GET');
    if (!suppliers) suppliers = await apiCall('/suppliers', 'GET');
    if (!items) items = await apiCall('/items', 'GET');
    if (!units) units = await apiCall('/definitions?type=unit', 'GET');

    const isSale = type === 'sale';
    const entLabel = isSale ? 'العميل' : 'المورد';
    const entOpts = isSale
      ? `<option value="cash">عميل نقدي</option>${customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}`
      : `<option value="cash">مورد نقدي</option>${suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}`;

    const mode = options.mode || 'create';
    const invData = options.invoiceData || {};
    const invLines = invData.invoice_lines || [];

    let linesHtml = '';
    if (mode === 'edit' && invLines.length) {
      invLines.forEach(line => {
        linesHtml += generateLineRowHtml({
          item_id: line.item_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total: line.total,
          unit_id: line.unit_id,
          conversion_factor: line.conversion_factor
        }, isSale);
      });
    } else {
      linesHtml = generateLineRowHtml(null, isSale);
    }

    const body = `
      <input type="hidden" id="inv-type" value="${type}">
      <input type="hidden" id="inv-id" value="${mode === 'edit' ? invData.id : ''}">
      <div class="invoice-lines" id="inv-lines">${linesHtml}</div>
      <button class="btn btn-secondary btn-sm" id="btn-add-line" style="width:auto;margin-bottom:20px;">${ICONS.plus} إضافة بند</button>
      <div class="form-group"><label class="form-label">${entLabel}</label><select class="select" id="inv-entity">${entOpts}</select></div>
      <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="inv-date" value="${mode === 'edit' ? invData.date : new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">الرقم المرجعي</label><input type="text" class="input" id="inv-ref" placeholder="رقم الفاتورة أو المرجع" value="${invData.reference || ''}"></div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="textarea" id="inv-notes" placeholder="أي ملاحظات إضافية...">${invData.notes || ''}</textarea></div>
      <div style="background:var(--bg);border-radius:16px;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:14px; border: 1.5px solid var(--border);">
        <div class="form-group" style="margin:0;">
          <label class="form-label">المبلغ المدفوع</label>
          <input type="number" step="0.01" class="input" id="inv-paid" placeholder="0.00" value="${mode === 'edit' ? (invData.paid || 0) : '0'}">
          ${mode === 'edit' ? '<span style="font-size:12px; color: var(--text-muted); display:block; margin-top:4px;">يمكنك تعديل الدفعة المرتبطة مباشرة بالفاتورة</span>' : '<span style="font-size:12px; color: var(--text-muted); display:block; margin-top:4px;">سيُملأ تلقائياً بالإجمالي، يمكنك تغييره</span>'}
        </div>
        <div class="form-group" style="margin:0;"><label class="form-label">الإجمالي</label><div id="inv-grand-total" style="font-size:24px;font-weight:900;color:var(--primary);padding:10px 0;">${mode === 'edit' ? formatNumber(invData.total || 0) : '0.00'}</div></div>
      </div>`;

    const modalTitle = mode === 'edit'
      ? `تعديل فاتورة ${isSale ? 'مبيعات' : 'مشتريات'}`
      : `فاتورة ${isSale ? 'مبيعات' : 'مشتريات'}`;

    const modal = openModal({
      title: modalTitle,
      bodyHTML: body,
      footerHTML: `<button class="btn btn-secondary" id="inv-cancel">إلغاء</button><button class="btn btn-primary" id="inv-save">${ICONS.check} حفظ الفاتورة</button>`
    });

    const container = modal.element;
    const paidInput = container.querySelector('#inv-paid');
    let paidManuallyEdited = false;

    paidInput.addEventListener('input', () => { paidManuallyEdited = true; });

    const updateGrandTotal = () => {
      let total = 0;
      container.querySelectorAll('.total-input').forEach(inp => total += parseFloat(inp.value) || 0);
      container.querySelector('#inv-grand-total').textContent = formatNumber(total);
      if (mode === 'create' && !paidManuallyEdited) {
        paidInput.value = total.toFixed(2);
      }
    };

    function isDup(itemId, currentRow) {
      if (!itemId) return false;
      let found = false;
      container.querySelectorAll('.line-row').forEach(r => {
        if (r !== currentRow && r.querySelector('.item-select')?.value === itemId) found = true;
      });
      return found;
    }

    function getUnitOptions(item, saleType) {
      if (!item) return '<option value="">اختر مادة</option>';
      const unitsList = storeGet('units') || [];
      const baseUnit = unitsList.find(u => u.id == item.base_unit_id) || {};
      const baseName = baseUnit.name || 'قطعة';
      let opts = `<option value="" data-factor="1">${baseName} (أساسية)</option>`;
      (item.item_units || []).forEach(iu => {
        const unit = unitsList.find(u => u.id == iu.unit_id) || {};
        const name = unit.name || unit.abbreviation || 'وحدة';
        opts += `<option value="${iu.unit_id}" data-factor="${iu.conversion_factor}">${name} (×${iu.conversion_factor})</option>`;
      });
      return opts;
    }

    function autoFill(selectEl, priceEl, unitSelectEl) {
      const itemId = selectEl.value;
      if (!itemId) {
        priceEl.value = '';
        if (unitSelectEl) { unitSelectEl.innerHTML = '<option value="">اختر مادة</option>'; unitSelectEl.style.display = 'none'; }
        return;
      }
      const itemsList = storeGet('items') || [];
      const item = itemsList.find(i => i.id == itemId);
      if (item) {
        const basePrice = isSale ? (item.selling_price || 0) : (item.purchase_price || 0);
        priceEl.value = basePrice;
        if (unitSelectEl) {
          unitSelectEl.innerHTML = getUnitOptions(item, isSale);
          unitSelectEl.style.display = 'block';
          unitSelectEl.dataset.basePrice = basePrice;
        }
        const row = selectEl.closest('.line-row');
        const qtyInput = row.querySelector('.qty-input');
        const totalInput = row.querySelector('.total-input');
        if (qtyInput && totalInput) {
          totalInput.value = ((parseFloat(qtyInput.value) || 0) * basePrice).toFixed(2);
        }
        updateGrandTotal();
      }
    }

    function calcRow(row) {
      const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
      const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
      row.querySelector('.total-input').value = (qty * price).toFixed(2);
      updateGrandTotal();
    }

    function handleUnitChange(row) {
      const sel = row.querySelector('.item-select');
      const unitSel = row.querySelector('.unit-select');
      const priceEl = row.querySelector('.price-input');
      if (!sel || !unitSel || !priceEl) return;
      const itemsList = storeGet('items') || [];
      const item = itemsList.find(i => i.id == sel.value);
      if (!item) return;
      const factor = parseFloat(unitSel.selectedOptions[0]?.dataset.factor || 1);
      const basePrice = parseFloat(unitSel.dataset.basePrice || 0);
      const newPrice = basePrice * factor;
      priceEl.value = newPrice.toFixed(2);
      if (factor > 1 && newPrice < basePrice) {
        showToast(`يبدو أن السعر المُحتسب للوحدة أقل من المتوقع. تأكد من صحة البيانات.`, 'warning');
      }
      priceEl.title = `السعر للوحدة المختارة (${unitSel.selectedOptions[0]?.textContent || '?'}) . يمكنك تعديله يدوياً عند الحاجة`;
      calcRow(row);
    }

    container.querySelectorAll('.line-row').forEach(row => {
      const sel = row.querySelector('.item-select');
      const price = row.querySelector('.price-input');
      const unitSel = row.querySelector('.unit-select');
      if (sel && price) autoFill(sel, price, unitSel);
      sel?.addEventListener('change', function () {
        if (isDup(this.value, this.closest('.line-row'))) {
          showToast('المادة مضافة مسبقاً', 'warning');
          this.value = '';
          price.value = '';
          if (unitSel) unitSel.style.display = 'none';
          return;
        }
        autoFill(this, price, unitSel);
      });
      row.querySelector('.qty-input')?.addEventListener('input', () => calcRow(row));
      row.querySelector('.price-input')?.addEventListener('input', () => calcRow(row));
      unitSel?.addEventListener('change', () => handleUnitChange(row));
    });

    container.querySelector('#btn-add-line').addEventListener('click', () => {
      const linesContainer = container.querySelector('#inv-lines');
      const itemsList = storeGet('items') || [];
      const nl = document.createElement('div');
      nl.className = 'line-row';
      nl.innerHTML = `
        <div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>${itemsList.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
        <div class="form-group"><select class="select unit-select" style="display:none;"><option value="">الوحدة</option></select></div>
        <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div>
        <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div>
        <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div>
        <button class="line-remove">${ICONS.trash}</button>`;
      linesContainer.appendChild(nl);
      const newSel = nl.querySelector('.item-select'), newPrice = nl.querySelector('.price-input'), newUnit = nl.querySelector('.unit-select');
      newSel.addEventListener('change', function () {
        if (isDup(this.value, this.closest('.line-row'))) { showToast('المادة مضافة مسبقاً', 'warning'); this.value = ''; newPrice.value = ''; if (newUnit) newUnit.style.display = 'none'; return; }
        autoFill(this, newPrice, newUnit);
      });
      nl.querySelector('.qty-input').addEventListener('input', () => calcRow(nl));
      nl.querySelector('.price-input').addEventListener('input', () => calcRow(nl));
      newUnit?.addEventListener('change', () => handleUnitChange(nl));
      nl.querySelector('.line-remove').addEventListener('click', () => {
        if (linesContainer.querySelectorAll('.line-row').length > 1) { nl.remove(); updateGrandTotal(); }
      });
    });

    const preSelectedItemId = options.itemId;
    if (preSelectedItemId) {
      const linesContainer = container.querySelector('#inv-lines');
      const itemsList = storeGet('items') || [];
      const item = itemsList.find(i => i.id == preSelectedItemId);
      if (item) {
        const nl = document.createElement('div');
        nl.className = 'line-row';
        const basePrice = isSale ? (item.selling_price || 0) : (item.purchase_price || 0);
        nl.innerHTML = `
          <div class="form-group" style="grid-column:1/-1">
            <select class="select item-select">
              <option value="${item.id}" selected>${item.name}</option>
            </select>
          </div>
          <div class="form-group">
            <select class="select unit-select">
              ${getUnitOptions(item, isSale)}
            </select>
          </div>
          <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية" value="1"></div>
          <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر" value="${basePrice}"></div>
          <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;" value="${basePrice}"></div>
          <button class="line-remove">${ICONS.trash}</button>`;
        linesContainer.appendChild(nl);

        const newSel = nl.querySelector('.item-select');
        const newPrice = nl.querySelector('.price-input');
        const newUnit = nl.querySelector('.unit-select');
        if (newUnit) newUnit.dataset.basePrice = basePrice;
        newSel.addEventListener('change', function () { });
        nl.querySelector('.qty-input').addEventListener('input', () => calcRow(nl));
        nl.querySelector('.price-input').addEventListener('input', () => calcRow(nl));
        newUnit?.addEventListener('change', () => {
          const factor = parseFloat(newUnit.selectedOptions[0]?.dataset.factor || 1);
          const basePrice = parseFloat(newUnit.dataset.basePrice || 0);
          newPrice.value = (basePrice * factor).toFixed(2);
          calcRow(nl);
        });
        nl.querySelector('.line-remove').addEventListener('click', () => {
          if (linesContainer.querySelectorAll('.line-row').length > 1) {
            nl.remove();
            updateGrandTotal();
          }
        });
        updateGrandTotal();
      }
    }

    if (mode === 'create') paidManuallyEdited = false;

    modal.element.querySelector('#inv-cancel').onclick = () => modal.close();

    modal.element.querySelector('#inv-save').onclick = async () => {
      const btn = container.querySelector('#inv-save');
      if (btn.disabled) return;

      const lines = [];
      const rows = container.querySelectorAll('.line-row');
      let dupCheck = new Set();
      for (const row of rows) {
        const itemId = row.querySelector('.item-select')?.value || null;
        if (itemId) {
          if (dupCheck.has(itemId)) return showToast('لا يمكن تكرار نفس المادة', 'error');
          dupCheck.add(itemId);
        }
        const unitSel = row.querySelector('.unit-select');
        const unitId = unitSel?.value || null;
        const factor = parseFloat(unitSel?.selectedOptions[0]?.dataset.factor || 1);
        const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
        const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
        const total = parseFloat(row.querySelector('.total-input')?.value) || 0;
        const basePrice = factor !== 0 ? price / factor : price;
        if (itemId || qty > 0) {
          lines.push({ item_id: itemId, unit_id: unitId || null, quantity: qty, unit_price: parseFloat(basePrice.toFixed(2)), conversion_factor: factor, total: total });
        }
      }
      if (!lines.length) return showToast('أضف بنداً واحداً على الأقل', 'error');

      btn.disabled = true;
      btn.innerHTML = '<span class="loader-inline"></span> جاري الحفظ...';

      if (isSale) {
        const itemsList = storeGet('items') || [];
        for (const line of lines) {
          const item = itemsList.find(i => i.id == line.item_id);
          if (item) {
            const deductedQty = line.quantity * (line.conversion_factor || 1);
            if ((item.available || 0) < deductedQty) {
              showToast(`المادة "${item.name}" غير متوفرة بالكمية المطلوبة`, 'error');
              btn.disabled = false;
              btn.innerHTML = `${ICONS.check} حفظ الفاتورة`;
              return;
            }
          }
        }
      }

      const entityVal = container.querySelector('#inv-entity').value;
      const isCash = entityVal === 'cash';
      const customer_id = isSale && !isCash ? entityVal : null;
      const supplier_id = !isSale && !isCash ? entityVal : null;

      const totalAmount = lines.reduce((s, l) => s + l.total, 0);
      const payload = {
        type,
        customer_id,
        supplier_id,
        date: container.querySelector('#inv-date').value,
        reference: container.querySelector('#inv-ref').value.trim(),
        notes: container.querySelector('#inv-notes').value.trim(),
        lines,
        total: totalAmount,
        paid_amount: parseFloat(paidInput.value) || 0
      };

      try {
        if (mode === 'edit') {
          await apiCall('/invoices', 'PUT', { id: invData.id, ...payload });
        } else {
          await apiCall('/invoices', 'POST', payload);
        }

        modal.close();
        showToast('تم حفظ الفاتورة بنجاح', 'success');

        if (currentTab === 'items') {
          const { loadItems } = await import('./items.js');
          await loadItems();
        } else {
          navigateTo('invoices');
        }
      } catch (e) {
        showToast(e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = `${ICONS.check} حفظ الفاتورة`;
      }
    };

    if (mode === 'edit') {
      const entitySelect = container.querySelector('#inv-entity');
      if (invData.customer_id) entitySelect.value = invData.customer_id;
      else if (invData.supplier_id) entitySelect.value = invData.supplier_id;
      else entitySelect.value = 'cash';
    }

  } catch (e) {
    showToast('خطأ في فتح الفاتورة: ' + e.message, 'error');
  }
}

export async function loadInvoices() {
  try {
    document.getElementById('tab-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">الفواتير</h3>
            <span class="card-subtitle">سجل الفواتير والحركات المالية</span>
          </div>
        </div>
        <div class="filter-bar">
          <button class="filter-pill active" data-filter="all">الكل</button>
          <button class="filter-pill" data-filter="sale">مبيعات</button>
          <button class="filter-pill" data-filter="purchase">مشتريات</button>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <input type="text" class="input" id="invoice-search" placeholder="🔍 البحث في الفواتير...">
        </div>
      </div>
      <div id="invoices-list"></div>`;

    document.querySelectorAll('.filter-pill').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.filter-pill').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        renderFilteredInvoices();
      });
    });
    document.getElementById('invoice-search').addEventListener('input', debounce(renderFilteredInvoices, 200));

    if (!storeGet('invoices')) {
      await apiCall('/invoices', 'GET');
    }
    renderFilteredInvoices();

    subscribe('customers', () => { if (currentTab === 'invoices') loadInvoices(); });
    subscribe('suppliers', () => { if (currentTab === 'invoices') loadInvoices(); });
  } catch (err) { showToast(err.message, 'error'); }
}

export function renderFilteredInvoices() {
  const container = document.getElementById('invoices-list');
  if (!container) return;

  const invoices = storeGet('invoices') || [];
  const filt = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
  const q = (document.getElementById('invoice-search')?.value || '').trim().toLowerCase();
  let data = invoices;
  if (filt !== 'all') data = data.filter(inv => inv.type === filt);
  if (q) data = data.filter(inv =>
    (inv.reference || '').includes(q) ||
    (inv.customer?.name || '').includes(q) ||
    (inv.supplier?.name || '').includes(q) ||
    String(inv.total).includes(q)
  );

  if (!data.length) return container.innerHTML = `<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><h3>لا توجد فواتير مطابقة</h3><p>جرب تغيير معايير البحث</p></div>`;

  let html = '';
  data.forEach(inv => {
    const typeLabel = inv.type === 'sale' ? 'بيع' : 'شراء';
    const entity = inv.customer?.name || inv.supplier?.name || 'نقدي';
    const statusColor = (inv.balance || 0) <= 0 ? 'var(--success)' : 'var(--warning)';
    html += `
      <div class="card card-hover invoice-rich-card" data-id="${inv.id}" style="cursor:pointer; padding: 20px 24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 14px;">
          <div style="min-width:0;">
            <div style="font-weight:800; font-size:17px; display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span style="background:${inv.type==='sale'?'var(--success-light)':'var(--warning-light)'};color:${inv.type==='sale'?'var(--success)':'var(--warning)'};padding:4px 14px;border-radius:20px;font-size:12px; font-weight:800;">${typeLabel}</span>
              ${inv.reference ? `<span style="color:var(--text-secondary); font-weight:700;">فاتورة ${inv.reference}</span>` : `<span style="color:var(--text-muted); font-weight:500;">بدون مرجع</span>`}
            </div>
            <div style="font-size:13px; color:var(--text-muted); display:flex; gap:18px; flex-wrap:wrap; font-weight:500;">
              <span>📅 ${formatDate(inv.date)}</span>
              <span>👤 ${entity}</span>
            </div>
          </div>
          <div style="text-align:left;">
            <div style="font-weight:900; font-size:24px; color:var(--primary);">${formatNumber(inv.total)}</div>
            <div style="font-size:12px; color:var(--text-muted); font-weight:500;">الإجمالي</div>
          </div>
        </div>
        <div style="display:flex; gap:24px; font-size:13px; border-top:1px solid var(--border); padding-top:14px; color:var(--text-secondary); font-weight:500;">
          <div><span style="color:var(--text-muted);">المدفوع:</span> <strong style="color:var(--success);">${formatNumber(inv.paid || 0)}</strong></div>
          <div><span style="color:var(--text-muted);">المتبقي:</span> <strong style="color:${statusColor};">${formatNumber(inv.balance || 0)}</strong></div>
          <div style="margin-right:auto; font-size:12px; color:${(inv.balance||0) <= 0 ? 'var(--success)' : 'var(--warning)'}; font-weight:700;">
            ${(inv.balance||0) <= 0 ? '✅ مدفوعة' : '⏳ غير مدفوعة'}
          </div>
        </div>
      </div>`;
  });
  container.innerHTML = html;
  animateEntry('.invoice-rich-card', 60);

  container.querySelectorAll('.invoice-rich-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = parseInt(card.dataset.id);
      const inv = (storeGet('invoices') || []).find(i => i.id === id);
      if (inv) showInvoiceDetailModal(inv);
    });
  });
}

export function showInvoiceDetailModal(invoice) {
  if (!invoice) return;

  const itemsList = storeGet('items') || [];
  const lines = invoice.invoice_lines?.map(l => {
    const item = itemsList.find(i => i.id === l.item_id);
    const unitName = l.unit?.name || l.unit?.abbreviation || (item?.base_unit?.name || 'قطعة');
    const factor = l.conversion_factor || 1;
    const baseQty = l.quantity * factor;
    const baseUnit = item?.base_unit?.name || 'قطعة';
    let qtyDisplay = `${l.quantity} ${unitName}`;
    if (factor > 1) qtyDisplay += ` <span style="color:var(--text-muted);font-size:12px;">(= ${baseQty} ${baseUnit})</span>`;
    return `<tr><td style="font-weight:700;">${l.item?.name || '-'}</td><td>${qtyDisplay}</td><td>${formatNumber(l.unit_price)}</td><td style="font-weight:800;">${formatNumber(l.total)}</td></tr>`;
  }).join('') || '';

  const typeLabel = invoice.type === 'sale' ? 'مبيعات' : 'مشتريات';
  const entity = invoice.customer?.name || invoice.supplier?.name || 'نقدي';
  const entityLabel = invoice.type === 'sale' ? 'العميل' : 'المورد';
  const statusColor = (invoice.balance || 0) <= 0 ? 'var(--success)' : 'var(--warning)';

  const modal = openModal({
    title: `فاتورة ${typeLabel} ${invoice.reference || ''}`,
    bodyHTML: `
      <div style="margin-bottom:20px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
          <div style="background:var(--bg);border-radius:12px;padding:14px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px; font-weight:700;">التاريخ</div>
            <div style="font-weight:800; font-size:15px;">${formatDate(invoice.date)}</div>
          </div>
          <div style="background:var(--bg);border-radius:12px;padding:14px;">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px; font-weight:700;">${entityLabel}</div>
            <div style="font-weight:800; font-size:15px;">${entity}</div>
          </div>
        </div>
        <div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${lines}</tbody></table></div>
        <div style="background:var(--bg);border-radius:16px;padding:20px;margin-top:20px; border: 1.5px solid var(--border);">
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:var(--text-muted); font-weight:600;">الإجمالي</span><span style="font-weight:900;font-size:20px;">${formatNumber(invoice.total)}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:var(--text-muted); font-weight:600;">المدفوع</span><span style="font-weight:800;color:var(--success);">${formatNumber(invoice.paid || 0)}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted); font-weight:600;">المتبقي</span><span style="font-weight:900;color:${statusColor};font-size:20px;">${formatNumber(invoice.balance || 0)}</span></div>
        </div>
        ${invoice.notes ? `<div style="margin-top:14px;padding:14px;background:var(--warning-light);border-radius:12px;color:var(--warning);font-size:13px; font-weight:600; border: 1.5px solid var(--warning);"><strong>ملاحظات:</strong> ${invoice.notes}</div>` : ''}
      </div>`,
    footerHTML: `
      <button class="btn btn-secondary" id="detail-close">إغلاق</button>
      <button class="btn btn-primary" id="detail-print">${ICONS.print} طباعة</button>
      <button class="btn btn-success" id="detail-send">${ICONS.file} إرسال</button>
      <button class="btn btn-warning" id="detail-edit">${ICONS.edit} تعديل</button>
      <button class="btn btn-danger" id="detail-delete">${ICONS.trash} حذف</button>
    `
  });

  modal.element.querySelector('#detail-close').onclick = () => modal.close();
  modal.element.querySelector('#detail-print').onclick = () => { modal.close(); setTimeout(() => printInvoiceWithFormat(invoice), 300); };
  modal.element.querySelector('#detail-send').onclick = () => { modal.close(); setTimeout(() => sendInvoiceViaTelegram(invoice.id), 300); };
  modal.element.querySelector('#detail-edit').onclick = () => { modal.close(); setTimeout(() => editInvoice(invoice.id), 300); };
  modal.element.querySelector('#detail-delete').onclick = () => { modal.close(); setTimeout(() => deleteInvoice(invoice.id), 300); };
}

export async function deleteInvoice(id) {
  if (!await confirmDialog('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم التراجع عن جميع التأثيرات المالية.')) return;
  try {
    await apiCall(`/invoices?id=${id}`, 'DELETE');
    showToast('تم الحذف بنجاح', 'success');
    loadInvoices();
  } catch (e) { showToast(e.message, 'error'); }
}

export async function sendInvoiceViaTelegram(invoiceId) {
  // بدون Telegram في النسخة المحلية
  showToast('الإرسال عبر Telegram غير متاح في النسخة المحلية', 'warning');
}

function printInvoiceWithFormat(invoice) {
  const formatModal = openModal({
    title: 'اختيار تنسيق الطباعة',
    bodyHTML: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 10px 0;">
        <div class="format-option" data-format="a4">
          <div style="font-size: 44px; margin-bottom: 10px;">📄</div>
          <div style="font-weight: 900; font-size: 16px; margin-bottom: 6px; color: var(--text);">A4 رسمية</div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">فاتورة كاملة<br>للطباعة على A4</div>
        </div>
        <div class="format-option" data-format="thermal">
          <div style="font-size: 44px; margin-bottom: 10px;">🧾</div>
          <div style="font-weight: 900; font-size: 16px; margin-bottom: 6px; color: var(--text);">حرارية 80mm</div>
          <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">للطابعة الحرارية<br>الصغيرة</div>
        </div>
      </div>
      <div style="margin-top: 20px; padding: 16px; background: var(--bg); border-radius: 14px; border: 1.5px solid var(--border);">
        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
          <input type="checkbox" id="preview-check" checked style="width: 20px; height: 20px; accent-color: var(--primary);">
          <span style="font-size: 14px; color: var(--text); font-weight: 700;">عرض معاينة قبل الطباعة</span>
        </label>
      </div>`,
    footerHTML: `<button class="btn btn-secondary" id="format-cancel">إلغاء</button><button class="btn btn-primary" id="format-confirm">🖨️ متابعة</button>`
  });

  const selectOption = (selected) => {
    formatModal.element.querySelectorAll('.format-option').forEach(o => {
      o.style.borderColor = 'var(--border)';
      o.style.background = 'var(--surface-solid)';
      o.style.boxShadow = 'none';
    });
    selected.style.borderColor = 'var(--primary)';
    selected.style.background = 'var(--primary-light)';
    selected.style.boxShadow = '0 6px 20px -4px var(--primary-glow)';
  };

  formatModal.element.querySelectorAll('.format-option').forEach(opt => {
    opt.addEventListener('click', () => selectOption(opt));
  });

  selectOption(formatModal.element.querySelector('[data-format="thermal"]'));

  formatModal.element.querySelector('#format-cancel').onclick = () => formatModal.close();
  formatModal.element.querySelector('#format-confirm').onclick = () => {
    const selected = formatModal.element.querySelector('.format-option[style*="border-color: var(--primary)"]') || formatModal.element.querySelector('[data-format="thermal"]');
    const selectedFormat = selected?.dataset.format || 'thermal';
    const withPreview = formatModal.element.querySelector('#preview-check').checked;
    formatModal.close();
    setTimeout(() => printInvoice(invoice, { preview: withPreview, format: selectedFormat }), 300);
  };
}

function printInvoice(invoice, options = {}) {
  if (!invoice) { showToast('لا توجد بيانات للطباعة', 'error'); return; }
  const { preview = false, format = 'thermal' } = options;
  const CURRENCY = { symbol: 'ل.س', decimals: 2 };

  function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: CURRENCY.decimals, maximumFractionDigits: CURRENCY.decimals }) + ' ' + CURRENCY.symbol;
  }

  function formatDateEn(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatTimeEn() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  const items = invoice.invoice_lines || [];
  const paid = invoice.paid || 0;
  const balance = (invoice.total || 0) - paid;
  const now = new Date();
  const timeStr = formatTimeEn();
  const dateStr = formatDateEn(invoice.date);
  const entity = invoice.customer || invoice.supplier;
  const entityLabel = invoice.type === 'sale' ? 'العميل' : 'المورد';

  const thermalHTML = `<!DOCTYPE html>...`; // (نفس الكود السابق)

  const a4HTML = `<!DOCTYPE html>...`; // (نفس الكود السابق)

  const htmlContent = format === 'a4' ? a4HTML : thermalHTML;

  if (preview) {
    const previewModal = openModal({
      title: `معاينة الفاتورة - ${format === 'a4' ? 'A4' : 'حرارية 80mm'}`,
      bodyHTML: `<div style="background: var(--bg); padding: 20px; border-radius: 16px; overflow: auto; max-height: 70vh;">
        <iframe srcdoc="${htmlContent.replace(/"/g, '&quot;')}" style="width: 100%; height: 500px; border: none; border-radius: 12px; background: white;"></iframe>
      </div>`,
      footerHTML: `
        <button class="btn btn-secondary" id="preview-close">إغلاق</button>
        <button class="btn btn-primary" id="preview-print">🖨️ طباعة</button>
      `
    });

    previewModal.element.querySelector('#preview-close').onclick = () => previewModal.close();
    previewModal.element.querySelector('#preview-print').onclick = () => {
      previewModal.close();
      setTimeout(() => executePrint(htmlContent), 300);
    };
    return;
  }

  executePrint(htmlContent);
}

function executePrint(htmlContent) {
  let printWindow = null;
  try {
    printWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes,resizable=yes,top=20,left=20');
  } catch (e) {
    console.error('فشل فتح النافذة:', e);
  }

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    showToast('✅ تم فتح نافذة الطباعة', 'success');
    return;
  }

  showToast('📄 جاري تحضير الطباعة...', 'info');
  let iframe = document.getElementById('print-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '-10000px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      showToast('⚠️ الطباعة غير متاحة.', 'warning');
    }
  }, 800);
}

window.printInvoice = printInvoice;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
window.sendInvoiceViaTelegram = sendInvoiceViaTelegram;
window.showInvoiceDetailModal = showInvoiceDetailModal;
window.printInvoiceWithFormat = printInvoiceWithFormat;
