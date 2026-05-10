// js/init.js — تهيئة التطبيق مع فحص الترخيص السنوي
import { checkActivation, activateLicense } from './activation.js';
import { initNavigation } from './navigation.js';
import { loadDashboard } from './dashboard.js';
import { refreshCaches } from './db.js';
import { showToast } from './modal.js';

async function initApp() {
    const status = checkActivation();

    if (!status.valid) {
        // إخفاء شاشة التحميل وإظهار واجهة التفعيل
        document.getElementById('loading-screen').style.display = 'none';
        const activationScreen = document.getElementById('activation-screen');
        if (activationScreen) {
            activationScreen.style.display = 'flex';
            // إعداد رسالة حسب السبب
            const msgEl = document.getElementById('activation-msg');
            if (msgEl) {
                switch (status.reason) {
                    case 'expired': msgEl.textContent = 'انتهت صلاحية الترخيص. يرجى التواصل مع المورد للحصول على مفتاح جديد.'; break;
                    case 'clock_tampered': msgEl.textContent = 'تم اكتشاف تلاعب في تاريخ الجهاز. تم إلغاء الترخيص.'; break;
                    case 'device_mismatch': msgEl.textContent = 'هذا الترخيص غير صالح لهذا الجهاز.'; break;
                    default: msgEl.textContent = 'الترخيص غير موجود أو تالف. يرجى إدخال مفتاح الترخيص.';
                }
            }
            document.getElementById('btn-activate').addEventListener('click', async () => {
                const key = document.getElementById('license-input').value.trim();
                const msg = document.getElementById('activation-msg');
                try {
                    await activateLicense(key);
                    msg.textContent = 'تم التفعيل بنجاح! جاري تحميل التطبيق...';
                    msg.style.color = 'var(--success)';
                    setTimeout(() => location.reload(), 1000);
                } catch (e) {
                    msg.textContent = e.message;
                    msg.style.color = 'var(--danger)';
                }
            });
        }
        return;
    }

    // التطبيق مفعل، تابع التهيئة بشكل طبيعي
    if (document.getElementById('activation-screen')) {
        document.getElementById('activation-screen').style.display = 'none';
    }

    try {
        await refreshCaches();
        document.getElementById('user-name-sidebar').textContent = 'مستخدم';
        document.getElementById('user-avatar').textContent = 'م';
        initNavigation();
        document.getElementById('loading-screen').classList.add('hidden');
        await loadDashboard();
    } catch (e) {
        console.error(e);
        showToast('فشل تهيئة التطبيق', 'error');
        document.getElementById('loading-screen').classList.add('hidden');
    }
}

initApp();
