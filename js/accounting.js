import { db, itemsCache, customersCache, suppliersCache } from './db.js';

export async function applyStockChanges(lines, type) {
  const qtyDeltaMap = new Map();

  for (const line of lines) {
    if (!line.item_id) continue;
    const baseQty = (parseFloat(line.quantity) || 0) * (parseFloat(line.conversion_factor) || 1);
    const delta = type === 'sale' ? -baseQty : baseQty;
    qtyDeltaMap.set(line.item_id, (qtyDeltaMap.get(line.item_id) || 0) + delta);
  }

  for (const [itemId, delta] of qtyDeltaMap) {
    const item = await db.items.get(itemId);
    if (item) {
      await db.items.update(itemId, { quantity: (item.quantity || 0) + delta });
    }
  }

  for (const [itemId, delta] of qtyDeltaMap) {
    const cached = itemsCache.find(i => i.id === itemId);
    if (cached) {
      cached.quantity = (cached.quantity || 0) + delta;
    }
  }
}

export async function revertStockChanges(lines, type) {
  const qtyDeltaMap = new Map();
  for (const line of lines) {
    if (!line.item_id) continue;
    const baseQty = (parseFloat(line.quantity) || 0) * (parseFloat(line.conversion_factor) || 1);
    const delta = type === 'sale' ? baseQty : -baseQty;
    qtyDeltaMap.set(line.item_id, (qtyDeltaMap.get(line.item_id) || 0) + delta);
  }

  for (const [itemId, delta] of qtyDeltaMap) {
    const item = await db.items.get(itemId);
    if (item) {
      await db.items.update(itemId, { quantity: (item.quantity || 0) + delta });
    }
    const cached = itemsCache.find(i => i.id === itemId);
    if (cached) {
      cached.quantity = (cached.quantity || 0) + delta;
    }
  }
}

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

export function netBalanceChange(total, paid) {
  return total - paid;
}
