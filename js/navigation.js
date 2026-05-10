// js/navigation.js — الملاحة مع التحميل الديناميكي
import { ICONS, unlockScroll } from './core.js';

export let currentTab = 'dashboard';

export const tabsConfig = {
  dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة عامة على أداء عملك', icon: ICONS.home },
  items: { title: 'المواد', subtitle: 'إدارة المخزون والمنتجات', icon: ICONS.box },
  'sale-invoice': { title: 'فاتورة بيع', subtitle: 'إنشاء فاتورة مبيعات جديدة', icon: ICONS.cart },
  'purchase-invoice': { title: 'فاتورة شراء', subtitle: 'إنشاء فاتورة مشتريات جديدة', icon: ICONS.download },
  customers: { title: 'العملاء', subtitle: 'قائمة العملاء والذمم المدينة', icon: ICONS.users },
  suppliers: { title: 'الموردين', subtitle: 'قائمة الموردين والذمم الدائنة', icon: ICONS.factory },
  categories: { title: 'التصنيفات', subtitle: 'تصنيفات المواد', icon: ICONS.tag },
  vouchers: { title: 'السندات', subtitle: 'سندات القبض والصرف والمصاريف', icon: ICONS.fileText },
  invoices: { title: 'الفواتير', subtitle: 'سجل الفواتير والحركات', icon: ICONS.fileText },
  reports: { title: 'التقارير', subtitle: 'التقارير المالية والإحصائيات', icon: ICONS.chart },
  more: { title: 'المزيد', icon: ICONS.info }
};

export function setActiveTab(tabName) {
  document.querySelectorAll('.nav-item, .bottom-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tabName);
  });
  const cfg = tabsConfig[tabName];
  document.getElementById('page-title').textContent = cfg?.title || '';
  document.getElementById('page-subtitle').textContent = cfg?.subtitle || '';
}

export function navigateTo(tabName) {
  currentTab = tabName;
  setActiveTab(tabName);
  document.getElementById('more-menu').style.display = 'none';
  document.getElementById('sidebar').classList.remove('open');
  if (document.body.style.position === 'fixed') unlockScroll();

  const content = document.getElementById('tab-content');
  content.style.opacity = '0';
  content.style.transform = 'translateY(12px)';

  setTimeout(async () => {
    try {
      switch (tabName) {
        case 'dashboard': { const m = await import('./dashboard.js'); m.loadDashboard(); break; }
        case 'items': { const m = await import('./items.js'); m.loadItems(); break; }
        case 'sale-invoice': { const m = await import('./invoices.js'); m.showInvoiceModal('sale'); break; }
        case 'purchase-invoice': { const m = await import('./invoices.js'); m.showInvoiceModal('purchase'); break; }
        case 'customers': { const m = await import('./sections.js'); m.loadGenericSection(m.getSectionOptions('/customers')); break; }
        case 'suppliers': { const m = await import('./sections.js'); m.loadGenericSection(m.getSectionOptions('/suppliers')); break; }
        case 'categories': { const m = await import('./sections.js'); m.loadGenericSection(m.getSectionOptions('/definitions?type=category')); break; }
        case 'vouchers': { const m = await import('./vouchers.js'); m.loadVouchers(); break; }
        case 'invoices': { const m = await import('./invoices.js'); m.loadInvoices(); break; }
        case 'reports': { const m = await import('./reports.js'); m.loadReports(); break; }
        case 'more': showMoreMenu(); break;
      }
    } catch (e) {
      const { showToast } = await import('./modal.js');
      showToast(e.message, 'error');
    }

    requestAnimationFrame(() => {
      content.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    });
  }, 60);
}

function showMoreMenu() {
  document.getElementById('more-menu').style.display = 'flex';
  unlockScroll(); // استخدام unlock بدلاً من lock ليكون متسقاً
}

export function initNavigation() {
  const sidebarNav = document.getElementById('sidebar-nav');
  const sheetGrid = document.getElementById('sheet-grid');

  const mainTabs = ['dashboard', 'items', 'sale-invoice', 'purchase-invoice', 'customers', 'suppliers', 'categories', 'vouchers', 'invoices', 'reports'];
  const moreTabs = ['purchase-invoice', 'customers', 'suppliers', 'categories', 'vouchers', 'reports'];

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

// ربط أحداث الواجهة
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

const moreBackdrop = document.querySelector('.sheet-backdrop');
if (moreBackdrop) {
  moreBackdrop.addEventListener('click', () => {
    document.getElementById('more-menu').style.display = 'none';
    unlockScroll();
  });
}

document.querySelectorAll('.bottom-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    if (tabName === 'more') showMoreMenu();
    else if (tabName) navigateTo(tabName);
  });
});

// زر المساعدة
document.getElementById('btn-help').addEventListener('click', () => {
  import('./modal.js').then(m => m.openModal({
    title: 'مركز المساعدة',
    bodyHTML: `
      <div style="line-height:1.9;">
        <p style="margin-bottom:16px; font-size:15px;">مرحباً بك في <strong style="color:var(--primary);">نظام الراجحي للمحاسبة</strong> (نسخة Offline).</p>
        <ul style="padding-right:24px; margin-bottom:20px; display:flex; flex-direction:column; gap:8px;">
          <li>إدارة المواد والعملاء والموردين</li>
          <li>إنشاء فواتير المبيعات والمشتريات</li>
          <li>تسجيل الدفعات والسندات والمصاريف</li>
          <li>عرض التقارير المالية المتكاملة</li>
          <li>طباعة الفواتير بتنسيقات متعددة</li>
        </ul>
        <div style="background:var(--bg); border-radius:16px; padding:20px; border:1px solid var(--border);">
          <div style="font-weight:800; margin-bottom:8px; font-size:15px;">💡 وضع Offline</div>
          <div style="font-size:13px; color:var(--text-secondary); line-height:1.7;">
            جميع بياناتك تُخزن محلياً في المتصفح. لا حاجة للإنترنت. يمكنك تصدير بياناتك كنسخة احتياطية.
          </div>
        </div>
      </div>`
  }));
});
