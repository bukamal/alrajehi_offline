import { ICONS } from './constants.js';
import { formatNumber, formatDate, showToast, showFormModal } from './utils.js';
import { db } from './db.js';

export async function loadExpenses() {
  const expenses = await db.expenses.toArray();
  const tc = document.getElementById('tab-content');
  tc.innerHTML = `<div class="card">
      <div class="card-header">
        <h3 class="card-title">المصاريف</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-exp">${ICONS.plus} إضافة</button>
      </div>
    </div>
    <div id="exp-list"></div>`;

  const container = document.getElementById('exp-list');
  if (!expenses.length) {
    container.innerHTML = '<div class="empty-state"><h3>لا توجد مصاريف</h3></div>';
  } else {
    expenses.forEach(e => {
      container.innerHTML += `<div class="card" style="border-right:3px solid var(--danger);">
        <div style="font-weight:900;font-size:20px;color:var(--danger);">
          ${formatNumber(e.amount)}
        </div>
        <div style="font-size:13px;color:var(--text-muted);">${formatDate(e.expense_date)} · ${e.description || ''}</div>
      </div>`;
    });
  }

  document.getElementById('btn-add-exp')?.addEventListener('click', () => {
    showFormModal({
      title: 'إضافة مصروف',
      fields: [
        { id: 'amount', label: 'المبلغ', type: 'number' },
        { id: 'expense_date', label: 'التاريخ', type: 'date' },
        { id: 'description', label: 'الوصف' }
      ],
      initialValues: { expense_date: new Date().toISOString().split('T')[0] },
      onSave: async v => {
        if (!v.amount || parseFloat(v.amount) <= 0) throw new Error('المبلغ مطلوب');
        return db.expenses.add({
          amount: parseFloat(v.amount),
          expense_date: v.expense_date,
          description: v.description
        });
      },
      onSuccess: loadExpenses
    });
  });
}
