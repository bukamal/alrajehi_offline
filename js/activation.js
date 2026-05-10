// js/activation.js — ترخيص سنوي مرتبط ببصمة جهاز متعددة العوامل (بديل IMEI)
const LICENSE_STORAGE_KEY = 'alrajhi_license_v4';
const SECRET = 'Alrajhi-License-2024-S3cr3t!K3y#';
const EXPIRATION_DAYS = 365;
const CLOCK_TOLERANCE = 60 * 1000;

// ----------------------------------------------
// بصمة جهاز متعددة العوامل (لا يمكن الوصول لـ IMEI)
// ----------------------------------------------
async function getDeviceFingerprint() {
    const factors = [];

    // عوامل أساسية
    factors.push(navigator.userAgent);
    factors.push(navigator.platform || 'unknown');
    factors.push(navigator.language);
    factors.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    factors.push(new Date().getTimezoneOffset());
    factors.push(navigator.hardwareConcurrency || 'unknown');

    // عوامل WebGL (بصمة عتاد الرسوميات)
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            factors.push(debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '');
            factors.push(debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '');
        }
    } catch (e) { /* تجاهل */ }

    // AudioContext بصمة
    try {
        const audioCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
        const oscillator = audioCtx.createOscillator();
        const analyser = audioCtx.createAnalyser();
        oscillator.connect(analyser);
        analyser.connect(audioCtx.destination);
        oscillator.start(0);
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(freqData);
        factors.push(freqData.slice(0, 10).join(','));
    } catch (e) { /* تجاهل */ }

    // دمج العوامل في سلسلة واحدة
    return factors.join('###');
}

// تشفير/فك تشفير للتخزين المحلي
function encode(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function decode(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
}

async function verifyLicenseKey(key) {
    const parts = key.split('.');
    if (parts.length !== 2) return false;
    const [fingerprint, signatureHex] = parts;

    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(fingerprint));
    const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return signatureHex === expectedHex;
}

async function activateLicense(licenseKey) {
    if (!await verifyLicenseKey(licenseKey)) {
        throw new Error('المفتاح غير صحيح');
    }

    const now = Date.now();
    const deviceFingerprint = await getDeviceFingerprint();
    const activationData = {
        key: licenseKey,
        device: deviceFingerprint,
        activationDate: now,
        expirationDate: now + EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
        lastOpened: now
    };

    localStorage.setItem(LICENSE_STORAGE_KEY, encode(activationData));
    return true;
}

async function checkActivation() {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!stored) return { valid: false, reason: 'no_license' };

    try {
        const data = decode(stored);
        const now = Date.now();

        // 1. التحقق من بصمة الجهاز الحالية
        const currentFingerprint = await getDeviceFingerprint();
        if (data.device !== currentFingerprint) {
            return { valid: false, reason: 'device_mismatch' };
        }

        // 2. التحقق من انتهاء الصلاحية
        if (now > data.expirationDate + CLOCK_TOLERANCE) {
            return { valid: false, reason: 'expired' };
        }

        // 3. كشف التلاعب بالساعة
        if (data.lastOpened && now < data.lastOpened - CLOCK_TOLERANCE) {
            localStorage.removeItem(LICENSE_STORAGE_KEY);
            return { valid: false, reason: 'clock_tampered' };
        }

        // 4. تحديث آخر فتح
        data.lastOpened = now;
        localStorage.setItem(LICENSE_STORAGE_KEY, encode(data));

        return { valid: true };
    } catch (e) {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        return { valid: false, reason: 'corrupted' };
    }
}

export { checkActivation, activateLicense };
