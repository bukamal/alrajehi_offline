(function() {
  'use strict';

  // ===== سجل تتبع آمن (يتعامل مع غياب body) =====
  var debugMessages = [];
  function debugLog(msg) {
    // إذا body غير موجود، خزن الرسالة لاحقاً
    if (!document.body) {
      debugMessages.push(msg);
      return;
    }
    // إنشاء الحاوية إن لم تكن موجودة
    var el = document.getElementById('debug-log');
    if (!el) {
      el = document.createElement('div');
      el.id = 'debug-log';
      el.style.cssText = 'position:fixed; bottom:80px; left:10px; right:10px; max-height:120px; overflow-y:auto; background:rgba(0,0,0,0); color:transparent; font-size:0; padding:0; z-index:-1;';
      document.body.appendChild(el);
      // إظهار الرسائل المخزنة
      if (debugMessages.length) {
        el.textContent = debugMessages.join('\n') + '\n';
        debugMessages = [];
        el.scrollTop = el.scrollHeight;
      }
    }
    el.textContent += msg + '\n';
    el.scrollTop = el.scrollHeight;
    // إظهار أيضاً كـ toast لرؤية فورية
    if (window.showToast) showToast(msg, 'info');
  }

  // ===== Global Error Handling =====
  window.addEventListener('error', function(e) {
    debugLog('[Error] ' + e.message + ' at line ' + e.lineno);
  });
  
  window.addEventListener('unhandledrejection', function(e) {
    debugLog('[Promise] ' + e.reason);
  });

  // ===== Input Sanitization =====
  function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>&"']/g, function(c) {
      return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  
  function validateNumber(value, min, max) {
    var num = parseFloat(value);
    if (isNaN(num)) return 0;
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    return num;
  }

  // ===== Database Setup with Fallback =====
  var db;
  var useMemoryFallback = false;
  var memoryDB = {};

  if (typeof Dexie !== 'undefined' && Dexie) {
    try {
      db = new Dexie('AlrajhiDB');
      db.version(1).stores({
        items: '++id, name, category_id, item_type, purchase_price, selling_price, quantity, base_unit_id',
        customers: '++id, name, phone, address, balance',
        suppliers: '++id, name, phone, address, balance',
        categories: '++id, name',
        units: '++id, name, abbreviation',
        invoices: '++id, type, customer_id, supplier_id, date, reference, notes, total, status',
        invoiceLines: '++id, invoice_id, item_id, unit_id, quantity, unit_price, total, description',
        payments: '++id, invoice_id, customer_id, supplier_id, amount, payment_date, notes',
        expenses: '++id, amount, expense_date, description'
      });
      debugLog('[DB] Dexie ready');
    } catch(e) {
      useMemoryFallback = true;
      debugLog('[DB] Dexie error: ' + e.message);
    }
  } else {
    useMemoryFallback = true;
    debugLog('[DB] Dexie not found');
  }

  function getMemoryTable(name) {
    if (!memoryDB[name]) memoryDB[name] = [];
    return {
      toArray: function() { return Promise.resolve(memoryDB[name]); },
      add: function(item) {
        item.id = Date.now() + Math.random();
        memoryDB[name].push(item);
        return Promise.resolve(item.id);
      },
      update: function(id, changes) {
        var idx = memoryDB[name].findIndex(function(x) { return x.id == id; });
        if (idx >= 0) Object.assign(memoryDB[name][idx], changes);
        return Promise.resolve();
      },
      delete: function(id) {
        memoryDB[name] = memoryDB[name].filter(function(x) { return x.id != id; });
        return Promise.resolve();
      },
      clear: function() { memoryDB[name] = []; return Promise.resolve(); },
      bulkAdd: function(items) { memoryDB[name].push.apply(memoryDB[name], items); return Promise.resolve(); },
      where: function(query) {
        return {
          toArray: function() {
            var key = Object.keys(query)[0];
            return Promise.resolve(memoryDB[name].filter(function(x) { return x[key] == query[key]; }));
          },
          delete: function() {
            var key = Object.keys(query)[0];
            memoryDB[name] = memoryDB[name].filter(function(x) { return x[key] != query[key]; });
            return Promise.resolve();
          }
        };
      }
    };
  }

  function getTable(name) {
    if (useMemoryFallback || !db) return getMemoryTable(name);
    return db[name];
  }

  function formatNumber(num) { 
    return Number(num||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); 
  }

  function formatDate(dateStr) { 
    return dateStr ? new Date(dateStr).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}) : '-'; 
  }

  window.showToast = function(message, type) {
    var container = document.getElementById('toast-container'); 
    if (!container) return;
    var toast = document.createElement('div'); 
    toast.className = 'toast ' + (type || 'info'); 
    toast.textContent = message;
    container.appendChild(toast); 
    setTimeout(function() { toast.remove(); }, 3000);
  };

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

