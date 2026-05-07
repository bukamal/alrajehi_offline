import { ICONS } from './constants.js';
import { showToast, confirmDialog, openModal } from './utils.js';
import { db, itemsCache, refreshCaches, checkCascadeDelete, performCascadeDelete } from './db.js';

export async function loadItems() {
  await refreshCaches();
  const tc = document.getElementById('tab-content');
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">المواد والمخزون</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-item">${ICONS.plus} إضافة مادة</button>
      </div>
    </div>`;

  if (!itemsCache.length) {
    html += '<div class="empty-state"><h3>لا توجد مواد</h3></div>';
  } else {
    html += '<div class="table-wrap"><table class="table"><thead><tr><th>الاسم</th><th>التصنيف</th><th>الكمية</th><th>سعر البيع</th><th></th></tr></thead><tbody>';
    itemsCache.forEach(item => {
      html += `<tr>
        <td>${item.name}</td>
        <td>${item.category_id ? categoriesCache.find(c => c.id == item.category_id)?.name || '-' : '-'}</td>
        <td>${item.quantity || 0}</td>
        <td>${item.selling_price || 0}</td>
        <td>
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${item.id}">✏️</button>
          <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">🗑</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }

  tc.innerHTML = html;

  document.getElementById('btn-add-item').onclick = showAddItemModal;

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => showEditItemModal(btn.dataset.id);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => deleteItem(btn.dataset.id);
  });
}

export async function deleteItem(id) {
  const item = itemsCache.find(i => i.id == id);
  if (!item) return showToast('المادة غير موجودة', 'error');

  const { counts, canDelete } = await checkCascadeDelete('items', id);

  if (!canDelete && counts.invoiceLines > 0) {
    return showToast(`هذه المادة مستخدمة في ${counts.invoiceLines} فاتورة ولا يمكن حذفها`, 'error');
  }

  const confirmed = await confirmDialog(`حذف المادة "${item.name}" نهائياً؟`);
  if (!confirmed) return;

  try {
    await performCascadeDelete('items', id);
    await refreshCaches();
    showToast('تم حذف المادة بنجاح', 'success');
    loadItems();
  } catch (e) {
    console.error(e);
    showToast('فشل الحذف: ' + e.message, 'error');
  }
}

// باقي الدوال (showAddItemModal, showEditItemModal...) تبقى كما هي
// يمكنك لصقها من الملف القديم

export { showAddItemModal, showEditItemModal } from './items-modal.js'; // إذا كان لديك ملف منفصل
