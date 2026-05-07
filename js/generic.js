import { showToast, confirmDialog } from './utils.js';
import { db, refreshCaches, checkCascadeDelete, performCascadeDelete } from './db.js';

export async function deleteGeneric(table, id, name = '') {
  const { counts, canDelete } = await checkCascadeDelete(table, id);

  let message = `حذف "${name}"؟`;

  if (!canDelete) {
    if (table === 'invoices' && (counts.invoiceLines > 0 || counts.payments > 0)) {
      message += `\n\nسيتم حذف ${counts.invoiceLines} بند و ${counts.payments} دفعة.`;
    } else if (table === 'items' && counts.invoiceLines > 0) {
      return showToast('هذه المادة مستخدمة في فواتير ولا يمكن حذفها', 'error');
    } else if (table === 'units' && counts.itemsBase > 0) {
      return showToast('هذه الوحدة أساسية لمواد أخرى', 'error');
    }
  }

  const confirmed = await confirmDialog(message);
  if (!confirmed) return false;

  try {
    await performCascadeDelete(table, id);
    await refreshCaches();
    showToast('تم الحذف بنجاح', 'success');
    return true;
  } catch (e) {
    console.error(e);
    showToast('فشل الحذف: ' + e.message, 'error');
    return false;
  }
}

// استخدام عام في الأقسام الأخرى
export { deleteGeneric };
