import { ICONS } from './constants.js';
import { showToast, showFormModal, confirmDialog } from './utils.js';
import {
  db,
  apiCall,
  unitsCache,
  checkCascadeDelete,
  performCascadeDelete
} from './db.js';

export async function loadUnitsSection() {
  try {
    unitsCache.length = 0;
    const data = await db.units.toArray();
    unitsCache.push(...data);

    const tc = document.getElementById('tab-content');
    let html = `
      <div class="card">
        <div class="card-header">
          <div><h3 class="card-title">وحدات القياس</h3></div>
          <button class="btn btn-primary btn-sm" id="btn-add-unit">${ICONS.plus} إضافة</button>
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
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${u.id}" data-type="units">${ICONS.edit}</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${u.id}" data-type="units">${ICONS.trash}</button>
          </td>
        </tr>`;
      });
      html += '</tbody></table></div>';
    }

    tc.innerHTML = html;

    document.getElementById('btn-add-unit')?.addEventListener('click', showAddUnitModal);
    document.querySelectorAll('.edit-btn[data-type="units"]').forEach(btn => {
      btn.addEventListener('click', () => showEditUnitModal(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.delete-btn[data-type="units"]').forEach(btn => {
      btn.addEventListener('click', () => deleteUnit(parseInt(btn.dataset.id)));
    });
  } catch (e) {
    showToast(e.message, 'error');
  }
}

export function showAddUnitModal() {
  showFormModal({
    title: 'إضافة وحدة',
    fields: [
      { id: 'name', label: 'الاسم' },
      { id: 'abbreviation', label: 'الاختصار' }
    ],
    onSave: async v => {
      if (!v.name) throw new Error('الاسم مطلوب');
      return apiCall('/definitions?type=unit', 'POST', v);
    },
    onSuccess: loadUnitsSection
  });
}

export function showEditUnitModal(id) {
  const u = unitsCache.find(x => x.id == id);
  if (!u) return;

  showFormModal({
    title: 'تعديل وحدة',
    fields: [
      { id: 'name', label: 'الاسم' },
      { id: 'abbreviation', label: 'الاختصار' }
    ],
    initialValues: u,
    onSave: async v => db.units.update(id, v),
    onSuccess: loadUnitsSection
  });
}

export async function deleteUnit(unitId) {
  const unit = unitsCache.find(u => u.id == unitId);
  if (!unit) return;

  try {
    const { counts } = await checkCascadeDelete('units', unitId);

    if (counts.itemsBase > 0) {
      showToast(
        `لا يمكن حذف "${unit.name}" لأنها الوحدة الأساسية لـ ${counts.itemsBase} مادة. قم بتغييرها أولاً.`,
        'error'
      );
      return;
    }

    if (counts.itemUnits > 0) {
      const proceed = await confirmDialog(
        `الوحدة "${unit.name}" مستخدمة كوحدة فرعية في ${counts.itemUnits} مادة.\nإذا تابعت، ستتم إزالتها من هذه المواد. متابعة؟`
      );
      if (!proceed) return;

      await performCascadeDelete('units', unitId);
      showToast('تم حذف الوحدة وإزالتها من المواد.', 'success');
      await loadUnitsSection();
      return;
    }

    if (!(await confirmDialog(`حذف "${unit.name}"؟`))) return;

    await db.units.delete(unitId);
    showToast('تم الحذف', 'success');
    await loadUnitsSection();
  } catch (e) {
    console.error('[Delete Unit Error]', e);
    showToast('فشل الحذف: ' + (e.message || 'خطأ غير معروف'), 'error');
  }
}