async function apiCall(endpoint, method, body) {
  method = method || 'GET'; 
  body = body || {};
  var parts = endpoint.split('?')[0].split('/').filter(Boolean);
  var tableName = parts[0];
  var queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
  var params = new URLSearchParams(queryString);
  var id = parts[1] ? parseInt(parts[1]) : (params.get('id') ? parseInt(params.get('id')) : null);
  
  try {
    if (method === 'GET') {
      switch (tableName) {
        case 'items': return await getTable('items').toArray();
        case 'customers': return await getTable('customers').toArray();
        case 'suppliers': return await getTable('suppliers').toArray();
        case 'definitions':
          if (params.get('type') === 'category') return await getTable('categories').toArray();
          if (params.get('type') === 'unit') return await getTable('units').toArray();
          return [];
        case 'invoices': {
          var invs = await getTable('invoices').toArray();
          for (var i = 0; i < invs.length; i++) {
            var inv = invs[i];
            var pmts = await getTable('payments').where({invoice_id: inv.id}).toArray();
            inv.paid = pmts.reduce(function(s, p) { return s + (p.amount || 0); }, 0);
            inv.balance = (inv.total || 0) - inv.paid;
          }
          return invs;
        }
        case 'payments': return await getTable('payments').toArray();
        case 'expenses': return await getTable('expenses').toArray();
        default: return [];
      }
    } else if (method === 'POST') {
      var payload = JSON.parse(JSON.stringify(body));
      switch (tableName) {
        case 'items': { 
          var cleanPayload = {
            name: sanitizeInput(payload.name),
            purchase_price: validateNumber(payload.purchase_price),
            selling_price: validateNumber(payload.selling_price),
            quantity: validateNumber(payload.quantity),
            category_id: payload.category_id || null,
            item_type: payload.item_type || 'product',
            base_unit_id: payload.base_unit_id || null
          };
          var newId = await getTable('items').add(cleanPayload); 
          return { id: newId, ...cleanPayload }; 
        }
        case 'customers': { 
          var newId = await getTable('customers').add({...payload, balance: validateNumber(payload.balance)}); 
          return { id: newId, ...payload }; 
        }
        case 'suppliers': { 
          var newId = await getTable('suppliers').add({...payload, balance: 0}); 
          return { id: newId, ...payload }; 
        }
        case 'definitions': {
          var type = params.get('type') || body.type;
          if (type === 'category') { 
            var newId = await getTable('categories').add({name: sanitizeInput(payload.name)}); 
            return { id: newId, name: payload.name }; 
          }
          if (type === 'unit') { 
            var newId = await getTable('units').add({name: sanitizeInput(payload.name), abbreviation: payload.abbreviation}); 
            return { id: newId, name: payload.name, abbreviation: payload.abbreviation }; 
          }
          break;
        }
        case 'invoices': {
          var lines = payload.lines; 
          delete payload.lines;
          var paid_amount = validateNumber(payload.paid_amount); 
          delete payload.paid_amount;
          var invId = await getTable('invoices').add(payload);
          if (lines && lines.length) {
            for (var l of lines) {
              await getTable('invoiceLines').add({...l, invoice_id: invId});
            }
          }
          if (paid_amount > 0) {
            await getTable('payments').add({
              invoice_id: invId, 
              customer_id: payload.customer_id || null, 
              supplier_id: payload.supplier_id || null, 
              amount: paid_amount, 
              payment_date: payload.date, 
              notes: 'دفعة تلقائية'
            });
          }
          return { id: invId, ...payload };
        }
        case 'payments': { 
          var newId = await getTable('payments').add(payload); 
          return { id: newId, ...payload }; 
        }
        case 'expenses': { 
          var newId = await getTable('expenses').add(payload); 
          return { id: newId, ...payload }; 
        }
      }
    } else if (method === 'PUT') {
      var upd = JSON.parse(JSON.stringify(body)); 
      if (!id) id = body.id;
      switch (tableName) {
        case 'items': 
          if (upd.name) upd.name = sanitizeInput(upd.name);
          if (upd.purchase_price) upd.purchase_price = validateNumber(upd.purchase_price);
          if (upd.selling_price) upd.selling_price = validateNumber(upd.selling_price);
          if (upd.quantity) upd.quantity = validateNumber(upd.quantity);
          await getTable('items').update(id, upd); 
          break;
        case 'customers': await getTable('customers').update(id, upd); break;
        case 'suppliers': await getTable('suppliers').update(id, upd); break;
        case 'definitions': {
          if ((params.get('type') || body.type) === 'category') {
            if (upd.name) upd.name = sanitizeInput(upd.name);
            await getTable('categories').update(id, {name: upd.name});
          } else {
            await getTable('units').update(id, {name: sanitizeInput(upd.name), abbreviation: upd.abbreviation});
          }
          break;
        }
      }
      return { id: id, ...upd };
    } else if (method === 'DELETE') {
      if (!id) id = body.id || parseInt(params.get('id'));
      switch (tableName) {
        case 'items': await getTable('items').delete(id); break;
        case 'customers': await getTable('customers').delete(id); break;
        case 'suppliers': await getTable('suppliers').delete(id); break;
        case 'definitions':
          if ((params.get('type') || body.type) === 'category') await getTable('categories').delete(id);
          else await getTable('units').delete(id);
          break;
        case 'invoices': 
          await getTable('invoices').delete(id); 
          await getTable('invoiceLines').where({invoice_id: id}).delete(); 
          await getTable('payments').where({invoice_id: id}).delete(); 
          break;
        case 'payments': await getTable('payments').delete(id); break;
        case 'expenses': await getTable('expenses').delete(id); break;
      }
      return { success: true };
    }
  } catch(e) {
    console.error('[API Error]', e);
    showToast('خطأ في قاعدة البيانات: ' + e.message, 'error');
    throw e;
  }
  throw new Error('Method not allowed');
}

var activeModal = null;
function openModal(opt) {
  var portal = document.getElementById('modal-portal'); 
  if (!portal) return {};
  if (activeModal) activeModal.close();
  var overlay = document.createElement('div'); 
  overlay.className = 'modal-overlay';
  overlay.innerHTML = '<div class="modal-box"><div class="modal-header"><h3 class="modal-title">' + (opt.title || '') + '</h3><button class="modal-close">&times;</button></div><div class="modal-body">' + (opt.bodyHTML || '') + '</div>' + (opt.footerHTML ? '<div class="modal-footer">' + opt.footerHTML + '</div>' : '') + '</div>';
  portal.appendChild(overlay); 
  lockScroll(); 
  activeModal = overlay;
  function close() { 
    overlay.remove(); 
    activeModal = null; 
    unlockScroll(); 
    if (opt.onClose) opt.onClose(); 
  }
  overlay.querySelector('.modal-close').onclick = close;
  overlay.addEventListener('click', function(e) { 
    if (e.target === overlay) close(); 
  });
  return { close: close, element: overlay };
}

function confirmDialog(msg) {
  return new Promise(function(resolve) {
    var modal = openModal({
      title: 'تأكيد العملية',
      bodyHTML: '<p style="font-size:15px;line-height:1.7;">' + sanitizeInput(msg) + '</p>',
      footerHTML: '<button class="btn btn-secondary" id="cf-cancel">إلغاء</button><button class="btn btn-danger" id="cf-ok">تأكيد</button>',
      onClose: function() { resolve(false); }
    });
    modal.element.querySelector('#cf-cancel').onclick = function() { modal.close(); resolve(false); };
    modal.element.querySelector('#cf-ok').onclick = function() { modal.close(); resolve(true); };
  });
}

var ICONS = {
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
};

