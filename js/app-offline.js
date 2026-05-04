// ==========================================
// الراجحي للمحاسبة - Offline PWA v.1.0.0
// ==========================================
(function() {
  'use strict';

  // ========== [قاعدة البيانات] ==========
  var db;
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
  } catch (e) {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('error-screen').style.display = 'flex';
    document.getElementById('error-screen').textContent = 'فشل تهيئة قاعدة البيانات: ' + e.message;
    throw e;
  }

  // ========== [خدمات API المحلية] ==========
  var localDB = {
    items: db.items, customers: db.customers, suppliers: db.suppliers,
    categories: db.categories, units: db.units, invoices: db.invoices,
    invoiceLines: db.invoiceLines, payments: db.payments, expenses: db.expenses
  };

  async function apiCall(endpoint, method, body) {
    method = method || 'GET';
    body = body || {};
    var parts = endpoint.replace('/api/', '').split('?')[0].split('/').filter(Boolean);
    var tableName = parts[0];
    var id = parts[1] ? parseInt(parts[1]) : null;
    var queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    var params = new URLSearchParams(queryString);

    if (method === 'GET') {
      switch (tableName) {
        case 'items': return await localDB.items.toArray();
        case 'customers': return await localDB.customers.toArray();
        case 'suppliers': return await localDB.suppliers.toArray();
        case 'definitions':
          if (params.get('type') === 'category') return await localDB.categories.toArray();
          if (params.get('type') === 'unit') return await localDB.units.toArray();
          break;
        case 'invoices': {
          var invs = await localDB.invoices.toArray();
          for (var inv of invs) {
            var pmts = await localDB.payments.where({ invoice_id: inv.id }).toArray();
            inv.paid = pmts.reduce(function(s, p) { return s + (p.amount || 0); }, 0);
            inv.balance = (inv.total || 0) - inv.paid;
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
        case 'customers': { var newId = await localDB.customers.add({ ...payload, balance: payload.balance || 0 }); return { id: newId, ...payload }; }
        case 'suppliers': { var newId = await localDB.suppliers.add({ ...payload, balance: 0 }); return { id: newId, ...payload }; }
        case 'definitions': {
          var type = params.get('type') || body.type;
          if (type === 'category') { var newId = await localDB.categories.add({ name: payload.name }); return { id: newId, name: payload.name }; }
          if (type === 'unit') { var newId = await localDB.units.add({ name: payload.name, abbreviation: payload.abbreviation }); return { id: newId, name: payload.name, abbreviation: payload.abbreviation }; }
          break;
        }
        case 'invoices': {
          var lines = payload.lines; delete payload.lines;
          var paid_amount = payload.paid_amount || 0; delete payload.paid_amount;
          var invId = await localDB.invoices.add(payload);
          if (lines && lines.length) {
            for (var l of lines) {
              await localDB.invoiceLines.add({ ...l, invoice_id: invId });
            }
          }
          if (paid_amount > 0) {
            await localDB.payments.add({ invoice_id: invId, customer_id: payload.customer_id || null, supplier_id: payload.supplier_id || null, amount: paid_amount, payment_date: payload.date, notes: 'دفعة تلقائية' });
          }
          return { id: invId, ...payload };
        }
        case 'payments': { var newId = await localDB.payments.add(payload); return { id: newId, ...payload }; }
        case 'expenses': { var newId = await localDB.expenses.add(payload); return { id: newId, ...payload }; }
      }
    } else if (method === 'PUT') {
      var updateData = JSON.parse(JSON.stringify(body));
      var targetId = id || body.id;
      switch (tableName) {
        case 'items': await localDB.items.update(targetId, updateData); break;
        case 'customers': await localDB.customers.update(targetId, updateData); break;
        case 'suppliers': await localDB.suppliers.update(targetId, updateData); break;
        case 'definitions': {
          var type = params.get('type') || body.type;
          if (type === 'category') await localDB.categories.update(targetId, { name: updateData.name });
          else await localDB.units.update(targetId, { name: updateData.name, abbreviation: updateData.abbreviation });
          break;
        }
      }
      return { id: targetId, ...updateData };
    } else if (method === 'DELETE') {
      var delId = id || body.id || parseInt(params.get('id'));
      switch (tableName) {
        case 'items': await localDB.items.delete(delId); break;
        case 'customers': await localDB.customers.delete(delId); break;
        case 'suppliers': await localDB.suppliers.delete(delId); break;
        case 'definitions': {
          var type = params.get('type') || body.type;
          if (type === 'category') await localDB.categories.delete(delId);
          else await localDB.units.delete(delId);
          break;
        }
        case 'invoices': await localDB.invoices.delete(delId); await localDB.invoiceLines.where({ invoice_id: delId }).delete(); await localDB.payments.where({ invoice_id: delId }).delete(); break;
        case 'payments': await localDB.payments.delete(delId); break;
        case 'expenses': await localDB.expenses.delete(delId); break;
      }
      return { success: true };
    }
    throw new Error('Method not allowed');
  }

  // ========== [وظائف مساعدة] ==========
  function formatNumber(num) { return (num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function formatDate(dateStr) { return dateStr ? new Date(dateStr).toLocaleDateString('ar-SA') : '-'; }
  window.showToast = function(msg, type) { /* ... */ };

  // ========== [حالة التطبيق] ==========
  var itemsCache = [], customersCache = [], suppliersCache = [], invoicesCache = [], categoriesCache = [], unitsCache = [];

  // ========== [لوحة التحكم] ==========
  async function loadDashboard() {
    var invoices = await apiCall('/invoices', 'GET');
    var totalSales = invoices.filter(function(i) { return i.type === 'sale'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var totalPurchases = invoices.filter(function(i) { return i.type === 'purchase'; }).reduce(function(s, i) { return s + (i.total || 0); }, 0);
    var customers = await apiCall('/customers', 'GET');
    var suppliers = await apiCall('/suppliers', 'GET');
    var receivables = customers.reduce(function(s, c) { return s + (c.balance || 0); }, 0);
    var payables = suppliers.reduce(function(s, s2) { return s + (s2.balance || 0); }, 0);
    var expenses = await apiCall('/expenses', 'GET');
    var totalExpenses = expenses.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    var netProfit = totalSales - totalPurchases - totalExpenses;

    document.getElementById('tab-content').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value ${netProfit>=0?'positive':'negative'}">${formatNumber(netProfit)}</div></div>
        <div class="stat-card cash"><div class="stat-label">المبيعات</div><div class="stat-value">${formatNumber(totalSales)}</div></div>
        <div class="stat-card receivables"><div class="stat-label">المشتريات</div><div class="stat-value">${formatNumber(totalPurchases)}</div></div>
        <div class="stat-card payables"><div class="stat-label">المصاريف</div><div class="stat-value">${formatNumber(totalExpenses)}</div></div>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-primary" id="btn-export">📤 تصدير البيانات</button>
          <button class="btn btn-sm btn-secondary" id="btn-import">📥 استيراد البيانات</button>
        </div>
      </div>
    `;

    document.getElementById('btn-export').onclick = async function() {
      var tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
      var data = {};
      for (var t of tables) data[t] = await db.table(t).toArray();
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `alrajhi-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
    };

    document.getElementById('btn-import').onclick = function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var text = await file.text();
        var data = JSON.parse(text);
        var tables = ['items','customers','suppliers','categories','units','invoices','invoiceLines','payments','expenses'];
        for (var t of tables) { await db.table(t).clear(); if (data[t]) await db.table(t).bulkAdd(data[t]); }
        showToast('تم استيراد البيانات بنجاح', 'success');
        loadDashboard();
      };
      input.click();
    };
  }

  // ========== [التنقل] ==========
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

  function navigateTo(tab) {
    document.querySelectorAll('.nav-item,.bottom-item').forEach(function(el) {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    if (tab === 'dashboard') loadDashboard();
  }

  // ========== [بدء التشغيل] ==========
  async function initApp() {
    initNavigation();
    try {
      var results = await Promise.all([
        apiCall('/items', 'GET'), apiCall('/customers', 'GET'), apiCall('/suppliers', 'GET'),
        apiCall('/invoices', 'GET'), apiCall('/definitions?type=category', 'GET'), apiCall('/definitions?type=unit', 'GET')
      ]);
      itemsCache = results[0]; customersCache = results[1]; suppliersCache = results[2];
      invoicesCache = results[3]; categoriesCache = results[4]; unitsCache = results[5];
    } catch(e) { console.error(e); }
    loadDashboard();
    document.getElementById('loading-screen').classList.add('hidden');
  }

  initApp().catch(function(err) {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('error-screen').style.display = 'flex';
    document.getElementById('error-screen').textContent = 'خطأ: ' + err.message;
  });

  // ========== [مستمعات الأحداث] ==========
  document.getElementById('menu-toggle').addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.querySelectorAll('.bottom-item').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = btn.dataset.tab;
      if (tab === 'more') { document.getElementById('more-menu').style.display = 'flex'; }
      else navigateTo(tab);
    });
  });
})();
