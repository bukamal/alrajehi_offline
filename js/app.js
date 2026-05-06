import { applyAutoTheme } from './utils.js';
import { initDB, refreshCaches } from './db.js';
import { initNavigation, navigateTo } from './navigation.js';
import { showToast, openModal, lockScroll, unlockScroll, importData } from './utils.js';

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

// ✅ FIXED: Simplified importData call - mergeFn is now handled internally in utils.js
async function checkPendingImport() {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.has('share-import')) {
    // تأخير قصير للسماح للـ Service Worker بمعالجة الملف
    setTimeout(async () => {
      await importData({
        validateFn: (data) => {
          return typeof data === 'object' && data !== null &&
                 (Array.isArray(data.items) || Array.isArray(data.invoices));
        },
        onSuccess: () => {
          showToast('✅ تم استيراد البيانات بنجاح', 'success');
          navigateTo('dashboard');
        },
        onError: (e) => {
          showToast('❌ فشل الاستيراد: ' + e.message, 'error');
        }
      });

      // تنظيف URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }, 500);
  }

  if (urlParams.has('share-error')) {
    const error = urlParams.get('share-error');
    showToast('❌ خطأ في الاستيراد: ' + decodeURIComponent(error), 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// بدء التطبيق
(async function initApp() {
  try {
    initDB();
    await refreshCaches();
    initNavigation();

    // فحص الاستيراد المعلق
    await checkPendingImport();

    navigateTo('dashboard');
    document.getElementById('loading-screen').classList.add('hidden');
  } catch (e) {
    console.error('[App Init Error]', e);
    showToast(e.message, 'error');
    document.getElementById('loading-screen').classList.add('hidden');
    const errScreen = document.getElementById('error-screen');
    const errDetails = document.getElementById('error-details');
    if (errScreen && errDetails) {
      errScreen.style.display = 'flex';
      errDetails.textContent = e.stack || e.message || 'خطأ غير معروف';
    }
  }
})();
