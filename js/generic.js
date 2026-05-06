import { ICONS } from './constants.js';
import { showToast, showFormModal, confirmDialog } from './utils.js';
import { apiCall, customersCache, suppliersCache, categoriesCache } from './db.js';

/**
 * تحميل وعرض قسم عام (عملاء / موردين / تصنيفات)
 * @param {string} endpoint - مسار API (مثل '/customers')
 * @param {string} cacheKey - مفتاح الكاش (customers, suppliers, categories)
 */
export async function loadGenericSection(endpoint, cacheKey) {
  const data = await apiCall(endpoint, 'GET');

  // تحديث الكاش المناسب
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

/**
 * المستمع العالمي الموحد لأزرار الإضافة/التعديل/الحذف
 * (يعمل على كامل الصفحة)
 */
document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;

  // زر الإضافة (في أقسام العملاء والموردين والتصنيفات)
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

  // زر التعديل
  else if (t.classList.contains('edit-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id);
    if (!id) return;

    // حالات خاصة للوحدات (تُعالج في ملف units.js)
    if (type === 'units') {
      // سيتم استدعاء showEditUnitModal من units.js، لكن المستمع هناك أيضًا
      return;
    }

    const caches = {
      customers: customersCache,
      suppliers: suppliersCache,
      categories: categoriesCache
    };
    const item = caches[type]?.find(x => x.id === id);
    if (!item) return;

    const endpoints = {
      customers: '/customers',
      suppliers: '/suppliers',
      categories: '/definitions?type=category'
    };

    showFormModal({
      title: 'تعديل',
      fields: [{ id: 'name', label: 'الاسم' }],
      initialValues: { name: item.name },
      onSave: async v => {
        if (type === 'categories') {
          return apiCall('/definitions?type=category', 'PUT', { type: 'category', id, name: v.name });
        } else {
          return apiCall(`/${type}`, 'PUT', { id, name: v.name });
        }
      },
      onSuccess: () => loadGenericSection(endpoints[type], type)
    });
  }

  // زر الحذف
  else if (t.classList.contains('delete-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id);
    if (!id) return;

    // حالات خاصة للوحدات
    if (type === 'units') {
      const { deleteUnit } = await import('./units.js');
      return deleteUnit(id);
    }

    const caches = {
      customers: customersCache,
      suppliers: suppliersCache,
      categories: categoriesCache
    };
    const item = caches[type]?.find(x => x.id === id);
    if (!item) return;
    if (!(await confirmDialog(`حذف ${item.name}؟`))) return;

    const delUrls = {
      customers: `/customers?id=${id}`,
      suppliers: `/suppliers?id=${id}`,
      categories: `/definitions?type=category&id=${id}`
    };
    await apiCall(delUrls[type], 'DELETE');
    showToast('تم الحذف', 'success');

    const endpoints = {
      customers: '/customers',
      suppliers: '/suppliers',
      categories: '/definitions?type=category'
    };
    loadGenericSection(endpoints[type], type);
  }
});
