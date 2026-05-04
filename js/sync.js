class SyncManager {
  constructor() {
    this.queue = [];
    this.syncing = false;
  }

  async syncNow() {
    if (!navigator.onLine) {
      window.showToast && window.showToast('أنت غير متصل بالإنترنت. لا يمكن المزامنة.', 'warning');
      return;
    }
    window.showToast && window.showToast('المزامنة غير مفعلة في الإصدار الحالي.', 'warning');
  }

  addToQueue(operation) {
    this.queue.push({
      ...operation,
      timestamp: Date.now()
    });
  }
}

export const syncManager = new SyncManager();
