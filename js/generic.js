import { ICONS } from './constants.js';
import { showToast, showFormModal, confirmDialog } from './utils.js';
import {
  apiCall,
  customersCache,
  suppliersCache,
  categoriesCache,
  checkCascadeDelete,
  db
} from './db.js';

/* =============================================
   تحميل وعرض قسم عام (عملاء / موردين / تصنيفات)
   ============================================= */
export async function loadGenericSection(endpoint, cacheKey) {
  const data = await apiCall(endpoint, 'GET');

  // إعادة بناء الكاش من الصفر
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

/* =============================================
   المستمع العالمي الموحد لأزرار add/edit/delete
   ============================================= */
document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;

  // ----- زر الإضافة (عملاء / موردين / تصنيفات) -----
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
      onSuccess: () => loadGenericSection(endpoints[type], type) // ← يعيد تحميل القسم بعد الإضافة
    });
  }

  // ----- زر التعديل -----
  else if (t.classList.contains('edit-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id, 10);
    if (!id) return;

    // الوحدات تُعالج في units.js
    if (type === 'units') return;

    const caches = {
      customers: customersCache,
      suppliers: suppliersCache,
      categories: categoriesCache
    };
    // استخدام == لمقارنة مرنة
    const item = caches[type]?.find(x => x.id == id);
    if (!item) {
      showToast('العنصر غير موجود في الكاش', 'error');
      return;
    }

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
      onSuccess: () => loadGenericSection(endpoints[type], type) // ← يعيد تحميل القسم بعد التعديل
    });
  }

  // ----- زر الحذف (مع فحص العلاقات) -----
  else if (t.classList.contains('delete-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id, 10);
    if (!id) {
      showToast('معرّف غير صالح', 'error');
      return;
    }

    // الوحدات تُعالج في units.js
    if (type === 'units') return;

    // العملية بالكامل داخل try...catch
    try {
      const name = (() => {
        const caches = {
          customers: customersCache,
          suppliers: suppliersCache,
          categories: categoriesCache
        };
        // == لمقارنة مرنة
        const item = caches[type]?.find(x => x.id == id);
        return item ? item.name : '';
      })();

      if (!name) {
        showToast('العنصر غير موجود', 'error');
        return;
      }

      // ---- فحص العلاقات ----
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
        await loadGenericSection('/definitions?type=category', 'categories'); // ← ينتظر إعادة التحميل
        return;
      }

      if (!(await confirmDialog(`حذف "${name}"؟`))) return;

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
      await loadGenericSection(endpoints[type], type); // ← ينتظر إعادة التحميل بعد الحذف
      
    } catch (err) {
      console.error('[Delete Error]', err);
      showToast('فشل الحذف: ' + (err.message || 'خطأ غير معروف'), 'error');
    }
  }
});