function initNavigation() {
  var nav = document.getElementById('sidebar-nav'); 
  if (!nav) return;
  var tabs = [
    { id: 'dashboard', name: 'الرئيسية' },
    { id: 'items', name: 'المواد' },
    { id: 'sale-invoice', name: 'فاتورة مبيعات' },
    { id: 'purchase-invoice', name: 'فاتورة مشتريات' },
    { id: 'customers', name: 'العملاء' },
    { id: 'suppliers', name: 'الموردين' },
    { id: 'categories', name: 'التصنيفات' },
    { id: 'units', name: 'وحدات القياس' },
    { id: 'payments', name: 'الدفعات' },
    { id: 'expenses', name: 'المصاريف' },
    { id: 'invoices', name: 'الفواتير' },
    { id: 'reports', name: 'التقارير' }
  ];
  tabs.forEach(function(tab) {
    var btn = document.createElement('button');
    btn.className = 'nav-item' + (tab.id === 'dashboard' ? ' active' : '');
    btn.dataset.tab = tab.id; 
    btn.textContent = tab.name;
    btn.onclick = function() {
      showToast('🔘 القائمة الجانبية: ' + tab.name);
      navigateTo(tab.id);
    };
    nav.appendChild(btn);
  });
}

// ===== Populate More Menu (المزيد) =====
function initMoreMenu() {
  var grid = document.getElementById('sheet-grid');
  if (!grid) {
    debugLog('[More] sheet-grid not found');
    return;
  }
  var items = [
    { id: 'customers', name: 'العملاء' },
    { id: 'suppliers', name: 'الموردين' },
    { id: 'categories', name: 'التصنيفات' },
    { id: 'units', name: 'وحدات القياس' },
    { id: 'payments', name: 'الدفعات' },
    { id: 'expenses', name: 'المصاريف' },
    { id: 'reports', name: 'التقارير' },
    { id: 'purchase-invoice', name: 'فاتورة مشتريات' }
  ];
  grid.innerHTML = ''; // نظف المحتوى السابق
  items.forEach(function(item) {
    var btn = document.createElement('button');
    btn.className = 'sheet-item';
    btn.dataset.tab = item.id;
    btn.textContent = item.name;
    btn.addEventListener('click', function() {
      var mm = document.getElementById('more-menu');
      if (mm) {
        mm.style.display = 'none';
        unlockScroll();
      }
      navigateTo(item.id);
    });
    grid.appendChild(btn);
  });
  debugLog('[More] Menu populated with ' + items.length + ' items');
}

function setActiveTab(tabName) {
  document.querySelectorAll('.nav-item,.bottom-item').forEach(function(el) { 
    el.classList.toggle('active', el.dataset.tab === tabName); 
  });
}

function navigateTo(tab) {
  showToast('🔘 Navigating to: ' + tab);
  setActiveTab(tab);
  var moreMenu = document.getElementById('more-menu'); 
  if (moreMenu) moreMenu.style.display = 'none';
  var sidebar = document.getElementById('sidebar'); 
  if (sidebar) sidebar.classList.remove('open');
  var content = document.getElementById('tab-content'); 
  if (!content) return;
  content.style.opacity = '0';
  setTimeout(function() {
    try {
      switch (tab) {
        case 'dashboard': loadDashboard(); break;
        case 'items': loadItems(); break;
        case 'sale-invoice': showInvoiceModal('sale'); break;
        case 'purchase-invoice': showInvoiceModal('purchase'); break;
        case 'customers': loadGenericSection('/customers','customers'); break;
        case 'suppliers': loadGenericSection('/suppliers','suppliers'); break;
        case 'categories': loadGenericSection('/definitions?type=category','categories'); break;
        case 'units': loadUnitsSection(); break;
        case 'payments': loadPayments(); break;
        case 'expenses': loadExpenses(); break;
        case 'invoices': loadInvoices(); break;
        case 'reports': loadReports(); break;
      }
    } catch (e) {
      showToast('خطأ في التحميل', 'error');
    }
    content.style.transition = 'all 0.3s'; 
    content.style.opacity = '1';
  }, 50);
}

