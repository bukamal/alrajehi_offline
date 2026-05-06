import { tabsConfig } from './constants.js';
import { lockScroll, unlockScroll, showToast } from './utils.js';
import { refreshCaches } from './db.js';
import { loadUnitsSection } from './units.js';
import { loadItems } from './items.js';
import { showInvoiceModal, loadInvoices } from './invoices.js';
import { loadPayments } from './payments.js';
import { loadExpenses } from './expenses.js';
import { loadDashboard, loadReports } from './reports.js';

export function setActiveTab(tab) {
    document.querySelectorAll('.nav-item, .bottom-item').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.getElementById('page-title').textContent = tabsConfig[tab]?.title || '';
}

export function navigateTo(tab) {
    setActiveTab(tab);
    document.getElementById('more-menu').style.display = 'none';
    document.getElementById('sidebar').classList.remove('open');
    const content = document.getElementById('tab-content');
    content.style.opacity = '0';
    setTimeout(async () => {
        try {
            switch (tab) {
                case 'dashboard': await loadDashboard(); break;
                case 'items': await loadItems(); break;
                case 'sale-invoice': await showInvoiceModal('sale'); break;
                case 'purchase-invoice': await showInvoiceModal('purchase'); break;
                case 'customers': await loadGenericSection('/customers', 'customers'); break;
                case 'suppliers': await loadGenericSection('/suppliers', 'suppliers'); break;
                case 'categories': await loadGenericSection('/definitions?type=category', 'categories'); break;
                case 'units': await loadUnitsSection(); break;
                case 'payments': await loadPayments(); break;
                case 'expenses': await loadExpenses(); break;
                case 'invoices': await loadInvoices(); break;
                case 'reports': await loadReports(); break;
                case 'more': document.getElementById('more-menu').style.display = 'flex'; lockScroll(); break;
            }
        } catch (e) {
            showToast(e.message, 'error');
        }
        content.style.transition = 'opacity 0.3s';
        content.style.opacity = '1';
    }, 50);
}

export function initNavigation() {
    const sidebarNav = document.getElementById('sidebar-nav');
    const sheetGrid = document.getElementById('sheet-grid');
    const mainTabs = ['dashboard', 'items', 'sale-invoice', 'customers', 'suppliers', 'categories', 'units', 'payments', 'expenses', 'invoices', 'reports'];
    const moreTabs = ['purchase-invoice', 'customers', 'suppliers', 'categories', 'units', 'payments', 'expenses', 'reports'];

    mainTabs.forEach(key => {
        const cfg = tabsConfig[key];
        const btn = document.createElement('button');
        btn.className = 'nav-item' + (key === 'dashboard' ? ' active' : '');
        btn.dataset.tab = key;
        btn.innerHTML = `${cfg.icon} <span>${cfg.title}</span>`;
        btn.onclick = () => navigateTo(key);
        sidebarNav.appendChild(btn);
    });

    moreTabs.forEach(key => {
        const cfg = tabsConfig[key];
        const btn = document.createElement('button');
        btn.className = 'sheet-item';
        btn.dataset.tab = key;
        btn.innerHTML = `${cfg.icon} <span>${cfg.title}</span>`;
        btn.onclick = () => { unlockScroll(); navigateTo(key); };
        sheetGrid.appendChild(btn);
    });
}
