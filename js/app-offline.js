(function() {
  'use strict';

  // ========== قاعدة البيانات ==========
  var db = new Dexie('AlrajhiDB');
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

  var localDB = {
    items: db.items, customers: db.customers, suppliers: db.suppliers,
    categories: db.categories, units: db.units, invoices: db.invoices,
    invoiceLines: db.invoiceLines, payments: db.payments, expenses: db.expenses
  };

  // ========== دوال مساعدة ==========
  function formatNumber(num) { return Number(num||0).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2}); }
  function formatDate(dateStr) { return dateStr ? new Date(dateStr).toLocaleDateString('ar-SA') : '-'; }
  window.showToast = function(msg, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  };

  // ========== API محلي ==========
  async function apiCall(endpoint, method, body) {
    method = method || 'GET'; body = body || {};
    var parts = endpoint.replace('/api/','').split('?')[0].split('/').filter(Boolean);
    var tableName = parts[0];
    var queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    var params = new URLSearchParams(queryString);
    var id = parts[1] ? parseInt(parts[1]) : (params.get('id') ? parseInt(params.get('id')) : null);

    if (method === 'GET') {
      switch (tableName) {
        case 'items': return await localDB.items.toArray();
        case 'customers': return await localDB.customers.toArray();
        case 'suppliers': return await localDB.suppliers.toArray();
        case 'definitions':
          if (params.get('type') === 'category') return await localDB.categories.toArray();
          if (params.get('type') === 'unit') return await localDB.units.toArray();
          return [];
        case 'invoices': {
          var invs = await localDB.invoices.toArray();
          for (var inv of invs) {
            var pmts = await localDB.payments.where({invoice_id: inv.id}).toArray();
            inv.paid = pmts.reduce(function(s,p){ return s + (p.amount||0); }, 0);
            inv.balance = (inv.total||0) - inv.paid;
          }
          return invs;
        }
        case 'payments': return await localDB.payments.toArray();
        case 'expenses': return await localDB.expenses.toArray();
        default: return [];
      }
    } else if (method === 'POST') {
      var payload = JSON.parse(JSON.stringify(body));
      switch (tableName) {
        case 'items': { var newId = await localDB.items.add(payload); return { id: newId, ...payload }; }
        case 'customers': { var newId = await localDB.customers.add({...payload, balance: payload.balance||0}); return { id: newId, ...payload }; }
        case 'suppliers': { var newId = await localDB.suppliers.add({...payload, balance:0}); return { id: newId, ...payload }; }
        case 'definitions': {
          var type = params.get('type') || body.type;
          if (type === 'category') { var newId = await localDB.categories.add({name: payload.name}); return { id: newId, name: payload.name }; }
          if (type === 'unit') { var newId = await localDB.units.add({name: payload.name, abbreviation: payload.abbreviation}); return { id: newId, name: payload.name, abbreviation: payload.abbreviation }; }
          break;
        }
        case 'invoices': {
          var lines = payload.lines; delete payload.lines;
          var paid_amount = payload.paid_amount || 0; delete payload.paid_amount;
          var invId = await localDB.invoices.add(payload);
          if (lines && lines.length) for (var l of lines) await localDB.invoiceLines.add({...l, invoice_id: invId});
          if (paid_amount > 0) await localDB.payments.add({invoice_id: invId, customer_id: payload.customer_id||null, supplier_id: payload.supplier_id||null, amount: paid_amount, payment_date: payload.date, notes:'دفعة تلقائية'});
          return { id: invId, ...payload };
        }
        case 'payments': { var newId = await localDB.payments.add(payload); return { id: newId, ...payload }; }
        case 'expenses': { var newId = await localDB.expenses.add(payload); return { id: newId, ...payload }; }
      }
    } else if (method === 'PUT') {
      var upd = JSON.parse(JSON.stringify(body));
      if (!id) id = body.id;
      switch (tableName) {
        case 'items': await localDB.items.update(id, upd); break;
        case 'customers': await localDB.customers.update(id, upd); break;
        case 'suppliers': await localDB.suppliers.update(id, upd); break;
        case 'definitions': {
          if ((params.get('type')||body.type) === 'category') await localDB.categories.update(id, {name: upd.name});
          else await localDB.units.update(id, {name: upd.name, abbreviation: upd.abbreviation});
          break;
        }
      }
      return { id: id, ...upd };
    } else if (method === 'DELETE') {
      if (!id) id = body.id || parseInt(params.get('id'));
      switch (tableName) {
        case 'items': await localDB.items.delete(id); break;
        case 'customers': await localDB.customers.delete(id); break;
        case 'suppliers': await localDB.suppliers.delete(id); break;
        case 'definitions':
          if ((params.get('type')||body.type) === 'category') await localDB.categories.delete(id);
          else await localDB.units.delete(id);
          break;
        case 'invoices': await localDB.invoices.delete(id); await localDB.invoiceLines.where({invoice_id: id}).delete(); await localDB.payments.where({invoice_id: id}).delete(); break;
        case 'payments': await localDB.payments.delete(id); break;
        case 'expenses': await localDB.expenses.delete(id); break;
      }
      return { success: true };
    }
    throw new Error('Method not allowed');
  }

  // ========== متغيرات عامة ==========
  var itemsCache = [], customersCache = [], suppliersCache = [], invoicesCache = [], categoriesCache = [], unitsCache = [];
  var activeModal = null, scrollLockPos = 0;

  function lockScroll() { scrollLockPos = window.scrollY; document.body.style.position = 'fixed'; document.body.style.top = -scrollLockPos + 'px'; document.body.style.width = '100%'; }
  function unlockScroll() { document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = ''; window.scrollTo(0, scrollLockPos); }

  function openModal(opt) {
    var portal = document.getElementById('modal-portal');
    if (activeModal) activeModal.close();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-header"><h3 class="modal-title">' + (opt.title||'') + '</h3><button class="modal-close">&times;</button></div><div class="modal-body">' + (opt.bodyHTML||'') + '</div>' + (opt.footerHTML ? '<div class="modal-footer">' + opt.footerHTML + '</div>' : '') + '</div>';
    portal.appendChild(overlay);
    lockScroll();
    activeModal = overlay;
    function close() { overlay.remove(); activeModal = null; unlockScroll(); if (opt.onClose) opt.onClose(); }
    overlay.querySelector('.modal-close').onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    return { close: close, element: overlay };
  }

  function confirmDialog(msg) {
    return new Promise(function(resolve) {
      var modal = openModal({
        title: 'تأكيد',
        bodyHTML: '<p style="font-size:15px;line-height:1.7;">' + msg + '</p>',
        footerHTML: '<button class="btn btn-secondary" id="cf-cancel">إلغاء</button><button class="btn btn-danger" id="cf-ok">تأكيد</button>',
        onClose: function() { resolve(false); }
      });
      modal.element.querySelector('#cf-cancel').onclick = function() { modal.close(); resolve(false); };
      modal.element.querySelector('#cf-ok').onclick = function() { modal.close(); resolve(true); };
    });
  }

  // ========== التنقل ==========
  function initNavigation() {
    var sidebarNav = document.getElementById('sidebar-nav');
    var tabs = ['dashboard','items','sale-invoice','purchase-invoice','customers','suppliers','categories','units','payments','expenses','invoices','reports'];
    tabs.forEach(function(tab) {
      var btn = document.createElement('button');
      btn.className = 'nav-item' + (tab === 'dashboard' ? ' active' : '');
      btn.dataset.tab = tab;
      btn.textContent = tab;
      btn.onclick = function() { navigateTo(tab); };
      sidebarNav.appendChild(btn);
    });
  }

  function setActiveTab(tabName) {
    document.querySelectorAll('.nav-item,.bottom-item').forEach(function(el) { el.classList.toggle('active', el.dataset.tab === tabName); });
}

  function navigateTo(tab) {
    setActiveTab(tab);
    document.getElementById('more-menu').style.display = 'none';
    document.getElementById('sidebar').classList.remove('open');
    var content = document.getElementById('tab-content');
    content.style.opacity = '0';
    setTimeout(function() {
      switch(tab) {
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
      content.style.transition = 'all 0.3s';
      content.style.opacity = '1';
    }, 50);
  }

  // ========== لوحة التحكم ==========
  async function loadDashboard() {
    var invoices = await apiCall('/invoices','GET');
    var totalSales = invoices.filter(function(i){ return i.type==='sale'; }).reduce(function(s,i){ return s + (i.total||0); }, 0);
    var totalPurchases = invoices.filter(function(i){ return i.type==='purchase'; }).reduce(function(s,i){ return s + (i.total||0); }, 0);
    var suppliers = await apiCall('/suppliers','GET');
    var customers = await apiCall('/customers','GET');
    var expenses = await apiCall('/expenses','GET');
    var totalExpenses = expenses.reduce(function(s,e){ return s + (e.amount||0); }, 0);
    var netProfit = totalSales - totalPurchases - totalExpenses;
    var receivables = customers.reduce(function(s,c){ return s + (c.balance||0); }, 0);
    var payables = suppliers.reduce(function(s,s2){ return s + (s2.balance||0); }, 0);

    document.getElementById('tab-content').innerHTML = 
      '<div class="stats-grid">' +
        '<div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value ' + (netProfit>=0?'positive':'negative') + '">' + formatNumber(netProfit) + '</div></div>' +
        '<div class="stat-card cash"><div class="stat-label">المبيعات</div><div class="stat-value">' + formatNumber(totalSales) + '</div></div>' +
        '<div class="stat-card receivables"><div class="stat-label">المشتريات</div><div class="stat-value">' + formatNumber(totalPurchases) + '</div></div>' +
        '<div class="stat-card payables"><div class="stat-label">المصاريف</div><div class="stat-value">' + formatNumber(totalExpenses) + '</div></div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm btn-primary" id="btn-export">📤 تصدير</button>' +
        '<button class="btn btn-sm btn-secondary" id="btn-import">📥 استيراد</button>' +
      '</div></div>';
    document.getElementById('btn-export').onclick = async function() {
      var tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
      var data = {};
      for (var t of tables) data[t] = await db.table(t).toArray();
      var blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'backup-' + new Date().toISOString().slice(0,10) + '.json'; a.click();
    };
    document.getElementById('btn-import').onclick = function() {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
      inp.onchange = async function(e) {
        var text = await e.target.files[0].text();
        var data = JSON.parse(text);
        if (await confirmDialog('سيتم استبدال جميع البيانات. هل أنت متأكد؟')) {
          var tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
          for (var t of tables) { await db.table(t).clear(); if (data[t]) await db.table(t).bulkAdd(data[t]); }
          showToast('تم الاستيراد بنجاح', 'success');
          loadDashboard();
        }
      };
      inp.click();
    };
  }

  // ========== المواد ==========
  async function loadItems() {
    itemsCache = await apiCall('/items','GET');
    document.getElementById('tab-content').innerHTML = 
      '<div class="card"><div class="card-header"><h3 class="card-title">المواد</h3><button class="btn btn-primary btn-sm" id="btn-add-item">✚ إضافة</button></div><input class="input" id="items-search" placeholder="بحث..."></div><div id="items-list"></div>';
    document.getElementById('btn-add-item').addEventListener('click', showAddItemModal);
    document.getElementById('items-search').addEventListener('input', function(e) { renderFilteredItems(e.target.value); });
    renderFilteredItems();
  }

  function renderFilteredItems(filter) {
    var q = (filter || '').trim().toLowerCase();
    var filtered = itemsCache.filter(function(i) { return (i.name||'').toLowerCase().includes(q); });
    var container = document.getElementById('items-list');
    if (!filtered.length) return container.innerHTML = '<div class="empty-state"><h3>لا توجد مواد</h3></div>';
    var html = '<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الكمية</th><th>سعر الشراء</th><th>سعر البيع</th><th></th></tr></thead><tbody>';
    filtered.forEach(function(item) {
      html += '<tr><td style="font-weight:700;">' + item.name + '</td><td>' + (item.quantity||0) + '</td><td>' + formatNumber(item.purchase_price) + '</td><td>' + formatNumber(item.selling_price) + '</td><td><button class="btn btn-secondary btn-sm edit-item" data-id="' + item.id + '">✎</button> <button class="btn btn-danger btn-sm delete-item" data-id="' + item.id + '">✕</button></td></tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
    container.querySelectorAll('.edit-item').forEach(function(b) { b.addEventListener('click', function(e) { showEditItemModal(e.target.closest('button').dataset.id); }); });
    container.querySelectorAll('.delete-item').forEach(function(b) { b.addEventListener('click', async function(e) { if (await confirmDialog('حذف المادة؟')) { await apiCall('/items?id=' + e.target.closest('button').dataset.id, 'DELETE'); loadItems(); } }); });
  }

  function showAddItemModal() {
    var body = '<div class="form-group"><label>اسم المادة</label><input class="input" id="fm-name"></div><div class="form-group"><label>سعر الشراء</label><input class="input" id="fm-purchase" type="number" step="0.01" value="0"></div><div class="form-group"><label>سعر البيع</label><input class="input" id="fm-selling" type="number" step="0.01" value="0"></div><div class="form-group"><label>الكمية</label><input class="input" id="fm-qty" type="number" step="any" value="0"></div>';
    var modal = openModal({ title: 'إضافة مادة', bodyHTML: body, footerHTML: '<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">حفظ</button>' });
    modal.element.querySelector('#fm-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#fm-save').onclick = async function() {
      var name = modal.element.querySelector('#fm-name').value.trim();
      if (!name) return showToast('اسم المادة مطلوب');
      await apiCall('/items','POST', { name: name, purchase_price: parseFloat(modal.element.querySelector('#fm-purchase').value)||0, selling_price: parseFloat(modal.element.querySelector('#fm-selling').value)||0, quantity: parseFloat(modal.element.querySelector('#fm-qty').value)||0 });
      modal.close(); showToast('تم الحفظ','success'); loadItems();
    };
  }

  function showEditItemModal(id) {
    var item = itemsCache.find(function(i) { return i.id == id; });
    if (!item) return;
    var body = '<div class="form-group"><label>اسم المادة</label><input class="input" id="fm-name" value="' + (item.name||'') + '"></div><div class="form-group"><label>سعر الشراء</label><input class="input" id="fm-purchase" type="number" step="0.01" value="' + (item.purchase_price||0) + '"></div><div class="form-group"><label>سعر البيع</label><input class="input" id="fm-selling" type="number" step="0.01" value="' + (item.selling_price||0) + '"></div><div class="form-group"><label>الكمية</label><input class="input" id="fm-qty" type="number" step="any" value="' + (item.quantity||0) + '"></div>';
    var modal = openModal({ title: 'تعديل مادة', bodyHTML: body, footerHTML: '<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">حفظ</button>' });
    modal.element.querySelector('#fm-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#fm-save').onclick = async function() {
      await apiCall('/items','PUT', { id: id, name: modal.element.querySelector('#fm-name').value.trim(), purchase_price: parseFloat(modal.element.querySelector('#fm-purchase').value)||0, selling_price: parseFloat(modal.element.querySelector('#fm-selling').value)||0, quantity: parseFloat(modal.element.querySelector('#fm-qty').value)||0 });
      modal.close(); showToast('تم التعديل','success'); loadItems();
    };
  }

  // ========== أقسام عامة (عملاء، موردين، تصنيفات) ==========
  async function loadGenericSection(endpoint, cacheKey) {
    var data = await apiCall(endpoint, 'GET');
    if (cacheKey === 'customers') customersCache = data;
    else if (cacheKey === 'suppliers') suppliersCache = data;
    else if (cacheKey === 'categories') categoriesCache = data;
    var titles = { customers: 'العملاء', suppliers: 'الموردين', categories: 'التصنيفات' };
    var title = titles[cacheKey] || cacheKey;
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">' + title + '</h3><button class="btn btn-primary btn-sm add-btn" data-type="' + cacheKey + '">✚ إضافة</button></div></div>';
    if (!data.length) html += '<div class="empty-state"><h3>لا يوجد ' + title + '</h3></div>';
    else {
      data.forEach(function(item) {
        html += '<div class="card card-hover" style="margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;"><span style="font-weight:800;">' + item.name + '</span><div><button class="btn btn-secondary btn-sm edit-btn" data-id="' + item.id + '" data-type="' + cacheKey + '">✎</button> <button class="btn btn-danger btn-sm delete-btn" data-id="' + item.id + '" data-type="' + cacheKey + '">✕</button></div></div>';
      });
    }
    document.getElementById('tab-content').innerHTML = html;
  }

  // ========== الوحدات ==========
  async function loadUnitsSection() {
    unitsCache = await apiCall('/definitions?type=unit','GET');
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">وحدات القياس</h3><button class="btn btn-primary btn-sm" id="btn-add-unit">✚ إضافة</button></div></div>';
    if (!unitsCache.length) html += '<div class="empty-state"><h3>لا توجد وحدات</h3></div>';
    else {
      html += '<div class="table-wrap"><table class="table"><thead><tr><th>الوحدة</th><th>الاختصار</th><th></th></tr></thead><tbody>';
      unitsCache.forEach(function(u) {
        html += '<tr><td>' + u.name + '</td><td>' + (u.abbreviation||'-') + '</td><td><button class="btn btn-secondary btn-sm edit-unit" data-id="' + u.id + '">✎</button> <button class="btn btn-danger btn-sm delete-unit" data-id="' + u.id + '">✕</button></td></tr>';
      });
      html += '</tbody></table></div>';
    }
    document.getElementById('tab-content').innerHTML = html;
    document.getElementById('btn-add-unit').addEventListener('click', showAddUnitModal);
    document.querySelectorAll('.edit-unit').forEach(function(b) { b.addEventListener('click', function(e) { var u = unitsCache.find(function(x) { return x.id == e.target.closest('button').dataset.id; }); if (u) showFormModal('تعديل وحدة', [{id:'name',label:'الاسم'},{id:'abbreviation',label:'الاختصار'}], {name:u.name,abbreviation:u.abbreviation||''}, function(v) { return apiCall('/definitions?type=unit','PUT', {type:'unit', id: u.id, ...v}); }, function() { loadUnitsSection(); }); }); });
    document.querySelectorAll('.delete-unit').forEach(function(b) { b.addEventListener('click', async function(e) { if (await confirmDialog('حذف الوحدة؟')) { await apiCall('/definitions?type=unit&id=' + e.target.closest('button').dataset.id, 'DELETE'); loadUnitsSection(); } }); });
  }

  function showAddUnitModal() {
    showFormModal('إضافة وحدة', [{id:'name',label:'اسم الوحدة'},{id:'abbreviation',label:'الاختصار'}], {}, function(v) { return apiCall('/definitions?type=unit','POST', {type:'unit', ...v}); }, function() { loadUnitsSection(); });
  }

  function showFormModal(title, fields, initialValues, onSave, onSuccess) {
    var formId = 'frm-' + Date.now();
    var body = '';
    fields.forEach(function(f) {
      body += '<div class="form-group"><label class="form-label">' + f.label + '</label><input class="input" id="' + formId + '-' + f.id + '" type="' + (f.type||'text') + '" value="' + (initialValues[f.id]||'') + '"></div>';
    });
    var modal = openModal({ title: title, bodyHTML: body, footerHTML: '<button class="btn btn-secondary" id="' + formId + '-cancel">إلغاء</button><button class="btn btn-primary" id="' + formId + '-save">حفظ</button>' });
    modal.element.querySelector('#'+formId+'-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#'+formId+'-save').onclick = async function() {
      var vals = {};
      fields.forEach(function(f) { vals[f.id] = modal.element.querySelector('#'+formId+'-'+f.id).value.trim(); });
      await onSave(vals);
      modal.close(); showToast('تم الحفظ','success'); if (onSuccess) onSuccess();
    };
  }

  // ========== الفواتير ==========
  async function showInvoiceModal(type) {
    customersCache = await apiCall('/customers','GET');
    suppliersCache = await apiCall('/suppliers','GET');
    itemsCache = await apiCall('/items','GET');
    var entityOptions = type === 'sale' ? '<option value="cash">عميل نقدي</option>' + customersCache.map(function(c) { return '<option value="'+c.id+'">'+c.name+'</option>'; }).join('') : '<option value="cash">مورد نقدي</option>' + suppliersCache.map(function(s) { return '<option value="'+s.id+'">'+s.name+'</option>'; }).join('');
    var body = '<input type="hidden" id="inv-type" value="' + type + '"><div class="invoice-lines" id="inv-lines"><div class="line-row"><div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>' + itemsCache.map(function(i) { return '<option value="'+i.id+'">'+i.name+'</option>'; }).join('') + '</select></div><div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div><div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div><div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly></div></div></div><button class="btn btn-sm" id="btn-add-line">✚ إضافة بند</button><div class="form-group"><label>' + (type==='sale'?'العميل':'المورد') + '</label><select class="select" id="inv-entity">' + entityOptions + '</select></div><div class="form-group"><label>التاريخ</label><input type="date" class="input" id="inv-date" value="' + new Date().toISOString().split('T')[0] + '"></div><div class="form-group"><label>المرجع</label><input type="text" class="input" id="inv-ref"></div><div style="display:flex;justify-content:space-between;background:var(--bg);padding:16px;border-radius:12px;"><span>الإجمالي:</span><span id="inv-grand-total" style="font-weight:900;font-size:22px;">0.00</span></div>';
    var modal = openModal({ title: 'فاتورة ' + (type==='sale'?'مبيعات':'مشتريات'), bodyHTML: body, footerHTML: '<button class="btn btn-secondary" id="inv-cancel">إلغاء</button><button class="btn btn-primary" id="inv-save">حفظ</button>' });
    var container = modal.element;
    function updateTotal() { var t = 0; container.querySelectorAll('.total-input').forEach(function(inp) { t += parseFloat(inp.value)||0; }); container.querySelector('#inv-grand-total').textContent = formatNumber(t); }
    function calc(row) { var q = parseFloat(row.querySelector('.qty-input').value)||0, p = parseFloat(row.querySelector('.price-input').value)||0; row.querySelector('.total-input').value = (q*p).toFixed(2); updateTotal(); }
    container.querySelectorAll('.line-row').forEach(function(row) {
      var sel = row.querySelector('.item-select'), pr = row.querySelector('.price-input');
      sel.addEventListener('change', function() { var it = itemsCache.find(function(i) { return i.id == sel.value; }); if (it) { pr.value = type==='sale' ? (it.selling_price||0) : (it.purchase_price||0); calc(row); } });
      row.querySelector('.qty-input').addEventListener('input', function() { calc(row); });
      row.querySelector('.price-input').addEventListener('input', function() { calc(row); });
    });
    container.querySelector('#btn-add-line').addEventListener('click', function() {
      var nl = document.createElement('div'); nl.className = 'line-row';
      nl.innerHTML = '<div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>' + itemsCache.map(function(i) { return '<option value="'+i.id+'">'+i.name+'</option>'; }).join('') + '</select></div><div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div><div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div><div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly></div><button class="line-remove">✕</button>';
      container.querySelector('#inv-lines').appendChild(nl);
      var sel = nl.querySelector('.item-select'), pr = nl.querySelector('.price-input');
      sel.addEventListener('change', function() { var it = itemsCache.find(function(i) { return i.id == sel.value; }); if (it) { pr.value = type==='sale' ? (it.selling_price||0) : (it.purchase_price||0); calc(nl); } });
      nl.querySelector('.qty-input').addEventListener('input', function() { calc(nl); });
      nl.querySelector('.price-input').addEventListener('input', function() { calc(nl); });
      nl.querySelector('.line-remove').addEventListener('click', function() { nl.remove(); updateTotal(); });
    });
    container.querySelector('#inv-cancel').onclick = function() { modal.close(); };
    container.querySelector('#inv-save').onclick = async function() {
      var lines = []; container.querySelectorAll('.line-row').forEach(function(row) { var id = row.querySelector('.item-select')?.value || null, q = parseFloat(row.querySelector('.qty-input').value)||0, p = parseFloat(row.querySelector('.price-input').value)||0, t = parseFloat(row.querySelector('.total-input').value)||0; if (id || q > 0) lines.push({ item_id: id, quantity: q, unit_price: p, total: t }); });
      if (!lines.length) return showToast('أضف بنداً', 'error');
      var entity = container.querySelector('#inv-entity').value;
      await apiCall('/invoices','POST', { type: type, customer_id: type==='sale' && entity!=='cash' ? entity : null, supplier_id: type==='purchase' && entity!=='cash' ? entity : null, date: container.querySelector('#inv-date').value, reference: container.querySelector('#inv-ref').value.trim(), lines: lines, total: lines.reduce(function(s,l) { return s + l.total; }, 0), paid_amount: 0 });
      modal.close(); showToast('تم الحفظ','success'); loadInvoices();
    };
  }

  async function loadInvoices() {
    invoicesCache = await apiCall('/invoices','GET');
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">الفواتير</h3></div><div class="filter-bar"><button class="filter-pill active" data-filter="all">الكل</button><button class="filter-pill" data-filter="sale">مبيعات</button><button class="filter-pill" data-filter="purchase">مشتريات</button></div></div><div id="inv-list"></div>';
    document.getElementById('tab-content').innerHTML = html;
    document.querySelectorAll('.filter-pill').forEach(function(tab) { tab.addEventListener('click', function() { document.querySelectorAll('.filter-pill').forEach(function(t) { t.classList.remove('active'); }); tab.classList.add('active'); renderFilteredInvoices(); }); });
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
      html += '<div class="card card-hover"><div style="display:flex;justify-content:space-between;"><span><span style="background:' + (inv.type==='sale'?'var(--success-light)':'var(--warning-light)') + ';color:' + (inv.type==='sale'?'var(--success)':'var(--warning)') + ';padding:2px 10px;border-radius:20px;font-size:12px;">' + (inv.type==='sale'?'بيع':'شراء') + '</span> ' + (inv.reference||'') + '</span><span style="font-weight:900;">' + formatNumber(inv.total) + '</span></div><div style="margin-top:8px;font-size:13px;">' + formatDate(inv.date) + ' · مدفوع: ' + formatNumber(inv.paid||0) + ' · باقي: ' + formatNumber(inv.balance||0) + '</div></div>';
    });
    container.innerHTML = html;
  }

  // ========== المدفوعات ==========
  async function loadPayments() {
    var payments = await apiCall('/payments','GET');
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">الدفعات</h3><button class="btn btn-primary btn-sm" id="btn-add-pmt">✚ إضافة</button></div></div>';
    if (!payments.length) html += '<div class="empty-state"><h3>لا توجد دفعات</h3></div>';
    else payments.forEach(function(p) { html += '<div class="card" style="border-right:3px solid ' + (p.customer_id?'var(--success)':'var(--danger)') + ';"><div><span style="font-weight:900;">' + (p.customer_id?'+':'-') + ' ' + formatNumber(p.amount) + '</span></div><div style="font-size:13px;">' + formatDate(p.payment_date) + ' · ' + (p.notes||'') + '</div></div>'; });
    document.getElementById('tab-content').innerHTML = html;
    document.getElementById('btn-add-pmt').addEventListener('click', showAddPaymentModal);
  }

  function showAddPaymentModal() {
    var body = '<div class="form-group"><label>النوع</label><select class="select" id="pmt-type"><option value="customer">مقبوضات</option><option value="supplier">مدفوعات</option></select></div><div class="form-group" id="pmt-cust-block"><label>العميل</label><select class="select" id="pmt-customer"><option value="">اختر</option>' + customersCache.map(function(c) { return '<option value="'+c.id+'">'+c.name+'</option>'; }).join('') + '</select></div><div class="form-group" id="pmt-supp-block" style="display:none"><label>المورد</label><select class="select" id="pmt-supplier"><option value="">اختر</option>' + suppliersCache.map(function(s) { return '<option value="'+s.id+'">'+s.name+'</option>'; }).join('') + '</select></div><div class="form-group"><label>المبلغ</label><input type="number" step="0.01" class="input" id="pmt-amount"></div><div class="form-group"><label>التاريخ</label><input type="date" class="input" id="pmt-date" value="' + new Date().toISOString().split('T')[0] + '"></div><div class="form-group"><label>ملاحظات</label><textarea class="textarea" id="pmt-notes"></textarea></div>';
    var modal = openModal({ title: 'تسجيل دفعة', bodyHTML: body, footerHTML: '<button class="btn btn-secondary" id="pmt-cancel">إلغاء</button><button class="btn btn-primary" id="pmt-save">حفظ</button>' });
    modal.element.querySelector('#pmt-type').addEventListener('change', function() { document.getElementById('pmt-cust-block').style.display = this.value==='customer'?'block':'none'; document.getElementById('pmt-supp-block').style.display = this.value==='supplier'?'block':'none'; });
    modal.element.querySelector('#pmt-cancel').onclick = function() { modal.close(); };
    modal.element.querySelector('#pmt-save').onclick = async function() {
      var type = modal.element.querySelector('#pmt-type').value;
      var amount = parseFloat(modal.element.querySelector('#pmt-amount').value);
      if (!amount || amount <= 0) return showToast('المبلغ مطلوب','error');
      await apiCall('/payments','POST', { customer_id: type==='customer' ? (modal.element.querySelector('#pmt-customer').value||null) : null, supplier_id: type==='supplier' ? (modal.element.querySelector('#pmt-supplier').value||null) : null, amount: amount, payment_date: modal.element.querySelector('#pmt-date').value, notes: modal.element.querySelector('#pmt-notes').value.trim() });
      modal.close(); showToast('تم الحفظ','success'); loadPayments();
    };
  }

  // ========== المصاريف ==========
  async function loadExpenses() {
    var expenses = await apiCall('/expenses','GET');
    var html = '<div class="card"><div class="card-header"><h3 class="card-title">المصاريف</h3><button class="btn btn-primary btn-sm" id="btn-add-exp">✚ إضافة</button></div></div>';
    expenses.forEach(function(ex) { html += '<div class="card" style="border-right:3px solid var(--danger);"><div style="font-weight:900;color:var(--danger);">' + formatNumber(ex.amount) + '</div><div style="font-size:13px;">' + formatDate(ex.expense_date) + ' · ' + (ex.description||'') + '</div></div>'; });
    document.getElementById('tab-content').innerHTML = html;
    document.getElementById('btn-add-exp').addEventListener('click', function() { showFormModal('إضافة مصروف', [{id:'amount',label:'المبلغ',type:'number'},{id:'expense_date',label:'التاريخ',type:'date'},{id:'description',label:'الوصف'}], {expense_date: new Date().toISOString().split('T')[0]}, function(v) { return apiCall('/expenses','POST', {amount: parseFloat(v.amount), expense_date: v.expense_date, description: v.description}); }, function() { loadExpenses(); }); });
  }

  // ========== التقارير ==========
  function loadReports() {
    document.getElementById('tab-content').innerHTML = '<div class="card"><h3 class="card-title">التقارير المالية</h3></div><div class="report-card" id="report-dashboard"><div class="report-icon">📊</div><div class="report-info"><h4>الملخص</h4><p>لوحة التحكم</p></div></div>';
    document.getElementById('report-dashboard').addEventListener('click', loadDashboard);
  }

  // ========== بدء التشغيل ==========
  document.getElementById('menu-toggle').addEventListener('click', function() { document.getElementById('sidebar').classList.toggle('open'); });
  document.querySelectorAll('.bottom-item').forEach(function(btn) {
    btn.addEventListener('click', function() { var tab = btn.dataset.tab; if (tab === 'more') { document.getElementById('more-menu').style.display = 'flex'; } else navigateTo(tab); });
  });
  document.querySelector('.sheet-backdrop')?.addEventListener('click', function() { document.getElementById('more-menu').style.display = 'none'; });

  // مستمع عام للأزرار (add/edit/delete)
  document.addEventListener('click', async function(e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.classList.contains('add-btn')) {
      var type = t.dataset.type;
      var titles = { customers: 'عميل', suppliers: 'مورد', categories: 'تصنيف' };
      var endpoints = { customers: '/customers', suppliers: '/suppliers', categories: '/definitions?type=category' };
      showFormModal('إضافة ' + titles[type], [{id:'name',label:'الاسم'}], {}, async function(v) { return apiCall(endpoints[type],'POST', type==='categories' ? {type:'category', name: v.name} : {name: v.name}); }, function() { loadGenericSection(endpoints[type], type); });
    } else if (t.classList.contains('edit-btn')) {
      var type = t.dataset.type;
      var caches = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
      var item = caches[type]?.find(function(x) { return x.id == t.dataset.id; });
      if (!item) return;
      var endpoints = { customers: '/customers', suppliers: '/suppliers', categories: '/definitions?type=category' };
      showFormModal('تعديل', [{id:'name',label:'الاسم'}], {name: item.name||''}, async function(v) { return apiCall(endpoints[type],'PUT', type==='categories' ? {type:'category', id: item.id, name: v.name} : {id: item.id, name: v.name}); }, function() { loadGenericSection(endpoints[type], type); });
    } else if (t.classList.contains('delete-btn')) {
      var type = t.dataset.type;
      var caches = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
      var item = caches[type]?.find(function(x) { return x.id == t.dataset.id; });
      if (!item) return;
      if (await confirmDialog('حذف ' + item.name + '؟')) {
        var delUrls = { customers: '/customers?id=' + item.id, suppliers: '/suppliers?id=' + item.id, categories: '/definitions?type=category&id=' + item.id };
        await apiCall(delUrls[type], 'DELETE');
        showToast('تم الحذف','success');
        loadGenericSection(delUrls[type].split('?')[0], type);
      }
    }
  });

  async function initApp() {
    initNavigation();
    try {
      var results = await Promise.all([apiCall('/items','GET'),apiCall('/customers','GET'),apiCall('/suppliers','GET'),apiCall('/invoices','GET'),apiCall('/definitions?type=category','GET'),apiCall('/definitions?type=unit','GET')]);
      itemsCache = results[0]; customersCache = results[1]; suppliersCache = results[2];
      invoicesCache = results[3]; categoriesCache = results[4]; unitsCache = results[5];
    } catch(e) { console.error(e); }
    loadDashboard();
    document.getElementById('loading-screen').classList.add('hidden');
  }

  initApp().catch(function(err) { document.getElementById('loading-screen').classList.add('hidden'); showToast('خطأ: ' + err.message, 'error'); });
})();
