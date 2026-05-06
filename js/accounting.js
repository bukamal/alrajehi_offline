import { db, itemsCache, customersCache, suppliersCache } from './db.js';

/**
 * تحديث المخزون عند إنشاء فاتورة (بيع/شراء)
 * @param {Array} lines - بنود الفاتورة
 * @param {string} type - "sale" أو "purchase"
 * @returns {Promise<void>}
 */
export async function applyStockChanges(lines, type) {
  // تجميع التغيرات لتطبيقها على قاعدة البيانات والكاش
  const qtyDeltaMap = new Map(); // key: itemId, value: delta (موجب للشراء، سالب للبيع)

  for (const line of lines) {
    if (!line.item_id) continue;
    const baseQty = (parseFloat(line.quantity) || 0) * (parseFloat(line.conversion_factor) || 1);
    const delta = type === 'sale' ? -baseQty : baseQty;
    qtyDeltaMap.set(line.item_id, (qtyDeltaMap.get(line.item_id) || 0) + delta);
  }

  // تحديث قاعدة البيانات (نفترض أننا داخل معاملة خارجية)
  for (const [itemId, delta] of qtyDeltaMap) {
    const item = await db.items.get(itemId);
    if (item) {
      await db.items.update(itemId, { quantity: (item.quantity || 0) + delta });
    }
  }

  // تحديث الكاش
  for (const [itemId, delta] of qtyDeltaMap) {
    const cached = itemsCache.find(i => i.id === itemId);
    if (cached) {
      cached.quantity = (cached.quantity || 0) + delta;
    }
  }
}

/**
 * عكس تغيرات المخزون عند حذف فاتورة
 * @param {Array} lines - بنود الفاتورة المحذوفة
 * @param {string} type - نوع الفاتورة الأصلية
 */
export async function revertStockChanges(lines, type) {
  // نفس المنطق لكن بالعكس
  const qtyDeltaMap = new Map();
  for (const line of lines) {
    if (!line.item_id) continue;
    const baseQty = (parseFloat(line.quantity) || 0) * (parseFloat(line.conversion_factor) || 1);
    // عكس التأثير: البيع نرجع الكمية (+) ، الشراء نخصم (-)
    const delta = type === 'sale' ? baseQty : -baseQty;
    qtyDeltaMap.set(line.item_id, (qtyDeltaMap.get(line.item_id) || 0) + delta);
  }

  for (const [itemId, delta] of qtyDeltaMap) {
    const item = await db.items.get(itemId);
    if (item) {
      await db.items.update(itemId, { quantity: (item.quantity || 0) + delta });
    }
    // الكاش
    const cached = itemsCache.find(i => i.id === itemId);
    if (cached) {
      cached.quantity = (cached.quantity || 0) + delta;
    }
  }
}

/**
 * تحديث رصيد عميل/مورد (زيادة أو نقصان)
 * @param {string} entityType - "customer" أو "supplier"
 * @param {number} entityId - id
 * @param {number} amount - المبلغ المضاف (موجب يزيد الرصيد، سالب ينقص)
 */
export async function updateEntityBalance(entityType, entityId, amount) {
  if (!entityId) return;
  const table = entityType === 'customer' ? db.customers : db.suppliers;
  const cache = entityType === 'customer' ? customersCache : suppliersCache;

  const entity = await table.get(entityId);
  if (entity) {
    await table.update(entityId, { balance: (entity.balance || 0) + amount });
  }

  const cached = cache.find(e => e.id == entityId);
  if (cached) {
    cached.balance = (cached.balance || 0) + amount;
  }
}

/**
 * حساب صافي التغير في الرصيد عند إنشاء فاتورة
 * @param {number} total - إجمالي الفاتورة
 * @param {number} paid - المبلغ المدفوع فوراً
 * @returns {number} المبلغ الصافي المُضاف للرصيد
 */
export function netBalanceChange(total, paid) {
  return total - paid;
}
