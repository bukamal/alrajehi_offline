// ========== الراجحي للمحاسبة - Offline-First v5 ==========
import { localDB, exportAllData, importAllData } from './js/db.js';
import { syncManager } from './js/sync.js';
import { apiCall } from './js/api-offline.js';
import { getEnvironment, initAuth, getCurrentUser } from './js/auth.js';

const env = getEnvironment();

// ... (باقي المحتوى مضغوط لتجنب الإطالة – استخدم الملف الأصلي)
// في التطبيق الفعلي الصق محتوى app-offline.js الكامل هنا
console.log('✅ تطبيق الراجحي Offline-First جاهز');
