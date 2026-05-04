// ========== الراجحي للمحاسبة - Offline-First v5 ==========
import { localDB, exportAllData, importAllData } from './db.js';
import { syncManager } from './sync.js';
import { apiCall, loginStandalone, logout, checkAuth } from './api-offline.js';
import { getEnvironment, initAuth, getCurrentUser, showStandaloneLogin } from './auth.js';

// ========== الإعدادات العامة ==========
window.APP_CONFIG = {
  API_BASE: localStorage.getItem('api_base') || '/api',
  AUTH_MODE: localStorage.getItem('auth_mode') || 'standalone',
  OFFLINE_FIRST: true
};

const env = getEnvironment();
const CURRENCY = { symbol: 'ل.س', decimals: 2 };

// ========== كائنات عالمية ==========
let itemsCache = [], customersCache = [], suppliersCache = [];
let invoicesCache = [], categoriesCache = [], unitsCache = [];
let activeModal = null;
let scrollLockPos = 0;
const cache = {}; const CACHE_DURATION = 60000;

// ========== دوال مساعدة ==========
function formatNumber(num) {
  if (num === undefined || num === null) return '0.00';
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}
function debounce(fn, ms = 300) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
function getCached(key) {
  const e = cache[key]; if (e && Date.now() - e.time < CACHE_DURATION) return e.data;
  delete cache[key]; return null;
}
function setCache(key, data) { cache[key] = { data, time: Date.now() }; }
function invalidateCache(pattern) { Object.keys(cache).forEach(k => { if (k.includes(pattern)) delete cache[k]; }); }

// ========== الثيم ==========
function applyTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark', prefersDark);
}
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

// ========== إدارة التمرير ==========
function lockScroll() {
  scrollLockPos = window.scrollY || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollLockPos}px`;
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

// ========== الإشعارات ==========
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = {
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// ========== المودال ==========
function openModal({ title, bodyHTML, footerHTML = '', onClose }) {
  const portal = document.getElementById('modal-portal');
  if (activeModal) activeModal.close();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" aria-label="إغلاق">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>
  `;
  portal.appendChild(overlay);
  lockScroll();
  activeModal = overlay;

  const box = overlay.querySelector('.modal-box');
  const closeBtn = overlay.querySelector('.modal-close');

  function close() {
    overlay.style.animation = 'fadeIn 0.2s ease reverse';
    box.style.animation = 'slideUp 0.25s ease reverse';
    setTimeout(() => {
      overlay.remove();
      if (activeModal === overlay) activeModal = null;
      unlockScroll();
      if (onClose) onClose();
    }, 200);
  }

  closeBtn.onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, { once: true });

  return { close, element: overlay };
}

function confirmDialog(message) {
  return new Promise(resolve => {
    const modal = openModal({
      title: 'تأكيد العملية',
      bodyHTML: `<div style="display:flex;gap:12px;align-items:center;padding:8px 0;"><div style="color:var(--warning);flex-shrink:0;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div><p style="font-size:15px;line-height:1.7;">${message}</p></div>`,
      footerHTML: `<button class="btn btn-secondary" id="confirm-cancel">إلغاء</button><button class="btn btn-danger" id="confirm-ok">تأكيد</button>`,
      onClose: () => resolve(false)
    });
    modal.element.querySelector('#confirm-cancel').onclick = () => { modal.close(); resolve(false); };
    modal.element.querySelector('#confirm-ok').onclick = () => { modal.close(); resolve(true); };
  });
}

// ========== الأيقونات ==========
const ICONS = {
  home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
  users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  factory: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22h20"/><path d="M4 22V10l4-2v14"/><path d="M12 22V8l4-2v16"/><path d="M20 22V4l-4 2v16"/></svg>',
  tag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  wallet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M16 10a4 4 0 0 1-4 4"/></svg>',
  dollar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  fileText: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  scale: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>',
  alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
};

// ========== التنقل ==========
const tabsConfig = {
  dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة عامة على أداء عملك', icon: ICONS.home },
  items: { title: 'المواد', subtitle: 'إدارة المخزون والمنتجات', icon: ICONS.box },
  'sale-invoice': { title: 'فاتورة بيع', subtitle: 'إنشاء فاتورة مبيعات جديدة', icon: ICONS.cart },
  'purchase-invoice': { title: 'فاتورة شراء', subtitle: 'إنشاء فاتورة مشتريات جديدة', icon: ICONS.cart },
  customers: { title: 'العملاء', subtitle: 'قائمة العملاء والذمم المدينة', icon: ICONS.users },
  suppliers: { title: 'الموردين', subtitle: 'قائمة الموردين والذمم الدائنة', icon: ICONS.factory },
  categories: { title: 'التصنيفات', subtitle: 'تصنيفات المواد', icon: ICONS.tag },
  units: { title: 'الوحدات', subtitle: 'إدارة وحدات القياس', icon: ICONS.scale },
  payments: { title: 'الدفعات', subtitle: 'سجل المقبوضات والمدفوعات', icon: ICONS.wallet },
  expenses: { title: 'المصاريف', subtitle: 'تتبع المصاريف التشغيلية', icon: ICONS.dollar },
  invoices: { title: 'الفواتير', subtitle: 'سجل الفواتير والحركات', icon: ICONS.fileText },
  reports: { title: 'التقارير', subtitle: 'التقارير المالية والإحصائيات', icon: ICONS.chart }
};

