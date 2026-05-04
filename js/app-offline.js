(function() {
  'use strict';

  // ========== قاعدة البيانات ==========
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

  var localDB = {
    items: db.items, customers: db.customers, suppliers: db.suppliers,
    categories: db.categories, units: db.units, invoices: db.invoices,
    invoiceLines: db.invoiceLines, payments: db.payments, expenses: db.expenses
  };

  window.exportAllData = function() { /* ... نفس الكود السابق ... */ };
  window.importAllData = function(jsonStr) { /* ... */ };

  async function apiCall(endpoint, method, body) {
    // نفس الكود السابق بالضبط (انقله كاملاً)
  }

  // ========== دوال عامة ==========
  function formatNumber(num) { return Number(num||0).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}); }
  function formatDate(d) { return d ? new Date(d).toLocaleDateString('ar-SA') : '-'; }
  window.showToast = function(msg, type) { /* ... */ };

  // ... باقي دوال المودال والتنقل ...

  async function loadDashboard() {
    // استخدام apiCall لجلب بيانات حقيقية وعرض لوحة التحكم
  }

  async function initApp() {
    localStorage.setItem('user_id', 'offline_user');
    localStorage.setItem('user_name', 'مستخدم');
    document.getElementById('user-name-sidebar').textContent = 'مستخدم';
    document.getElementById('user-avatar').textContent = 'م';

    // بناء الشريط الجانبي
    var sidebarNav = document.getElementById('sidebar-nav');
    ['dashboard','items','sale-invoice','purchase-invoice','customers','suppliers','categories','units','payments','expenses','invoices','reports'].forEach(function(tab) {
      var btn = document.createElement('button');
      btn.className = 'nav-item' + (tab==='dashboard'?' active':'');
      btn.dataset.tab = tab;
      btn.innerHTML = tab;
      btn.onclick = function() { navigateTo(tab); };
      sidebarNav.appendChild(btn);
    });

    try {
      var results = await Promise.all([
        apiCall('/items','GET'),
        apiCall('/customers','GET'),
        apiCall('/suppliers','GET'),
        apiCall('/invoices','GET'),
        apiCall('/definitions?type=category','GET'),
        apiCall('/definitions?type=unit','GET')
      ]);
      // تخزين في المتغيرات العامة
      window.itemsCache = results[0];
      window.customersCache = results[1];
      window.suppliersCache = results[2];
      window.invoicesCache = results[3];
      window.categoriesCache = results[4];
      window.unitsCache = results[5];
    } catch(e) {
      console.error('فشل تحميل البيانات الأولية:', e);
    }

    loadDashboard();
  }

  function hideLoading() {
    var loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('hidden');
  }

  // بدء التطبيق مع تأخير احتياطي لإخفاء شاشة التحميل
  initApp().then(function() {
    hideLoading();
  }).catch(function(err) {
    console.error('خطأ في بدء التشغيل:', err);
    hideLoading(); // نخفي شاشة التحميل حتى في حال الخطأ
    // عرض الخطأ في الصفحة بدلاً من شاشة التحميل
    var errorDiv = document.getElementById('error-screen');
    if (errorDiv) {
      errorDiv.style.display = 'flex';
      errorDiv.textContent = 'حدث خطأ: ' + err.message;
    }
  });

  // احتياطي: إخفاء شاشة التحميل بعد 6 ثوانٍ حتى لو لم تنتهي initApp
  setTimeout(function() {
    hideLoading();
  }, 6000);

  // مستمعات الأزرار الثابتة
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

  function navigateTo(tab) {
    document.querySelectorAll('.nav-item,.bottom-item').forEach(function(el) { el.classList.toggle('active', el.dataset.tab === tab); });
    if (tab === 'dashboard') loadDashboard();
  }
})();
