/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 1 من 10 */
(function() {
  'use strict';
// حماية شاملة: تسجيل أي خطأ في debug-log
var debugEl = document.getElementById('debug-log');
function logDebug(msg) {
  if (debugEl) {
    debugEl.textContent += msg + '\n';
    debugEl.scrollTop = debugEl.scrollHeight;
  }
  console.log(msg);
}

// تأكيد وجود Dexie
if (typeof Dexie === 'undefined') {
  logDebug('خطأ: Dexie غير موجود - توقف التطبيق');
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('error-screen').style.display = 'flex';
  throw new Error('Dexie missing');
} else {
  logDebug('Dexie محمل بنجاح');
}

// بدء التطبيق مع حماية من الأخطاء
(async function() {
  try {
    // تعريف قاعدة البيانات (نفس كودك السابق)
    const db = new Dexie('AlrajhiDBv4');
    // ... (باقي تعريف db)
    
    // استدعاء initApp مع معالجة الأخطاء
    await initApp();
  } catch (e) {
    logDebug('فشل في بدء التطبيق: ' + e.message + ' - ' + (e.stack || ''));
    document.getElementById('loading-screen').style.display = 'none';
    // محاولة عرض شاشة الخطأ
    var errScreen = document.getElementById('error-screen');
    if (errScreen) {
      errScreen.style.display = 'flex';
      document.getElementById('error-details').textContent = 'خطأ: ' + e.message;
    }
  }
})();
// ... بقية كود app.js (داخل IIFE الرئيسي)
  const ICONS = {
    home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    download: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    factory: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 22h20"/><path d="M4 22V10l4-2v14"/><path d="M12 22V8l4-2v16"/><path d="M20 22V4l-4 2v16"/></svg>',
    tag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    wallet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M16 10a4 4 0 0 1-4 4"/></svg>',
    dollar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    fileText: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    scale: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>',
    send: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
  };

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 2 من 10 */
  function formatNumber(num) {
    if (num === undefined || num === null) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function debounce(fn, ms) {
    if (ms === undefined) ms = 300;
    var timeout;
    return function() {
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() { fn.apply(null, args); }, ms);
    };
  }

  var scrollLockPos = 0;
  function lockScroll() {
    scrollLockPos = window.scrollY || document.documentElement.scrollTop;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollLockPos + 'px';
    document.body.style.width = '100%';
    document.body.classList.add('scroll-locked');
  }
  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('scroll-locked');
    window.scrollTo(0, scrollLockPos);
  }

  window.showToast = function(msg, type) {
    if (type === undefined) type = 'info';
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  };

  var activeModal = null;
  function openModal(opts) {
    var title = opts.title;
    var bodyHTML = opts.bodyHTML;
    var footerHTML = opts.footerHTML || '';
    var onClose = opts.onClose;

    var portal = document.getElementById('modal-portal');
    if (activeModal) activeModal.close();

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
        '<div class="modal-header">' +
          '<h3 class="modal-title">' + title + '</h3>' +
          '<button class="modal-close">' + ICONS.x + '</button>' +
        '</div>' +
        '<div class="modal-body">' + bodyHTML + '</div>' +
        (footerHTML ? '<div class="modal-footer">' + footerHTML + '</div>' : '') +
      '</div>';

    portal.appendChild(overlay);
    lockScroll();

    var close = function() {
      overlay.remove();
      activeModal = null;
      unlockScroll();
      if (onClose) onClose();
    };

    overlay.querySelector('.modal-close').onclick = close;
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });

    activeModal = { close: close, element: overlay };
    return activeModal;
  }

  function confirmDialog(msg) {
    return new Promise(function(resolve) {
      var m = openModal({
        title: 'تأكيد',
        bodyHTML: '<p>' + msg + '</p>',
        footerHTML:
          '<button class="btn btn-secondary" id="cf-cancel">إلغاء</button>' +
          '<button class="btn btn-danger" id="cf-ok">تأكيد</button>',
        onClose: function() { resolve(false); }
      });
      m.element.querySelector('#cf-cancel').onclick = function() { m.close(); resolve(false); };
      m.element.querySelector('#cf-ok').onclick = function() { m.close(); resolve(true); };
    });
  }

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 3 من 10 */
  // ========== قاعدة البيانات ==========
  const db = new Dexie('AlrajhiDBv4');
  db.version(4).stores({
    items: '++id, name, category_id, item_type, purchase_price, selling_price, quantity, base_unit_id',
    customers: '++id, name, phone, address, balance',
    suppliers: '++id, name, phone, address, balance',
    categories: '++id, name',
    units: '++id, name, abbreviation',
    invoices: '++id, type, customer_id, supplier_id, date, reference, notes, total',
    invoiceLines: '++id, invoice_id, item_id, unit_id, quantity, unit_price, conversion_factor, total',
    payments: '++id, invoice_id, customer_id, supplier_id, amount, payment_date, notes',
    expenses: '++id, amount, expense_date, description'
  });

  function getTable(name) {
    return db[name];
  }

  // ========== دالة مساعدة لتحديث الكمية بالوحدة الأساسية ==========
  async function updateItemQuantity(itemId, changeBaseQty) {
    if (!itemId) return;
    const item = await getTable('items').get(itemId);
    if (item) {
      const newQty = (parseFloat(item.quantity) || 0) + changeBaseQty;
      await getTable('items').update(itemId, { quantity: Math.max(0, newQty) });
    }
  }

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 4 من 10 */
  // ========== apiCall المعدلة مع دعم PUT للفواتير وتحديث المخزون ==========
  async function apiCall(endpoint, method, body) {
    if (method === undefined) method = 'GET';
    if (body === undefined) body = {};

    var parts = endpoint.split('?');
    var table = parts[0];
    var params = new URLSearchParams(parts[1] || '');
    var id = params.get('id') ? parseInt(params.get('id')) : null;
    var type = params.get('type');

    if (method === 'GET') {
      switch (table) {
        case '/items':
          return await getTable('items').toArray();
        case '/customers':
          return await getTable('customers').toArray();
        case '/suppliers':
          return await getTable('suppliers').toArray();
        case '/definitions':
          if (type === 'category') return await getTable('categories').toArray();
          if (type === 'unit') return await getTable('units').toArray();
          return [];
        case '/invoices':
          var invs = await getTable('invoices').toArray();
          for (var i = 0; i < invs.length; i++) {
            var inv = invs[i];
            var lines = await getTable('invoiceLines').where({ invoice_id: inv.id }).toArray();
            var pmts = await getTable('payments').where({ invoice_id: inv.id }).toArray();
            inv.invoice_lines = lines;
            inv.paid = pmts.reduce(function(s, p) { return s + p.amount; }, 0);
            inv.balance = inv.total - inv.paid;
          }
          return invs;
        case '/payments':
          return await getTable('payments').toArray();
        case '/expenses':
          return await getTable('expenses').toArray();
        default:
          return [];
      }
    }

    if (method === 'POST') {
      switch (table) {
        case '/items': {
          var clean = Object.assign({}, body);
          clean.purchase_price = parseFloat(clean.purchase_price) || 0;
          clean.selling_price = parseFloat(clean.selling_price) || 0;
          clean.quantity = parseFloat(clean.quantity) || 0;
          var nid = await getTable('items').add(clean);
          return Object.assign({ id: nid }, clean);
        }
        case '/invoices': {
          var invLines = body.lines;
          delete body.lines;
          var paid_amount = parseFloat(body.paid_amount) || 0;
          delete body.paid_amount;
          var invId = await getTable('invoices').add(body);
          if (invLines) {
            for (var j = 0; j < invLines.length; j++) {
              var l = invLines[j];
              await getTable('invoiceLines').add({
                invoice_id: invId,
                item_id: l.item_id,
                unit_id: l.unit_id || null,
                quantity: l.quantity,
                unit_price: l.unit_price || 0,
                conversion_factor: l.conversion_factor || 1,
                total: l.total
              });
              // تحديث المخزون
              var change = body.type === 'purchase'
                ? (l.quantity * (l.conversion_factor || 1))
                : -(l.quantity * (l.conversion_factor || 1));
              await updateItemQuantity(l.item_id, change);
            }
          }
          if (paid_amount > 0) {
            await getTable('payments').add({
              invoice_id: invId,
              customer_id: body.customer_id || null,
              supplier_id: body.supplier_id || null,
              amount: paid_amount,
              payment_date: body.date,
              notes: 'دفعة تلقائية'
            });
          }
          return Object.assign({ id: invId }, body);
        }
        case '/customers': {
          var cid = await getTable('customers').add(body);
          return Object.assign({ id: cid }, body);
        }
        case '/suppliers': {
          var sid = await getTable('suppliers').add(body);
          return Object.assign({ id: sid }, body);
        }
        case '/definitions': {
          if (type === 'category') {
            var catId = await getTable('categories').add({ name: body.name });
            return Object.assign({ id: catId }, body);
          }
          if (type === 'unit') {
            var unit = { name: body.name, abbreviation: body.abbreviation || body.name };
            var uid = await getTable('units').add(unit);
            unitsCache.push(Object.assign({ id: uid }, unit));
            return Object.assign({ id: uid }, unit);
          }
          break;
        }
        case '/payments': {
          var pid = await getTable('payments').add(body);
          return Object.assign({ id: pid }, body);
        }
        case '/expenses': {
          var eid = await getTable('expenses').add(body);
          return Object.assign({ id: eid }, body);
        }
      }
    }

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 5 من 10 */
    if (method === 'PUT') {
      var tbl = table.replace('/', '');
      var recordId = id || body.id;
      if (recordId === undefined || recordId === null) throw new Error('معرف السجل مطلوب للتعديل');
      var changes = Object.assign({}, body);
      delete changes.id;

      // معالجة خاصة للفواتير (تحديث المخزون)
      if (tbl === 'invoices') {
        // جلب الفاتورة القديمة
        var oldInv = await getTable('invoices').get(recordId);
        if (!oldInv) throw new Error('الفاتورة غير موجودة');
        var oldLines = await getTable('invoiceLines').where({ invoice_id: recordId }).toArray();

        // عكس تأثير الكميات القديمة
        for (var oi = 0; oi < oldLines.length; oi++) {
          var ol = oldLines[oi];
          var oldChange = oldInv.type === 'purchase'
            ? -(ol.quantity * (ol.conversion_factor || 1))
            : (ol.quantity * (ol.conversion_factor || 1));
          await updateItemQuantity(ol.item_id, oldChange);
        }

        // حذف البنود والدفعات القديمة
        await getTable('invoiceLines').where({ invoice_id: recordId }).delete();
        await getTable('payments').where({ invoice_id: recordId }).delete();

        // تحديث رأس الفاتورة
        var newType = changes.type;
        await getTable('invoices').update(recordId, changes);

        // إدراج البنود الجديدة إن وجدت
        if (changes.lines) {
          var newLines = changes.lines;
          delete changes.lines;
          for (var ni = 0; ni < newLines.length; ni++) {
            var nl = newLines[ni];
            await getTable('invoiceLines').add({
              invoice_id: recordId,
              item_id: nl.item_id,
              unit_id: nl.unit_id || null,
              quantity: nl.quantity,
              unit_price: nl.unit_price || 0,
              conversion_factor: nl.conversion_factor || 1,
              total: nl.total
            });
            // تطبيق تأثير الكميات الجديدة
            var newChange = newType === 'purchase'
              ? (nl.quantity * (nl.conversion_factor || 1))
              : -(nl.quantity * (nl.conversion_factor || 1));
            await updateItemQuantity(nl.item_id, newChange);
          }
        }

        return { id: recordId, ...changes };
      }

      // تعديل باقي السجلات
      if (tbl === 'definitions') {
        var defType = type || changes.type;
        delete changes.type;
        if (defType === 'category') {
          await getTable('categories').update(recordId, changes);
        } else if (defType === 'unit') {
          await getTable('units').update(recordId, changes);
        } else {
          throw new Error('نوع التعريف غير معروف');
        }
      } else {
        await getTable(tbl).update(recordId, changes);
      }
      return Object.assign({ id: recordId }, changes);
    }

    if (method === 'DELETE') {
      var dTbl = table.split('?')[0].replace('/', '');

      // منع حذف عميل/مورد مرتبط بفواتير
      if (dTbl === 'customers' || dTbl === 'suppliers') {
        var checkField = dTbl === 'customers' ? 'customer_id' : 'supplier_id';
        var checkResult = await getTable('invoices').where(checkField).equals(id).count();
        if (checkResult > 0) {
          throw new Error('لا يمكن حذف ' + (dTbl === 'customers' ? 'العميل' : 'المورد') + ' لارتباطه بفواتير');
        }
      }

      // معالجة خاصة للفواتير (عكس المخزون)
      if (dTbl === 'invoices') {
        var oldLines = await getTable('invoiceLines').where({ invoice_id: id }).toArray();
        var inv = await getTable('invoices').get(id);
        for (var li = 0; li < oldLines.length; li++) {
          var l = oldLines[li];
          var change = inv.type === 'purchase'
            ? -(l.quantity * (l.conversion_factor || 1))
            : (l.quantity * (l.conversion_factor || 1));
          await updateItemQuantity(l.item_id, change);
        }
        await getTable('invoiceLines').where({ invoice_id: id }).delete();
        await getTable('payments').where({ invoice_id: id }).delete();
      }

      await getTable(dTbl).delete(id);
      return { success: true };
    }
  }

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 6 من 10 */
  // ========== الكاش العام ==========
  var itemsCache = [];
  var customersCache = [];
  var suppliersCache = [];
  var invoicesCache = [];
  var categoriesCache = [];
  var unitsCache = [];

  // ========== إدارة الوحدات ==========
  async function loadUnitsSection() {
    try {
      unitsCache = await apiCall('/definitions?type=unit', 'GET');
      var tc = document.getElementById('tab-content');
      var html = '<div class="card"><div class="card-header"><div><h3 class="card-title">وحدات القياس</h3></div><button class="btn btn-primary btn-sm" id="btn-add-unit">' + ICONS.plus + ' إضافة</button></div></div>';
      if (!unitsCache.length) {
        html += '<div class="empty-state"><h3>لا توجد وحدات</h3></div>';
      } else {
        html += '<div class="table-wrap"><table class="table"><thead><tr><th>الوحدة</th><th>الاختصار</th><th></th></tr></thead><tbody>';
        for (var i = 0; i < unitsCache.length; i++) {
          var u = unitsCache[i];
          html += '<tr><td>' + u.name + '</td><td>' + (u.abbreviation || '-') + '</td>' +
                  '<td><button class="btn btn-secondary btn-sm edit-btn" data-id="' + u.id + '" data-type="units">' + ICONS.edit + '</button> ' +
                  '<button class="btn btn-danger btn-sm delete-btn" data-id="' + u.id + '" data-type="units">' + ICONS.trash + '</button></td></tr>';
        }
        html += '</tbody></table></div>';
      }
      tc.innerHTML = html;
      var addBtn = document.getElementById('btn-add-unit');
      if (addBtn) addBtn.addEventListener('click', showAddUnitModal);
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  function showAddUnitModal() {
    showFormModal({
      title: 'إضافة وحدة',
      fields: [
        { id: 'name', label: 'الاسم' },
        { id: 'abbreviation', label: 'الاختصار' }
      ],
      onSave: async function(v) {
        if (!v.name) throw new Error('الاسم مطلوب');
        return apiCall('/definitions?type=unit', 'POST', v);
      },
      onSuccess: loadUnitsSection
    });
  }

  function showEditUnitModal(id) {
    var u = unitsCache.find(function(x) { return x.id == id; });
    if (!u) return;
    showFormModal({
      title: 'تعديل وحدة',
      fields: [
        { id: 'name', label: 'الاسم' },
        { id: 'abbreviation', label: 'الاختصار' }
      ],
      initialValues: u,
      onSave: async function(v) {
        return apiCall('/definitions?type=unit', 'PUT', { id: id, name: v.name, abbreviation: v.abbreviation });
      },
      onSuccess: loadUnitsSection
    });
  }

  async function deleteUnit(unitId) {
    if (!(await confirmDialog('حذف الوحدة؟'))) return;
    try {
      await apiCall('/definitions?type=unit&id=' + unitId, 'DELETE');
      showToast('تم الحذف', 'success');
      loadUnitsSection();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 7 من 10 */
  // ========== المواد ==========
  async function loadItems() {
    itemsCache = await apiCall('/items', 'GET');
    var tc = document.getElementById('tab-content');
    tc.innerHTML =
      '<div class="card">' +
        '<div class="card-header">' +
          '<h3 class="card-title">المواد</h3>' +
          '<button class="btn btn-primary btn-sm" id="btn-add-item">' + ICONS.plus + ' إضافة</button>' +
        '</div>' +
        '<input class="input" id="items-search" placeholder="بحث...">' +
      '</div>' +
      '<div id="items-list"></div>';

    document.getElementById('btn-add-item').addEventListener('click', showAddItemModal);
    document.getElementById('items-search').addEventListener('input', debounce(renderFilteredItems, 200));
    renderFilteredItems();
  }

  function renderFilteredItems() {
    var q = (document.getElementById('items-search')?.value || '').toLowerCase();
    var filtered = itemsCache.filter(function(i) {
      return (i.name || '').toLowerCase().includes(q);
    });
    var container = document.getElementById('items-list');
    if (!filtered.length) {
      return container.innerHTML = '<div class="empty-state"><h3>لا توجد مواد</h3></div>';
    }

    var html = '<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الوحدة الأساسية</th><th>متوفر</th></tr></thead><tbody>';
    for (var i = 0; i < filtered.length; i++) {
      var item = filtered[i];
      var baseUnit = unitsCache.find(function(u) { return u.id == item.base_unit_id; }) || {};
      html +=
        '<tr onclick="showItemDetail(' + item.id + ')" style="cursor:pointer;">' +
          '<td style="font-weight:700;">' + item.name + '</td>' +
          '<td>' + (baseUnit.name || 'قطعة') + '</td>' +
          '<td>' + (item.quantity || 0) + '</td>' +
        '</tr>';
    }
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  window.showItemDetail = function(itemId) {
    var item = itemsCache.find(function(i) { return i.id === itemId; });
    if (!item) return;
    var baseUnit = unitsCache.find(function(u) { return u.id == item.base_unit_id; }) || {};
    var baseName = baseUnit.name || 'قطعة';
    var unitsHtml = '';
    if (item.item_units && item.item_units.length) {
      unitsHtml = '<div style="margin-bottom:12px;"><strong>الوحدات الفرعية:</strong><ul>';
      for (var i = 0; i < item.item_units.length; i++) {
        var iu = item.item_units[i];
        var unit = unitsCache.find(function(u) { return u.id == iu.unit_id; }) || {};
        unitsHtml += '<li>' + (unit.name || 'وحدة') + ' (1 = ' + iu.conversion_factor + ' ' + baseName + ')</li>';
      }
      unitsHtml += '</ul></div>';
    }

    var modal = openModal({
      title: item.name,
      bodyHTML:
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
          '<div><strong>التصنيف:</strong> ' + (item.category_id ? (categoriesCache.find(function(c) { return c.id == item.category_id; })?.name || '-') : 'بدون تصنيف') + '</div>' +
          '<div><strong>نوع المادة:</strong> ' + (item.item_type || 'مخزون') + '</div>' +
          '<div><strong>الوحدة الأساسية:</strong> ' + baseName + '</div>' +
          '<div><strong>الكمية:</strong> ' + (item.quantity || 0) + '</div>' +
          '<div><strong>سعر الشراء (للوحدة الأساسية):</strong> ' + formatNumber(item.purchase_price) + '</div>' +
          '<div><strong>سعر البيع (للوحدة الأساسية):</strong> ' + formatNumber(item.selling_price) + '</div>' +
        '</div>' + unitsHtml,
      footerHTML:
        '<button class="btn btn-secondary" id="edit-item-btn">' + ICONS.edit + ' تعديل</button>' +
        '<button class="btn btn-danger" id="delete-item-btn">' + ICONS.trash + ' حذف</button>'
    });

    modal.element.querySelector('#edit-item-btn').onclick = function() {
      modal.close();
      setTimeout(function() { showEditItemModal(itemId); }, 200);
    };
    modal.element.querySelector('#delete-item-btn').onclick = function() {
      modal.close();
      setTimeout(async function() {
        if (await confirmDialog('حذف المادة؟')) {
          await apiCall('/items?id=' + itemId, 'DELETE');
          loadItems();
        }
      }, 200);
    };
  };

  async function getOrCreateUnit(name) {
    if (!name) return null;
    var existing = unitsCache.find(function(u) {
      return u.name.toLowerCase() === name.toLowerCase();
    });
    if (existing) return existing.id;
    var result = await apiCall('/definitions?type=unit', 'POST', { name: name, abbreviation: name });
    var newUnit = { id: result.id, name: name, abbreviation: name };
    unitsCache.push(newUnit);
    return newUnit.id;
  }

  function showAddItemModal() {
    var catOpts = categoriesCache.map(function(c) {
      return '<option value="' + c.id + '">' + c.name + '</option>';
    }).join('');

    var body =
      '<div class="form-group"><label class="form-label">اسم المادة</label><input class="input" id="fm-name"></div>' +
      '<div class="form-group"><label class="form-label">التصنيف</label><select class="select" id="fm-category_id"><option value="">بدون تصنيف</option>' + catOpts + '</select></div>' +
      '<div class="form-group" style="margin-bottom:4px;"><button class="btn btn-secondary btn-sm" id="btn-quick-cat" type="button" style="width:auto;">' + ICONS.plus + ' تصنيف جديد</button></div>' +
      '<div id="quick-cat-row" style="display:none;margin-bottom:12px;"><input class="input" id="fm-new-category" placeholder="اسم التصنيف..."><button class="btn btn-primary btn-sm" id="btn-save-quick-cat" style="width:auto;margin-top:4px;">إضافة</button></div>' +
      '<div class="form-group"><label class="form-label">الوحدة الأساسية</label><div style="display:flex;gap:8px;align-items:center;"><input class="input" id="fm-baseUnit" value="قطعة" style="flex:1;"><button class="btn btn-secondary" id="btn-toggle-units" type="button" style="width:auto;padding:8px 14px;" title="إضافة وحدات فرعية">' + ICONS.plus + '</button></div></div>' +
      '<div id="extra-units" style="display:none;">' +
        '<div class="form-group"><label class="form-label">وحدة فرعية 1</label><input class="input" id="fm-unit2-name" placeholder="الاسم"><input class="input" id="fm-unit2-factor" type="number" placeholder="عامل التحويل (مثلاً 12)"></div>' +
        '<div class="form-group"><label class="form-label">وحدة فرعية 2</label><input class="input" id="fm-unit3-name" placeholder="الاسم"><input class="input" id="fm-unit3-factor" type="number" placeholder="عامل التحويل"></div>' +
      '</div>' +
      '<div class="form-group"><label class="form-label">الكمية الافتتاحية</label><div style="display:flex;gap:8px;"><input class="input" id="fm-quantity" type="number" value="0" style="flex:1;"><select class="select" id="fm-qty-unit" style="width:150px;"><option value="base">الوحدة الأساسية</option><option value="u2">الوحدة الفرعية 1</option><option value="u3">الوحدة الفرعية 2</option></select></div><div id="qty-converted" style="font-size:12px;color:var(--text-muted);margin-top:4px;display:none;">= <strong id="qty-base-val">0</strong> قطعة</div></div>' +
      '<div class="form-group"><label class="form-label">سعر الشراء (للوحدة الأساسية)</label><input class="input" id="fm-purchase" type="number" value="0"></div>' +
      '<div class="form-group"><label class="form-label">سعر البيع (للوحدة الأساسية)</label><input class="input" id="fm-selling" type="number" value="0"></div>';

    var modal = openModal({
      title: 'إضافة مادة',
      bodyHTML: body,
      footerHTML: '<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">' + ICONS.check + ' حفظ</button>'
    });

    var baseNameInput = modal.element.querySelector('#fm-baseUnit');
    var extraUnitsDiv = modal.element.querySelector('#extra-units');
    var toggleBtn = modal.element.querySelector('#btn-toggle-units');
    var qtyInput = modal.element.querySelector('#fm-quantity');
    var qtyUnit = modal.element.querySelector('#fm-qty-unit');
    var qtyConverted = modal.element.querySelector('#qty-converted');
    var qtyBaseVal = modal.element.querySelector('#qty-base-val');

    toggleBtn.onclick = function() {
      if (extraUnitsDiv.style.display === 'none') {
        extraUnitsDiv.style.display = 'block';
        toggleBtn.innerHTML = ICONS.x;
      } else {
        extraUnitsDiv.style.display = 'none';
        toggleBtn.innerHTML = ICONS.plus;
      }
    };

    function updateQty() {
      var qty = parseFloat(qtyInput.value) || 0;
      var unit = qtyUnit.value;
      var f2 = parseFloat(modal.element.querySelector('#fm-unit2-factor').value) || 1;
      var f3 = parseFloat(modal.element.querySelector('#fm-unit3-factor').value) || 1;
      var baseQty = qty;
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
    modal.element.querySelector('#fm-unit2-factor').addEventListener('input', updateQty);
    modal.element.querySelector('#fm-unit3-factor').addEventListener('input', updateQty);

    // إصلاح خطأ row not defined - تم تعريف المتغير مسبقًا
    modal.element.querySelector('#btn-quick-cat').onclick = function() {
      var row = modal.element.querySelector('#quick-cat-row');
      if (row.style.display === 'none') {
        row.style.display = 'block';
      } else {
        row.style.display = 'none';
      }
    };

    modal.element.querySelector('#btn-save-quick-cat').onclick = async function() {
      var input = modal.element.querySelector('#fm-new-category');
      var select = modal.element.querySelector('#fm-category_id');
      var name = input.value.trim();
      if (!name) return showToast('ادخل اسم التصنيف', 'error');
      try {
        var res = await apiCall('/definitions?type=category', 'POST', { type: 'category', name: name });
        var newId = res.id;
        categoriesCache.push({ id: newId, name: name });
        var o = document.createElement('option');
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

    modal.element.querySelector('#fm-cancel').onclick = function() { modal.close(); };

    modal.element.querySelector('#fm-save').onclick = async function() {
      var btn = modal.element.querySelector('#fm-save');
      if (btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = '⏳ جاري الحفظ...';
      try {
        var nameVal = modal.element.querySelector('#fm-name').value.trim();
        if (!nameVal) throw new Error('اسم المادة مطلوب');
        var baseUnitName = baseNameInput.value.trim() || 'قطعة';
        var baseUnitId = await getOrCreateUnit(baseUnitName);

        var item_units = [];
        var u2name = modal.element.querySelector('#fm-unit2-name').value.trim();
        var u2factor = parseFloat(modal.element.querySelector('#fm-unit2-factor').value);
        if (u2name && u2factor > 0) {
          var uid = await getOrCreateUnit(u2name);
          if (uid) item_units.push({ unit_id: uid, conversion_factor: u2factor });
        }

        var u3name = modal.element.querySelector('#fm-unit3-name').value.trim();
        var u3factor = parseFloat(modal.element.querySelector('#fm-unit3-factor').value);
        if (u3name && u3factor > 0) {
          var uid2 = await getOrCreateUnit(u3name);
          if (uid2) item_units.push({ unit_id: uid2, conversion_factor: u3factor });
        }

        var qtyEntered = parseFloat(qtyInput.value) || 0;
        var unit = qtyUnit.value;
        var f2 = parseFloat(modal.element.querySelector('#fm-unit2-factor').value) || 1;
        var f3 = parseFloat(modal.element.querySelector('#fm-unit3-factor').value) || 1;
        var quantity = qtyEntered;
        if (unit === 'u2') quantity = qtyEntered * f2;
        else if (unit === 'u3') quantity = qtyEntered * f3;

        await apiCall('/items', 'POST', {
          name: nameVal,
          category_id: modal.element.querySelector('#fm-category_id').value || null,
          base_unit_id: baseUnitId,
          item_units: item_units,
          quantity: quantity,
          purchase_price: parseFloat(modal.element.querySelector('#fm-purchase').value) || 0,
          selling_price: parseFloat(modal.element.querySelector('#fm-selling').value) || 0
        });

        modal.close();
        showToast('تم الحفظ', 'success');
        loadItems();
      } catch (e) {
        showToast(e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = ICONS.check + ' حفظ';
      }
    };
  }

  function showEditItemModal(id) {
    var item = itemsCache.find(function(i) { return i.id == id; });
    if (!item) return;
    var baseUnit = unitsCache.find(function(u) { return u.id == item.base_unit_id; }) || {};
    var baseUnitName = baseUnit.name || 'قطعة';
    var catOpts = categoriesCache.map(function(c) {
      return '<option value="' + c.id + '"' + (c.id == item.category_id ? ' selected' : '') + '>' + c.name + '</option>';
    }).join('');

    var body =
      '<div class="form-group"><label class="form-label">الاسم</label><input class="input" id="fm-name" value="' + item.name + '"></div>' +
      '<div class="form-group"><label class="form-label">التصنيف</label><select class="select" id="fm-category_id"><option value="">بدون تصنيف</option>' + catOpts + '</select></div>' +
      '<div class="form-group"><label class="form-label">الوحدة الأساسية</label><input class="input" id="fm-baseUnit" value="' + baseUnitName + '"></div>' +
      '<div class="form-group"><label class="form-label">الكمية</label><input class="input" id="fm-quantity" type="number" value="' + (item.quantity || 0) + '"></div>' +
      '<div class="form-group"><label class="form-label">سعر الشراء (للوحدة الأساسية)</label><input class="input" id="fm-purchase" type="number" value="' + (item.purchase_price || 0) + '"></div>' +
      '<div class="form-group"><label class="form-label">سعر البيع (للوحدة الأساسية)</label><input class="input" id="fm-selling" type="number" value="' + (item.selling_price || 0) + '"></div>';

    var modal = openModal({
      title: 'تعديل مادة',
      bodyHTML: body,
      footerHTML: '<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">' + ICONS.check + ' حفظ</button>'
    });

    modal.element.querySelector('#fm-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#fm-save').onclick = async function() {
      var btn = modal.element.querySelector('#fm-save');
      if (btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = '⏳ جاري الحفظ...';
      try {
        var baseUnitNameInput = modal.element.querySelector('#fm-baseUnit');
        var newBaseUnitName = baseUnitNameInput ? baseUnitNameInput.value.trim() : 'قطعة';
        var newBaseUnitId = await getOrCreateUnit(newBaseUnitName);
        var values = {
          name: modal.element.querySelector('#fm-name').value.trim(),
          category_id: modal.element.querySelector('#fm-category_id').value || null,
          base_unit_id: newBaseUnitId,
          quantity: parseFloat(modal.element.querySelector('#fm-quantity').value) || 0,
          purchase_price: parseFloat(modal.element.querySelector('#fm-purchase').value) || 0,
          selling_price: parseFloat(modal.element.querySelector('#fm-selling').value) || 0
        };
        if (!values.name) throw new Error('اسم المادة مطلوب');
        await apiCall('/items', 'PUT', Object.assign({ id: id }, values));
        modal.close();
        showToast('تم التعديل بنجاح', 'success');
        loadItems();
      } catch (e) {
        showToast(e.message, 'error');
        btn.disabled = false;
        btn.innerHTML = ICONS.check + ' حفظ';
      }
    };
  }

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 8 من 10 */
  // ========== الأقسام العامة (عملاء، موردين، تصنيفات) ==========
  async function loadGenericSection(endpoint, cacheKey) {
    var data = await apiCall(endpoint, 'GET');
    if (cacheKey === 'customers') customersCache = data;
    else if (cacheKey === 'suppliers') suppliersCache = data;
    else if (cacheKey === 'categories') categoriesCache = data;

    var titles = { customers: 'العملاء', suppliers: 'الموردين', categories: 'التصنيفات' };
    var title = titles[cacheKey] || cacheKey;
    var tc = document.getElementById('tab-content');
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">' + title + '</h3><button class="btn btn-primary btn-sm add-btn" data-type="' + cacheKey + '">' + ICONS.plus + ' إضافة</button></div></div>';
    if (!data.length) {
      html += '<div class="empty-state"><h3>لا يوجد ' + title + '</h3></div>';
    } else {
      for (var i = 0; i < data.length; i++) {
        var item = data[i];
        html +=
          '<div class="card card-hover" style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-weight:800;">' + item.name + '</span>' +
            '<div>' +
              '<button class="btn btn-secondary btn-sm edit-btn" data-id="' + item.id + '" data-type="' + cacheKey + '">' + ICONS.edit + '</button> ' +
              '<button class="btn btn-danger btn-sm delete-btn" data-id="' + item.id + '" data-type="' + cacheKey + '">' + ICONS.trash + '</button>' +
            '</div>' +
          '</div>';
      }
    }
    tc.innerHTML = html;
  }

  function showFormModal(opts) {
    var title = opts.title;
    var fields = opts.fields;
    var initialValues = opts.initialValues || {};
    var onSave = opts.onSave;
    var onSuccess = opts.onSuccess;
    var formId = 'frm-' + Date.now();
    var body = '';
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var val = initialValues[f.id] !== undefined ? initialValues[f.id] : '';
      body += '<div class="form-group"><label class="form-label">' + f.label + '</label><input class="input" id="' + formId + '-' + f.id + '" type="' + (f.type || 'text') + '" value="' + val + '"></div>';
    }
    var modal = openModal({
      title: title,
      bodyHTML: body,
      footerHTML: '<button class="btn btn-secondary" id="' + formId + '-cancel">إلغاء</button><button class="btn btn-primary" id="' + formId + '-save">' + ICONS.check + ' حفظ</button>'
    });
    modal.element.querySelector('#' + formId + '-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#' + formId + '-save').onclick = async function() {
      var values = {};
      for (var j = 0; j < fields.length; j++) {
        var f2 = fields[j];
        var el = modal.element.querySelector('#' + formId + '-' + f2.id);
        values[f2.id] = el ? el.value.trim() : '';
      }
      try {
        await onSave(values);
        modal.close();
        showToast('تم الحفظ', 'success');
        if (onSuccess) onSuccess();
      } catch (e) {
        showToast(e.message, 'error');
      }
    };
  }

  // ========== المستمع العام لأزرار الإضافة والتعديل والحذف ==========
  document.addEventListener('click', async function(e) {
    var t = e.target.closest('button');
    if (!t) return;

    if (t.classList.contains('add-btn')) {
      var type = t.dataset.type;
      var titles = { customers: 'عميل', suppliers: 'مورد', categories: 'تصنيف' };
      var endpoints = { customers: '/customers', suppliers: '/suppliers', categories: '/definitions?type=category' };
      if (!endpoints[type]) return;
      showFormModal({
        title: 'إضافة ' + titles[type],
        fields: [{ id: 'name', label: 'الاسم' }],
        onSave: async function(v) {
          if (type === 'categories') {
            return apiCall(endpoints[type], 'POST', { type: 'category', name: v.name });
          } else {
            return apiCall(endpoints[type], 'POST', { name: v.name });
          }
        },
        onSuccess: function() { loadGenericSection(endpoints[type], type); }
      });

    } else if (t.classList.contains('edit-btn')) {
      var type2 = t.dataset.type;
      var id2 = parseInt(t.dataset.id);
      if (!id2) return;
      if (type2 === 'units') {
        showEditUnitModal(id2);
      } else {
        var caches = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
        var item = caches[type2]?.find(function(x) { return x.id === id2; });
        if (!item) return;
        showFormModal({
          title: 'تعديل',
          fields: [{ id: 'name', label: 'الاسم' }],
          initialValues: { name: item.name },
          onSave: async function(v) {
            if (type2 === 'categories') {
              return apiCall('/definitions?type=category', 'PUT', { type: 'category', id: id2, name: v.name });
            } else {
              return apiCall('/' + type2, 'PUT', { id: id2, name: v.name });
            }
          },
          onSuccess: function() {
            if (type2 === 'categories') loadGenericSection('/definitions?type=category', 'categories');
            else loadGenericSection('/' + type2, type2);
          }
        });
      }

    } else if (t.classList.contains('delete-btn')) {
      var type3 = t.dataset.type;
      var id3 = parseInt(t.dataset.id);
      if (!id3) return;
      if (type3 === 'units') {
        await deleteUnit(id3);
      } else {
        var caches2 = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
        var item2 = caches2[type3]?.find(function(x) { return x.id === id3; });
        if (!item2) return;
        var confirmMsg = 'حذف ' + item2.name + '؟';
        if (!(await confirmDialog(confirmMsg))) return;
        var delUrls = {
          customers: '/customers?id=' + id3,
          suppliers: '/suppliers?id=' + id3,
          categories: '/definitions?type=category&id=' + id3
        };
        try {
          await apiCall(delUrls[type3], 'DELETE');
          showToast('تم الحذف', 'success');
          if (type3 === 'categories') loadGenericSection('/definitions?type=category', 'categories');
          else loadGenericSection('/' + type3, type3);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    }
  });

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 9 من 10 */
  // ========== فاتورة (بيع / شراء) مع دعم التعديل ==========
  async function showInvoiceModal(type, editData) {
    try {
      customersCache = await apiCall('/customers', 'GET');
      suppliersCache = await apiCall('/suppliers', 'GET');
      itemsCache = await apiCall('/items', 'GET');
      unitsCache = await apiCall('/definitions?type=unit', 'GET');

      var isEdit = editData && editData.id;
      var invId = isEdit ? editData.id : null;
      var oldLines = isEdit ? editData.invoice_lines || [] : [];

      var entOpts = type === 'sale'
        ? '<option value="cash">عميل نقدي</option>' + customersCache.map(function(c) { return '<option value="' + c.id + '"' + (isEdit && editData.customer_id == c.id ? ' selected' : '') + '>' + c.name + '</option>'; }).join('')
        : '<option value="cash">مورد نقدي</option>' + suppliersCache.map(function(s) { return '<option value="' + s.id + '"' + (isEdit && editData.supplier_id == s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('');

      var linesHtml = '';
      if (isEdit && oldLines.length) {
        for (var li = 0; li < oldLines.length; li++) {
          linesHtml += generateLineRowHtml(oldLines[li], type === 'sale');
        }
      } else {
        linesHtml += generateLineRowHtml(null, type === 'sale');
      }

      var body =
        '<input type="hidden" id="inv-type" value="' + type + '">' +
        (isEdit ? '<input type="hidden" id="inv-id" value="' + invId + '">' : '') +
        '<div class="invoice-lines" id="inv-lines">' + linesHtml + '</div>' +
        '<button class="btn btn-secondary btn-sm" id="btn-add-line" style="width:auto;margin-bottom:16px;">' + ICONS.plus + ' إضافة بند</button>' +
        '<div class="form-group"><label class="form-label">' + (type === 'sale' ? 'العميل' : 'المورد') + '</label><select class="select" id="inv-entity">' + entOpts + '</select></div>' +
        '<div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="inv-date" value="' + (isEdit ? editData.date : new Date().toISOString().split('T')[0]) + '"></div>' +
        '<div class="form-group"><label class="form-label">الرقم المرجعي</label><input type="text" class="input" id="inv-ref" placeholder="رقم الفاتورة أو المرجع" value="' + (isEdit ? (editData.reference || '') : '') + '"></div>' +
        '<div class="form-group"><label class="form-label">ملاحظات</label><textarea class="textarea" id="inv-notes" placeholder="أي ملاحظات إضافية...">' + (isEdit ? (editData.notes || '') : '') + '</textarea></div>' +
        '<div style="background:var(--bg);border-radius:12px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
          '<div class="form-group" style="margin:0;"><label class="form-label">المبلغ المدفوع</label><input type="number" step="0.01" class="input" id="inv-paid" placeholder="0.00" value="0"></div>' +
          '<div class="form-group" style="margin:0;"><label class="form-label">الإجمالي</label><div id="inv-grand-total" style="font-size:22px;font-weight:900;color:var(--primary);padding:8px 0;">0.00</div></div>' +
        '</div>';

      var modal = openModal({
        title: (isEdit ? 'تعديل ' : '') + 'فاتورة ' + (type === 'sale' ? 'مبيعات' : 'مشتريات'),
        bodyHTML: body,
        footerHTML: '<button class="btn btn-secondary" id="inv-cancel">إلغاء</button><button class="btn btn-primary" id="inv-save">' + ICONS.check + ' حفظ الفاتورة</button>'
      });

      var container = modal.element;

      // دوال مساعدة
      function generateLineRowHtml(lineData, isSale) {
        var selectedItemId = lineData ? lineData.item_id : '';
        var qty = lineData ? lineData.quantity : '';
        var price = lineData ? lineData.unit_price : '';
        var total = lineData ? lineData.total : '';
        var unitId = lineData ? lineData.unit_id : '';
        var itemOptions = itemsCache.map(function(i) {
          return '<option value="' + i.id + '"' + (i.id == selectedItemId ? ' selected' : '') + '>' + i.name + '</option>';
        }).join('');
        return '<div class="line-row">' +
          '<div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>' + itemOptions + '</select></div>' +
          '<div class="form-group"><select class="select unit-select">' + (selectedItemId ? getUnitOptionsForItem(selectedItemId, unitId) : '<option value="">الوحدة</option>') + '</select></div>' +
          '<div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية" value="' + qty + '"></div>' +
          '<div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر" value="' + price + '"></div>' +
          '<div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;" value="' + total + '"></div>' +
          '<button class="line-remove">' + ICONS.trash + '</button>' +
        '</div>';
      }

      function getUnitOptionsForItem(itemId, selectedUnitId) {
        var item = itemsCache.find(function(i) { return i.id == itemId; });
        if (!item) return '<option value="">اختر مادة</option>';
        var baseUnit = unitsCache.find(function(u) { return u.id == item.base_unit_id; }) || {};
        var baseName = baseUnit.name || 'قطعة';
        var opts = '<option value="" data-factor="1"' + (!selectedUnitId ? ' selected' : '') + '>' + baseName + ' (أساسية)</option>';
        (item.item_units || []).forEach(function(iu) {
          var unit = unitsCache.find(function(u) { return u.id == iu.unit_id; }) || {};
          opts += '<option value="' + iu.unit_id + '" data-factor="' + iu.conversion_factor + '"' + (iu.unit_id == selectedUnitId ? ' selected' : '') + '>' + (unit.name || unit.abbreviation || 'وحدة') + ' (×' + iu.conversion_factor + ')</option>';
        });
        return opts;
      }

      var updateGrandTotal = function() {
        var total = 0;
        container.querySelectorAll('.total-input').forEach(function(inp) { total += parseFloat(inp.value) || 0; });
        container.querySelector('#inv-grand-total').textContent = formatNumber(total);
      };

      function isDup(itemId, currentRow) {
        if (!itemId) return false;
        var found = false;
        container.querySelectorAll('.line-row').forEach(function(r) {
          if (r !== currentRow && r.querySelector('.item-select')?.value === itemId) found = true;
        });
        return found;
      }

      function autoFill(selectEl, priceEl, unitSelectEl) {
        var itemId = selectEl.value;
        if (!itemId) {
          priceEl.value = '';
          if (unitSelectEl) { unitSelectEl.innerHTML = '<option value="">اختر مادة</option>'; unitSelectEl.style.display = 'none'; }
          return;
        }
        var item = itemsCache.find(function(i) { return i.id == itemId; });
        if (item) {
          var basePrice = type === 'sale' ? (item.selling_price || 0) : (item.purchase_price || 0);
          priceEl.value = basePrice;
          if (unitSelectEl) {
            unitSelectEl.innerHTML = getUnitOptionsForItem(itemId, null);
            unitSelectEl.style.display = 'block';
            unitSelectEl.dataset.basePrice = basePrice;
          }
          var row = selectEl.closest('.line-row');
          var qtyInput = row.querySelector('.qty-input');
          var totalInput = row.querySelector('.total-input');
          if (qtyInput && totalInput) {
            totalInput.value = ((parseFloat(qtyInput.value) || 0) * basePrice).toFixed(2);
          }
          updateGrandTotal();
        }
      }

      function calcRow(row) {
        var qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
        var price = parseFloat(row.querySelector('.price-input')?.value) || 0;
        row.querySelector('.total-input').value = (qty * price).toFixed(2);
        updateGrandTotal();
      }

      function handleUnitChange(row) {
        var sel = row.querySelector('.item-select');
        var unitSel = row.querySelector('.unit-select');
        var priceEl = row.querySelector('.price-input');
        if (!sel || !unitSel || !priceEl) return;
        var item = itemsCache.find(function(i) { return i.id == sel.value; });
        if (!item) return;
        var factor = parseFloat(unitSel.selectedOptions[0]?.dataset.factor || 1);
        var basePrice = parseFloat(unitSel.dataset.basePrice || 0);
        priceEl.value = (basePrice * factor).toFixed(2);
        calcRow(row);
      }

      // ربط الأحداث للصفوف الحالية
      container.querySelectorAll('.line-row').forEach(function(row) {
        row.querySelector('.line-remove').addEventListener('click', function() {
          if (container.querySelectorAll('.line-row').length > 1) { row.remove(); updateGrandTotal(); }
        });
        var sel = row.querySelector('.item-select');
        var price = row.querySelector('.price-input');
        var unitSel = row.querySelector('.unit-select');
        if (sel && price) autoFill(sel, price, unitSel);
        sel?.addEventListener('change', function() {
          if (isDup(this.value, this.closest('.line-row'))) {
            showToast('المادة مضافة مسبقاً', 'warning');
            this.value = ''; price.value = ''; if (unitSel) unitSel.style.display = 'none'; return;
          }
          autoFill(this, price, unitSel);
        });
        row.querySelector('.qty-input')?.addEventListener('input', function() { calcRow(row); });
        row.querySelector('.price-input')?.addEventListener('input', function() { calcRow(row); });
        unitSel?.addEventListener('change', function() { handleUnitChange(row); });
      });

      // زر إضافة بند جديد
      container.querySelector('#btn-add-line').addEventListener('click', function() {
        var linesContainer = container.querySelector('#inv-lines');
        var nl = document.createElement('div');
        nl.className = 'line-row';
        nl.innerHTML = generateLineRowHtml(null, type === 'sale');
        linesContainer.appendChild(nl);
        var newSel = nl.querySelector('.item-select');
        var newPrice = nl.querySelector('.price-input');
        var newUnit = nl.querySelector('.unit-select');
        newSel.addEventListener('change', function() {
          if (isDup(this.value, nl)) { showToast('المادة مضافة مسبقاً', 'warning'); this.value = ''; newPrice.value = ''; if (newUnit) newUnit.style.display = 'none'; return; }
          autoFill(this, newPrice, newUnit);
        });
        nl.querySelector('.qty-input').addEventListener('input', function() { calcRow(nl); });
        nl.querySelector('.price-input').addEventListener('input', function() { calcRow(nl); });
        newUnit?.addEventListener('change', function() { handleUnitChange(nl); });
        nl.querySelector('.line-remove').addEventListener('click', function() {
          if (linesContainer.querySelectorAll('.line-row').length > 1) { nl.remove(); updateGrandTotal(); }
        });
      });

      // تحديث الإجمالي أول مرة
      updateGrandTotal();

      // حفظ الفاتورة
      modal.element.querySelector('#inv-save').onclick = async function() {
        var lines = [];
        var rows = container.querySelectorAll('.line-row');
        var dupCheck = new Set();
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var itemId = row.querySelector('.item-select')?.value || null;
          if (itemId) {
            if (dupCheck.has(itemId)) return showToast('لا يمكن تكرار نفس المادة', 'error');
            dupCheck.add(itemId);
          }
          var unitSel = row.querySelector('.unit-select');
          var unitId = unitSel?.value || null;
          var factor = parseFloat(unitSel?.selectedOptions[0]?.dataset.factor || 1);
          var qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
          var price = parseFloat(row.querySelector('.price-input')?.value) || 0;
          var total = parseFloat(row.querySelector('.total-input')?.value) || 0;
          var basePrice = factor !== 0 ? price / factor : price;
          if (itemId || qty > 0) {
            lines.push({
              item_id: itemId,
              unit_id: unitId || null,
              quantity: qty,
              unit_price: parseFloat(basePrice.toFixed(2)),
              conversion_factor: factor,
              total: total
            });
          }
        }
        if (!lines.length) return showToast('أضف بنداً واحداً على الأقل', 'error');

        var btn = container.querySelector('#inv-save');
        btn.disabled = true; btn.innerHTML = '<span class="loader-inline"></span> جاري الحفظ...';
        try {
          var payload = {
            type: type,
            customer_id: type === 'sale' && container.querySelector('#inv-entity').value !== 'cash' ? container.querySelector('#inv-entity').value : null,
            supplier_id: type === 'purchase' && container.querySelector('#inv-entity').value !== 'cash' ? container.querySelector('#inv-entity').value : null,
            date: container.querySelector('#inv-date').value,
            reference: container.querySelector('#inv-ref').value.trim(),
            notes: container.querySelector('#inv-notes').value.trim(),
            lines: lines,
            total: lines.reduce(function(s, l) { return s + l.total; }, 0),
            paid_amount: parseFloat(container.querySelector('#inv-paid').value) || 0
          };
          if (isEdit) {
            await apiCall('/invoices?id=' + invId, 'PUT', Object.assign({ id: invId }, payload));
          } else {
            await apiCall('/invoices', 'POST', payload);
          }
          modal.close();
          showToast(isEdit ? 'تم تعديل الفاتورة بنجاح' : 'تم حفظ الفاتورة بنجاح', 'success');
          loadInvoices();
        } catch (e) {
          showToast(e.message, 'error');
          btn.disabled = false; btn.innerHTML = ICONS.check + ' حفظ الفاتورة';
        }
      };

      modal.element.querySelector('#inv-cancel').onclick = function() { modal.close(); };
    } catch (e) {
      showToast('خطأ في فتح الفاتورة: ' + e.message, 'error');
    }
  }

  // ========== قائمة الفواتير ==========
  async function loadInvoices() {
    invoicesCache = await apiCall('/invoices', 'GET');
    var tc = document.getElementById('tab-content');
    tc.innerHTML =
      '<div class="card"><div class="card-header"><h3 class="card-title">الفواتير</h3></div>' +
      '<div class="filter-bar"><button class="filter-pill active" data-filter="all">الكل</button><button class="filter-pill" data-filter="sale">مبيعات</button><button class="filter-pill" data-filter="purchase">مشتريات</button></div></div>' +
      '<div id="inv-list"></div>';
    document.querySelectorAll('.filter-pill').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-pill').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        renderFilteredInvoices();
      });
    });
    renderFilteredInvoices();
  }

  function renderFilteredInvoices() {
    var filt = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
    var data = invoicesCache;
    if (filt !== 'all') data = data.filter(function(inv) { return inv.type === filt; });
    var container = document.getElementById('inv-list');
    if (!data.length) return container.innerHTML = '<div class="empty-state"><h3>لا توجد فواتير</h3></div>';

    var html = '';
    data.forEach(function(inv) {
      html +=
        '<div class="card card-hover">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
            '<span><span style="background:' + (inv.type === 'sale' ? 'var(--success-light)' : 'var(--warning-light)') + ';color:' + (inv.type === 'sale' ? 'var(--success)' : 'var(--warning)') + ';padding:2px 10px;border-radius:20px;font-size:12px;">' + (inv.type === 'sale' ? 'بيع' : 'شراء') + '</span> ' + (inv.reference || '') + '</span>' +
            '<span style="font-weight:900;">' + formatNumber(inv.total) + '</span>' +
          '</div>' +
          '<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">' + formatDate(inv.date) + ' · مدفوع: ' + formatNumber(inv.paid || 0) + ' · باقي: ' + formatNumber(inv.balance || 0) + '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button class="btn btn-secondary btn-sm view-inv-btn" data-id="' + inv.id + '">' + ICONS.file + ' عرض</button>' +
            '<button class="btn btn-primary btn-sm print-inv-btn" data-id="' + inv.id + '">' + ICONS.print + ' طباعة</button>' +
            '<button class="btn btn-warning btn-sm edit-inv-btn" data-id="' + inv.id + '">' + ICONS.edit + ' تعديل</button>' +
            '<button class="btn btn-danger btn-sm delete-inv-btn" data-id="' + inv.id + '">' + ICONS.trash + ' حذف</button>' +
          '</div>' +
        '</div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.view-inv-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var inv = invoicesCache.find(function(i) { return i.id == parseInt(b.dataset.id); });
        if (inv) showInvoiceDetail(inv);
      });
    });
    container.querySelectorAll('.print-inv-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        var inv = invoicesCache.find(function(i) { return i.id == parseInt(b.dataset.id); });
        if (inv) window.printInvoice(inv, { preview: true, format: 'thermal' });
      });
    });
    container.querySelectorAll('.edit-inv-btn').forEach(function(b) {
      b.addEventListener('click', async function() {
        var invId = parseInt(b.dataset.id);
        var inv = invoicesCache.find(function(i) { return i.id == invId; });
        if (inv) showInvoiceModal(inv.type, inv);
      });
    });
    container.querySelectorAll('.delete-inv-btn').forEach(function(b) {
      b.addEventListener('click', async function() {
        if (await confirmDialog('حذف الفاتورة؟')) {
          await apiCall('/invoices?id=' + b.dataset.id, 'DELETE');
          loadInvoices();
        }
      });
    });
  }

  function showInvoiceDetail(inv) {
    var lines = (inv.invoice_lines || []).map(function(l) {
      var item = itemsCache.find(function(i) { return i.id == l.item_id; });
      var unit = unitsCache.find(function(u) { return u.id == l.unit_id; }) || {};
      var displayQty = l.quantity + ' ' + (unit.name || '');
      var factor = l.conversion_factor || 1;
      var qtyHint = factor > 1 ? '<span style="color:var(--text-muted);font-size:12px;"> (' + (l.quantity * factor).toFixed(2) + ' ' + (item ? (unitsCache.find(function(u) { return u.id == item.base_unit_id; })?.name || 'قطعة') : '') + ')</span>' : '';
      return '<tr><td>' + (item?.name || '-') + '</td><td>' + displayQty + qtyHint + '</td><td>' + formatNumber(l.unit_price) + '</td><td>' + formatNumber(l.total) + '</td></tr>';
    }).join('');
    var modal = openModal({
      title: 'فاتورة ' + (inv.type === 'sale' ? 'بيع' : 'شراء') + ' ' + (inv.reference || ''),
      bodyHTML:
        '<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الكمية</th><th>السعر الأساسي</th><th>الإجمالي</th></tr></thead><tbody>' + lines + '</tbody></table></div>' +
        '<div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><strong>الإجمالي:</strong> ' + formatNumber(inv.total) + '</div><div><strong>المدفوع:</strong> ' + formatNumber(inv.paid || 0) + '</div><div><strong>المتبقي:</strong> ' + formatNumber(inv.balance || 0) + '</div></div>',
      footerHTML: '<button class="btn btn-secondary" id="det-close">إغلاق</button>'
    });
    modal.element.querySelector('#det-close').onclick = function() { modal.close(); };
  }

  window.printInvoice = function(invoice, options) {
    options = options || {};
    var preview = options.preview || false;
    var linesHTML = (invoice.invoice_lines || []).map(function(l) {
      var item = itemsCache.find(function(i) { return i.id == l.item_id; });
      var unit = unitsCache.find(function(u) { return u.id == l.unit_id; }) || {};
      var factor = l.conversion_factor || 1;
      var qtyDisplay = factor > 1
        ? l.quantity + ' ' + (unit.name || '') + ' (' + (l.quantity * factor).toFixed(2) + ' ' + (item ? (unitsCache.find(function(u) { return u.id == item.base_unit_id; })?.name || 'قطعة') : '') + ')'
        : l.quantity + ' ' + (unit.name || '');
      return '<div class="row"><span>' + (item?.name || '-') + '</span><span>' + qtyDisplay + ' x ' + formatNumber(l.unit_price) + '</span><span>' + formatNumber(l.total) + '</span></div>';
    }).join('');

    var thermalHTML =
      '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>@page{size:80mm auto;margin:0}body{width:80mm;font-size:12px;padding:4mm;font-family:sans-serif}.center{text-align:center}.bold{font-weight:900}.line{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between}.total{font-size:18px;color:#2563eb}</style></head><body>' +
      '<div class="center"><div class="bold">الراجحي للمحاسبة</div><div>فاتورة ' + (invoice.type === 'sale' ? 'بيع' : 'شراء') + '</div></div>' +
      '<div class="line"></div>' +
      '<div class="row"><span>التاريخ:</span><span>' + formatDate(invoice.date) + '</span></div>' +
      '<div class="row"><span>المرجع:</span><span>' + (invoice.reference || '-') + '</span></div>' +
      linesHTML +
      '<div class="line"></div>' +
      '<div class="row total"><span>الإجمالي</span><span>' + formatNumber(invoice.total) + '</span></div>' +
      '</body></html>';

    if (preview) {
      var modal = openModal({
        title: 'معاينة الطباعة',
        bodyHTML: '<iframe srcdoc="' + thermalHTML.replace(/"/g, '&quot;') + '" style="width:100%;height:400px;"></iframe>',
        footerHTML: '<button class="btn btn-primary" id="print-now">طباعة</button>'
      });
      modal.element.querySelector('#print-now').onclick = function() { modal.close(); window.print(); };
      return;
    }
    var w = window.open('', '_blank');
    w.document.write(thermalHTML);
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
  };

/* الراجحي للمحاسبة - Offline PWA v2.0 - الجزء 10 من 10 */
  // ========== الدفعات ==========
  async function loadPayments() {
    var payments = await apiCall('/payments', 'GET');
    var tc = document.getElementById('tab-content');
    tc.innerHTML = '<div class="card"><div class="card-header"><h3 class="card-title">الدفعات</h3><button class="btn btn-primary btn-sm" id="btn-add-pmt">' + ICONS.plus + ' إضافة</button></div></div>';
    for (var i = 0; i < payments.length; i++) {
      var p = payments[i];
      var isIn = !!p.customer_id;
      tc.innerHTML +=
        '<div class="card" style="border-right:3px solid ' + (isIn ? 'var(--success)' : 'var(--danger)') + ';">' +
          '<div style="font-weight:900;font-size:20px;color:' + (isIn ? 'var(--success)' : 'var(--danger)') + ';">' + (isIn ? '+' : '-') + ' ' + formatNumber(p.amount) + '</div>' +
          '<div style="font-size:13px;color:var(--text-muted);">' + formatDate(p.payment_date) + ' · ' + (p.notes || '') + '</div>' +
        '</div>';
    }
    var addBtn = document.getElementById('btn-add-pmt');
    if (addBtn) addBtn.addEventListener('click', showAddPaymentModal);
  }

  function showAddPaymentModal() {
    var body =
      '<div class="form-group"><select class="select" id="pmt-type"><option value="customer">مقبوضات</option><option value="supplier">مدفوعات</option></select></div>' +
      '<div class="form-group" id="pmt-cust-block"><select class="select" id="pmt-customer"><option value="">اختر</option>' + customersCache.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-group" id="pmt-supp-block" style="display:none"><select class="select" id="pmt-supplier"><option value="">اختر</option>' + suppliersCache.map(function(s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-group"><input class="input" id="pmt-amount" type="number" placeholder="المبلغ"></div>' +
      '<div class="form-group"><input class="input" id="pmt-date" type="date" value="' + new Date().toISOString().split('T')[0] + '"></div>' +
      '<div class="form-group"><textarea class="textarea" id="pmt-notes" placeholder="ملاحظات"></textarea></div>';
    var modal = openModal({
      title: 'تسجيل دفعة',
      bodyHTML: body,
      footerHTML: '<button class="btn btn-secondary" id="pmt-cancel">إلغاء</button><button class="btn btn-primary" id="pmt-save">' + ICONS.check + ' حفظ</button>'
    });
    modal.element.querySelector('#pmt-type').addEventListener('change', function() {
      document.getElementById('pmt-cust-block').style.display = this.value === 'customer' ? 'block' : 'none';
      document.getElementById('pmt-supp-block').style.display = this.value === 'supplier' ? 'block' : 'none';
    });
    modal.element.querySelector('#pmt-save').onclick = async function() {
      var type = modal.element.querySelector('#pmt-type').value;
      var amount = parseFloat(modal.element.querySelector('#pmt-amount').value);
      if (!amount) return showToast('المبلغ مطلوب', 'error');
      await apiCall('/payments', 'POST', {
        customer_id: type === 'customer' ? modal.element.querySelector('#pmt-customer').value || null : null,
        supplier_id: type === 'supplier' ? modal.element.querySelector('#pmt-supplier').value || null : null,
        amount: amount,
        payment_date: modal.element.querySelector('#pmt-date').value,
        notes: modal.element.querySelector('#pmt-notes').value.trim()
      });
      modal.close();
      showToast('تم الحفظ', 'success');
      loadPayments();
    };
    modal.element.querySelector('#pmt-cancel').onclick = function() { modal.close(); };
  }

  // ========== المصاريف ==========
  async function loadExpenses() {
    var expenses = await apiCall('/expenses', 'GET');
    var tc = document.getElementById('tab-content');
    tc.innerHTML = '<div class="card"><div class="card-header"><h3 class="card-title">المصاريف</h3><button class="btn btn-primary btn-sm" id="btn-add-exp">' + ICONS.plus + ' إضافة</button></div></div>';
    for (var i = 0; i < expenses.length; i++) {
      var ex = expenses[i];
      tc.innerHTML +=
        '<div class="card" style="border-right:3px solid var(--danger);">' +
          '<div style="font-weight:900;font-size:20px;color:var(--danger);">' + formatNumber(ex.amount) + '</div>' +
          '<div>' + formatDate(ex.expense_date) + ' · ' + (ex.description || '') + '</div>' +
        '</div>';
    }
    var addBtn = document.getElementById('btn-add-exp');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        showFormModal({
          title: 'إضافة مصروف',
          fields: [
            { id: 'amount', label: 'المبلغ', type: 'number' },
            { id: 'expense_date', label: 'التاريخ', type: 'date' },
            { id: 'description', label: 'الوصف' }
          ],
          initialValues: { expense_date: new Date().toISOString().split('T')[0] },
          onSave: function(v) { return apiCall('/expenses', 'POST', v); },
          onSuccess: loadExpenses
        });
      });
    }
  }

  // ========== التقارير ==========
  function loadReports() {
    var tc = document.getElementById('tab-content');
    tc.innerHTML =
      '<div class="card"><h3 class="card-title">التقارير المالية</h3></div>' +
      '<div class="report-card" id="rpt-dash"><div class="report-icon">📊</div><div class="report-info"><h4>لوحة التحكم</h4></div></div>' +
      '<div class="report-card" id="rpt-trial"><div class="report-icon">📋</div><div class="report-info"><h4>ميزان المراجعة</h4></div></div>' +
      '<div class="report-card" id="rpt-income"><div class="report-icon">📈</div><div class="report-info"><h4>قائمة الدخل</h4></div></div>' +
      '<div class="report-card" id="rpt-balance"><div class="report-icon">⚖️</div><div class="report-info"><h4>الميزانية العمومية</h4></div></div>' +
      '<div class="report-card" id="rpt-cust"><div class="report-icon">👤</div><div class="report-info"><h4>كشف حساب عميل</h4></div></div>' +
      '<div class="report-card" id="rpt-supp"><div class="report-icon">🏭</div><div class="report-info"><h4>كشف حساب مورد</h4></div></div>';
    document.getElementById('rpt-dash').onclick = loadDashboard;
    document.getElementById('rpt-trial').onclick = loadTrialBalance;
    document.getElementById('rpt-income').onclick = loadIncomeStatement;
    document.getElementById('rpt-balance').onclick = loadBalanceSheet;
    document.getElementById('rpt-cust').onclick = loadCustomerStatementForm;
    document.getElementById('rpt-supp').onclick = loadSupplierStatementForm;
  }

  async function loadTrialBalance() {
    var invoices = await apiCall('/invoices', 'GET');
    var expenses = await apiCall('/expenses', 'GET');
    var totalSales = invoices.filter(function(i) { return i.type === 'sale'; }).reduce(function(s, i) { return s + i.total; }, 0);
    var totalPurchases = invoices.filter(function(i) { return i.type === 'purchase'; }).reduce(function(s, i) { return s + i.total; }, 0);
    var totalExpenses = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    document.getElementById('tab-content').innerHTML =
      '<div class="card">' +
        '<button class="btn btn-secondary btn-sm" id="back-from-trial" style="margin-bottom:12px;">🔙 رجوع</button>' +
        '<h3>ميزان المراجعة</h3>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr></thead><tbody>' +
          '<tr><td>المبيعات</td><td></td><td>' + formatNumber(totalSales) + '</td></tr>' +
          '<tr><td>المشتريات</td><td>' + formatNumber(totalPurchases) + '</td><td></td></tr>' +
          '<tr><td>المصاريف</td><td>' + formatNumber(totalExpenses) + '</td><td></td></tr>' +
        '</tbody></table></div>' +
      '</div>';
    document.getElementById('back-from-trial').addEventListener('click', function() { navigateTo('reports'); });
  }

  async function loadIncomeStatement() {
    var invoices = await apiCall('/invoices', 'GET');
    var expenses = await apiCall('/expenses', 'GET');
    var totalSales = invoices.filter(function(i) { return i.type === 'sale'; }).reduce(function(s, i) { return s + i.total; }, 0);
    var totalPurchases = invoices.filter(function(i) { return i.type === 'purchase'; }).reduce(function(s, i) { return s + i.total; }, 0);
    var totalExpenses = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    var net = totalSales - totalPurchases - totalExpenses;
    document.getElementById('tab-content').innerHTML =
      '<div class="card">' +
        '<button class="btn btn-secondary btn-sm" id="back-from-income" style="margin-bottom:12px;">🔙 رجوع</button>' +
        '<h3>قائمة الدخل</h3>' +
        '<p>الإيرادات: ' + formatNumber(totalSales) + '</p>' +
        '<p>تكلفة المبيعات: ' + formatNumber(totalPurchases) + '</p>' +
        '<p>المصاريف: ' + formatNumber(totalExpenses) + '</p>' +
        '<hr><h2 style="color:' + (net >= 0 ? 'var(--success)' : 'var(--danger)') + '">صافي الربح: ' + formatNumber(net) + '</h2>' +
      '</div>';
    document.getElementById('back-from-income').addEventListener('click', function() { navigateTo('reports'); });
  }

  async function loadBalanceSheet() {
    var customers = await apiCall('/customers', 'GET');
    var suppliers = await apiCall('/suppliers', 'GET');
    var custBalance = customers.reduce(function(s, c) { return s + (c.balance || 0); }, 0);
    var suppBalance = suppliers.reduce(function(s, s2) { return s + (s2.balance || 0); }, 0);
    document.getElementById('tab-content').innerHTML =
      '<div class="card">' +
        '<button class="btn btn-secondary btn-sm" id="back-from-balance" style="margin-bottom:12px;">🔙 رجوع</button>' +
        '<h3>الميزانية العمومية</h3>' +
        '<p>ذمم مدينة: ' + formatNumber(custBalance) + '</p>' +
        '<p>ذمم دائنة: ' + formatNumber(suppBalance) + '</p>' +
      '</div>';
    document.getElementById('back-from-balance').addEventListener('click', function() { navigateTo('reports'); });
  }

  async function loadCustomerStatementForm() {
    var customers = await apiCall('/customers', 'GET');
    var opts = customers.map(function(c) { return '<option value="' + c.id + '">' + c.name + '</option>'; }).join('');
    document.getElementById('tab-content').innerHTML =
      '<div class="card">' +
        '<button class="btn btn-secondary btn-sm" id="back-from-cust" style="margin-bottom:12px;">🔙 رجوع</button>' +
        '<h3>كشف حساب عميل</h3>' +
        '<select class="select" id="cust-sel">' + opts + '</select>' +
        '<button class="btn btn-primary" id="btn-show-cust">عرض</button>' +
        '<div id="stmt-result"></div>' +
      '</div>';
    document.getElementById('back-from-cust').addEventListener('click', function() { navigateTo('reports'); });
    document.getElementById('btn-show-cust').onclick = async function() {
      var id = document.getElementById('cust-sel').value;
      var invoices = await apiCall('/invoices', 'GET');
      var payments = await apiCall('/payments', 'GET');
      var custInvs = invoices.filter(function(i) { return i.customer_id == id; });
      var custPmts = payments.filter(function(p) { return p.customer_id == id; });
      var html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>';
      for (var j = 0; j < custInvs.length; j++) {
        var i = custInvs[j];
        html += '<tr><td>' + formatDate(i.date) + '</td><td>فاتورة ' + (i.reference || '') + '</td><td>' + formatNumber(i.total) + '</td></tr>';
      }
      for (var k = 0; k < custPmts.length; k++) {
        var p = custPmts[k];
        html += '<tr><td>' + formatDate(p.payment_date) + '</td><td>دفعة</td><td style="color:var(--success);">-' + formatNumber(p.amount) + '</td></tr>';
      }
      html += '</tbody></table></div>';
      document.getElementById('stmt-result').innerHTML = html;
    };
  }

  async function loadSupplierStatementForm() {
    var suppliers = await apiCall('/suppliers', 'GET');
    var opts = suppliers.map(function(s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join('');
    document.getElementById('tab-content').innerHTML =
      '<div class="card">' +
        '<button class="btn btn-secondary btn-sm" id="back-from-supp" style="margin-bottom:12px;">🔙 رجوع</button>' +
        '<h3>كشف حساب مورد</h3>' +
        '<select class="select" id="supp-sel">' + opts + '</select>' +
        '<button class="btn btn-primary" id="btn-show-supp">عرض</button>' +
        '<div id="stmt-result"></div>' +
      '</div>';
    document.getElementById('back-from-supp').addEventListener('click', function() { navigateTo('reports'); });
    document.getElementById('btn-show-supp').onclick = async function() {
      var id = document.getElementById('supp-sel').value;
      var invoices = await apiCall('/invoices', 'GET');
      var payments = await apiCall('/payments', 'GET');
      var suppInvs = invoices.filter(function(i) { return i.supplier_id == id; });
      var suppPmts = payments.filter(function(p) { return p.supplier_id == id; });
      var html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>';
      for (var j = 0; j < suppInvs.length; j++) {
        var i = suppInvs[j];
        html += '<tr><td>' + formatDate(i.date) + '</td><td>فاتورة ' + (i.reference || '') + '</td><td>' + formatNumber(i.total) + '</td></tr>';
      }
      for (var k = 0; k < suppPmts.length; k++) {
        var p = suppPmts[k];
        html += '<tr><td>' + formatDate(p.payment_date) + '</td><td>دفعة</td><td style="color:var(--danger);">-' + formatNumber(p.amount) + '</td></tr>';
      }
      html += '</tbody></table></div>';
      document.getElementById('stmt-result').innerHTML = html;
    };
  }

  // ========== لوحة التحكم (مع مخطط شهري) ==========
  async function loadDashboard() {
    var invoices = await apiCall('/invoices', 'GET');
    var totalSales = invoices.filter(function(i) { return i.type === 'sale'; }).reduce(function(s, i) { return s + i.total; }, 0);
    var totalPurchases = invoices.filter(function(i) { return i.type === 'purchase'; }).reduce(function(s, i) { return s + i.total; }, 0);
    var expenses = await apiCall('/expenses', 'GET');
    var totalExpenses = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    var net = totalSales - totalPurchases - totalExpenses;

    // تجهيز المخطط الشهري (اخر 6 أشهر)
    var monthly = {};
    var months = [];
    for (var m = 5; m >= 0; m--) {
      var d = new Date();
      d.setMonth(d.getMonth() - m);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      months.push(key);
      monthly[key] = { sales: 0, purchases: 0 };
    }
    invoices.forEach(function(inv) {
      if (!inv.date) return;
      var k = inv.date.substring(0, 7);
      if (monthly[k]) {
        if (inv.type === 'sale') monthly[k].sales += inv.total;
        else if (inv.type === 'purchase') monthly[k].purchases += inv.total;
      }
    });

    var tc = document.getElementById('tab-content');
    tc.innerHTML =
      '<div class="stats-grid">' +
        '<div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value ' + (net >= 0 ? 'positive' : 'negative') + '">' + formatNumber(net) + '</div></div>' +
        '<div class="stat-card cash"><div class="stat-label">المبيعات</div><div class="stat-value">' + formatNumber(totalSales) + '</div></div>' +
        '<div class="stat-card receivables"><div class="stat-label">المشتريات</div><div class="stat-value">' + formatNumber(totalPurchases) + '</div></div>' +
        '<div class="stat-card payables"><div class="stat-label">المصاريف</div><div class="stat-value">' + formatNumber(totalExpenses) + '</div></div>' +
      '</div>' +
      '<div class="chart-card">' +
        '<div class="chart-title">المبيعات والمشتريات الشهرية (آخر 6 أشهر)</div>' +
        '<canvas id="monthlyChart" style="max-height:250px;"></canvas>' +
      '</div>' +
      '<div class="card">' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
          '<button class="btn btn-primary" id="btn-export"><span style="display:flex;align-items:center;gap:6px;">📤 تصدير البيانات</span></button>' +
          '<button class="btn btn-secondary" id="btn-import"><span style="display:flex;align-items:center;gap:6px;">📥 استيراد البيانات</span></button>' +
        '</div>' +
      '</div>';

    // رسم المخطط
    var ctx = document.getElementById('monthlyChart')?.getContext('2d');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'المبيعات', data: months.map(function(m) { return monthly[m].sales; }), backgroundColor: '#10b981', borderRadius: 6 },
            { label: 'المشتريات', data: months.map(function(m) { return monthly[m].purchases; }), backgroundColor: '#f59e0b', borderRadius: 6 }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          },
          plugins: { legend: { labels: { font: { family: 'Tajawal' } } } }
        }
      });
    }

    document.getElementById('btn-export').onclick = showExportDialog;
    document.getElementById('btn-import').onclick = function() {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json';
      inp.onchange = function(e) { handleImport(e.target.files[0]); };
      inp.click();
    };
  }

  // ========== تصدير واستيراد البيانات ==========
  async function showExportDialog() {
    var tables = ['items', 'customers', 'suppliers', 'categories', 'units', 'invoices', 'invoiceLines', 'payments', 'expenses'];
    var names = { items: 'المواد', customers: 'العملاء', suppliers: 'الموردين', categories: 'التصنيفات', units: 'الوحدات', invoices: 'الفواتير', invoiceLines: 'بنود الفواتير', payments: 'الدفعات', expenses: 'المصاريف' };
    var statsPromises = tables.map(async function(t) {
      var data = await getTable(t).toArray();
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span>' + names[t] + '</span><span style="font-weight:700;">' + data.length + ' سجل</span></div>';
    });
    var statsArray = await Promise.all(statsPromises);
    var statsHTML = statsArray.join('');
    var supportsFilePicker = ('showSaveFilePicker' in window);
    var modal = openModal({
      title: 'تصدير البيانات',
      bodyHTML:
        '<p style="margin-bottom:12px;color:var(--text-secondary);">سيتم تصدير جميع بياناتك إلى ملف JSON.</p>' +
        '<div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">' +
          '<div style="font-weight:700;margin-bottom:8px;">محتوى التصدير</div>' + statsHTML +
        '</div>' +
        '<p style="font-size:13px;color:var(--text-muted);">' + (supportsFilePicker ? '💡 المتصفح يدعم اختيار مكان الحفظ.' : '⚠️ سيتم الحفظ في مجلد "التنزيلات" الافتراضي.') + '</p>',
      footerHTML: '<button class="btn btn-secondary" id="exp-cancel">إلغاء</button><button class="btn btn-primary" id="exp-confirm">📥 بدء التصدير</button>'
    });
    modal.element.querySelector('#exp-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#exp-confirm').onclick = async function() {
      modal.close();
      var data = {};
      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        data[t] = await getTable(t).toArray();
      }
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var fileName = 'alrajhi-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      if (supportsFilePicker) {
        try {
          var handle = await window.showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'ملف JSON', accept: { 'application/json': ['.json'] } }] });
          var writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          showToast('✅ تم حفظ الملف بنجاح: ' + fileName, 'success');
        } catch (err) {
          if (err.name !== 'AbortError') showToast('فشل التصدير: ' + err.message, 'error');
        }
      } else {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        showToast('✅ تم تنزيل "' + fileName + '" إلى مجلد التنزيلات', 'success');
      }
    };
  }

  async function handleImport(file) {
    if (!file) return;
    try {
      var text = await file.text();
      var data = JSON.parse(text);
      if (typeof data !== 'object' || Array.isArray(data)) throw new Error('تنسيق الملف غير صحيح');
      var priorityOrder = ['categories', 'units', 'customers', 'suppliers', 'items', 'invoices', 'invoiceLines', 'payments', 'expenses'];
      var sortedTables = Object.keys(data).sort(function(a, b) { return priorityOrder.indexOf(a) - priorityOrder.indexOf(b); });
      if (!sortedTables.length) throw new Error('الملف فارغ');
      var totalRecords = 0;
      var tableDetails = sortedTables.map(function(t) {
        var count = Array.isArray(data[t]) ? data[t].length : 0;
        totalRecords += count;
        return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span>' + t + '</span><span style="font-weight:700;">' + count + ' سجل</span></div>';
      }).join('');
      var modal = openModal({
        title: 'معاينة ملف الاستيراد',
        bodyHTML:
          '<p>تم العثور على <strong>' + sortedTables.length + ' جداول</strong> تحتوي على <strong>' + totalRecords + ' سجل</strong>.</p>' +
          '<div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">' + tableDetails + '</div>' +
          '<p style="color:var(--danger);">⚠️ تحذير: سيتم <strong>مسح جميع بياناتك الحالية</strong> واستبدالها بهذا الملف.</p>',
        footerHTML: '<button class="btn btn-secondary" id="imp-cancel">إلغاء</button><button class="btn btn-danger" id="imp-confirm">استيراد واستبدال</button>'
      });
      modal.element.querySelector('#imp-cancel').onclick = function() { modal.close(); };
      modal.element.querySelector('#imp-confirm').onclick = async function() {
        modal.close();
        var tableNames = sortedTables.filter(function(t) { return Array.isArray(data[t]); });
        try {
          await db.transaction('rw', tableNames, async function() {
            for (var i = 0; i < tableNames.length; i++) {
              var table = tableNames[i];
              var tableObj = getTable(table);
              await tableObj.clear();
              for (var j = 0; j < data[table].length; j++) {
                await tableObj.add(data[table][j]);
              }
            }
          });
          showToast('تم استيراد البيانات بنجاح', 'success');
        } catch (innerError) {
          showToast('فشل الاستيراد: ' + innerError.message, 'error');
          return;
        }
        var results = await Promise.all([
          apiCall('/items', 'GET'),
          apiCall('/customers', 'GET'),
          apiCall('/suppliers', 'GET'),
          apiCall('/invoices', 'GET'),
          apiCall('/definitions?type=category', 'GET'),
          apiCall('/definitions?type=unit', 'GET'),
          apiCall('/payments', 'GET').then(function(payments) {
            for (var k = 0; k < invoicesCache.length; k++) {
              var inv = invoicesCache[k];
              var pmts = payments.filter(function(p) { return p.invoice_id == inv.id; });
              inv.paid = pmts.reduce(function(s, p) { return s + p.amount; }, 0);
              inv.balance = inv.total - inv.paid;
            }
          })
        ]);
        itemsCache = results[0];
        customersCache = results[1];
        suppliersCache = results[2];
        invoicesCache = results[3];
        categoriesCache = results[4];
        unitsCache = results[5];
        loadDashboard();
      };
    } catch (e) {
      showToast('فشل استيراد الملف: ' + e.message, 'error');
    }
  }

  // ========== التنقل ==========
  var tabsConfig = {
    dashboard: { title: 'لوحة التحكم', icon: ICONS.home },
    items: { title: 'المواد', icon: ICONS.box },
    'sale-invoice': { title: 'فاتورة بيع', icon: ICONS.cart },
    'purchase-invoice': { title: 'فاتورة شراء', icon: ICONS.download },
    customers: { title: 'العملاء', icon: ICONS.users },
    suppliers: { title: 'الموردين', icon: ICONS.factory },
    categories: { title: 'التصنيفات', icon: ICONS.tag },
    units: { title: 'الوحدات', icon: ICONS.scale },
    payments: { title: 'الدفعات', icon: ICONS.wallet },
    expenses: { title: 'المصاريف', icon: ICONS.dollar },
    invoices: { title: 'الفواتير', icon: ICONS.fileText },
    reports: { title: 'التقارير', icon: ICONS.chart }
  };

  function setActiveTab(tab) {
    document.querySelectorAll('.nav-item, .bottom-item').forEach(function(el) {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.getElementById('page-title').textContent = tabsConfig[tab]?.title || '';
  }

  function navigateTo(tab) {
    setActiveTab(tab);
    document.getElementById('more-menu').style.display = 'none';
    document.getElementById('sidebar').classList.remove('open');
    var content = document.getElementById('tab-content');
    content.style.opacity = '0';
    setTimeout(function() {
      switch (tab) {
        case 'dashboard': loadDashboard(); break;
        case 'items': loadItems(); break;
        case 'sale-invoice': showInvoiceModal('sale'); break;
        case 'purchase-invoice': showInvoiceModal('purchase'); break;
        case 'customers': loadGenericSection('/customers', 'customers'); break;
        case 'suppliers': loadGenericSection('/suppliers', 'suppliers'); break;
        case 'categories': loadGenericSection('/definitions?type=category', 'categories'); break;
        case 'units': loadUnitsSection(); break;
        case 'payments': loadPayments(); break;
        case 'expenses': loadExpenses(); break;
        case 'invoices': loadInvoices(); break;
        case 'reports': loadReports(); break;
        case 'more':
          document.getElementById('more-menu').style.display = 'flex';
          lockScroll();
          break;
      }
      content.style.transition = 'opacity 0.3s';
      content.style.opacity = '1';
    }, 50);
  }

  function initNavigation() {
    var sidebarNav = document.getElementById('sidebar-nav');
    var sheetGrid = document.getElementById('sheet-grid');
    var mainTabs = ['dashboard', 'items', 'sale-invoice', 'customers', 'suppliers', 'categories', 'units', 'payments', 'expenses', 'invoices', 'reports'];
    var moreTabs = ['purchase-invoice', 'customers', 'suppliers', 'categories', 'units', 'payments', 'expenses', 'reports'];

    mainTabs.forEach(function(key) {
      var cfg = tabsConfig[key];
      var btn = document.createElement('button');
      btn.className = 'nav-item' + (key === 'dashboard' ? ' active' : '');
      btn.dataset.tab = key;
      btn.innerHTML = cfg.icon + ' <span>' + cfg.title + '</span>';
      btn.onclick = function() { navigateTo(key); };
      sidebarNav.appendChild(btn);
    });

    moreTabs.forEach(function(key) {
      var cfg = tabsConfig[key];
      var btn = document.createElement('button');
      btn.className = 'sheet-item';
      btn.dataset.tab = key;
      btn.innerHTML = cfg.icon + ' <span>' + cfg.title + '</span>';
      btn.onclick = function() { unlockScroll(); navigateTo(key); };
      sheetGrid.appendChild(btn);
    });
  }

  // ========== ربط الأحداث ==========
  document.getElementById('menu-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.querySelector('.sheet-backdrop').addEventListener('click', function() {
    document.getElementById('more-menu').style.display = 'none';
    unlockScroll();
  });
  document.querySelectorAll('.bottom-item').forEach(function(b) {
    b.addEventListener('click', function() {
      var tab = b.dataset.tab;
      if (tab === 'more') {
        document.getElementById('more-menu').style.display = 'flex';
        lockScroll();
      } else if (tab) {
        navigateTo(tab);
      }
    });
  });
  document.getElementById('btn-help').addEventListener('click', function() {
    openModal({ title: 'مساعدة', bodyHTML: '<p>نظام الراجحي للمحاسبة - نسخة Offline PWA v2.0</p>' });
  });

  // ========== بدء التطبيق ==========
  async function initApp() {
    try {
      var results = await Promise.all([
        apiCall('/items', 'GET'),
        apiCall('/customers', 'GET'),
        apiCall('/suppliers', 'GET'),
        apiCall('/invoices', 'GET'),
        apiCall('/definitions?type=category', 'GET'),
        apiCall('/definitions?type=unit', 'GET')
      ]);
      itemsCache = results[0];
      customersCache = results[1];
      suppliersCache = results[2];
      invoicesCache = results[3];
      categoriesCache = results[4];
      unitsCache = results[5];
      initNavigation();
      loadDashboard();
      document.getElementById('loading-screen').classList.add('hidden');
    } catch (e) {
      showToast(e.message, 'error');
      document.getElementById('loading-screen').classList.add('hidden');
    }
  }

  initApp();
})();
