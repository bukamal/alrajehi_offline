import { applyAutoTheme } from './utils.js';
import { initDB, refreshCaches } from './db.js';
import { initNavigation, navigateTo } from './navigation.js';
import { loadGenericSection } from './generic.js';
import { deleteUnit, showEditUnitModal } from './units.js';
import { showToast, openModal, lockScroll, unlockScroll } from './utils.js';

// تطبيق الوضع الليلي التلقائي
applyAutoTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyAutoTheme);

// ربط أحداث القائمة
document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.querySelector('.sheet-backdrop').addEventListener('click', () => {
  document.getElementById('more-menu').style.display = 'none';
  unlockScroll();
});

document.querySelectorAll('.bottom-item').forEach(b => {
  b.addEventListener('click', () => {
    const tab = b.dataset.tab;
    if (tab === 'more') {
      document.getElementById('more-menu').style.display = 'flex';
      lockScroll();
    } else if (tab) {
      navigateTo(tab);
    }
  });
});

document.getElementById('btn-help').addEventListener('click', () => {
  openModal({ title: 'مساعدة', bodyHTML: '<p>نظام الراجحي للمحاسبة - نسخة Offline</p>' });
});

// بدء التطبيق
(async function initApp() {
  try {
    initDB();
    await refreshCaches();
    initNavigation();
    navigateTo('dashboard');
    document.getElementById('loading-screen').classList.add('hidden');
  } catch (e) {
    showToast(e.message, 'error');
    document.getElementById('loading-screen').classList.add('hidden');
  }
})();
