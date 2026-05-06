import { ICONS } from './constants.js';
import {
  formatNumber,
  showToast,
  openModal,
  confirmDialog,
  debounce,
  showFormModal
} from './utils.js';
import {
  apiCall,
  itemsCache,
  unitsCache,
  categoriesCache,
  checkCascadeDelete
} from './db.js';

/**
 * تحميل وعرض قائمة المواد في المحتوى الرئيسي
 */
export async function loadItems() {
  itemsCache.length = 0;
  const data = await apiCall('/items', 'GET');
  itemsCache.push(...data);

  const tc = document.getElementById('tab-content');
  tc.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">المواد</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-item">${ICONS.plus} إضافة</button>
      </div>
      <input class="input" id="items-search" placeholder="بحث...">
    </div>
    <div id="items-list"></div>`;

  document.getElementById('btn-add-item').addEventListener('click', showAddItemModal);
  document.getElementById('items-search').addEventListener('input', debounce(renderFilteredItems, 200));
  renderFilteredItems();
}

/**
 * عرض المواد مع إمكانية التصفية حسب البحث
 */
export function renderFilteredItems() {
  const q = (document.getElementById('items-search')?.value || '').toLowerCase();
  const filtered = itemsCache.filter(i =>
    (i.name || '').toLowerCase().includes(q)
  );
  const container = document.getElementById('items-list');

  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><h3>لا توجد مواد</h3></div>';
    return;
  }

  let html = '<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الوحدة الأساسية</th><th>متوفر</th></tr></thead><tbody>';
  filtered.forEach(item => {
    const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
    const unitName = baseUnit.name || 'قطعة';
    html += `<tr onclick="window.showItemDetail(${item.id})" style="cursor:pointer;">
      <td style="font-weight:700;">${item.name}</td>
      <td>${unitName}</td>
      <td>${item.quantity || 0}</td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

/**
 * الحصول على معرّف وحدة معينة (أو إنشاؤها إن لم تكن موجودة)
 */
export async function getOrCreateUnit(name) {
  if (!name) return null;
  let u = unitsCache.find(x => x.name.toLowerCase() === name.toLowerCase());
  if (u) return u.id;
  const res = await apiCall('/definitions?type=unit', 'POST', { name, abbreviation: name });
  u = { id: res.id, name, abbreviation: name };
  unitsCache.push(u);
  return u.id;
}

/**
 * نافذة تفاصيل المادة (تُربط عبر window.showItemDetail)
 */
window.showItemDetail = function (itemId) {
  const item = itemsCache.find(i => i.id === itemId);
  if (!item) return;

  const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
  const baseName = baseUnit.name || 'قطعة';

  let unitsHtml = '';
  if (item.item_units && item.item_units.length) {
    unitsHtml = '<div style="margin-bottom:12px;"><strong>الوحدات الفرعية:</strong><ul>';
    item.item_units.forEach(iu => {
      const unit = unitsCache.find(u => u.id == iu.unit_id) || {};
      unitsHtml += `<li>${unit.name || unit.abbreviation || 'وحدة'} (1 = ${iu.conversion_factor} ${baseName})</li>`;
    });
    unitsHtml += '</ul></div>';
  }

  const categoryName = item.category_id
    ? (categoriesCache.find(c => c.id == item.category_id)?.name || '-')
    : 'بدون تصنيف';

  const modal = openModal({
    title: item.name,
    bodyHTML: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div><strong>التصنيف:</strong> ${categoryName}</div>
        <div><strong>نوع المادة:</strong> ${item.item_type || 'مخزون'}</div>
        <div><strong>الوحدة الأساسية:</strong> ${baseName}</div>
        <div><strong>الكمية:</strong> ${item.quantity || 0}</div>
        <div><strong>سعر الشراء:</strong> ${formatNumber(item.purchase_price)}</div>
        <div><strong>سعر البيع:</strong> ${formatNumber(item.selling_price)}</div>
      </div>
      ${unitsHtml}
    `,
    footerHTML: `
      <button class="btn btn-secondary" id="edit-item-btn">${ICONS.edit} تعديل</button>
      <button class="btn btn-danger" id="delete-item-btn">${ICONS.trash} حذف</button>
    `
  });

  modal.element.querySelector('#edit-item-btn').onclick = () => {
    modal.close();
    setTimeout(() => showEditItemModal(itemId), 200);
  };

  // --------------- حذف المادة (مع فحص العلاقات) ---------------
  modal.element.querySelector('#delete-item-btn').onclick = async () => {
    modal.close();
    setTimeout(async () => {
      // فحص العلاقات قبل الحذف
      const { counts } = await checkCascadeDelete('items', itemId);
      if (counts.invoiceLines > 0) {
        showToast(
          `لا يمكن حذف المادة "${item.name}" لأنها مرتبطة بـ ${counts.invoiceLines} بند في الفواتير.`,
          'error'
        );
        return;
      }

      if (!(await confirmDialog(`حذف المادة "${item.name}"؟`))) return;
      await apiCall('/items?id=' + itemId, 'DELETE');
      showToast('تم الحذف', 'success');
      loadItems();
    }, 200);
  };
};

/**
 * نافذة إضافة مادة جديدة
 */
export function showAddItemModal() {
  const catOpts = categoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const body = `
    <div class="form-group">
      <label class="form-label">اسم المادة</label>
      <input class="input" id="fm-name">
    </div>
    <div class="form-group">
      <label class="form-label">التصنيف</label>
      <select class="select" id="fm-category_id">
        <option value="">بدون تصنيف</option>
        ${catOpts}
      </select>
    </div>
    <div class="form-group" style="margin-bottom:4px;">
      <button class="btn btn-secondary btn-sm" id="btn-quick-cat" type="button" style="width:auto;">
        ${ICONS.plus} تصنيف جديد
      </button>
    </div>
    <div id="quick-cat-row" style="display:none;margin-bottom:12px;">
      <input class="input" id="fm-new-category" placeholder="اسم التصنيف...">
      <button class="btn btn-primary btn-sm" id="btn-save-quick-cat" style="width:auto;margin-top:4px;">إضافة</button>
    </div>
    <div class="form-group">
      <label class="form-label">الوحدة الأساسية</label>
      <div style="display:flex;gap:8px;align-items:center;">
        <input class="input" id="fm-baseUnit" value="قطعة" style="flex:1;">
        <button class="btn btn-secondary" id="btn-toggle-units" type="button" style="width:auto;padding:8px 14px;" title="إضافة وحدات فرعية">
          ${ICONS.plus}
        </button>
      </div>
    </div>
    <div id="extra-units" style="display:none;">
      <div class="form-group">
        <label class="form-label">وحدة فرعية 1</label>
        <input class="input" id="fm-unit2-name" placeholder="الاسم">
        <input class="input" id="fm-unit2-factor" type="number" placeholder="عامل التحويل (مثلاً 12)">
      </div>
      <div class="form-group">
        <label class="form-label">وحدة فرعية 2</label>
        <input class="input" id="fm-unit3-name" placeholder="الاسم">
        <input class="input" id="fm-unit3-factor" type="number" placeholder="عامل التحويل">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">الكمية الافتتاحية</label>
      <div style="display:flex;gap:8px;">
        <input class="input" id="fm-quantity" type="number" value="0" style="flex:1;">
        <select class="select" id="fm-qty-unit" style="width:150px;">
          <option value="base">الوحدة الأساسية</option>
          <option value="u2">الوحدة الفرعية 1</option>
          <option value="u3">الوحدة الفرعية 2</option>
        </select>
      </div>
      <div id="qty-converted" style="font-size:12px;color:var(--text-muted);margin-top:4px;display:none;">
        = <strong id="qty-base-val">0</strong> قطعة
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">سعر الشراء</label>
      <input class="input" id="fm-purchase" type="number" value="0">
    </div>
    <div class="form-group">
      <label class="form-label">سعر البيع</label>
      <input class="input" id="fm-selling" type="number" value="0">
    </div>`;

  const modal = openModal({
    title: 'إضافة مادة',
    bodyHTML: body,
    footerHTML: `
      <button class="btn btn-secondary" id="fm-cancel">إلغاء</button>
      <button class="btn btn-primary" id="fm-save">${ICONS.check} حفظ</button>
    `
  });

  const container = modal.element;
  const baseNameInput = container.querySelector('#fm-baseUnit');
  const extraUnitsDiv = container.querySelector('#extra-units');
  const toggleBtn = container.querySelector('#btn-toggle-units');
  const qtyInput = container.querySelector('#fm-quantity');
  const qtyUnit = container.querySelector('#fm-qty-unit');
  const qtyConverted = container.querySelector('#qty-converted');
  const qtyBaseVal = container.querySelector('#qty-base-val');

  toggleBtn.onclick = () => {
    const isHidden = extraUnitsDiv.style.display === 'none';
    extraUnitsDiv.style.display = isHidden ? 'block' : 'none';
    toggleBtn.innerHTML = isHidden ? ICONS.x : ICONS.plus;
  };

  function updateQty() {
    const qty = parseFloat(qtyInput.value) || 0;
    const unit = qtyUnit.value;
    const f2 = parseFloat(container.querySelector('#fm-unit2-factor').value) || 1;
    const f3 = parseFloat(container.querySelector('#fm-unit3-factor').value) || 1;
    let baseQty = qty;
    if (unit === 'u2') baseQty = qty * f2;
    else if (unit === 'u3') baseQty = qty * f3;
    if (qty > 0 && unit !== 'base') {
      qtyConverted.style.display = 'block';
      qtyBaseVal.textContent = baseQty;
    } else {
      qtyConverted.style.display = 'none';
    }
  }

  qtyInput.addEventListener('input', updateQty);
  qtyUnit.addEventListener('change', updateQty);
  container.querySelector('#fm-unit2-factor').addEventListener('input', updateQty);
  container.querySelector('#fm-unit3-factor').addEventListener('input', updateQty);

  // إضافة سريعة لتصنيف جديد
  container.querySelector('#btn-quick-cat').onclick = () => {
    const row = container.querySelector('#quick-cat-row');
    row.style.display = (row.style.display === 'none' ? 'block' : 'none');
  };
  container.querySelector('#btn-save-quick-cat').onclick = async () => {
    const input = container.querySelector('#fm-new-category');
    const select = container.querySelector('#fm-category_id');
    const name = input.value.trim();
    if (!name) return showToast('ادخل اسم التصنيف', 'error');
    try {
      const res = await apiCall('/definitions?type=category', 'POST', { type: 'category', name });
      const newId = res.id;
      categoriesCache.push({ id: newId, name });
      const o = document.createElement('option');
      o.value = newId;
      o.textContent = name;
      select.appendChild(o);
      select.value = newId;
      input.value = '';
      row.style.display = 'none';
      showToast('تم إضافة التصنيف', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // زر الإلغاء
  container.querySelector('#fm-cancel').onclick = () => modal.close();

  // زر الحفظ
  container.querySelector('#fm-save').onclick = async () => {
    const btn = container.querySelector('#fm-save');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري الحفظ...';

    try {
      const name = container.querySelector('#fm-name').value.trim();
      if (!name) throw new Error('اسم المادة مطلوب');

      const baseUnitName = baseNameInput.value.trim() || 'قطعة';
      const baseUnitId = await getOrCreateUnit(baseUnitName);

      const item_units = [];

      const u2name = container.querySelector('#fm-unit2-name').value.trim();
      const u2factor = parseFloat(container.querySelector('#fm-unit2-factor').value) || 0;
      if (u2name && u2factor > 0) {
        const uid = await getOrCreateUnit(u2name);
        if (uid) item_units.push({ unit_id: uid, conversion_factor: u2factor });
      }

      const u3name = container.querySelector('#fm-unit3-name').value.trim();
      const u3factor = parseFloat(container.querySelector('#fm-unit3-factor').value) || 0;
      if (u3name && u3factor > 0) {
        const uid = await getOrCreateUnit(u3name);
        if (uid) item_units.push({ unit_id: uid, conversion_factor: u3factor });
      }

      // الكمية بالوحدة الأساسية
      const qtyEntered = parseFloat(qtyInput.value) || 0;
      const unit = qtyUnit.value;
      const f2 = parseFloat(container.querySelector('#fm-unit2-factor').value) || 1;
      const f3 = parseFloat(container.querySelector('#fm-unit3-factor').value) || 1;
      let quantity = qtyEntered;
      if (unit === 'u2') quantity = qtyEntered * f2;
      else if (unit === 'u3') quantity = qtyEntered * f3;

      await apiCall('/items', 'POST', {
        name,
        category_id: container.querySelector('#fm-category_id').value || null,
        base_unit_id: baseUnitId,
        item_units,
        quantity,
        purchase_price: parseFloat(container.querySelector('#fm-purchase').value) || 0,
        selling_price: parseFloat(container.querySelector('#fm-selling').value) || 0
      });

      modal.close();
      showToast('تم الحفظ', 'success');
      loadItems();
    } catch (e) {
      showToast(e.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `${ICONS.check} حفظ`;
    }
  };
}

/**
 * نافذة تعديل مادة موجودة
 */
export function showEditItemModal(id) {
  const item = itemsCache.find(i => i.id == id);
  if (!item) return;

  const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
  const baseUnitName = baseUnit.name || 'قطعة';
  const catOpts = categoriesCache
    .map(c => `<option value="${c.id}" ${c.id == item.category_id ? 'selected' : ''}>${c.name}</option>`)
    .join('');

  const body = `
    <div class="form-group">
      <label class="form-label">الاسم</label>
      <input class="input" id="fm-name" value="${item.name}">
    </div>
    <div class="form-group">
      <label class="form-label">التصنيف</label>
      <select class="select" id="fm-category_id">
        <option value="">بدون تصنيف</option>
        ${catOpts}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">الوحدة الأساسية</label>
      <input class="input" id="fm-baseUnit" value="${baseUnitName}">
    </div>
    <div class="form-group">
      <label class="form-label">الكمية</label>
      <input class="input" id="fm-quantity" type="number" value="${item.quantity || 0}">
    </div>
    <div class="form-group">
      <label class="form-label">سعر الشراء</label>
      <input class="input" id="fm-purchase" type="number" value="${item.purchase_price || 0}">
    </div>
    <div class="form-group">
      <label class="form-label">سعر البيع</label>
      <input class="input" id="fm-selling" type="number" value="${item.selling_price || 0}">
    </div>`;

  const modal = openModal({
    title: 'تعديل مادة',
    bodyHTML: body,
    footerHTML: `
      <button class="btn btn-secondary" id="fm-cancel">إلغاء</button>
      <button class="btn btn-primary" id="fm-save">${ICONS.check} حفظ</button>
    `
  });

  modal.element.querySelector('#fm-cancel').onclick = () => modal.close();

  modal.element.querySelector('#fm-save').onclick = async () => {
    const btn = modal.element.querySelector('#fm-save');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري الحفظ...';

    try {
      const baseUnitNameInput = modal.element.querySelector('#fm-baseUnit');
      const newBaseName = baseUnitNameInput ? baseUnitNameInput.value.trim() : 'قطعة';
      const baseUnitId = await getOrCreateUnit(newBaseName);

      const values = {
        name: modal.element.querySelector('#fm-name').value.trim(),
        category_id: modal.element.querySelector('#fm-category_id').value || null,
        base_unit_id: baseUnitId,
        quantity: parseFloat(modal.element.querySelector('#fm-quantity').value) || 0,
        purchase_price: parseFloat(modal.element.querySelector('#fm-purchase').value) || 0,
        selling_price: parseFloat(modal.element.querySelector('#fm-selling').value) || 0
      };

      if (!values.name) throw new Error('اسم المادة مطلوب');

      await apiCall('/items', 'PUT', { id, ...values });
      modal.close();
      showToast('تم التعديل بنجاح', 'success');
      loadItems();
    } catch (e) {
      showToast(e.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `${ICONS.check} حفظ`;
    }
  };
}

/**
 * التحقق من توفر المخزون عند البيع (تُستخدم في invoices.js)
 */
export function checkStockAvailability(lines, type) {
  if (type !== 'sale') return true;
  for (const line of lines) {
    if (!line.item_id) continue;
    const item = itemsCache.find(i => i.id == line.item_id);
    if (!item) continue;
    const baseQty = (parseFloat(line.quantity) || 0) * (parseFloat(line.conversion_factor) || 1);
    if (baseQty > (item.quantity || 0)) {
      const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
      const unitName = baseUnit.name || 'قطعة';
      return `المادة "${item.name}" غير متوفرة بكمية كافية. المتاح: ${item.quantity || 0} ${unitName}، المطلوب: ${baseQty} ${unitName}.`;
    }
  }
  return true;
}
