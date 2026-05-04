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
  function formatNumber(num) { return Number(num||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function formatDate(d) { return d ? new Date(d).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}) : '-'; }
  window.showToast = function(msg, type) {
    var c = document.getElementById('toast-container'); if (!c) return;
    var t = document.createElement('div'); t.className = 'toast ' + (type||'info'); t.textContent = msg;
    c.appendChild(t); setTimeout(function(){ t.remove(); }, 3000);
  };

  // ========== إدارة التمرير ==========
  var scrollLockPos = 0;
  function lockScroll() {
    scrollLockPos = window.scrollY || document.documentElement.scrollTop;
    document.body.style.position = 'fixed'; document.body.style.top = '-'+scrollLockPos+'px'; document.body.style.width = '100%';
    document.body.classList.add('scroll-locked');
  }
  function unlockScroll() {
    document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = '';
    document.body.classList.remove('scroll-locked'); window.scrollTo(0, scrollLockPos);
  }

  // ========== المودال ==========
  var activeModal = null;
  function openModal(opt) {
    var portal = document.getElementById('modal-portal'); if (!portal) return {};
    if (activeModal) activeModal.close();
    var overlay = document.createElement('div'); overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-header"><h3 class="modal-title">'+(opt.title||'')+'</h3><button class="modal-close" aria-label="إغلاق">&times;</button></div><div class="modal-body">'+(opt.bodyHTML||'')+'</div>'+(opt.footerHTML?'<div class="modal-footer">'+opt.footerHTML+'</div>':'')+'</div>';
    portal.appendChild(overlay); lockScroll(); activeModal = overlay;
    function close() { overlay.remove(); activeModal = null; unlockScroll(); if (opt.onClose) opt.onClose(); }
    var closeBtn = overlay.querySelector('.modal-close'); if (closeBtn) closeBtn.onclick = close;
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    return { close: close, element: overlay };
  }

  function confirmDialog(msg) {
    return new Promise(function(resolve) {
      var modal = openModal({
        title: 'تأكيد العملية',
        bodyHTML: '<p style="font-size:15px;line-height:1.7;">'+msg+'</p>',
        footerHTML: '<button class="btn btn-secondary" id="cf-cancel">إلغاء</button><button class="btn btn-danger" id="cf-ok">تأكيد</button>',
        onClose: function() { resolve(false); }
      });
      var cancel = modal.element.querySelector('#cf-cancel'), ok = modal.element.querySelector('#cf-ok');
      if (cancel) cancel.onclick = function() { modal.close(); resolve(false); };
      if (ok) ok.onclick = function() { modal.close(); resolve(true); };
    });
  }

  // ========== API محلي ==========
  async function apiCall(endpoint, method, body) {
    method = method || 'GET'; body = body || {};
    var parts = endpoint.split('?')[0].split('/').filter(Boolean);
    var tableName = parts[0];
    var params = new URLSearchParams(endpoint.includes('?')?endpoint.split('?')[1]:'');
    var id = parts[1] ? parseInt(parts[1]) : (params.get('id')?parseInt(params.get('id')):null);

    if (method === 'GET') {
      switch (tableName) {
        case 'items': return await localDB.items.toArray();
        case 'customers': return await localDB.customers.toArray();
        case 'suppliers': return await localDB.suppliers.toArray();
        case 'definitions':
          if (params.get('type')==='category') return await localDB.categories.toArray();
          if (params.get('type')==='unit') return await localDB.units.toArray();
          return [];
        case 'invoices': {
          var invs = await localDB.invoices.toArray();
          for (var i=0; i<invs.length; i++) {
            var inv = invs[i];
            var pmts = await localDB.payments.where({invoice_id:inv.id}).toArray();
            inv.paid = pmts.reduce(function(s,p){return s+(p.amount||0);},0);
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
        case 'items': { var nid = await localDB.items.add(payload); return {id:nid,...payload}; }
        case 'customers': { var nid = await localDB.customers.add({...payload,balance:payload.balance||0}); return {id:nid,...payload}; }
        case 'suppliers': { var nid = await localDB.suppliers.add({...payload,balance:0}); return {id:nid,...payload}; }
        case 'definitions': {
          var type = params.get('type')||body.type;
          if (type==='category'){ var nid = await localDB.categories.add({name:payload.name}); return {id:nid,name:payload.name}; }
          if (type==='unit'){ var nid = await localDB.units.add({name:payload.name,abbreviation:payload.abbreviation}); return {id:nid,name:payload.name,abbreviation:payload.abbreviation}; }
          break;
        }
        case 'invoices': {
          var lines = payload.lines; delete payload.lines;
          var paid_amount = payload.paid_amount||0; delete payload.paid_amount;
          var invId = await localDB.invoices.add(payload);
          if (lines&&lines.length) for (var l of lines) await localDB.invoiceLines.add({...l,invoice_id:invId});
          if (paid_amount>0) await localDB.payments.add({invoice_id:invId,customer_id:payload.customer_id||null,supplier_id:payload.supplier_id||null,amount:paid_amount,payment_date:payload.date,notes:'دفعة تلقائية'});
          return {id:invId,...payload};
        }
        case 'payments': { var nid = await localDB.payments.add(payload); return {id:nid,...payload}; }
        case 'expenses': { var nid = await localDB.expenses.add(payload); return {id:nid,...payload}; }
      }
    } else if (method === 'PUT') {
      var upd = JSON.parse(JSON.stringify(body)); if (!id) id = body.id;
      switch (tableName) {
        case 'items': await localDB.items.update(id, upd); break;
        case 'customers': await localDB.customers.update(id, upd); break;
        case 'suppliers': await localDB.suppliers.update(id, upd); break;
        case 'definitions':
          if ((params.get('type')||body.type)==='category') await localDB.categories.update(id,{name:upd.name});
          else await localDB.units.update(id,{name:upd.name,abbreviation:upd.abbreviation});
          break;
      }
      return {id:id,...upd};
    } else if (method === 'DELETE') {
      if (!id) id = body.id || parseInt(params.get('id'));
      switch (tableName) {
        case 'items': await localDB.items.delete(id); break;
        case 'customers': await localDB.customers.delete(id); break;
        case 'suppliers': await localDB.suppliers.delete(id); break;
        case 'definitions':
          if ((params.get('type')||body.type)==='category') await localDB.categories.delete(id);
          else await localDB.units.delete(id);
          break;
        case 'invoices': await localDB.invoices.delete(id); await localDB.invoiceLines.where({invoice_id:id}).delete(); await localDB.payments.where({invoice_id:id}).delete(); break;
        case 'payments': await localDB.payments.delete(id); break;
        case 'expenses': await localDB.expenses.delete(id); break;
      }
      return {success:true};
    }
    throw new Error('Method not allowed');
  }

  // ========== متغيرات عامة ==========
  var itemsCache=[], customersCache=[], suppliersCache=[], invoicesCache=[], categoriesCache=[], unitsCache=[];
  var ICONS = {
    plus:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    edit:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };

  // ========== التنقل ==========
  function initNavigation() {
    var nav = document.getElementById('sidebar-nav'); if (!nav) return;
    ['dashboard','items','sale-invoice','purchase-invoice','customers','suppliers','categories','units','payments','expenses','invoices','reports'].forEach(function(tab){
      var b = document.createElement('button'); b.className = 'nav-item'+(tab==='dashboard'?' active':'');
      b.dataset.tab = tab; b.textContent = tab; b.onclick = function(){ navigateTo(tab); };
      nav.appendChild(b);
    });
  }

  function setActiveTab(tab) {
    document.querySelectorAll('.nav-item,.bottom-item').forEach(function(el){ el.classList.toggle('active', el.dataset.tab===tab); });
  }

  function navigateTo(tab) {
    setActiveTab(tab);
    var mm = document.getElementById('more-menu'); if (mm) mm.style.display='none';
    var sidebar = document.getElementById('sidebar'); if (sidebar) sidebar.classList.remove('open');
    var content = document.getElementById('tab-content'); if (!content) return;
    content.style.opacity = '0';
    setTimeout(function(){
      switch(tab){
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
      content.style.transition = 'all 0.3s'; content.style.opacity = '1';
    },50);
  }

  // ========== الصفحات ==========
  async function loadDashboard() {
    var invoices = await apiCall('/invoices','GET');
    var totalSales = invoices.filter(function(i){return i.type==='sale'}).reduce(function(s,i){return s+(i.total||0);},0);
    var totalPurchases = invoices.filter(function(i){return i.type==='purchase'}).reduce(function(s,i){return s+(i.total||0);},0);
    var expenses = await apiCall('/expenses','GET');
    var totalExpenses = expenses.reduce(function(s,e){return s+(e.amount||0);},0);
    var netProfit = totalSales - totalPurchases - totalExpenses;

    var tc = document.getElementById('tab-content'); if (!tc) return;
    tc.innerHTML = '<div class="stats-grid"><div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value '+(netProfit>=0?'positive':'negative')+'">'+formatNumber(netProfit)+'</div></div><div class="stat-card cash"><div class="stat-label">المبيعات</div><div class="stat-value">'+formatNumber(totalSales)+'</div></div><div class="stat-card receivables"><div class="stat-label">المشتريات</div><div class="stat-value">'+formatNumber(totalPurchases)+'</div></div><div class="stat-card payables"><div class="stat-label">المصاريف</div><div class="stat-value">'+formatNumber(totalExpenses)+'</div></div></div><div class="card" style="margin-bottom:16px;"><div style="display:flex;gap:8px;"><button class="btn btn-sm btn-primary" id="btn-export">تصدير</button><button class="btn btn-sm btn-secondary" id="btn-import">استيراد</button></div></div>';
    var exp = document.getElementById('btn-export'), imp = document.getElementById('btn-import');
    if (exp) exp.onclick = async function(){ /* ... */ };
    if (imp) imp.onclick = function(){ /* ... */ };
  }

  // ... (يُستكمل المحتوى لجميع أقسام التطبيق، مع تغليف كل addEventListener بـ if)
})();
