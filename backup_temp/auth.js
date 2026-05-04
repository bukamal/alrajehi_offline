export function getEnvironment() {
  return {
    isTelegram: false, // Offline standalone
    isStandalone: true
  };
}

export async function initAuth() {
  // لا يوجد مصادقة، نستخدم مستخدم افتراضي
  if (!localStorage.getItem('user_id')) {
    localStorage.setItem('user_id', 'offline_user');
    localStorage.setItem('user_name', 'مستخدم');
  }
  return true;
}

export function getCurrentUser() {
  return {
    id: localStorage.getItem('user_id') || 'offline_user',
    name: localStorage.getItem('user_name') || 'مستخدم'
  };
}

export function showStandaloneLogin() {
  // غير مطلوب في الوضع الـ offline
}
