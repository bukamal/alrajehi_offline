import { ICONS } from './constants.js';
import { showToast, showFormModal, confirmDialog } from './utils.js';
import {
  db,
  apiCall,
  customersCache,
  suppliersCache,
  categoriesCache,
  checkCascadeDelete,
} from './db.js';

export async function loadGenericSection(endpoint, cacheKey) {
  const data = await apiCall(endpoint, 'GET');

  if (cacheKey === 'customers') {
    customersCache.length = 0;
    customersCache.push(...data);
  } else if (cacheKey === 'suppliers') {
    suppliersCache.length = 0;
    suppliersCache.push(...data);
  } else if (cacheKey === 'categories') {
    categoriesCache.length = 0;
    categoriesCache.push(...data);
  }

  const titles = {
    customers: 'العملاء',
    suppliers: 'الموردين',
    categories: 'التصنيفات'
  };
  const title = titles[cacheKey] || cacheKey;
  const tc = document.getElementById('tab-content');

  let html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${title}</h3>
        <button class="btn btn-primary btn-sm add-btn" data-type="${cacheKey}">${ICONS.plus} إضافة</button>
      </div>
    </div>`;

  if (!data.length) {
    html += `<div class="empty-state"><h3>لا يوجد ${title}</h3></div>`;
  } else {
    data.forEach(item => {
      html += `
        <div class="card card-hover" style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:800;">${item.name}</span>
          <div>
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${item.id}" data-type="${cacheKey}">${ICONS.edit}</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}" data-type="${cacheKey}">${ICONS.trash}</button>
          </div>
        </div>`;
    });
  }

  tc.innerHTML = html;
}

document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;

  if (t.classList.contains('add-btn')) {
    const type = t.dataset.type;
    const titles = { customers: 'عميل', suppliers: 'مورد', categories: 'تصنيف' };
    const endpoints = {
      customers: '/customers',
      suppliers: '/suppliers',
      categories: '/definitions?type=category'
    };
    if (!endpoints[type]) return;

    showFormModal({
      title: `إضافة ${titles[type]}`,
      fields: [{ id: 'name', label: 'الاسم' }],
      onSave: async v => {
        if (type === 'categories') {
          return apiCall(endpoints[type], 'POST', { type: 'category', name: v.name });
        } else {
          return apiCall(endpoints[type], 'POST', { name: v.name });
        }
      },
      onSuccess: () => loadGenericSection(endpoints[type], type)
    });
  }

  else if (t.classList.contains('edit-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id, 10);
    if (!id) return;
    if (type === 'units') return;

    const caches = {
      customers: customersCache,
      suppliers: suppliersCache,
      categories: categoriesCache
    };
    const item = caches[type]?.find(x => x.id == id);
    if (!item) {
      showToast('العنصر غير موجود في الكاش', 'error');
      return;
    }

    showFormModal({
      title: 'تعديل',
      fields: [{ id: 'name', label: 'الاسم' }],
      initialValues: { name: item.name },
      onSave: async v => {
        if (type === 'categories') {
          return apiCall('/definitions?type=category', 'PUT', { type: 'category', id, name: v.name });
        } else {
          return db[type].update(id, { name: v.name });
        }
      },
      onSuccess: () => loadGenericSection('/' + (type === 'categories' ? 'definitions?type=category' : type), type)
    });
  }

  else if (t.classList.contains('delete-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id, 10);
    if (!id) {
      showToast('معرّف غير صالح', 'error');
      return;
    }
    if (type === 'units') return;

    try {
      const caches = {
        customers: customersCache,
        suppliers: suppliersCache,
        categories: categoriesCache
      };
      const item = caches[type]?.find(x => x.id == id);
      const name = item ? item.name : '';
      if (!name) {
        showToast('العنصر غير موجود', 'error');
        return;
      }

      const { counts } = await checkCascadeDelete(type, id);

      if (type === 'customers' || type === 'suppliers') {
        if (counts.invoices > 0 || counts.payments > 0) {
          showToast(
            `لا يمكن حذف "${name}" لأنه مرتبط بـ ${counts.invoices || 0} فاتورة و ${counts.payments || 0} دفعة. قم بحذف الفواتير والدفعات أولاً.`,
            'error'
          );
          return;
        }
      }

      if (type === 'categories' && counts.items > 0) {
        const proceed = await confirmDialog(
          `التصنيف "${name}" يحتوي على ${counts.items} مادة.\nإذا تابعت، سيتم إزالة التصنيف من هذه المواد. متابعة؟`
        );
        if (!proceed) return;

        await db.transaction('rw', db.items, db.categories, async () => {
          await db.items.where({ category_id: id }).modify({ category_id: null });
          await db.categories.delete(id);
        });
        showToast('تم حذف التصنيف وإزالته من المواد.', 'success');
        await loadGenericSection('/definitions?type=category', 'categories');
        return;
      }

      if (!(await confirmDialog(`حذف "${name}"؟`))) return;

      await db[type].delete(id);
      showToast('تم الحذف', 'success');

      const endpoints = {
        customers: '/customers',
        suppliers: '/suppliers',
        categories: '/definitions?type=category'
      };
      await loadGenericSection(endpoints[type], type);
      
    } catch (err) {
      console.error('[Delete Error]', err);
      showToast('فشل الحذف: ' + (err.message || 'خطأ غير معروف'), 'error');
    }
  }
});
