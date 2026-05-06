import { ICONS } from './constants.js';

export function formatNumber(num) {
    return Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(d) {
    return d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
}

export function debounce(fn, ms = 300) {
    let t;
    return (...a) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...a), ms);
    };
}

let scrollLockPos = 0;
export function lockScroll() {
    scrollLockPos = window.scrollY || document.documentElement.scrollTop;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollLockPos + 'px';
    document.body.style.width = '100%';
    document.body.classList.add('scroll-locked');
}
export function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('scroll-locked');
    window.scrollTo(0, scrollLockPos);
}

export function showToast(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

let activeModal = null;
export function openModal({ title, bodyHTML, footerHTML = '', onClose }) {
    const portal = document.getElementById('modal-portal');
    if (activeModal) activeModal.close();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box"><div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close">${ICONS.x}</button></div><div class="modal-body">${bodyHTML}</div>${footerHTML ? '<div class="modal-footer">' + footerHTML + '</div>' : ''}</div>`;
    portal.appendChild(overlay);
    lockScroll();
    activeModal = overlay;
    function close() {
        overlay.remove();
        activeModal = null;
        unlockScroll();
        if (onClose) onClose();
    }
    overlay.querySelector('.modal-close').onclick = close;
    overlay.addEventListener('click', e => {
        if (e.target === overlay) close();
    });
    return { close, element: overlay };
}

export function confirmDialog(msg) {
    return new Promise(resolve => {
        const m = openModal({
            title: 'تأكيد',
            bodyHTML: `<p>${msg}</p>`,
            footerHTML: '<button class="btn btn-secondary" id="cf-cancel">إلغاء</button><button class="btn btn-danger" id="cf-ok">تأكيد</button>',
            onClose: () => resolve(false)
        });
        m.element.querySelector('#cf-cancel').onclick = () => { m.close(); resolve(false); };
        m.element.querySelector('#cf-ok').onclick = () => { m.close(); resolve(true); };
    });
}

// نموذج عام للإضافة/التعديل (يستخدم في أماكن متعددة)
export function showFormModal({ title, fields, initialValues = {}, onSave, onSuccess }) {
    const formId = 'frm-' + Date.now();
    let body = '';
    fields.forEach(f => {
        const val = initialValues[f.id] !== undefined ? initialValues[f.id] : '';
        body += `<div class="form-group"><label class="form-label">${f.label}</label><input class="input" id="${formId}-${f.id}" type="${f.type || 'text'}" value="${val}"></div>`;
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
            values[f.id] = el ? el.value.trim() : '';
        });
        try {
            await onSave(values);
            modal.close();
            showToast('تم الحفظ', 'success');
            if (onSuccess) onSuccess();
        } catch (e) {
            showToast(e.message, 'error');
        }
    };
}
