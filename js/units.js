import { ICONS } from './constants.js';
import { showToast, showFormModal, confirmDialog } from './utils.js';
import { apiCall, unitsCache } from './db.js';

export async function loadUnitsSection() {
    try {
        unitsCache.length = 0;
        unitsCache.push(...(await apiCall('/definitions?type=unit', 'GET')));
        const tc = document.getElementById('tab-content');
        let html = `<div class="card"><div class="card-header"><div><h3 class="card-title">وحدات القياس</h3></div><button class="btn btn-primary btn-sm" id="btn-add-unit">${ICONS.plus} إضافة</button></div></div>`;
        if (!unitsCache.length) {
            html += '<div class="empty-state"><h3>لا توجد وحدات</h3></div>';
        } else {
            html += '<div class="table-wrap"><table class="table"><thead><tr><th>الوحدة</th><th>الاختصار</th><th></th></tr></thead><tbody>';
            unitsCache.forEach(u => {
                html += `<tr><td>${u.name}</td><td>${u.abbreviation || '-'}</td><td><button class="btn btn-secondary btn-sm edit-btn" data-id="${u.id}" data-type="units">${ICONS.edit}</button> <button class="btn btn-danger btn-sm delete-btn" data-id="${u.id}" data-type="units">${ICONS.trash}</button></td></tr>`;
            });
            html += '</tbody></table></div>';
        }
        tc.innerHTML = html;
        document.getElementById('btn-add-unit')?.addEventListener('click', showAddUnitModal);
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
        onSave: async v => apiCall('/definitions?type=unit', 'PUT', { id, ...v }),
        onSuccess: loadUnitsSection
    });
}

export async function deleteUnit(unitId) {
    if (!(await confirmDialog('حذف الوحدة؟'))) return;
    try {
        await apiCall('/definitions?type=unit&id=' + unitId, 'DELETE');
        showToast('تم الحذف', 'success');
        loadUnitsSection();
    } catch (e) {
        showToast(e.message, 'error');
    }
}
