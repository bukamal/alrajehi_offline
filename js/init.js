// js/init.js — تهيئة التطبيق مع فحص ترخيص محسن
import { checkActivation, activateLicense } from './activation.js';
import { initNavigation } from './navigation.js';
import { loadDashboard } from './dashboard.js';
import { refreshCaches } from './db.js';
import { showToast } from './modal.js';

async function initApp() {
    const status = await checkActivation(); // تأكد من استدعاء await

    if (!status.valid) {
        document.getElementById('loading-screen').style.display = 'none';
        const activationScreen = document.getElementById('activation-screen');
        if (activationScreen) {
            activationScreen.style.display = 'flex';
            const msgEl = document.getElementById('activation-msg');
            if (msgEl) {
                switch (status.reason) {
                    case 'expired': msgEl.textContent = 'انتهت صلاحية الترخيص. تواصل مع المورد.'; break;
                    case 'clock_tampered': msgEl.textContent = 'تم اكتشاف تلاعب في الساعة. تم إلغاء الترخيص.'; break;
                    case 'device_mismatch': msgEl.textContent = 'الترخيص غير صالح لهذا الجهاز.'; break;
                    default: msgEl.textContent = 'الترخيص غير موجود. أدخل المفتاح للتفعيل.';
                }
            }
            document.getElementById('btn-activate').addEventListener('click', async () => {
                const key = document.getElementById('license-input').value.trim();
                const msg = document.getElementById('activation-msg');
                try {
                    await activateLicense(key);
                    msg.textContent = 'تم التفعيل! جاري التشغيل...';
                    msg.style.color = 'var(--success)';
                    setTimeout(() => location.reload(), 500);
                } catch (e) {
                    console.error(e);
                    msg.textContent = e.message || 'فشل التفعيل';
                    msg.style.color = 'var(--danger)';
                }
            });
        }
        return;
    }

    // التطبيق مفعل
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
        showToast('فشل تحميل التطبيق', 'error');
        document.getElementById('loading-screen').classList.add('hidden');
    }
}

initApp();
