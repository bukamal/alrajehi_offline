// ========== نظام المصادقة المُحسّن ==========
export function getEnvironment() {
    const isTelegram = !!window.Telegram?.WebApp?.initData;
    const isStandalone = !isTelegram;
    return { isTelegram, isStandalone, isOnline: navigator.onLine, platform: isTelegram ? 'telegram' : 'standalone' };
}

export async function getCurrentUser() {
    const env = getEnvironment();
    if (env.isTelegram) {
        const tg = window.Telegram.WebApp;
        return {
            id: tg.initDataUnsafe?.user?.id,
            first_name: tg.initDataUnsafe?.user?.first_name,
            username: tg.initDataUnsafe?.user?.username,
            initData: tg.initData,
            platform: 'telegram'
        };
    }
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('auth_token');
    if (!userId || !token) return null;
    if (navigator.onLine) {
        try {
            const API_BASE = localStorage.getItem('api_base') || '/api';
            const res = await fetch(`${API_BASE}/auth/verify-token`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_id');
                return null;
            }
            const data = await res.json();
            return { ...data.user, platform: 'standalone' };
        } catch (err) {
            console.warn('⚠️ فشل التحقق من التوكن:', err);
        }
    }
    return { id: userId, first_name: localStorage.getItem('user_name') || 'مستخدم', platform: 'standalone' };
}

export function showStandaloneLogin() {
    const env = getEnvironment();
    if (env.isTelegram) return;
    const modal = document.createElement('div');
    modal.id = 'standalone-login-modal';
    modal.innerHTML = `
        <div class="modal-overlay" style="display:flex; align-items:center; justify-content:center;">
            <div class="modal-box" style="max-width:400px; width:90%; border-radius:24px;">
                <div style="text-align:center; margin-bottom:24px;">
                    <div style="width:72px; height:72px; margin:0 auto 16px; background:linear-gradient(135deg, #4f46e5, #8b5cf6); border-radius:20px; display:flex; align-items:center; justify-content:center; color:white; font-size:32px; font-weight:900;">ر</div>
                    <h2 style="font-size:20px; font-weight:800;">الراجحي للمحاسبة</h2>
                    <p style="color:var(--text-muted); font-size:14px;">تسجيل الدخول للمتابعة</p>
                </div>
                <div id="login-form">
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف أو البريد</label>
                        <input class="input" id="login-phone" type="text" placeholder="09xxxxxxxx أو email@example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">كلمة المرور</label>
                        <input class="input" id="login-password" type="password" placeholder="••••••••">
                    </div>
                    <button class="btn btn-primary btn-block" id="login-submit" style="margin-top:8px;">تسجيل الدخول</button>
                </div>
                <div id="register-form" style="display:none;">
                    <div class="form-group">
                        <label class="form-label">الاسم الكامل</label>
                        <input class="input" id="reg-name" type="text" placeholder="الاسم">
                    </div>
                    <div class="form-group">
                        <label class="form-label">رقم الهاتف</label>
                        <input class="input" id="reg-phone" type="text" placeholder="09xxxxxxxx">
                    </div>
                    <div class="form-group">
                        <label class="form-label">كلمة المرور</label>
                        <input class="input" id="reg-password" type="password" placeholder="6 أحرف على الأقل">
                    </div>
                    <button class="btn btn-primary btn-block" id="register-submit" style="margin-top:8px;">إنشاء حساب</button>
                </div>
                <div style="text-align:center; margin-top:16px; padding-top:16px; border-top:1px solid var(--border);">
                    <p style="font-size:13px; color:var(--text-muted);">
                        <span id="toggle-text">ليس لديك حساب؟</span>
                        <a href="#" id="toggle-mode" style="color:var(--primary); font-weight:700;">إنشاء حساب</a>
                    </p>
                </div>
                <div id="login-error" style="display:none; margin-top:12px; padding:12px; background:var(--danger-light); color:var(--danger); border-radius:8px; font-size:13px;"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const toggleBtn = modal.querySelector('#toggle-mode');
    const loginForm = modal.querySelector('#login-form');
    const registerForm = modal.querySelector('#register-form');
    const toggleText = modal.querySelector('#toggle-text');
    let isLogin = true;
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        if (isLogin) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            toggleText.textContent = 'ليس لديك حساب؟';
            toggleBtn.textContent = 'إنشاء حساب';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            toggleText.textContent = 'لديك حساب؟';
            toggleBtn.textContent = 'تسجيل الدخول';
        }
    });
    modal.querySelector('#login-submit').addEventListener('click', async () => {
        const phone = modal.querySelector('#login-phone').value.trim();
        const password = modal.querySelector('#login-password').value;
        const errorDiv = modal.querySelector('#login-error');
        if (!phone || !password) {
            errorDiv.textContent = 'جميع الحقول مطلوبة';
            errorDiv.style.display = 'block';
            return;
        }
        try {
            const API_BASE = localStorage.getItem('api_base') || '/api';
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_name', data.user.first_name || data.user.name);
            localStorage.setItem('auth_mode', 'jwt');
            modal.remove();
            window.location.reload();
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });
    modal.querySelector('#register-submit').addEventListener('click', async () => {
        const name = modal.querySelector('#reg-name').value.trim();
        const phone = modal.querySelector('#reg-phone').value.trim();
        const password = modal.querySelector('#reg-password').value;
        const errorDiv = modal.querySelector('#login-error');
        if (!name || !phone || !password) {
            errorDiv.textContent = 'جميع الحقول مطلوبة';
            errorDiv.style.display = 'block';
            return;
        }
        if (password.length < 6) {
            errorDiv.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
            errorDiv.style.display = 'block';
            return;
        }
        try {
            const API_BASE = localStorage.getItem('api_base') || '/api';
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب');
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user_id', data.user.id);
            localStorage.setItem('user_name', data.user.name);
            localStorage.setItem('auth_mode', 'jwt');
            modal.remove();
            window.location.reload();
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        }
    });
}

export async function initAuth() {
    const env = getEnvironment();
    if (env.isTelegram) return true;
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showStandaloneLogin();
        return false;
    }
    if (navigator.onLine) {
        try {
            const API_BASE = localStorage.getItem('api_base') || '/api';
            const res = await fetch(`${API_BASE}/auth/verify-token`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                localStorage.removeItem('auth_token');
                showStandaloneLogin();
                return false;
            }
            return true;
        } catch (err) {
            console.warn('⚠️ فشل التحقق من التوكن:', err);
            return true;
        }
    }
    return true;
}

console.log('✅ نظام المصادقة جاهز');