async function loadDashboard() {
  try {
    var invoices = await apiCall('/invoices','GET');
    var totalSales = invoices.filter(function(i) { return i.type === 'sale'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var totalPurchases = invoices.filter(function(i) { return i.type === 'purchase'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var expenses = await apiCall('/expenses','GET');
    var totalExpenses = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    var netProfit = totalSales - totalPurchases - totalExpenses;
    var tc = document.getElementById('tab-content'); 
    if (!tc) return;
    tc.innerHTML = '<div class="stats-grid"><div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value ' + (netProfit >= 0 ? 'positive' : 'negative') + '">' + formatNumber(netProfit) + '</div></div><div class="stat-card cash"><div class="stat-label">المبيعات</div><div class="stat-value">' + formatNumber(totalSales) + '</div></div><div class="stat-card receivables"><div class="stat-label">المشتريات</div><div class="stat-value">' + formatNumber(totalPurchases) + '</div></div><div class="stat-card payables"><div class="stat-label">المصاريف</div><div class="stat-value">' + formatNumber(totalExpenses) + '</div></div></div><div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:8px;"><button class="btn btn-sm btn-primary" id="btn-export">تصدير</button><button class="btn btn-sm btn-secondary" id="btn-import">استيراد</button></div></div>';
    
    var exportBtn = document.getElementById('btn-export');
    var importBtn = document.getElementById('btn-import');
    
    if (exportBtn) exportBtn.onclick = async function() {
      try {
        var tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
        var data = {}; 
        for (var t of tables) data[t] = await getTable(t).toArray();
        var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        var a = document.createElement('a'); 
        a.href = URL.createObjectURL(blob);
        a.download = 'alrajhi-backup-' + new Date().toISOString().slice(0,10) + '.json'; 
        a.click();
        showToast('تم التصدير بنجاح', 'success');
      } catch(e) {
        showToast('خطأ في التصدير: ' + e.message, 'error');
      }
    };
    
    if (importBtn) importBtn.onclick = function() {
      var inp = document.createElement('input'); 
      inp.type = 'file'; 
      inp.accept = '.json';
      inp.onchange = async function(e) {
        try {
          var file = e.target.files[0]; 
          if (!file) return;
          var text = await file.text(); 
          var data = JSON.parse(text);
          if (await confirmDialog('سيتم استبدال جميع البيانات. هل أنت متأكد؟')) {
            var tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
            for (var t of tables) { 
              await getTable(t).clear(); 
              if (data[t]) await getTable(t).bulkAdd(data[t]); 
            }
            showToast('تم الاستيراد بنجاح', 'success'); 
            loadDashboard();
          }
        } catch(e) {
          showToast('خطأ في الاستيراد: ' + e.message, 'error');
        }
      };
      inp.click();
    };
  } catch(e) {
    showToast('خطأ في تحميل لوحة التحكم', 'error');
  }
}

var itemsCache = [], customersCache = [], suppliersCache = [], invoicesCache = [], categoriesCache = [], unitsCache = [];

async function loadItems() {
  try {
    itemsCache = await apiCall('/items','GET');
    var tc = document.getElementById('tab-content'); 
    if (!tc) return;
    tc.innerHTML = '<div class="card"><div class="card-header"><h3 class="card-title">المواد</h3><button class="btn btn-primary btn-sm" id="btn-add-item">' + ICONS.plus + ' إضافة</button></div><input class="input" id="items-search" placeholder="بحث..."></div><div id="items-list"></div>';
    var addBtn = document.getElementById('btn-add-item'); 
    if (addBtn) addBtn.addEventListener('click', showAddItemModal);
    var search = document.getElementById('items-search'); 
    if (search) search.addEventListener('input', function(e) { renderFilteredItems(e.target.value); });
    renderFilteredItems();
  } catch(e) {
    showToast('خطأ في تحميل المواد', 'error');
  }
}

function renderFilteredItems(filter) {
  var q = sanitizeInput((filter || '').trim().toLowerCase());
  var filtered = itemsCache.filter(function(i) { return (i.name || '').toLowerCase().includes(q); });
  var container = document.getElementById('items-list'); 
  if (!container) return;
  if (!filtered.length) { container.innerHTML = '<div class="empty-state"><h3>لا توجد مواد</h3></div>'; return; }
  var html = '<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الكمية</th><th>سعر الشراء</th><th>سعر البيع</th><th></th></tr></thead><tbody>';
  filtered.forEach(function(item) {
    html += '<tr><td style="font-weight:700;">' + sanitizeInput(item.name) + '</td><td>' + (item.quantity || 0) + '</td><td>' + formatNumber(item.purchase_price) + '</td><td>' + formatNumber(item.selling_price) + '</td><td><button class="btn btn-secondary btn-sm edit-item-btn" data-id="' + item.id + '">' + ICONS.edit + '</button> <button class="btn btn-danger btn-sm delete-item-btn" data-id="' + item.id + '">' + ICONS.trash + '</button></td></tr>';
  });
  html += '</tbody></table></div>'; 
  container.innerHTML = html;
  container.querySelectorAll('.edit-item-btn').forEach(function(b) { 
    b.addEventListener('click', function(e) { showEditItemModal(e.target.closest('button').dataset.id); }); 
  });
  container.querySelectorAll('.delete-item-btn').forEach(function(b) { 
    b.addEventListener('click', async function(e) { 
      if (await confirmDialog('حذف المادة؟')) { 
        try {
          await apiCall('/items?id=' + e.target.closest('button').dataset.id, 'DELETE'); 
          showToast('تم الحذف','success'); 
          loadItems(); 
        } catch(err) { showToast('خطأ في الحذف', 'error'); }
      } 
    }); 
  });
}

function showAddItemModal() {
  var body = '<div class="form-group"><label class="form-label">اسم المادة</label><input class="input" id="fm-name"></div><div class="form-group"><label class="form-label">سعر الشراء</label><input class="input" id="fm-purchase" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">سعر البيع</label><input class="input" id="fm-selling" type="number" step="0.01" value="0"></div><div class="form-group"><label class="form-label">الكمية</label><input class="input" id="fm-qty" type="number" step="any" value="0"></div>';
  var modal = openModal({
    title: 'إضافة مادة جديدة',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">' + ICONS.plus + ' حفظ</button>'
  });
  modal.element.querySelector('#fm-cancel').onclick = function() { modal.close(); };
  modal.element.querySelector('#fm-save').onclick = async function() {
    try {
      var name = sanitizeInput(modal.element.querySelector('#fm-name').value.trim());
      if (!name) return showToast('اسم المادة مطلوب', 'warning');
      await apiCall('/items', 'POST', {
        name: name,
        purchase_price: validateNumber(modal.element.querySelector('#fm-purchase').value),
        selling_price: validateNumber(modal.element.querySelector('#fm-selling').value),
        quantity: validateNumber(modal.element.querySelector('#fm-qty').value)
      });
      modal.close(); 
      showToast('تم الحفظ بنجاح', 'success'); 
      loadItems();
    } catch(e) { showToast('خطأ في الحفظ: ' + e.message, 'error'); }
  };
}

function showEditItemModal(id) {
  var item = itemsCache.find(function(i) { return i.id == id; }); 
  if (!item) return;
  var body = '<div class="form-group"><label class="form-label">اسم المادة</label><input class="input" id="fm-name" value="' + sanitizeInput(item.name || '') + '"></div><div class="form-group"><label class="form-label">سعر الشراء</label><input class="input" id="fm-purchase" type="number" step="0.01" value="' + (item.purchase_price || 0) + '"></div><div class="form-group"><label class="form-label">سعر البيع</label><input class="input" id="fm-selling" type="number" step="0.01" value="' + (item.selling_price || 0) + '"></div><div class="form-group"><label class="form-label">الكمية</label><input class="input" id="fm-qty" type="number" step="any" value="' + (item.quantity || 0) + '"></div>';
  var modal = openModal({
    title: 'تعديل المادة',
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">' + ICONS.edit + ' حفظ</button>'
  });
  modal.element.querySelector('#fm-cancel').onclick = function() { modal.close(); };
  modal.element.querySelector('#fm-save').onclick = async function() {
    try {
      await apiCall('/items', 'PUT', {
        id: id,
        name: sanitizeInput(modal.element.querySelector('#fm-name').value.trim()),
        purchase_price: validateNumber(modal.element.querySelector('#fm-purchase').value),
        selling_price: validateNumber(modal.element.querySelector('#fm-selling').value),
        quantity: validateNumber(modal.element.querySelector('#fm-qty').value)
      });
      modal.close(); 
      showToast('تم التعديل بنجاح', 'success'); 
      loadItems();
    } catch(e) { showToast('خطأ في التعديل: ' + e.message, 'error'); }
  };
}

async function loadGenericSection(endpoint, cacheKey) {
  try {
    var data = await apiCall(endpoint, 'GET');
    if (cacheKey === 'customers') customersCache = data;
    else if (cacheKey === 'suppliers') suppliersCache = data;
    else if (cacheKey === 'categories') categoriesCache = data;
    var titles = { customers: 'العملاء', suppliers: 'الموردين', categories: 'التصنيفات' };
    var title = titles[cacheKey] || cacheKey;
    var tc = document.getElementById('tab-content'); 
    if (!tc) return;
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">' + title + '</h3><button class="btn btn-primary btn-sm add-btn" data-type="' + cacheKey + '">' + ICONS.plus + ' إضافة</button></div></div>';
    if (!data.length) html += '<div class="empty-state"><h3>لا يوجد ' + title + '</h3></div>';
    else data.forEach(function(item) {
      html += '<div class="card card-hover" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;"><span style="font-weight:800;">' + sanitizeInput(item.name) + '</span><div style="display:flex;gap:6px;"><button class="btn btn-secondary btn-sm edit-btn" data-id="' + item.id + '" data-type="' + cacheKey + '">' + ICONS.edit + '</button> <button class="btn btn-danger btn-sm delete-btn" data-id="' + item.id + '" data-type="' + cacheKey + '">' + ICONS.trash + '</button></div></div>';
    });
    tc.innerHTML = html;
  } catch(e) { showToast('خطأ في تحميل البيانات', 'error'); }
}

async function loadUnitsSection() {
  try {
    unitsCache = await apiCall('/definitions?type=unit','GET');
    var tc = document.getElementById('tab-content'); 
    if (!tc) return;
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">وحدات القياس</h3><button class="btn btn-primary btn-sm" id="btn-add-unit">' + ICONS.plus + ' إضافة</button></div></div>';
    if (!unitsCache.length) html += '<div class="empty-state"><h3>لا توجد وحدات</h3></div>';
    else {
      html += '<div class="table-wrap"><table class="table"><thead><tr><th>الوحدة</th><th>الاختصار</th><th></th></tr></thead><tbody>';
      unitsCache.forEach(function(u) {
        html += '<tr><td>' + sanitizeInput(u.name) + '</td><td>' + (sanitizeInput(u.abbreviation) || '-') + '</td><td><button class="btn btn-secondary btn-sm edit-unit-btn" data-id="' + u.id + '">' + ICONS.edit + '</button> <button class="btn btn-danger btn-sm delete-unit-btn" data-id="' + u.id + '">' + ICONS.trash + '</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    tc.innerHTML = html;
    var addBtn = document.getElementById('btn-add-unit'); 
    if (addBtn) addBtn.addEventListener('click', showAddUnitModal);
    document.querySelectorAll('.edit-unit-btn').forEach(function(b) {
      b.addEventListener('click', function(e) {
        var u = unitsCache.find(function(x) { return x.id == e.target.closest('button').dataset.id; });
        if (u) showFormModal('تعديل وحدة', [{id:'name',label:'الاسم'},{id:'abbreviation',label:'الاختصار'}], {name:u.name,abbreviation:u.abbreviation||''}, function(v) { return apiCall('/definitions?type=unit','PUT',{type:'unit',id:u.id,...v}); }, function() { loadUnitsSection(); });
      });
    });
    document.querySelectorAll('.delete-unit-btn').forEach(function(b) {
      b.addEventListener('click', async function(e) {
        if (await confirmDialog('حذف الوحدة؟')) { 
          try {
            await apiCall('/definitions?type=unit&id=' + e.target.closest('button').dataset.id,'DELETE'); 
            showToast('تم الحذف','success'); 
            loadUnitsSection(); 
          } catch(err) { showToast('خطأ في الحذف', 'error'); }
        }
      });
    });
  } catch(e) { showToast('خطأ في تحميل الوحدات', 'error'); }
}

function showAddUnitModal() {
  showFormModal('إضافة وحدة قياس', [{id:'name',label:'اسم الوحدة'},{id:'abbreviation',label:'الاختصار'}], {}, function(v) { return apiCall('/definitions?type=unit','POST',{type:'unit',...v}); }, function() { loadUnitsSection(); });
}

function showFormModal(title, fields, initialValues, onSave, onSuccess) {
  var formId = 'frm-' + Date.now();
  var body = '';
  fields.forEach(function(f) {
    var val = initialValues[f.id] !== undefined ? sanitizeInput(initialValues[f.id]) : '';
    body += '<div class="form-group"><label class="form-label">' + f.label + '</label><input class="input" id="' + formId + '-' + f.id + '" type="' + (f.type || 'text') + '" value="' + val + '"></div>';
  });
  var modal = openModal({
    title: title,
    bodyHTML: body,
    footerHTML: '<button class="btn btn-secondary" id="' + formId + '-cancel">إلغاء</button><button class="btn btn-primary" id="' + formId + '-save">' + ICONS.plus + ' حفظ</button>'
  });
  modal.element.querySelector('#' + formId + '-cancel').onclick = function() { modal.close(); };
  modal.element.querySelector('#' + formId + '-save').onclick = async function() {
    try {
      var values = {};
      fields.forEach(function(f) {
        var el = modal.element.querySelector('#' + formId + '-' + f.id);
        values[f.id] = el ? sanitizeInput(el.value.trim()) : '';
      });
      await onSave(values);
      modal.close(); 
      showToast('تم الحفظ','success');
      if (onSuccess) onSuccess();
    } catch(e) { showToast('خطأ في الحفظ: ' + e.message, 'error'); }
  };
}

  // ===== Invoice Modal =====
  async function showInvoiceModal(type) {
    try {
      customersCache = await apiCall('/customers','GET');
      suppliersCache = await apiCall('/suppliers','GET');
      itemsCache = await apiCall('/items','GET');
      var entOpts = type === 'sale' ? '<option value="cash">عميل نقدي</option>' + customersCache.map(function(c) { return '<option value="' + c.id + '">' + sanitizeInput(c.name) + '</option>'; }).join('') : '<option value="cash">مورد نقدي</option>' + suppliersCache.map(function(s) { return '<option value="' + s.id + '">' + sanitizeInput(s.name) + '</option>'; }).join('');
      var body = '<input type="hidden" id="inv-type" value="' + type + '"><div class="invoice-lines" id="inv-lines"><div class="line-row"><div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>' + itemsCache.map(function(i) { return '<option value="' + i.id + '">' + sanitizeInput(i.name) + '</option>'; }).join('') + '</select></div><div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div><div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div><div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div></div></div><button class="btn btn-secondary btn-sm" id="btn-add-line" style="width:auto;margin-bottom:16px;">' + ICONS.plus + ' إضافة بند</button><div class="form-group"><label class="form-label">' + (type==='sale'?'العميل':'المورد') + '</label><select class="select" id="inv-entity">' + entOpts + '</select></div><div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="inv-date" value="' + new Date().toISOString().split('T')[0] + '"></div><div class="form-group"><label class="form-label">المرجع</label><input type="text" class="input" id="inv-ref"></div><div style="background:var(--bg);border-radius:12px;padding:16px;display:flex;justify-content:space-between;"><span>الإجمالي:</span><span id="inv-grand-total" style="font-size:22px;font-weight:900;color:var(--primary);">0.00</span></div>';
      var modal = openModal({ title: 'فاتورة ' + (type==='sale'?'مبيعات':'مشتريات'), bodyHTML: body, footerHTML: '<button class="btn btn-secondary" id="inv-cancel">إلغاء</button><button class="btn btn-primary" id="inv-save">' + ICONS.plus + ' حفظ الفاتورة</button>' });
      var container = modal.element;
      function updateGrandTotal() { 
        var t = 0; 
        container.querySelectorAll('.total-input').forEach(function(inp) { t += parseFloat(inp.value) || 0; }); 
        var gt = container.querySelector('#inv-grand-total'); 
        if (gt) gt.textContent = formatNumber(t); 
      }
      function calc(row) { 
        var q = parseFloat(row.querySelector('.qty-input')?.value) || 0, p = parseFloat(row.querySelector('.price-input')?.value) || 0, tot = row.querySelector('.total-input'); 
        if (tot) { tot.value = (q * p).toFixed(2); updateGrandTotal(); } 
      }
      container.querySelectorAll('.line-row').forEach(function(row) {
        var sel = row.querySelector('.item-select'), pr = row.querySelector('.price-input');
        sel.addEventListener('change', function() { 
          var it = itemsCache.find(function(i) { return i.id == sel.value; }); 
          if (it) { pr.value = type === 'sale' ? (it.selling_price || 0) : (it.purchase_price || 0); calc(row); } 
        });
        row.querySelector('.qty-input')?.addEventListener('input', function() { calc(row); });
        row.querySelector('.price-input')?.addEventListener('input', function() { calc(row); });
      });
      container.querySelector('#btn-add-line').addEventListener('click', function() {
        var nl = document.createElement('div'); 
        nl.className = 'line-row';
        nl.innerHTML = '<div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>' + itemsCache.map(function(i) { return '<option value="' + i.id + '">' + sanitizeInput(i.name) + '</option>'; }).join('') + '</select></div><div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div><div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div><div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div><button class="line-remove">' + ICONS.trash + '</button>';
        container.querySelector('#inv-lines').appendChild(nl);
        var sel = nl.querySelector('.item-select'), pr = nl.querySelector('.price-input');
        sel.addEventListener('change', function() { 
          var it = itemsCache.find(function(i) { return i.id == sel.value; }); 
          if (it) { pr.value = type === 'sale' ? (it.selling_price || 0) : (it.purchase_price || 0); calc(nl); } 
        });
        nl.querySelector('.qty-input').addEventListener('input', function() { calc(nl); });
        nl.querySelector('.price-input').addEventListener('input', function() { calc(nl); });
        nl.querySelector('.line-remove').addEventListener('click', function() { nl.remove(); updateGrandTotal(); });
      });
      container.querySelector('#inv-cancel').onclick = function() { modal.close(); };
      container.querySelector('#inv-save').onclick = async function() {
        try {
          var lines = []; 
          container.querySelectorAll('.line-row').forEach(function(row) { 
            var id = row.querySelector('.item-select')?.value || null, q = parseFloat(row.querySelector('.qty-input')?.value) || 0, p = parseFloat(row.querySelector('.price-input')?.value) || 0, t = parseFloat(row.querySelector('.total-input')?.value) || 0; 
            if (id || q > 0) lines.push({ item_id: id, quantity: q, unit_price: p, total: t }); 
          });
          if (!lines.length) return showToast('أضف بنداً واحداً على الأقل', 'error');
          var entity = container.querySelector('#inv-entity').value;
          var btn = container.querySelector('#inv-save'); 
          btn.disabled = true; 
          btn.innerHTML = '⏳ جاري الحفظ...';
          await apiCall('/invoices','POST', { 
            type: type, 
            customer_id: type==='sale' && entity!=='cash' ? entity : null, 
            supplier_id: type==='purchase' && entity!=='cash' ? entity : null, 
            date: container.querySelector('#inv-date').value, 
            reference: sanitizeInput(container.querySelector('#inv-ref').value.trim()), 
            lines: lines, 
            total: lines.reduce(function(s,l){return s+l.total;},0), 
            paid_amount: 0 
          });
          modal.close(); 
          showToast('تم حفظ الفاتورة بنجاح','success'); 
          loadInvoices();
        } catch (e) { 
          showToast(e.message,'error'); 
          var btn = container.querySelector('#inv-save');
          btn.disabled = false; 
          btn.innerHTML = ICONS.plus + ' حفظ الفاتورة'; 
        }
      };
    } catch(e) {
      showToast('خطأ في فتح الفاتورة', 'error');
    }
  }
  
  // ===== Invoices =====
  async function loadInvoices() {
    try {
      invoicesCache = await apiCall('/invoices','GET');
      var tc = document.getElementById('tab-content'); 
      if (!tc) return;
      tc.innerHTML = '<div class="card"><div class="card-header"><h3 class="card-title">الفواتير</h3></div><div class="filter-bar"><button class="filter-pill active" data-filter="all">الكل</button><button class="filter-pill" data-filter="sale">مبيعات</button><button class="filter-pill" data-filter="purchase">مشتريات</button></div></div><div id="inv-list"></div>';
      document.querySelectorAll('.filter-pill').forEach(function(tab) { 
        tab.addEventListener('click', function() { 
          document.querySelectorAll('.filter-pill').forEach(function(t){t.classList.remove('active');}); 
          tab.classList.add('active'); 
          renderFilteredInvoices(); 
        }); 
      });
      renderFilteredInvoices();
    } catch(e) {
      showToast('خطأ في تحميل الفواتير', 'error');
    }
  }
  
  function renderFilteredInvoices() {
    var filt = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
    var data = invoicesCache;
    if (filt !== 'all') data = data.filter(function(inv) { return inv.type === filt; });
    var container = document.getElementById('inv-list'); 
    if (!container) return;
    if (!data.length) { container.innerHTML = '<div class="empty-state"><h3>لا توجد فواتير</h3></div>'; return; }
    var html = '';
    data.forEach(function(inv) {
      html += '<div class="card card-hover"><div style="display:flex;justify-content:space-between;"><span><span style="background:' + (inv.type==='sale'?'var(--success-light)':'var(--warning-light)') + ';color:' + (inv.type==='sale'?'var(--success)':'var(--warning)') + ';padding:2px 10px;border-radius:20px;font-size:12px;">' + (inv.type==='sale'?'بيع':'شراء') + '</span> ' + sanitizeInput(inv.reference||'') + '</span><span style="font-weight:900;">' + formatNumber(inv.total) + '</span></div><div style="margin-top:8px;font-size:13px;color:var(--text-muted);">' + formatDate(inv.date) + ' · مدفوع: ' + formatNumber(inv.paid||0) + ' · باقي: ' + formatNumber(inv.balance||0) + '</div></div>';
    });
    container.innerHTML = html;
  }
  
  // ===== Payments =====
  async function loadPayments() {
    try {
      var payments = await apiCall('/payments','GET');
      var tc = document.getElementById('tab-content'); 
      if (!tc) return;
      var html = '<div class="card"><div class="card-header"><h3 class="card-title">الدفعات</h3><button class="btn btn-primary btn-sm" id="btn-add-pmt">' + ICONS.plus + ' إضافة</button></div></div>';
      payments.forEach(function(p) {
        var isIn = !!p.customer_id;
        html += '<div class="card" style="border-right:3px solid ' + (isIn?'var(--success)':'var(--danger)') + ';margin-bottom:12px;"><div style="font-weight:900;font-size:20px;color:' + (isIn?'var(--success)':'var(--danger)') + ';">' + (isIn?'+':'-') + ' ' + formatNumber(p.amount) + '</div><div style="font-size:13px;color:var(--text-muted);">' + formatDate(p.payment_date) + ' · ' + sanitizeInput(p.notes||'') + '</div></div>';
      });
      tc.innerHTML = html;
      var addBtn = document.getElementById('btn-add-pmt'); 
      if (addBtn) addBtn.addEventListener('click', showAddPaymentModal);
    } catch(e) { showToast('خطأ في تحميل الدفعات', 'error'); }
  }
  
  function showAddPaymentModal() {
    var body = '<div class="form-group"><label class="form-label">النوع</label><select class="select" id="pmt-type"><option value="customer">مقبوضات</option><option value="supplier">مدفوعات</option></select></div><div class="form-group" id="pmt-cust-block"><label class="form-label">العميل</label><select class="select" id="pmt-customer"><option value="">اختر</option>' + customersCache.map(function(c){ return '<option value="'+c.id+'">'+sanitizeInput(c.name)+' ('+formatNumber(c.balance)+')</option>'; }).join('') + '</select></div><div class="form-group" id="pmt-supp-block" style="display:none"><label class="form-label">المورد</label><select class="select" id="pmt-supplier"><option value="">اختر</option>' + suppliersCache.map(function(s){ return '<option value="'+s.id+'">'+sanitizeInput(s.name)+' ('+formatNumber(s.balance)+')</option>'; }).join('') + '</select></div><div class="form-group"><label class="form-label">المبلغ</label><input type="number" step="0.01" class="input" id="pmt-amount"></div><div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="pmt-date" value="'+new Date().toISOString().split('T')[0]+'"></div><div class="form-group"><label class="form-label">ملاحظات</label><textarea class="textarea" id="pmt-notes"></textarea></div>';
    var modal = openModal({ title: 'تسجيل دفعة', bodyHTML: body, footerHTML: '<button class="btn btn-secondary" id="pmt-cancel">إلغاء</button><button class="btn btn-primary" id="pmt-save">'+ICONS.plus+' حفظ</button>' });
    modal.element.querySelector('#pmt-type').addEventListener('change', function() { 
      document.getElementById('pmt-cust-block').style.display = this.value==='customer'?'block':'none'; 
      document.getElementById('pmt-supp-block').style.display = this.value==='supplier'?'block':'none'; 
    });
    modal.element.querySelector('#pmt-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#pmt-save').onclick = async function() {
      try {
        var type = modal.element.querySelector('#pmt-type').value;
        var amount = validateNumber(modal.element.querySelector('#pmt-amount').value);
        if (!amount || amount <= 0) return showToast('المبلغ مطلوب','error');
        await apiCall('/payments','POST', { 
          customer_id: type==='customer' ? (modal.element.querySelector('#pmt-customer').value||null) : null, 
          supplier_id: type==='supplier' ? (modal.element.querySelector('#pmt-supplier').value||null) : null, 
          amount: amount, 
          payment_date: modal.element.querySelector('#pmt-date').value, 
          notes: sanitizeInput(modal.element.querySelector('#pmt-notes').value.trim()) 
        });
        modal.close(); 
        showToast('تم الحفظ','success'); 
        loadPayments();
      } catch(e) { showToast('خطأ في الحفظ: ' + e.message, 'error'); }
    };
  }
  
  // ===== Expenses =====
  async function loadExpenses() {
    try {
      var expenses = await apiCall('/expenses','GET');
      var tc = document.getElementById('tab-content'); 
      if (!tc) return;
      var html = '<div class="card"><div class="card-header"><h3 class="card-title">المصاريف</h3><button class="btn btn-primary btn-sm" id="btn-add-exp">' + ICONS.plus + ' إضافة</button></div></div>';
      expenses.forEach(function(ex) {
        html += '<div class="card" style="border-right:3px solid var(--danger);margin-bottom:12px;"><div style="font-weight:900;font-size:20px;color:var(--danger);">' + formatNumber(ex.amount) + '</div><div style="font-size:13px;color:var(--text-muted);">' + formatDate(ex.expense_date) + ' · ' + sanitizeInput(ex.description||'') + '</div></div>';
      });
      tc.innerHTML = html;
      var addBtn = document.getElementById('btn-add-exp'); 
      if (addBtn) addBtn.addEventListener('click', function() { 
        showFormModal('إضافة مصروف', 
          [{id:'amount',label:'المبلغ',type:'number'},{id:'expense_date',label:'التاريخ',type:'date'},{id:'description',label:'الوصف'}], 
          {expense_date: new Date().toISOString().split('T')[0]}, 
          function(v) { return apiCall('/expenses','POST',{amount:validateNumber(v.amount),expense_date:v.expense_date,description:sanitizeInput(v.description)}); }, 
          function() { loadExpenses(); }
        ); 
      });
    } catch(e) { showToast('خطأ في تحميل المصاريف', 'error'); }
  }
  
  // ===== Reports =====
  function loadReports() {
    var tc = document.getElementById('tab-content'); 
    if (!tc) return;
    tc.innerHTML = '<div class="card"><h3 class="card-title">التقارير المالية</h3></div><div class="report-card" id="report-summary"><div class="report-icon">📊</div><div class="report-info"><h4>ملخص الحسابات</h4><p>لوحة التحكم</p></div></div>';
    var rpt = document.getElementById('report-summary'); 
    if (rpt) rpt.addEventListener('click', loadDashboard);
  }
  
  // ===== Event Listeners (with debugLog tracking) =====
  function initEventListeners() {
    debugLog('[Events] بدء ربط الأحداث...');

    var menuToggle = document.getElementById('menu-toggle'); 
    if (menuToggle) {
      menuToggle.addEventListener('click', function() { 
        var sb = document.getElementById('sidebar'); 
        if (sb) sb.classList.toggle('open'); 
      });
      debugLog('[Events] menu-toggle bound');
    } else {
      debugLog('[Events] menu-toggle NOT FOUND');
    }

    var sheetBackdrop = document.querySelector('.sheet-backdrop'); 
    if (sheetBackdrop) {
      sheetBackdrop.addEventListener('click', function() { 
        var mm = document.getElementById('more-menu'); 
        if (mm) { mm.style.display = 'none'; unlockScroll(); } 
      });
      debugLog('[Events] sheet-backdrop bound');
    } else {
      debugLog('[Events] sheet-backdrop NOT FOUND');
    }

    var bottomItems = document.querySelectorAll('.bottom-item');
    debugLog('[Events] Found ' + bottomItems.length + ' bottom items');
    bottomItems.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tab = btn.dataset.tab;
        debugLog('[Events] Bottom nav clicked: ' + tab);
        if (tab === 'more') { 
          var mm = document.getElementById('more-menu'); 
          if (mm) { mm.style.display = 'flex'; lockScroll(); } 
        }
        else if (tab) navigateTo(tab);
      });
    });

    var helpBtn = document.getElementById('btn-help'); 
    if (helpBtn) {
      helpBtn.addEventListener('click', function() { 
        openModal({ title: 'مساعدة', bodyHTML: '<p>نظام الراجحي للمحاسبة - نسخة Offline</p>' }); 
      });
      debugLog('[Events] help button bound');
    }

    debugLog('[Events] المستمعات جاهزة');
  }

  // ===== Global Click Handler (احتياطي شامل) =====
  document.addEventListener('click', async function(e) {
    // معالجة أي عنصر يحمل data-tab (سواءً زر التنقل السفلي أو غير ذلك)
    var target = e.target.closest('[data-tab]');
    if (target) {
      var tab = target.dataset.tab;
      if (tab === 'more') {
        // فتح قائمة "المزيد"
        var mm = document.getElementById('more-menu'); 
        if (mm) { mm.style.display = 'flex'; lockScroll(); }
        return;
      } else if (tab) {
        showToast('🔄 تنقل احتياطي: ' + tab);
        navigateTo(tab);
        return;
      }
    }

    // باقي الأزرار (add, edit, delete)
    var t = e.target.closest('button'); 
    if (!t) return;
    if (t.classList.contains('add-btn')) {
      var type = t.dataset.type;
      var titles = { customers:'عميل', suppliers:'مورد', categories:'تصنيف' };
      var endpoints = { customers:'/customers', suppliers:'/suppliers', categories:'/definitions?type=category' };
      showFormModal('إضافة ' + titles[type], [{id:'name',label:'الاسم'}], {}, async function(v) { 
        return apiCall(endpoints[type],'POST', type==='categories' ? {type:'category', name:sanitizeInput(v.name)} : {name:sanitizeInput(v.name)}); 
      }, function() { loadGenericSection(endpoints[type], type); });
    } else if (t.classList.contains('edit-btn')) {
      var type = t.dataset.type;
      var caches = { customers:customersCache, suppliers:suppliersCache, categories:categoriesCache };
      var item = caches[type]?.find(function(x) { return x.id == t.dataset.id; });
      if (!item) return;
      var endpoints = { customers:'/customers', suppliers:'/suppliers', categories:'/definitions?type=category' };
      showFormModal('تعديل', [{id:'name',label:'الاسم'}], {name:item.name||''}, async function(v) { 
        return apiCall(endpoints[type],'PUT', type==='categories' ? {type:'category',id:item.id,name:sanitizeInput(v.name)} : {id:item.id,name:sanitizeInput(v.name)}); 
      }, function() { loadGenericSection(endpoints[type], type); });
    } else if (t.classList.contains('delete-btn')) {
      var type = t.dataset.type;
      var caches = { customers:customersCache, suppliers:suppliersCache, categories:categoriesCache };
      var item = caches[type]?.find(function(x) { return x.id == t.dataset.id; });
      if (!item) return;
      if (await confirmDialog('حذف ' + item.name + '؟')) {
        try {
          var delUrls = { customers:'/customers?id='+item.id, suppliers:'/suppliers?id='+item.id, categories:'/definitions?type=category&id='+item.id };
          await apiCall(delUrls[type],'DELETE'); 
          showToast('تم الحذف','success');
          loadGenericSection(delUrls[type].split('?')[0], type);
        } catch(e) { showToast('خطأ في الحذف', 'error'); }
      }
    }
  });

  // ===== App Initialization (with debugLog) =====
  async function initApp() {
    debugLog('[App] Starting initialization...');
    try {
      initNavigation();
      initMoreMenu();   // <--- أضف هذا السطر هنا لملء قائمة "المزيد"
      debugLog('[App] Navigation & More Menu built');
      initEventListeners();
      debugLog('[App] Event listeners initialized');
      
      var results = await Promise.all([
        apiCall('/items','GET'), 
        apiCall('/customers','GET'), 
        apiCall('/suppliers','GET'),
        apiCall('/invoices','GET'), 
        apiCall('/definitions?type=category','GET'), 
        apiCall('/definitions?type=unit','GET')
      ]);
      itemsCache = results[0]; 
      customersCache = results[1]; 
      suppliersCache = results[2];
      invoicesCache = results[3]; 
      categoriesCache = results[4]; 
      unitsCache = results[5];
      debugLog('[App] Data loaded successfully');
    } catch (e) { 
      debugLog('[App] Init error: ' + e.message);
      if (window.showToast) showToast('خطأ في تهيئة التطبيق', 'error');
    }
    loadDashboard();
    var loader = document.getElementById('loading-screen'); 
    if (loader) {
      loader.classList.add('hidden');
      debugLog('[App] Loading screen hidden');
    }
    debugLog('[App] Ready - Dashboard loaded');
  }

  initApp().catch(function(err) {
    debugLog('[App] Fatal error: ' + err.message);
    var loader = document.getElementById('loading-screen'); 
    if (loader) loader.classList.add('hidden');
    if (window.showToast) showToast('خطأ: ' + err.message, 'error');
  });
})();
