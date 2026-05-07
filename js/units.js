import { ICONS } from './constants.js';
import { showToast, confirmDialog, openModal } from './utils.js';
import { db, unitsCache, refreshCaches, checkCascadeDelete, performCascadeDelete } from './db.js';

export async function loadUnitsSection() {
  await refreshCaches();

  const tc = document.getElementById('tab-content');
  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">وحدات القياس</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-unit">${ICONS.plus} إضافة وحدة</button>
      </div>
    </div>`;

  if (!unitsCache.length) {
    html += '<div class="empty-state"><h3>لا توجد وحدات</h3></div>';
  } else {
    html += '<div class="table-wrap"><table class="table"><thead><tr><th>الوحدة</th><th>الاختصار</th><th></th></tr></thead><tbody>';
    unitsCache.forEach(u => {
      html += `<tr>
        <td>${u.name}</td>
        <td>${u.abbreviation || '-'}</td>
        <td>
          <button class="btn btn-secondary btn-sm edit-unit" data-id="${u.id}">✏️</button>
          <button class="btn btn-danger btn-sm delete-unit" data-id="${u.id}">🗑</button>
        </td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  }

  tc.innerHTML = html;

  document.getElementById('btn-add-unit').onclick = showAddUnitModal;

  document.querySelectorAll('.edit-unit').forEach(btn => {
    btn.onclick = () => showEditUnitModal(btn.dataset.id);
  });

  document.querySelectorAll('.delete-unit').forEach(btn => {
    btn.onclick = () => deleteUnit(btn.dataset.id);
  });
}

export function showAddUnitModal() {
  // يمكنك إضافة النموذج هنا أو استدعاء showFormModal
  showToast('إضافة وحدة جديدة', 'info');
}

export function showEditUnitModal(id) {
  showToast(`تعديل الوحدة رقم ${id}`, 'info');
}

export async function deleteUnit(id) {
  const unit = unitsCache.find(u => u.id == id);
  if (!unit) return showToast('الوحدة غير موجودة', 'error');

  const { counts, canDelete } = await checkCascadeDelete('units', id);

  if (!canDelete) {
    if (counts.itemsBase > 0) {
      return showToast(`هذه الوحدة أساسية لـ ${counts.itemsBase} مادة ولا يمكن حذفها`, 'error');
    }
    if (counts.itemUnits > 0) {
      const ok = await confirmDialog(`الوحدة مستخدمة في ${counts.itemUnits} مادة.\nسيتم إزالتها من المواد. متابعة؟`);
      if (!ok) return;
    }
  }

  const confirmed = await confirmDialog(`حذف الوحدة "${unit.name}"؟`);
  if (!confirmed) return;

  try {
    await performCascadeDelete('units', id);
    await refreshCaches();
    showToast('تم حذف الوحدة بنجاح', 'success');
    loadUnitsSection();
  } catch (e) {
    console.error(e);
    showToast('فشل الحذف: ' + e.message, 'error');
  }
}