let currentTab = 'dashboard';

function setActiveTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.nav-item, .bottom-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tabName));
  const cfg = tabsConfig[tabName];
  document.getElementById('page-title').textContent = cfg?.title || '';
  document.getElementById('page-subtitle').textContent = cfg?.subtitle || '';
  document.getElementById('page-subtitle').style.display = cfg?.subtitle ? 'block' : 'none';
}

function navigateTo(tabName) {
  setActiveTab(tabName);
  document.getElementById('more-menu').style.display = 'none';
  document.getElementById('sidebar').classList.remove('open');
  if (scrollLockPos !== undefined) unlockScroll();

  const content = document.getElementById('tab-content');
  content.style.opacity = '0';
  content.style.transform = 'translateY(10px)';

  setTimeout(() => {
    switch (tabName) {
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
      case 'more': showMoreMenu(); break;
    }
    requestAnimationFrame(() => {
      content.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    });
  }, 50);
}

function showMoreMenu() {
  document.getElementById('more-menu').style.display = 'flex';
  lockScroll();
}

function emptyState(title, subtitle) {
  return `<div class="empty-state"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><h3>${title}</h3><p>${subtitle}</p></div>`;
}

function initNavigation() {
  const sidebarNav = document.getElementById('sidebar-nav');
  const sheetGrid = document.getElementById('sheet-grid');
  const mainTabs = ['dashboard','items','sale-invoice','purchase-invoice','customers','suppliers','categories','units','payments','expenses','invoices','reports'];
  const moreTabs = ['purchase-invoice','customers','suppliers','categories','units','payments','expenses','reports'];

  mainTabs.forEach(key => {
    const cfg = tabsConfig[key];
    if (!cfg) return;
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (key === 'dashboard' ? ' active' : '');
    btn.dataset.tab = key;
    btn.innerHTML = `${cfg.icon}<span>${cfg.title}</span>`;
    btn.onclick = () => navigateTo(key);
    sidebarNav.appendChild(btn);
  });

  moreTabs.forEach(key => {
    const cfg = tabsConfig[key];
    if (!cfg) return;
    const btn = document.createElement('button');
    btn.className = 'sheet-item';
    btn.dataset.tab = key;
    btn.innerHTML = `${cfg.icon}<span>${cfg.title}</span>`;
    btn.onclick = () => { unlockScroll(); navigateTo(key); };
    sheetGrid.appendChild(btn);
  });
}

