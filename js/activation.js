// js/activation.js — ترخيص مرن مع بصمة أساسية (لا يفشل أبداً)
const LICENSE_STORAGE_KEY = 'alrajhi_license_v6';
const SECRET = 'Alrajhi-License-2024-S3cr3t!K3y#';
const CLOCK_TOLERANCE = 60 * 1000;

// بصمة بسيطة مضمونة العمل
function getSimpleFingerprint() {
    return [
        navigator.userAgent,
        navigator.platform || 'unknown',
        navigator.language,
        screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
        new Date().getTimezoneOffset()
    ].join('|');
}

async function verifyLicenseKey(key) {
    const parts = key.split('.');
    if (parts.length !== 3) return { valid: false, error: 'تنسيق المفتاح غير صحيح' };
    const [fingerprint, durationStr, signatureHex] = parts;
    const durationHours = parseInt(durationStr, 10);
    if (isNaN(durationHours) || durationHours <= 0) return { valid: false, error: 'مدة الترخيص غير صالحة' };

    try {
        const encoder = new TextEncoder();
        const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(fingerprint));
        const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (signatureHex !== expectedHex) return { valid: false, error: 'المفتاح غير صحيح (توقيع خاطئ)' };
    } catch (e) {
        console.error('Crypto error:', e);
        return { valid: false, error: 'تعذر التحقق من المفتاح' };
    }
    return { valid: true, durationHours };
}

async function activateLicense(licenseKey) {
    const verified = await verifyLicenseKey(licenseKey);
    if (!verified.valid) throw new Error(verified.error || 'مفتاح غير صالح');

    const durationMs = verified.durationHours * 60 * 60 * 1000;
    const now = Date.now();
    const device = getSimpleFingerprint();

    const data = {
        key: licenseKey,
        device: device,
        activationDate: now,
        expirationDate: now + durationMs,
        lastOpened: now
    };

    try {
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        throw new Error('تعذر تخزين الترخيص. تأكد من أن مساحة التخزين متاحة.');
    }
    return true;
}

async function checkActivation() {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!stored) return { valid: false, reason: 'no_license' };

    let data;
    try {
        data = JSON.parse(stored);
    } catch (e) {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        return { valid: false, reason: 'corrupted' };
    }

    const now = Date.now();
    const currentFingerprint = getSimpleFingerprint();

    if (data.device !== currentFingerprint) {
        return { valid: false, reason: 'device_mismatch' };
    }

    if (now > data.expirationDate + CLOCK_TOLERANCE) {
        return { valid: false, reason: 'expired' };
    }

    if (data.lastOpened && now < data.lastOpened - CLOCK_TOLERANCE) {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        return { valid: false, reason: 'clock_tampered' };
    }

    // تحديث آخر فتح
    data.lastOpened = now;
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(data));

    return { valid: true };
}

export { checkActivation, activateLicense };
