// js/activation.js — ترخيص سنوي/مرن مع بصمة جهاز متعددة العوامل
const LICENSE_STORAGE_KEY = 'alrajhi_license_v5';
const SECRET = 'Alrajhi-License-2024-S3cr3t!K3y#';
const CLOCK_TOLERANCE = 60 * 1000;

async function getDeviceFingerprint() {
    // (نفس دالة البصمة السابقة، بدون تغيير)
    const factors = [];
    factors.push(navigator.userAgent);
    factors.push(navigator.platform || 'unknown');
    factors.push(navigator.language);
    factors.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    factors.push(new Date().getTimezoneOffset());
    factors.push(navigator.hardwareConcurrency || 'unknown');
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            factors.push(debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '');
            factors.push(debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '');
        }
    } catch (e) {}
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
    } catch (e) {}
    return factors.join('###');
}

function encode(data) {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function decode(str) {
    return JSON.parse(decodeURIComponent(escape(atob(str))));
}

async function verifyLicenseKey(key) {
    // المفتاح بصيغة: fingerprint.durationHours.signature
    const parts = key.split('.');
    if (parts.length !== 3) return { valid: false };
    const [fingerprint, durationStr, signatureHex] = parts;
    const durationHours = parseInt(durationStr);
    if (isNaN(durationHours) || durationHours <= 0) return { valid: false };

    // إعادة حساب التوقيع على بصمة المُصدر (لا تشمل المدة هنا لأننا فصلناها)
    // يجب أن نوقع على fingerprint فقط (كما في المولد)
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(fingerprint));
    const expectedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (signatureHex !== expectedHex) return { valid: false };
    return { valid: true, durationHours };
}

async function activateLicense(licenseKey) {
    const verified = await verifyLicenseKey(licenseKey);
    if (!verified.valid) throw new Error('المفتاح غير صحيح');
    const durationMs = verified.durationHours * 60 * 60 * 1000;
    const now = Date.now();
    const deviceFingerprint = await getDeviceFingerprint();
    const activationData = {
        key: licenseKey,
        device: deviceFingerprint,
        activationDate: now,
        expirationDate: now + durationMs,
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
        const currentFingerprint = await getDeviceFingerprint();
        if (data.device !== currentFingerprint) return { valid: false, reason: 'device_mismatch' };
        if (now > data.expirationDate + CLOCK_TOLERANCE) return { valid: false, reason: 'expired' };
        if (data.lastOpened && now < data.lastOpened - CLOCK_TOLERANCE) {
            localStorage.removeItem(LICENSE_STORAGE_KEY);
            return { valid: false, reason: 'clock_tampered' };
        }
        data.lastOpened = now;
        localStorage.setItem(LICENSE_STORAGE_KEY, encode(data));
        return { valid: true };
    } catch (e) {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        return { valid: false, reason: 'corrupted' };
    }
}

export { checkActivation, activateLicense };