// ========== لوحة التحكم ==========
async function loadDashboard() {
  try {
    const [invoices, payments, customers, suppliers, expenses] = await Promise.all([
      apiCall('/invoices', 'GET'), apiCall('/payments', 'GET'),
      apiCall('/customers', 'GET'), apiCall('/suppliers', 'GET'),
      apiCall('/expenses', 'GET')
    ]);

    const totalSales = invoices.filter(i => i.type === 'sale').reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const netProfit = totalSales - totalPurchases - (expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0));
    const receivables = customers.reduce((s, c) => s + parseFloat(c.balance || 0), 0);
    const payables = suppliers.reduce((s, s2) => s + parseFloat(s2.balance || 0), 0);
    const cashIn = payments.filter(p => p.customer_id).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const cashOut = payments.filter(p => p.supplier_id).reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const cashBalance = cashIn - cashOut;

    const html = `
      <div class="stats-grid">
        <div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value ${netProfit>=0?'positive':'negative'}" style="font-size:24px;">${formatNumber(netProfit)}</div></div>
        <div class="stat-card cash"><div class="stat-label">رصيد الصندوق</div><div class="stat-value ${cashBalance>=0?'positive':'negative'}">${formatNumber(cashBalance)}</div></div>
        <div class="stat-card receivables"><div class="stat-label">الذمم المدينة</div><div class="stat-value">${formatNumber(receivables)}</div></div>
        <div class="stat-card payables"><div class="stat-label">الذمم الدائنة</div><div class="stat-value">${formatNumber(payables)}</div></div>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-primary" id="btn-export-data">📤 تصدير البيانات</button>
          <button class="btn btn-sm btn-secondary" id="btn-import-data">📥 استيراد البيانات</button>
          <button class="btn btn-sm btn-secondary" id="btn-sync-manual">🔄 مزامنة الآن</button>
        </div>
      </div>
      <div class="chart-card"><div class="chart-title">المبيعات vs المشتريات</div><canvas id="incomeChart"></canvas></div>
    `;
    document.getElementById('tab-content').innerHTML = html;

    new Chart(document.getElementById('incomeChart'), {
      type: 'doughnut',
      data: { labels: ['مبيعات', 'مشتريات'], datasets: [{ data: [totalSales, totalPurchases], backgroundColor: ['#10b981', '#f59e0b'], borderWidth: 0 }] },
      options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Tajawal' } } } } }
    });

    document.getElementById('btn-export-data').onclick = async () => {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `alrajhi-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      showToast('تم تصدير البيانات بنجاح', 'success');
    };

    document.getElementById('btn-import-data').onclick = () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        if (await confirmDialog('سيتم استبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
          await importAllData(text);
          showToast('تم استيراد البيانات بنجاح', 'success');
          loadDashboard();
        }
      };
      input.click();
    };

    document.getElementById('btn-sync-manual').onclick = () => syncManager.syncNow();
  } catch (err) { showToast(err.message, 'error'); }
}

// ========== تحميل المواد ==========
async function loadItems() {
  try {
    itemsCache = await apiCall('/items', 'GET');
    const html = `
      <div class="card">
        <div class="card-header">
          <div><h3 class="card-title">المواد</h3><span class="card-subtitle">إدارة المخزون والمنتجات</span></div>
          <button class="btn btn-primary btn-sm" id="btn-add-item">${ICONS.plus} إضافة</button>
        </div>
        <div class="form-group" style="margin-bottom:0;"><input type="text" class="input" id="items-search" placeholder="البحث في المواد..."></div>
      </div>
      <div id="items-list"></div>
    `;
    document.getElementById('tab-content').innerHTML = html;
    document.getElementById('btn-add-item').addEventListener('click', showAddItemModal);
    document.getElementById('items-search').addEventListener('input', debounce(renderFilteredItems, 200));
    renderFilteredItems();
  } catch (err) { showToast(err.message, 'error'); }
}

function renderFilteredItems() {
  const q = (document.getElementById('items-search')?.value || '').trim().toLowerCase();
  const filtered = itemsCache.filter(i => (i.name || '').toLowerCase().includes(q));
  const container = document.getElementById('items-list');
  if (!filtered.length) return container.innerHTML = emptyState('لا توجد مواد مطابقة', 'يمكنك إضافة مواد جديدة من الزر أعلاه');

  let html = '<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الكمية</th><th>سعر الشراء</th><th>سعر البيع</th><th>إجراءات</th></tr></thead><tbody>';
  filtered.forEach(item => {
    html += `<tr>
      <td style="font-weight:700;">${item.name}</td>
      <td>${item.quantity || 0}</td>
      <td>${formatNumber(item.purchase_price)}</td>
      <td>${formatNumber(item.selling_price)}</td>
      <td>
        <button class="btn btn-secondary btn-sm edit-item-btn" data-id="${item.id}">${ICONS.edit}</button>
        <button class="btn btn-danger btn-sm delete-item-btn" data-id="${item.id}">${ICONS.trash}</button>
      </td>
    </tr>`;
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;

  container.querySelectorAll('.edit-item-btn').forEach(b => b.addEventListener('click', e => {
    const id = e.target.closest('button').dataset.id;
    showEditItemModal(id);
  }));
  container.querySelectorAll('.delete-item-btn').forEach(b => b.addEventListener('click', async e => {
    const id = e.target.closest('button').dataset.id;
    const item = itemsCache.find(i => i.id == id);
    if (await confirmDialog(`حذف ${item?.name}؟`)) {
      try { await apiCall(`/items?id=${id}`, 'DELETE'); showToast('تم الحذف', 'success'); loadItems(); }
      catch (err) { showToast(err.message, 'error'); }
    }
  }));
}

// ========== إضافة / تعديل مادة ==========
function showAddItemModal() {
  const body = `
    <div class="form-group"><label class="form-label">اسم المادة</label><input class="input" id="fm-name" type="text" placeholder="اسم المادة"></div>
    <div class="form-group"><label class="form-label">سعر الشراء</label><input class="input" id="fm-purchase_price" type="number" step="0.01" placeholder="0.00"></div>
    <div class="form-group"><label class="form-label">سعر البيع</label><input class="input" id="fm-selling_price" type="number" step="0.01" placeholder="0.00"></div>
    <div class="form-group"><label class="form-label">الكمية الافتتاحية</label><input class="input" id="fm-quantity" type="number" step="any" placeholder="0"></div>
  `;
  const modal = openModal({
    title: 'إضافة مادة جديدة',
    bodyHTML: body,
    footerHTML: `<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">${ICONS.check} حفظ</button>`
  });
  modal.element.querySelector('#fm-cancel').onclick = () => modal.close();
  modal.element.querySelector('#fm-save').onclick = async () => {
    const values = {
      name: modal.element.querySelector('#fm-name').value.trim(),
      purchase_price: parseFloat(modal.element.querySelector('#fm-purchase_price').value) || 0,
      selling_price: parseFloat(modal.element.querySelector('#fm-selling_price').value) || 0,
      quantity: parseFloat(modal.element.querySelector('#fm-quantity').value) || 0
    };
    if (!values.name) return showToast('اسم المادة مطلوب', 'warning');
    try {
      await apiCall('/items', 'POST', values);
      modal.close();
      showToast('تم الحفظ', 'success');
      loadItems();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

function showEditItemModal(id) {
  const item = itemsCache.find(i => i.id == id);
  if (!item) return;
  const body = `
    <div class="form-group"><label class="form-label">اسم المادة</label><input class="input" id="fm-name" type="text" value="${item.name || ''}"></div>
    <div class="form-group"><label class="form-label">سعر الشراء</label><input class="input" id="fm-purchase_price" type="number" step="0.01" value="${item.purchase_price || 0}"></div>
    <div class="form-group"><label class="form-label">سعر البيع</label><input class="input" id="fm-selling_price" type="number" step="0.01" value="${item.selling_price || 0}"></div>
    <div class="form-group"><label class="form-label">الكمية</label><input class="input" id="fm-quantity" type="number" step="any" value="${item.quantity || 0}"></div>
  `;
  const modal = openModal({
    title: 'تعديل المادة',
    bodyHTML: body,
    footerHTML: `<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">${ICONS.check} حفظ</button>`
  });
  modal.element.querySelector('#fm-cancel').onclick = () => modal.close();
  modal.element.querySelector('#fm-save').onclick = async () => {
    const values = {
      name: modal.element.querySelector('#fm-name').value.trim(),
      purchase_price: parseFloat(modal.element.querySelector('#fm-purchase_price').value) || 0,
      selling_price: parseFloat(modal.element.querySelector('#fm-selling_price').value) || 0,
      quantity: parseFloat(modal.element.querySelector('#fm-quantity').value) || 0
    };
    try {
      await apiCall('/items', 'PUT', { id, ...values });
      modal.close();
      showToast('تم الحفظ', 'success');
      loadItems();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// ========== الأقسام العامة (عملاء، موردين، تصنيفات) ==========
async function loadGenericSection(endpoint, cacheKey) {
  try {
    const data = await apiCall(endpoint, 'GET');
    if (cacheKey === 'customers') customersCache = data;
    else if (cacheKey === 'suppliers') suppliersCache = data;
    else if (cacheKey === 'categories') categoriesCache = data;

    const nameField = 'name';
    const titles = {
      customers: 'العملاء', suppliers: 'الموردين', categories: 'التصنيفات'
    };
    const title = titles[cacheKey] || cacheKey;

    let html = `<div class="card"><div class="card-header"><div><h3 class="card-title">${title}</h3></div><button class="btn btn-primary btn-sm add-btn" data-type="${cacheKey}">${ICONS.plus} إضافة</button></div></div>`;
    if (!data || !data.length) {
      html += emptyState(`لا يوجد ${title}`, 'ابدأ بإضافة أول سجل');
    } else {
      data.forEach(item => {
        html += `<div class="card card-hover" style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:800;font-size:15px;">${item[nameField]}</div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-secondary btn-sm edit-btn" data-id="${item.id}" data-type="${cacheKey}">${ICONS.edit}</button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}" data-type="${cacheKey}">${ICONS.trash}</button>
            </div>
          </div>
        </div>`;
      });
    }
    document.getElementById('tab-content').innerHTML = html;
  } catch (err) { showToast(err.message, 'error'); }
}

// ========== الوحدات ==========
async function loadUnitsSection() {
  try {
    unitsCache = await apiCall('/definitions?type=unit', 'GET');
    let html = `<div class="card"><div class="card-header"><div><h3 class="card-title">وحدات القياس</h3></div><button class="btn btn-primary btn-sm" id="btn-add-unit">${ICONS.plus} إضافة</button></div></div>`;
    if (!unitsCache.length) {
      html += emptyState('لا توجد وحدات', 'أضف وحدة قياس جديدة');
    } else {
      html += '<div class="table-wrap"><table class="table"><thead><tr><th>الوحدة</th><th>الاختصار</th><th>إجراءات</th></tr></thead><tbody>';
      unitsCache.forEach(u => {
        html += `<tr><td style="font-weight:700;">${u.name}</td><td>${u.abbreviation || '-'}</td>
          <td><button class="btn btn-secondary btn-sm edit-unit-btn" data-id="${u.id}">${ICONS.edit}</button>
          <button class="btn btn-danger btn-sm delete-unit-btn" data-id="${u.id}">${ICONS.trash}</button></td></tr>`;
      });
      html += '</tbody></table></div>';
    }
    document.getElementById('tab-content').innerHTML = html;

    document.getElementById('btn-add-unit')?.addEventListener('click', showAddUnitModal);
    document.querySelectorAll('.edit-unit-btn').forEach(b => b.addEventListener('click', e => {
      const id = e.target.closest('button').dataset.id;
      const unit = unitsCache.find(u => u.id == id);
      if (!unit) return;
      showFormModal('تعديل وحدة', [{ id: 'name', label: 'الاسم' }, { id: 'abbreviation', label: 'الاختصار' }],
        { name: unit.name, abbreviation: unit.abbreviation || '' },
        async (v) => apiCall('/definitions?type=unit', 'PUT', { type: 'unit', id, ...v }),
        () => loadUnitsSection()
      );
    }));
    document.querySelectorAll('.delete-unit-btn').forEach(b => b.addEventListener('click', async e => {
      const id = e.target.closest('button').dataset.id;
      const u = unitsCache.find(x => x.id == id);
      if (await confirmDialog(`حذف ${u?.name}؟`)) {
        await apiCall(`/definitions?type=unit&id=${id}`, 'DELETE');
        showToast('تم الحذف', 'success');
        loadUnitsSection();
      }
    }));
  } catch (err) { showToast(err.message, 'error'); }
}

function showAddUnitModal() {
  showFormModal('إضافة وحدة', [{ id: 'name', label: 'اسم الوحدة' }, { id: 'abbreviation', label: 'الاختصار' }],
    {}, async (v) => apiCall('/definitions?type=unit', 'POST', { type: 'unit', ...v }),
    () => loadUnitsSection()
  );
}

// ========== نموذج عام ==========
function showFormModal(title, fields, initialValues, onSave, onSuccess) {
  const formId = 'frm-' + Date.now();
  let body = '';
  fields.forEach(f => {
    const val = initialValues[f.id] !== undefined ? initialValues[f.id] : '';
    body += `<div class="form-group"><label class="form-label">${f.label}</label><input class="input" id="${formId}-${f.id}" type="${f.type || 'text'}" value="${val}" placeholder="${f.placeholder || ''}"></div>`;
  });
  const modal = openModal({
    title,
    bodyHTML: body,
    footerHTML: `<button class="btn btn-secondary" id="${formId}-cancel">إلغاء</button><button class="btn btn-primary" id="${formId}-save">${ICONS.check} حفظ</button>`
  });
  modal.element.querySelector(`#${formId}-cancel`).onclick = () => modal.close();
  modal.element.querySelector(`#${formId}-save`).onclick = async () => {
    const values = {};
    fields.forEach(f => {
      const el = modal.element.querySelector(`#${formId}-${f.id}`);
      if (el) values[f.id] = el.value.trim();
    });
    try {
      await onSave(values);
      modal.close();
      showToast('تم الحفظ', 'success');
      if (onSuccess) onSuccess();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// ========== الفواتير ==========
async function showInvoiceModal(type) {
  try {
    [customersCache, suppliersCache, itemsCache] = await Promise.all([
      apiCall('/customers', 'GET'), apiCall('/suppliers', 'GET'), apiCall('/items', 'GET')
    ]);
    const entOpts = type === 'sale'
      ? `<option value="cash">عميل نقدي</option>${customersCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}`
      : `<option value="cash">مورد نقدي</option>${suppliersCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}`;

    const body = `
      <input type="hidden" id="inv-type" value="${type}">
      <div class="invoice-lines" id="inv-lines">
        <div class="line-row">
          <div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>${itemsCache.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
          <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div>
          <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div>
          <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-add-line" style="width:auto;margin-bottom:16px;">${ICONS.plus} إضافة بند</button>
      <div class="form-group"><label class="form-label">${type === 'sale' ? 'العميل' : 'المورد'}</label><select class="select" id="inv-entity">${entOpts}</select></div>
      <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="inv-date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">الرقم المرجعي</label><input type="text" class="input" id="inv-ref" placeholder="رقم الفاتورة"></div>
      <div style="background:var(--bg);border-radius:12px;padding:16px;display:flex;justify-content:space-between;">
        <span>الإجمالي:</span><span id="inv-grand-total" style="font-size:22px;font-weight:900;color:var(--primary);">0.00</span>
      </div>
    `;
    const modal = openModal({
      title: `فاتورة ${type === 'sale' ? 'مبيعات' : 'مشتريات'}`,
      bodyHTML: body,
      footerHTML: `<button class="btn btn-secondary" id="inv-cancel">إلغاء</button><button class="btn btn-primary" id="inv-save">${ICONS.check} حفظ</button>`
    });

    const container = modal.element;
    function updateGrandTotal() {
      let total = 0;
      container.querySelectorAll('.total-input').forEach(inp => total += parseFloat(inp.value) || 0);
      container.querySelector('#inv-grand-total').textContent = formatNumber(total);
    }
    function calc(row) {
      const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
      const pr = parseFloat(row.querySelector('.price-input')?.value) || 0;
      const tot = row.querySelector('.total-input');
      if (tot) { tot.value = (qty * pr).toFixed(2); updateGrandTotal(); }
    }
    container.querySelectorAll('.line-row').forEach(row => {
      const sel = row.querySelector('.item-select'), pr = row.querySelector('.price-input');
      sel.addEventListener('change', () => {
        const item = itemsCache.find(i => i.id == sel.value);
        if (item) { pr.value = type === 'sale' ? (item.selling_price || 0) : (item.purchase_price || 0); calc(row); }
      });
      row.querySelector('.qty-input')?.addEventListener('input', () => calc(row));
      row.querySelector('.price-input')?.addEventListener('input', () => calc(row));
    });

    container.querySelector('#btn-add-line').addEventListener('click', () => {
      const nl = document.createElement('div'); nl.className = 'line-row';
      nl.innerHTML = `
        <div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>${itemsCache.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
        <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div>
        <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div>
        <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div>
        <button class="line-remove" title="حذف">${ICONS.trash}</button>`;
      container.querySelector('#inv-lines').appendChild(nl);
      const sel = nl.querySelector('.item-select'), pr = nl.querySelector('.price-input');
      sel.addEventListener('change', () => {
        const item = itemsCache.find(i => i.id == sel.value);
        if (item) { pr.value = type === 'sale' ? (item.selling_price || 0) : (item.purchase_price || 0); calc(nl); }
      });
      nl.querySelector('.qty-input').addEventListener('input', () => calc(nl));
      nl.querySelector('.price-input').addEventListener('input', () => calc(nl));
      nl.querySelector('.line-remove').addEventListener('click', () => { nl.remove(); updateGrandTotal(); });
    });

    container.querySelector('#inv-cancel').onclick = () => modal.close();
    container.querySelector('#inv-save').onclick = async () => {
      const lines = [];
      container.querySelectorAll('.line-row').forEach(row => {
        const id = row.querySelector('.item-select')?.value || null;
        const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
        const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
        const total = parseFloat(row.querySelector('.total-input')?.value) || 0;
        if (id || qty > 0) lines.push({ item_id: id, quantity: qty, unit_price: price, total });
      });
      if (!lines.length) return showToast('أضف بنداً واحداً على الأقل', 'error');
      const entity = container.querySelector('#inv-entity').value;
      try {
        const btn = container.querySelector('#inv-save');
        btn.disabled = true; btn.innerHTML = '⏳ جاري الحفظ...';
        await apiCall('/invoices', 'POST', {
          type, customer_id: type === 'sale' && entity !== 'cash' ? entity : null,
          supplier_id: type === 'purchase' && entity !== 'cash' ? entity : null,
          date: container.querySelector('#inv-date').value,
          reference: container.querySelector('#inv-ref').value.trim(),
          lines, total: parseFloat(container.querySelector('#inv-grand-total').textContent.replace(/,/g,'')) || 0,
          paid_amount: 0
        });
        modal.close(); showToast('تم الحفظ', 'success'); loadInvoices();
      } catch (e) { showToast(e.message, 'error'); btn.disabled = false; btn.innerHTML = `${ICONS.check} حفظ`; }
    };
  } catch (err) { showToast(err.message, 'error'); }
}

// ========== الفواتير - عرض ==========
async function loadInvoices() {
  try {
    invoicesCache = await apiCall('/invoices', 'GET');
    let html = `<div class="card"><div class="card-header"><div><h3 class="card-title">الفواتير</h3></div></div>
      <div class="filter-bar">
        <button class="filter-pill active" data-filter="all">الكل</button>
        <button class="filter-pill" data-filter="sale">مبيعات</button>
        <button class="filter-pill" data-filter="purchase">مشتريات</button>
      </div></div><div id="inv-list"></div>`;
    document.getElementById('tab-content').innerHTML = html;
    document.querySelectorAll('.filter-pill').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.filter-pill').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        renderFilteredInvoices();
      });
    });
    renderFilteredInvoices();
  } catch (err) { showToast(err.message, 'error'); }
}

function renderFilteredInvoices() {
  const filt = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
  let data = invoicesCache;
  if (filt !== 'all') data = data.filter(inv => inv.type === filt);
  const container = document.getElementById('inv-list');
  if (!data.length) return container.innerHTML = emptyState('لا توجد فواتير', '');
  let html = '';
  data.forEach(inv => {
    const typeLabel = inv.type === 'sale' ? 'بيع' : 'شراء';
    html += `<div class="card card-hover">
      <div style="display:flex;justify-content:space-between;">
        <div><span style="background:${inv.type==='sale'?'var(--success-light)':'var(--warning-light)'};color:${inv.type==='sale'?'var(--success)':'var(--warning)'};padding:2px 10px;border-radius:20px;font-size:12px;">${typeLabel}</span> ${inv.reference || ''}</div>
        <div style="font-weight:900;font-size:20px;">${formatNumber(inv.total)}</div>
      </div>
      <div style="margin-top:8px;font-size:13px;color:var(--text-muted);">${formatDate(inv.date)} · مدفوع: ${formatNumber(inv.paid||0)} · باقي: ${formatNumber(inv.balance||0)}</div>
      <div style="margin-top:8px;display:flex;gap:6px;">
        <button class="btn btn-danger btn-sm delete-inv-btn" data-id="${inv.id}">${ICONS.trash} حذف</button>
      </div>
    </div>`;
  });
  container.innerHTML = html;
  container.querySelectorAll('.delete-inv-btn').forEach(b => b.addEventListener('click', async e => {
    const id = e.target.closest('button').dataset.id;
    if (await confirmDialog('حذف الفاتورة؟')) {
      await apiCall(`/invoices?id=${id}`, 'DELETE');
      showToast('تم الحذف', 'success');
      loadInvoices();
    }
  }));
}

// ========== المدفوعات ==========
async function loadPayments() {
  try {
    const payments = await apiCall('/payments', 'GET');
    let html = `<div class="card"><div class="card-header"><div><h3 class="card-title">الدفعات</h3></div><button class="btn btn-primary btn-sm" id="btn-add-pmt">${ICONS.plus} إضافة</button></div></div>`;
    payments.forEach(p => {
      const isIn = !!p.customer_id;
      html += `<div class="card" style="border-right:3px solid ${isIn?'var(--success)':'var(--danger)'};">
        <div style="display:flex;justify-content:space-between;">
          <div style="font-weight:900;font-size:20px;color:${isIn?'var(--success)':'var(--danger)'};">${isIn?'+':'-'} ${formatNumber(p.amount)}</div>
          <button class="btn btn-ghost btn-sm delete-pmt-btn" data-id="${p.id}">${ICONS.trash}</button>
        </div>
        <div style="font-size:13px;color:var(--text-muted);">${formatDate(p.payment_date)} · ${p.notes || ''}</div>
      </div>`;
    });
    document.getElementById('tab-content').innerHTML = html;
    document.getElementById('btn-add-pmt')?.addEventListener('click', showAddPaymentModal);
    document.querySelectorAll('.delete-pmt-btn').forEach(b => b.addEventListener('click', async e => {
      const id = e.target.closest('button').dataset.id;
      if (await confirmDialog('حذف الدفعة؟')) {
        await apiCall(`/payments?id=${id}`, 'DELETE');
        showToast('تم الحذف', 'success');
        loadPayments();
      }
    }));
  } catch (err) { showToast(err.message, 'error'); }
}

function showAddPaymentModal() {
  const body = `
    <div class="form-group"><label class="form-label">النوع</label><select class="select" id="pmt-type"><option value="customer">مقبوضات من عميل</option><option value="supplier">مدفوعات إلى مورد</option></select></div>
    <div class="form-group" id="pmt-cust-block"><label class="form-label">العميل</label><select class="select" id="pmt-customer"><option value="">اختر عميل</option>${customersCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
    <div class="form-group" id="pmt-supp-block" style="display:none"><label class="form-label">المورد</label><select class="select" id="pmt-supplier"><option value="">اختر مورد</option>${suppliersCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
    <div class="form-group"><label class="form-label">المبلغ</label><input type="number" step="0.01" class="input" id="pmt-amount" placeholder="0.00"></div>
    <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="pmt-date" value="${new Date().toISOString().split('T')[0]}"></div>
    <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="textarea" id="pmt-notes"></textarea></div>
  `;
  const modal = openModal({ title: 'تسجيل دفعة', bodyHTML: body, footerHTML: `<button class="btn btn-secondary" id="pmt-cancel">إلغاء</button><button class="btn btn-primary" id="pmt-save">${ICONS.check} حفظ</button>` });
  modal.element.querySelector('#pmt-type').addEventListener('change', function() {
    document.getElementById('pmt-cust-block').style.display = this.value === 'customer' ? 'block' : 'none';
    document.getElementById('pmt-supp-block').style.display = this.value === 'supplier' ? 'block' : 'none';
  });
  modal.element.querySelector('#pmt-cancel').onclick = () => modal.close();
  modal.element.querySelector('#pmt-save').onclick = async () => {
    const type = modal.element.querySelector('#pmt-type').value;
    const amount = parseFloat(modal.element.querySelector('#pmt-amount').value);
    if (!amount || amount <= 0) return showToast('المبلغ مطلوب', 'error');
    try {
      await apiCall('/payments', 'POST', {
        customer_id: type === 'customer' ? (modal.element.querySelector('#pmt-customer').value || null) : null,
        supplier_id: type === 'supplier' ? (modal.element.querySelector('#pmt-supplier').value || null) : null,
        amount, payment_date: modal.element.querySelector('#pmt-date').value,
        notes: modal.element.querySelector('#pmt-notes').value.trim()
      });
      modal.close(); showToast('تم الحفظ', 'success'); loadPayments();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// ========== المصاريف ==========
async function loadExpenses() {
  try {
    const expenses = await apiCall('/expenses', 'GET');
    let html = `<div class="card"><div class="card-header"><div><h3 class="card-title">المصاريف</h3></div><button class="btn btn-primary btn-sm" id="btn-add-exp">${ICONS.plus} إضافة</button></div></div>`;
    expenses.forEach(ex => {
      html += `<div class="card" style="border-right:3px solid var(--danger);display:flex;justify-content:space-between;">
        <div><div style="font-weight:900;font-size:20px;color:var(--danger);">${formatNumber(ex.amount)}</div><div style="font-size:13px;">${formatDate(ex.expense_date)} · ${ex.description || ''}</div></div>
        <button class="btn btn-ghost btn-sm delete-exp-btn" data-id="${ex.id}">${ICONS.trash}</button>
      </div>`;
    });
    document.getElementById('tab-content').innerHTML = html;
    document.getElementById('btn-add-exp').addEventListener('click', () => showFormModal('إضافة مصروف', [
      { id: 'amount', label: 'المبلغ', type: 'number' }, { id: 'expense_date', label: 'التاريخ', type: 'date' }, { id: 'description', label: 'الوصف' }
    ], { expense_date: new Date().toISOString().split('T')[0] }, v => apiCall('/expenses', 'POST', { ...v, amount: parseFloat(v.amount) }), () => loadExpenses()));
    document.querySelectorAll('.delete-exp-btn').forEach(b => b.addEventListener('click', async e => {
      if (await confirmDialog('حذف المصروف؟')) { await apiCall(`/expenses?id=${e.target.closest('button').dataset.id}`, 'DELETE'); loadExpenses(); }
    }));
  } catch (err) { showToast(err.message, 'error'); }
}

// ========== التقارير ==========
function loadReports() {
  document.getElementById('tab-content').innerHTML = `
    <div class="card"><h3 class="card-title">التقارير المالية</h3></div>
    <div class="report-card" data-report="summary"><div class="report-icon">${ICONS.chart}</div><div class="report-info"><h4>ملخص الحسابات</h4><p>نظرة شاملة</p></div></div>
  `;
  document.querySelector('.report-card').addEventListener('click', loadDashboard);
}

// ========== المساعدة ==========
function showHelpModal() {
  openModal({
    title: 'مركز المساعدة',
    bodyHTML: `<div style="line-height:1.8;"><p>مرحباً بك في <strong>نظام الراجحي للمحاسبة</strong> - النسخة المستقلة.</p>
      <ul style="padding-right:20px;margin-bottom:16px;">
        <li>يعمل التطبيق بدون إنترنت</li>
        <li>البيانات مخزنة محلياً في المتصفح</li>
        <li>يمكنك تصدير واستيراد البيانات للنسخ الاحتياطي</li>
        <li>عند الاتصال بالإنترنت، يمكن مزامنة البيانات مع الخادم</li>
      </ul>
      <div style="background:var(--bg);border-radius:12px;padding:16px;">
        <div style="font-weight:700;margin-bottom:4px;">💡 نصائح</div>
        <div style="font-size:13px;">قم بتصدير بياناتك دورياً من لوحة التحكم للنسخ الاحتياطي.</div>
      </div></div>`
  });
}

// ========== مستمعات الأحداث الثابتة ==========
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.querySelector('.sheet-backdrop')?.addEventListener('click', () => {
  document.getElementById('more-menu').style.display = 'none';
  unlockScroll();
});

document.querySelectorAll('.bottom-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    if (tabName === 'more') {
      showMoreMenu();
    } else if (tabName) {
      navigateTo(tabName);
    }
  });
});

document.getElementById('btn-help').addEventListener('click', showHelpModal);
document.getElementById('btn-sync-now').addEventListener('click', () => syncManager.syncNow());

// مستمع للأزرار العامة (add/edit/delete)
document.addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;

  if (t.classList.contains('add-btn')) {
    const type = t.dataset.type;
    const titles = { customers: 'عميل', suppliers: 'مورد', categories: 'تصنيف' };
    const endpoints = { customers: '/customers', suppliers: '/suppliers', categories: '/definitions?type=category' };
    showFormModal(`إضافة ${titles[type]}`, [
      { id: 'name', label: 'الاسم', placeholder: `اسم ${titles[type]}` }
    ], {}, async (v) => {
      if (!v.name) throw new Error('الاسم مطلوب');
      return apiCall(endpoints[type], 'POST', type === 'categories' ? { type: 'category', name: v.name } : { name: v.name });
    }, () => loadGenericSection(endpoints[type], type));
  } else if (t.classList.contains('edit-btn')) {
    const type = t.dataset.type;
    const id = t.dataset.id;
    const caches = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
    const item = caches[type]?.find(x => x.id == id);
    if (!item) return;
    const endpoints = { customers: '/customers', suppliers: '/suppliers', categories: '/definitions?type=category' };
    showFormModal('تعديل', [{ id: 'name', label: 'الاسم' }], { name: item.name || '' },
      async (v) => apiCall(endpoints[type], 'PUT', type === 'categories' ? { type: 'category', id, name: v.name } : { id, name: v.name }),
      () => loadGenericSection(endpoints[type], type)
    );
  } else if (t.classList.contains('delete-btn')) {
    const type = t.dataset.type;
    const id = t.dataset.id;
    const caches = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
    const item = caches[type]?.find(x => x.id == id);
    const delUrls = { customers: `/customers?id=${id}`, suppliers: `/suppliers?id=${id}`, categories: `/definitions?type=category&id=${id}` };
    if (await confirmDialog(`حذف ${item?.name || ''}؟`)) {
      await apiCall(delUrls[type], 'DELETE');
      showToast('تم الحذف', 'success');
      const endpoints = { customers: '/customers', suppliers: '/suppliers', categories: '/definitions?type=category' };
      loadGenericSection(endpoints[type], type);
    }
  }
});

// ========== بدء التطبيق ==========
async function initApp() {
  try {
    // محاولة المصادقة
    const env = getEnvironment();
    if (!env.isTelegram) {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // وضع Offline بدون مصادقة
        localStorage.setItem('user_id', 'offline_user');
        localStorage.setItem('user_name', 'مستخدم');
      }
    }

    // تحديث واجهة المستخدم
    const userName = localStorage.getItem('user_name') || 'مستخدم';
    document.getElementById('user-name-sidebar').textContent = userName;
    document.getElementById('user-avatar').textContent = (userName[0] || 'م').toUpperCase();

    // تهيئة التنقل
    initNavigation();

    // تحميل البيانات الأولية
    [itemsCache, customersCache, suppliersCache, invoicesCache, categoriesCache, unitsCache] = await Promise.all([
      apiCall('/items', 'GET'), apiCall('/customers', 'GET'), apiCall('/suppliers', 'GET'),
      apiCall('/invoices', 'GET'), apiCall('/definitions?type=category', 'GET'), apiCall('/definitions?type=unit', 'GET')
    ]);

    // إظهار التطبيق
    document.getElementById('loading-screen').classList.add('hidden');
    loadDashboard();

    // إظهار مؤشر الاتصال
    const indicator = document.getElementById('connection-indicator');
    if (indicator) {
      indicator.style.display = 'block';
      const updateStatus = () => {
        indicator.textContent = navigator.onLine ? '● متصل' : '● Offline';
        indicator.className = 'connection-status ' + (navigator.onLine ? 'online' : 'offline');
      };
      updateStatus();
      window.addEventListener('online', updateStatus);
      window.addEventListener('offline', updateStatus);
    }

    console.log('✅ تطبيق الراجحي Offline-First جاهز');
  } catch (err) {
    console.error('فشل بدء التطبيق:', err);
    document.getElementById('loading-screen').innerHTML = `<div style="color:var(--danger);font-size:18px;text-align:center;padding:20px;">❌<br><br>${err.message}</div>`;
  }
}

initApp();
