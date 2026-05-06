(function() {
  'use strict';

  const ICONS = {
    home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    box: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    download: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    factory: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 22h20"/><path d="M4 22V10l4-2v14"/><path d="M12 22V8l4-2v16"/><path d="M20 22V4l-4 2v16"/></svg>',
    tag: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    wallet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M16 10a4 4 0 0 1-4 4"/></svg>',
    dollar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    fileText: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    alert: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    file: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    scale: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>',
    send: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
  };

  function formatNumber(num) { return Number(num||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function formatDate(d) { return d ? new Date(d).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'}) : '-'; }
  function debounce(fn, ms=300) { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

  let scrollLockPos=0;
  function lockScroll(){ scrollLockPos=window.scrollY||document.documentElement.scrollTop; document.body.style.position='fixed'; document.body.style.top='-'+scrollLockPos+'px'; document.body.style.width='100%'; document.body.classList.add('scroll-locked'); }
  function unlockScroll(){ document.body.style.position=''; document.body.style.top=''; document.body.style.width=''; document.body.classList.remove('scroll-locked'); window.scrollTo(0,scrollLockPos); }

  window.showToast = function(msg, type='info'){
    const c=document.getElementById('toast-container'); if(!c) return;
    const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg; c.appendChild(t); setTimeout(()=>t.remove(),3000);
  };

  let activeModal=null;
  function openModal({title, bodyHTML, footerHTML='', onClose}){
    const portal=document.getElementById('modal-portal'); if(activeModal) activeModal.close();
    const overlay=document.createElement('div'); overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="modal-box"><div class="modal-header"><h3 class="modal-title">${title}</h3><button class="modal-close">${ICONS.x}</button></div><div class="modal-body">${bodyHTML}</div>${footerHTML?'<div class="modal-footer">'+footerHTML+'</div>':''}</div>`;
    portal.appendChild(overlay); lockScroll(); activeModal=overlay;
    function close(){ overlay.remove(); activeModal=null; unlockScroll(); if(onClose) onClose(); }
    overlay.querySelector('.modal-close').onclick=close;
    overlay.addEventListener('click', e=>{ if(e.target===overlay) close(); });
    return {close, element:overlay};
  }
  function confirmDialog(msg){ return new Promise(resolve=>{ const m=openModal({title:'تأكيد',bodyHTML:`<p>${msg}</p>`,footerHTML:'<button class="btn btn-secondary" id="cf-cancel">إلغاء</button><button class="btn btn-danger" id="cf-ok">تأكيد</button>',onClose:()=>resolve(false)}); m.element.querySelector('#cf-cancel').onclick=()=>{m.close();resolve(false);}; m.element.querySelector('#cf-ok').onclick=()=>{m.close();resolve(true);}; }); }

  // قاعدة البيانات – لا نسمح بوضع الذاكرة المؤقتة
  if (typeof Dexie === 'undefined' || !Dexie) {
    document.getElementById('loading-screen').style.display = 'none';
    const errScreen = document.getElementById('error-screen');
    errScreen.style.display = 'flex';
    document.getElementById('error-details').textContent = 'تعذر تهيئة قاعدة البيانات. تأكد من اتصال الانترنت ثم أعد تحميل الصفحة.';
    throw new Error('Dexie not available');
  }
  const db = new Dexie('AlrajhiDBv3');
  db.version(1).stores({
    items: '++id, name, category_id, item_type, purchase_price, selling_price, quantity, base_unit_id, item_units',
    customers: '++id, name, phone, address, balance',
    suppliers: '++id, name, phone, address, balance',
    categories: '++id, name',
    units: '++id, name, abbreviation',
    invoices: '++id, type, customer_id, supplier_id, date, reference, notes, total',
    invoiceLines: '++id, invoice_id, item_id, unit_id, quantity, unit_price, total, description',
    payments: '++id, invoice_id, customer_id, supplier_id, amount, payment_date, notes',
    expenses: '++id, amount, expense_date, description'
  });

  function getTable(name){
    return db[name];
  }

  async function apiCall(endpoint, method='GET', body={}){
    const [table, query] = endpoint.split('?');
    const params = new URLSearchParams(query||'');
    const id = params.get('id') ? parseInt(params.get('id')) : null;
    const type = params.get('type');
    if(method==='GET'){
      switch(table){
        case '/items': return await getTable('items').toArray();
        case '/customers': return await getTable('customers').toArray();
        case '/suppliers': return await getTable('suppliers').toArray();
        case '/definitions': if(type==='category') return await getTable('categories').toArray(); if(type==='unit') return await getTable('units').toArray(); return [];
        case '/invoices': {
          const invs = await getTable('invoices').toArray();
          for(const inv of invs){
            const lines = await getTable('invoiceLines').where({invoice_id:inv.id}).toArray();
            const pmts = await getTable('payments').where({invoice_id:inv.id}).toArray();
            inv.invoice_lines=lines; inv.paid=pmts.reduce((s,p)=>s+p.amount,0); inv.balance=inv.total-inv.paid;
          }
          return invs;
        }
        case '/payments': return await getTable('payments').toArray();
        case '/expenses': return await getTable('expenses').toArray();
        default: return [];
      }
    } else if(method==='POST'){
      if(table==='/items'){ const clean={...body}; clean.purchase_price=parseFloat(clean.purchase_price)||0; clean.selling_price=parseFloat(clean.selling_price)||0; clean.quantity=parseFloat(clean.quantity)||0; const nid=await getTable('items').add(clean); return {id:nid,...clean}; }
      else if(table==='/invoices'){
        const lines=body.lines; delete body.lines;
        const paid_amount = parseFloat(body.paid_amount) || 0; delete body.paid_amount;
        const invId=await getTable('invoices').add(body);
        if(lines) for(const l of lines) await getTable('invoiceLines').add({...l,invoice_id:invId});
        if(paid_amount > 0){
          await getTable('payments').add({
            invoice_id: invId,
            customer_id: body.customer_id || null,
            supplier_id: body.supplier_id || null,
            amount: paid_amount,
            payment_date: body.date,
            notes: 'دفعة تلقائية'
          });
        }
        return {id:invId,...body};
      }
      else if(table==='/customers'){ const nid=await getTable('customers').add(body); return {id:nid,...body}; }
      else if(table==='/suppliers'){ const nid=await getTable('suppliers').add(body); return {id:nid,...body}; }
      else if(table==='/definitions'){
        if(type==='category'){ const nid=await getTable('categories').add({name:body.name}); return {id:nid,...body}; }
        else if(type==='unit'){ const u={name:body.name, abbreviation:body.abbreviation||body.name}; const nid=await getTable('units').add(u); unitsCache.push({id:nid,...u}); return {id:nid,...u}; }
      }
      else if(table==='/payments'){ const nid=await getTable('payments').add(body); return {id:nid,...body}; }
      else if(table==='/expenses'){ const nid=await getTable('expenses').add(body); return {id:nid,...body}; }
    } else if(method==='DELETE'){
      const tbl = table.split('?')[0].replace('/','');
      if(tbl==='invoices') await getTable('invoiceLines').where({invoice_id:id}).delete();
      await getTable(tbl).delete(id); return {success:true};
    } else if(method==='PUT'){
      let tbl = table.replace('/','');
      // استخراج id من الرابط أو من الجسم
      let recordId = id;
      if (!recordId) recordId = body.id;
      if (recordId === undefined || recordId === null) throw new Error('معرّف السجل مطلوب للتعديل');
      const changes = { ...body };
      delete changes.id;
      if (tbl === 'definitions') {
        const defType = type || changes.type;
        delete changes.type;
        if (defType === 'category') await getTable('categories').update(recordId, changes);
        else if (defType === 'unit') await getTable('units').update(recordId, changes);
        else throw new Error('نوع التعريف غير معروف');
      } else {
        await getTable(tbl).update(recordId, changes);
      }
      return { id: recordId, ...changes };
    }
  }

let itemsCache=[], customersCache=[], suppliersCache=[], invoicesCache=[], categoriesCache=[], unitsCache=[];

// ===== إدارة الوحدات =====
async function loadUnitsSection() {
  try {
    unitsCache = await apiCall('/definitions?type=unit', 'GET');
    const tc = document.getElementById('tab-content');
    let html = '<div class="card"><div class="card-header"><div><h3 class="card-title">وحدات القياس</h3></div><button class="btn btn-primary btn-sm" id="btn-add-unit">' + ICONS.plus + ' إضافة</button></div></div>';
    if (!unitsCache.length) html += '<div class="empty-state"><h3>لا توجد وحدات</h3></div>';
    else {
      html += '<div class="table-wrap"><table class="table"><thead><tr><th>الوحدة</th><th>الاختصار</th><th></th></tr></thead><tbody>';
      unitsCache.forEach(u => html += `<tr><td>${u.name}</td><td>${u.abbreviation || '-'}</td><td><button class="btn btn-secondary btn-sm edit-btn" data-id="${u.id}" data-type="units">${ICONS.edit}</button> <button class="btn btn-danger btn-sm delete-btn" data-id="${u.id}" data-type="units">${ICONS.trash}</button></td></tr>`);
      html += '</tbody></table></div>';
    }
    tc.innerHTML = html;
    document.getElementById('btn-add-unit')?.addEventListener('click', showAddUnitModal);
  } catch (e) { showToast(e.message, 'error'); }
}

function showAddUnitModal() {
  showFormModal({
    title: 'إضافة وحدة', fields: [{ id: 'name', label: 'الاسم' }, { id: 'abbreviation', label: 'الاختصار' }],
    onSave: async v => { if (!v.name) throw new Error('الاسم مطلوب'); return apiCall('/definitions?type=unit', 'POST', v); },
    onSuccess: loadUnitsSection
  });
}

function showEditUnitModal(id) {
  const u = unitsCache.find(x => x.id == id);
  if (!u) return;
  showFormModal({
    title: 'تعديل وحدة', fields: [{ id: 'name', label: 'الاسم' }, { id: 'abbreviation', label: 'الاختصار' }],
    initialValues: u,
    onSave: async v => apiCall('/definitions?type=unit', 'PUT', { id, ...v }),
    onSuccess: loadUnitsSection
  });
}

async function deleteUnit(unitId) {
  if (!(await confirmDialog('حذف الوحدة؟'))) return;
  try {
    await apiCall('/definitions?type=unit&id=' + unitId, 'DELETE');
    showToast('تم الحذف', 'success');
    loadUnitsSection();
  } catch (e) { showToast(e.message, 'error'); }
}

// ===== إدارة المواد =====
async function loadItems() {
  itemsCache = await apiCall('/items', 'GET');
  const tc = document.getElementById('tab-content');
  tc.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">المواد</h3><button class="btn btn-primary btn-sm" id="btn-add-item">${ICONS.plus} إضافة</button></div><input class="input" id="items-search" placeholder="بحث..."></div><div id="items-list"></div>`;
  document.getElementById('btn-add-item').addEventListener('click', showAddItemModal);
  document.getElementById('items-search').addEventListener('input', debounce(renderFilteredItems, 200));
  renderFilteredItems();
}

function renderFilteredItems() {
  const q = (document.getElementById('items-search')?.value || '').toLowerCase();
  const filtered = itemsCache.filter(i => (i.name || '').toLowerCase().includes(q));
  const container = document.getElementById('items-list');
  if (!filtered.length) return container.innerHTML = '<div class="empty-state"><h3>لا توجد مواد</h3></div>';
  let html = '<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الوحدة الأساسية</th><th>متوفر</th></tr></thead><tbody>';
  filtered.forEach(item => {
    const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
    html += `<tr onclick="showItemDetail(${item.id})" style="cursor:pointer;"><td style="font-weight:700;">${item.name}</td><td>${baseUnit.name || 'قطعة'}</td><td>${item.quantity || 0}</td></tr>`;
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

window.showItemDetail = function (itemId) {
  const item = itemsCache.find(i => i.id === itemId);
  if (!item) return;
  const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
  const baseName = baseUnit.name || 'قطعة';
  let unitsHtml = '';
  if (item.item_units && item.item_units.length) {
    unitsHtml = '<div style="margin-bottom:12px;"><strong>الوحدات الفرعية:</strong><ul>';
    item.item_units.forEach(iu => {
      const unit = unitsCache.find(u => u.id == iu.unit_id) || {};
      unitsHtml += `<li>${unit.name || 'وحدة'} (1 = ${iu.conversion_factor} ${baseName})</li>`;
    });
    unitsHtml += '</ul></div>';
  }
  const modal = openModal({
    title: item.name,
    bodyHTML: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div><strong>التصنيف:</strong> ${item.category_id ? (categoriesCache.find(c => c.id == item.category_id)?.name || '-') : 'بدون تصنيف'}</div>
        <div><strong>نوع المادة:</strong> ${item.item_type || 'مخزون'}</div>
        <div><strong>الوحدة الأساسية:</strong> ${baseName}</div>
        <div><strong>الكمية:</strong> ${item.quantity || 0}</div>
        <div><strong>سعر الشراء:</strong> ${formatNumber(item.purchase_price)}</div>
        <div><strong>سعر البيع:</strong> ${formatNumber(item.selling_price)}</div>
      </div>
      ${unitsHtml}
    `,
    footerHTML: `<button class="btn btn-secondary" id="edit-item-btn">${ICONS.edit} تعديل</button><button class="btn btn-danger" id="delete-item-btn">${ICONS.trash} حذف</button>`
  });
  modal.element.querySelector('#edit-item-btn').onclick = () => { modal.close(); setTimeout(() => showEditItemModal(itemId), 200); };
  modal.element.querySelector('#delete-item-btn').onclick = () => { modal.close(); setTimeout(async () => { if (await confirmDialog('حذف المادة؟')) { await apiCall('/items?id=' + itemId, 'DELETE'); loadItems(); } }, 200); };
};

async function getOrCreateUnit(name) {
  if (!name) return null;
  let u = unitsCache.find(x => x.name.toLowerCase() === name.toLowerCase());
  if (u) return u.id;
  const res = await apiCall('/definitions?type=unit', 'POST', { name, abbreviation: name });
  u = { id: res.id, name, abbreviation: name };
  unitsCache.push(u);
  return u.id;
}

function showAddItemModal() {
  const catOpts = categoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  const body = `
    <div class="form-group"><label class="form-label">اسم المادة</label><input class="input" id="fm-name"></div>
    <div class="form-group"><label class="form-label">التصنيف</label><select class="select" id="fm-category_id"><option value="">بدون تصنيف</option>${catOpts}</select></div>
    <div class="form-group" style="margin-bottom:4px;"><button class="btn btn-secondary btn-sm" id="btn-quick-cat" type="button" style="width:auto;">${ICONS.plus} تصنيف جديد</button></div>
    <div id="quick-cat-row" style="display:none;margin-bottom:12px;"><input class="input" id="fm-new-category" placeholder="اسم التصنيف..."><button class="btn btn-primary btn-sm" id="btn-save-quick-cat" style="width:auto;margin-top:4px;">إضافة</button></div>
    <div class="form-group"><label class="form-label">الوحدة الأساسية</label><div style="display:flex;gap:8px;align-items:center;"><input class="input" id="fm-baseUnit" value="قطعة" style="flex:1;"><button class="btn btn-secondary" id="btn-toggle-units" type="button" style="width:auto;padding:8px 14px;" title="إضافة وحدات فرعية">${ICONS.plus}</button></div></div>
    <div id="extra-units" style="display:none;">
      <div class="form-group"><label class="form-label">وحدة فرعية 1</label><input class="input" id="fm-unit2-name" placeholder="الاسم"><input class="input" id="fm-unit2-factor" type="number" placeholder="عامل التحويل (مثلاً 12)"></div>
      <div class="form-group"><label class="form-label">وحدة فرعية 2</label><input class="input" id="fm-unit3-name" placeholder="الاسم"><input class="input" id="fm-unit3-factor" type="number" placeholder="عامل التحويل"></div>
    </div>
    <div class="form-group"><label class="form-label">الكمية الافتتاحية</label><div style="display:flex;gap:8px;"><input class="input" id="fm-quantity" type="number" value="0" style="flex:1;"><select class="select" id="fm-qty-unit" style="width:150px;"><option value="base">الوحدة الأساسية</option><option value="u2">الوحدة الفرعية 1</option><option value="u3">الوحدة الفرعية 2</option></select></div><div id="qty-converted" style="font-size:12px;color:var(--text-muted);margin-top:4px;display:none;">= <strong id="qty-base-val">0</strong> قطعة</div></div>
    <div class="form-group"><label class="form-label">سعر الشراء</label><input class="input" id="fm-purchase" type="number" value="0"></div>
    <div class="form-group"><label class="form-label">سعر البيع</label><input class="input" id="fm-selling" type="number" value="0"></div>`;

  const modal = openModal({ title: 'إضافة مادة', bodyHTML: body, footerHTML: `<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">${ICONS.check} حفظ</button>` });
  const baseNameInput = modal.element.querySelector('#fm-baseUnit');
  const extraUnitsDiv = modal.element.querySelector('#extra-units');
  const toggleBtn = modal.element.querySelector('#btn-toggle-units');
  const qtyInput = modal.element.querySelector('#fm-quantity');
  const qtyUnit = modal.element.querySelector('#fm-qty-unit');
  const qtyConverted = modal.element.querySelector('#qty-converted');
  const qtyBaseVal = modal.element.querySelector('#qty-base-val');

  toggleBtn.onclick = () => {
    extraUnitsDiv.style.display = (extraUnitsDiv.style.display === 'none' ? 'block' : 'none');
    toggleBtn.innerHTML = (extraUnitsDiv.style.display === 'block' ? ICONS.x : ICONS.plus);
  };

  function updateQty() {
    const qty = parseFloat(qtyInput.value) || 0;
    const unit = qtyUnit.value;
    const f2 = parseFloat(modal.element.querySelector('#fm-unit2-factor').value) || 1;
    const f3 = parseFloat(modal.element.querySelector('#fm-unit3-factor').value) || 1;
    let baseQty = qty;
    if (unit === 'u2') baseQty = qty * f2;
    else if (unit === 'u3') baseQty = qty * f3;
    if (qty > 0 && unit !== 'base') { qtyConverted.style.display = 'block'; qtyBaseVal.textContent = baseQty; }
    else { qtyConverted.style.display = 'none'; }
  }

  qtyInput.addEventListener('input', updateQty);
  qtyUnit.addEventListener('change', updateQty);
  modal.element.querySelector('#fm-unit2-factor').addEventListener('input', updateQty);
  modal.element.querySelector('#fm-unit3-factor').addEventListener('input', updateQty);

  modal.element.querySelector('#btn-quick-cat').onclick = () => {
    const row = modal.element.querySelector('#quick-cat-row');
    row.style.display = (row.style.display === 'none' ? 'block' : 'none');
  };
  modal.element.querySelector('#btn-save-quick-cat').onclick = async () => {
    const input = modal.element.querySelector('#fm-new-category');
    const select = modal.element.querySelector('#fm-category_id');
    const name = input.value.trim();
    if (!name) return showToast('ادخل اسم التصنيف', 'error');
    try {
      const res = await apiCall('/definitions?type=category', 'POST', { type: 'category', name });
      const newId = res.id;
      categoriesCache.push({ id: newId, name });
      const o = document.createElement('option'); o.value = newId; o.textContent = name;
      select.appendChild(o); select.value = newId;
      input.value = ''; row.style.display = 'none';
      showToast('تم إضافة التصنيف', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  modal.element.querySelector('#fm-cancel').onclick = () => modal.close();
  modal.element.querySelector('#fm-save').onclick = async () => {
    const btn = modal.element.querySelector('#fm-save');
    if (btn.disabled) return;
    btn.disabled = true; btn.innerHTML = '⏳ جاري الحفظ...';
    try {
      const name = modal.element.querySelector('#fm-name').value.trim();
      if (!name) throw new Error('اسم المادة مطلوب');
      const baseUnitName = baseNameInput.value.trim() || 'قطعة';
      const baseUnitId = await getOrCreateUnit(baseUnitName);
      const item_units = [];
      const u2name = modal.element.querySelector('#fm-unit2-name').value.trim();
      const u2factor = parseFloat(modal.element.querySelector('#fm-unit2-factor').value);
      if (u2name && u2factor > 0) {
        const uid = await getOrCreateUnit(u2name);
        if (uid) item_units.push({ unit_id: uid, conversion_factor: u2factor });
      }
      const u3name = modal.element.querySelector('#fm-unit3-name').value.trim();
      const u3factor = parseFloat(modal.element.querySelector('#fm-unit3-factor').value);
      if (u3name && u3factor > 0) {
        const uid = await getOrCreateUnit(u3name);
        if (uid) item_units.push({ unit_id: uid, conversion_factor: u3factor });
      }
      const qtyEntered = parseFloat(qtyInput.value) || 0;
      const unit = qtyUnit.value;
      const f2 = parseFloat(modal.element.querySelector('#fm-unit2-factor').value) || 1;
      const f3 = parseFloat(modal.element.querySelector('#fm-unit3-factor').value) || 1;
      let quantity = qtyEntered;
      if (unit === 'u2') quantity = qtyEntered * f2;
      else if (unit === 'u3') quantity = qtyEntered * f3;
      await apiCall('/items', 'POST', {
        name, category_id: modal.element.querySelector('#fm-category_id').value || null,
        base_unit_id: baseUnitId, item_units, quantity,
        purchase_price: parseFloat(modal.element.querySelector('#fm-purchase').value) || 0,
        selling_price: parseFloat(modal.element.querySelector('#fm-selling').value) || 0
      });
      modal.close(); showToast('تم الحفظ', 'success'); loadItems();
    } catch (e) { showToast(e.message, 'error'); btn.disabled = false; btn.innerHTML = `${ICONS.check} حفظ`; }
  };
}

function showEditItemModal(id) {
  const item = itemsCache.find(i => i.id == id);
  if (!item) return;
  const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
  const baseUnitName = baseUnit.name || 'قطعة';
  const catOpts = categoriesCache.map(c => `<option value="${c.id}" ${c.id == item.category_id ? 'selected' : ''}>${c.name}</option>`).join('');
  const body = `
    <div class="form-group"><label class="form-label">الاسم</label><input class="input" id="fm-name" value="${item.name}"></div>
    <div class="form-group"><label class="form-label">التصنيف</label><select class="select" id="fm-category_id"><option value="">بدون تصنيف</option>${catOpts}</select></div>
    <div class="form-group"><label class="form-label">الوحدة الأساسية</label><input class="input" id="fm-baseUnit" value="${baseUnitName}"></div>
    <div class="form-group"><label class="form-label">الكمية</label><input class="input" id="fm-quantity" type="number" value="${item.quantity || 0}"></div>
    <div class="form-group"><label class="form-label">سعر الشراء</label><input class="input" id="fm-purchase" type="number" value="${item.purchase_price || 0}"></div>
    <div class="form-group"><label class="form-label">سعر البيع</label><input class="input" id="fm-selling" type="number" value="${item.selling_price || 0}"></div>`;
  const modal = openModal({ title: 'تعديل مادة', bodyHTML: body, footerHTML: `<button class="btn btn-secondary" id="fm-cancel">إلغاء</button><button class="btn btn-primary" id="fm-save">${ICONS.check} حفظ</button>` });

  modal.element.querySelector('#fm-cancel').onclick = () => modal.close();
  modal.element.querySelector('#fm-save').onclick = async () => {
    const btn = modal.element.querySelector('#fm-save');
    if (btn.disabled) return;
    btn.disabled = true; btn.innerHTML = '⏳ جاري الحفظ...';
    try {
      const baseUnitNameInput = modal.element.querySelector('#fm-baseUnit');
      const baseUnitName = baseUnitNameInput ? baseUnitNameInput.value.trim() : 'قطعة';
      const baseUnitId = await getOrCreateUnit(baseUnitName);
      const values = {
        name: modal.element.querySelector('#fm-name').value.trim(),
        category_id: modal.element.querySelector('#fm-category_id').value || null,
        base_unit_id: baseUnitId,
        quantity: parseFloat(modal.element.querySelector('#fm-quantity').value) || 0,
        purchase_price: parseFloat(modal.element.querySelector('#fm-purchase').value) || 0,
        selling_price: parseFloat(modal.element.querySelector('#fm-selling').value) || 0
      };
      if (!values.name) throw new Error('اسم المادة مطلوب');
      await apiCall('/items', 'PUT', { id, ...values });
      modal.close(); showToast('تم التعديل بنجاح', 'success'); loadItems();
    } catch (e) { showToast(e.message, 'error'); btn.disabled = false; btn.innerHTML = `${ICONS.check} حفظ`; }
  };
}

// ===== الأقسام العامة (عملاء، موردين، تصنيفات) =====
async function loadGenericSection(endpoint, cacheKey) {
  const data = await apiCall(endpoint, 'GET');
  if (cacheKey === 'customers') customersCache = data;
  else if (cacheKey === 'suppliers') suppliersCache = data;
  else if (cacheKey === 'categories') categoriesCache = data;
  const titles = { customers: 'العملاء', suppliers: 'الموردين', categories: 'التصنيفات' };
  const title = titles[cacheKey] || cacheKey;
  const tc = document.getElementById('tab-content');
  let html = `<div class="card"><div class="card-header"><h3 class="card-title">${title}</h3><button class="btn btn-primary btn-sm add-btn" data-type="${cacheKey}">${ICONS.plus} إضافة</button></div></div>`;
  if (!data.length) html += `<div class="empty-state"><h3>لا يوجد ${title}</h3></div>`;
  else data.forEach(item => {
    html += `<div class="card card-hover" style="display:flex;justify-content:space-between;align-items:center;"><span style="font-weight:800;">${item.name}</span><div><button class="btn btn-secondary btn-sm edit-btn" data-id="${item.id}" data-type="${cacheKey}">${ICONS.edit}</button> <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}" data-type="${cacheKey}">${ICONS.trash}</button></div></div>`;
  });
  tc.innerHTML = html;
}

// ===== نموذج عام للإضافة/التعديل =====
function showFormModal({ title, fields, initialValues = {}, onSave, onSuccess }) {
  const formId = 'frm-' + Date.now();
  let body = '';
  fields.forEach(f => {
    const val = initialValues[f.id] !== undefined ? initialValues[f.id] : '';
    body += `<div class="form-group"><label class="form-label">${f.label}</label><input class="input" id="${formId}-${f.id}" type="${f.type || 'text'}" value="${val}"></div>`;
  });
  const modal = openModal({ title, bodyHTML: body, footerHTML: `<button class="btn btn-secondary" id="${formId}-cancel">إلغاء</button><button class="btn btn-primary" id="${formId}-save">${ICONS.check} حفظ</button>` });
  modal.element.querySelector(`#${formId}-cancel`).onclick = () => modal.close();
  modal.element.querySelector(`#${formId}-save`).onclick = async () => {
    const values = {};
    fields.forEach(f => {
      const el = modal.element.querySelector(`#${formId}-${f.id}`);
      values[f.id] = el ? el.value.trim() : '';
    });
    try {
      await onSave(values);
      modal.close();
      showToast('تم الحفظ', 'success');
      if (onSuccess) onSuccess();
    } catch (e) { showToast(e.message, 'error'); }
  };
}

// ===== المستمع العالمي الموحد لجميع أزرار add/edit/delete =====
document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;

  if (t.classList.contains('add-btn')) {
    const type = t.dataset.type;
    const titles = { customers: 'عميل', suppliers: 'مورد', categories: 'تصنيف' };
    const endpoints = { customers: '/customers', suppliers: '/suppliers', categories: '/definitions?type=category' };
    if (!endpoints[type]) return;
    showFormModal({
      title: `إضافة ${titles[type]}`,
      fields: [{ id: 'name', label: 'الاسم' }],
      onSave: async v => apiCall(endpoints[type], 'POST', type === 'categories' ? { type: 'category', name: v.name } : { name: v.name }),
      onSuccess: () => loadGenericSection(endpoints[type], type)
    });
  }
  else if (t.classList.contains('edit-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id);
    if (!id) return;
    if (type === 'units') {
      showEditUnitModal(id);
    } else {
      const caches = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
      const item = caches[type]?.find(x => x.id === id);
      if (!item) return;
      showFormModal({
        title: 'تعديل',
        fields: [{ id: 'name', label: 'الاسم' }],
        initialValues: { name: item.name },
        onSave: async v => apiCall(type === 'categories' ? '/definitions?type=category' : `/${type}`, 'PUT', type === 'categories' ? { type: 'category', id, name: v.name } : { id, name: v.name }),
        onSuccess: () => {
          if (type === 'categories') loadGenericSection('/definitions?type=category', 'categories');
          else loadGenericSection(`/${type}`, type);
        }
      });
    }
  }
  else if (t.classList.contains('delete-btn')) {
    const type = t.dataset.type;
    const id = parseInt(t.dataset.id);
    if (!id) return;
    if (type === 'units') {
      await deleteUnit(id);
    } else {
      const caches = { customers: customersCache, suppliers: suppliersCache, categories: categoriesCache };
      const item = caches[type]?.find(x => x.id === id);
      if (!item || !(await confirmDialog(`حذف ${item.name}؟`))) return;
      const delUrls = {
        customers: `/customers?id=${id}`,
        suppliers: `/suppliers?id=${id}`,
        categories: `/definitions?type=category&id=${id}`
      };
      await apiCall(delUrls[type], 'DELETE');
      showToast('تم الحذف', 'success');
      if (type === 'categories') loadGenericSection('/definitions?type=category', 'categories');
      else loadGenericSection(`/${type}`, type);
    }
  }
});

// ===== فاتورة (بيع / شراء) مع حقل المبلغ المدفوع وتسجيل دفعة تلقائية =====
async function showInvoiceModal(type) {
  try {
    customersCache = await apiCall('/customers', 'GET');
    suppliersCache = await apiCall('/suppliers', 'GET');
    itemsCache = await apiCall('/items', 'GET');
    unitsCache = await apiCall('/definitions?type=unit', 'GET');

    const entOpts = type === 'sale'
      ? `<option value="cash">عميل نقدي</option>${customersCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}`
      : `<option value="cash">مورد نقدي</option>${suppliersCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}`;

    const body = `
      <input type="hidden" id="inv-type" value="${type}">
      <div class="invoice-lines" id="inv-lines">
        <div class="line-row">
          <div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>${itemsCache.map(i => `<option value="${i.id}" data-price="${type === 'sale' ? i.selling_price : i.purchase_price}">${i.name}</option>`).join('')}</select></div>
          <div class="form-group"><select class="select unit-select" style="display:none;"><option value="">الوحدة</option></select></div>
          <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div>
          <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div>
          <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-add-line">${ICONS.plus} إضافة بند</button>
      <div class="form-group"><label class="form-label">${type === 'sale' ? 'العميل' : 'المورد'}</label><select class="select" id="inv-entity">${entOpts}</select></div>
      <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="input" id="inv-date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label class="form-label">الرقم المرجعي</label><input type="text" class="input" id="inv-ref" placeholder="رقم الفاتورة أو المرجع"></div>
      <div class="form-group"><label class="form-label">المبلغ المدفوع</label><input type="number" step="0.01" class="input" id="inv-paid" value="0"></div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="textarea" id="inv-notes" placeholder="أي ملاحظات إضافية..."></textarea></div>
      <div style="background:var(--bg);border-radius:12px;padding:16px;display:flex;justify-content:space-between;"><span>الإجمالي:</span><span id="inv-grand-total" style="font-size:22px;font-weight:900;color:var(--primary);">0.00</span></div>`;

    const modal = openModal({ title: `فاتورة ${type === 'sale' ? 'مبيعات' : 'مشتريات'}`, bodyHTML: body, footerHTML: `<button class="btn btn-secondary" id="inv-cancel">إلغاء</button><button class="btn btn-primary" id="inv-save">${ICONS.check} حفظ</button>` });
    const container = modal.element;

    const updateGrandTotal = () => {
      let t = 0;
      container.querySelectorAll('.total-input').forEach(inp => t += parseFloat(inp.value) || 0);
      const gt = container.querySelector('#inv-grand-total');
      if (gt) gt.textContent = formatNumber(t);
    };

    const calc = row => {
      const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
      const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
      const tot = row.querySelector('.total-input');
      if (tot) { tot.value = (qty * price).toFixed(2); updateGrandTotal(); }
    };

    const getUnitOptions = item => {
      if (!item) return '<option value="">اختر مادة</option>';
      const baseUnit = unitsCache.find(u => u.id == item.base_unit_id) || {};
      const baseName = baseUnit.name || 'قطعة';
      let opts = `<option value="" data-factor="1">${baseName} (أساسية)</option>`;
      (item.item_units || []).forEach(iu => {
        const unit = unitsCache.find(u => u.id == iu.unit_id) || {};
        opts += `<option value="${iu.unit_id}" data-factor="${iu.conversion_factor}">${unit.name || unit.abbreviation || 'وحدة'} (×${iu.conversion_factor})</option>`;
      });
      return opts;
    };

    const rowHandler = row => {
      const sel = row.querySelector('.item-select');
      const pr = row.querySelector('.price-input');
      const unitSel = row.querySelector('.unit-select');

      sel.addEventListener('change', () => {
        const item = itemsCache.find(i => i.id == sel.value);
        if (item) {
          const basePrice = type === 'sale' ? (item.selling_price || 0) : (item.purchase_price || 0);
          pr.value = basePrice;
          if (unitSel) {
            unitSel.innerHTML = getUnitOptions(item);
            unitSel.style.display = 'block';
            unitSel.dataset.basePrice = basePrice;
          }
          calc(row);
        } else {
          pr.value = '';
          if (unitSel) { unitSel.innerHTML = '<option value="">الوحدة</option>'; unitSel.style.display = 'none'; }
        }
      });

      row.querySelector('.qty-input')?.addEventListener('input', () => calc(row));
      row.querySelector('.price-input')?.addEventListener('input', () => calc(row));

      unitSel?.addEventListener('change', () => {
        calc(row);
      });
    };

    container.querySelectorAll('.line-row').forEach(row => rowHandler(row));

    container.querySelector('#btn-add-line').addEventListener('click', () => {
      const nl = document.createElement('div');
      nl.className = 'line-row';
      nl.innerHTML = `<div class="form-group" style="grid-column:1/-1"><select class="select item-select"><option value="">اختر مادة</option>${itemsCache.map(i => `<option value="${i.id}" data-price="${type === 'sale' ? i.selling_price : i.purchase_price}">${i.name}</option>`).join('')}</select></div>
      <div class="form-group"><select class="select unit-select" style="display:none;"><option value="">الوحدة</option></select></div>
      <div class="form-group"><input type="number" step="any" class="input qty-input" placeholder="الكمية"></div>
      <div class="form-group"><input type="number" step="0.01" class="input price-input" placeholder="السعر"></div>
      <div class="form-group"><input type="number" step="0.01" class="input total-input" placeholder="الإجمالي" readonly style="background:var(--bg);font-weight:700;"></div>
      <button class="line-remove">${ICONS.trash}</button>`;
      container.querySelector('#inv-lines').appendChild(nl);
      rowHandler(nl);
      nl.querySelector('.line-remove').addEventListener('click', () => { nl.remove(); updateGrandTotal(); });
    });

    modal.element.querySelector('#inv-cancel').onclick = () => modal.close();
    modal.element.querySelector('#inv-save').onclick = async () => {
      const lines = [];
      container.querySelectorAll('.line-row').forEach(row => {
        const id = row.querySelector('.item-select')?.value || null;
        const unitId = row.querySelector('.unit-select')?.value || null;
        const factor = parseFloat(row.querySelector('.unit-select')?.selectedOptions[0]?.dataset.factor || 1);
        const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
        const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
        const total = parseFloat(row.querySelector('.total-input')?.value) || 0;
        if (id || qty > 0) lines.push({ item_id: id, unit_id: unitId, quantity: qty, unit_price: price, total, conversion_factor: factor });
      });
      if (!lines.length) return showToast('أضف بنداً واحداً على الأقل', 'error');

      const entity = container.querySelector('#inv-entity').value;
      const paid = parseFloat(container.querySelector('#inv-paid').value) || 0;
      const btn = container.querySelector('#inv-save');
      btn.disabled = true; btn.innerHTML = '⏳ جاري الحفظ...';

      await apiCall('/invoices', 'POST', {
        type,
        customer_id: type === 'sale' && entity !== 'cash' ? entity : null,
        supplier_id: type === 'purchase' && entity !== 'cash' ? entity : null,
        date: container.querySelector('#inv-date').value,
        reference: container.querySelector('#inv-ref').value.trim(),
        notes: container.querySelector('#inv-notes').value.trim(),
        lines,
        total: lines.reduce((s, l) => s + l.total, 0),
        paid_amount: paid
      });
      modal.close(); showToast('تم حفظ الفاتورة بنجاح', 'success'); loadInvoices();
    };
  } catch (e) { showToast('خطأ في فتح الفاتورة: ' + e.message, 'error'); }
}

// ===== قائمة الفواتير مع عرض/طباعة/حذف =====
async function loadInvoices() {
  invoicesCache = await apiCall('/invoices', 'GET');
  const tc = document.getElementById('tab-content');
  tc.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">الفواتير</h3></div><div class="filter-bar"><button class="filter-pill active" data-filter="all">الكل</button><button class="filter-pill" data-filter="sale">مبيعات</button><button class="filter-pill" data-filter="purchase">مشتريات</button></div></div><div id="inv-list"></div>`;
  document.querySelectorAll('.filter-pill').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.filter-pill').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderFilteredInvoices();
    });
  });
  renderFilteredInvoices();
}

function renderFilteredInvoices() {
  const filt = document.querySelector('.filter-pill.active')?.dataset.filter || 'all';
  let data = invoicesCache;
  if (filt !== 'all') data = data.filter(inv => inv.type === filt);
  const container = document.getElementById('inv-list');
  if (!data.length) return container.innerHTML = '<div class="empty-state"><h3>لا توجد فواتير</h3></div>';

  let html = '';
  data.forEach(inv => {
    html += `<div class="card card-hover"><div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span><span style="background:${inv.type === 'sale' ? 'var(--success-light)' : 'var(--warning-light)'};color:${inv.type === 'sale' ? 'var(--success)' : 'var(--warning)'};padding:2px 10px;border-radius:20px;font-size:12px;">${inv.type === 'sale' ? 'بيع' : 'شراء'}</span> ${inv.reference || ''}</span><span style="font-weight:900;">${formatNumber(inv.total)}</span></div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">${formatDate(inv.date)} · مدفوع: ${formatNumber(inv.paid || 0)} · باقي: ${formatNumber(inv.balance || 0)}</div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-secondary btn-sm view-inv-btn" data-id="${inv.id}">${ICONS.file} عرض</button>
      <button class="btn btn-primary btn-sm print-inv-btn" data-id="${inv.id}">${ICONS.print} طباعة</button>
      <button class="btn btn-danger btn-sm delete-inv-btn" data-id="${inv.id}">${ICONS.trash} حذف</button>
    </div></div>`;
  });
  container.innerHTML = html;

  container.querySelectorAll('.view-inv-btn').forEach(b => b.addEventListener('click', e => {
    const inv = invoicesCache.find(i => i.id == parseInt(b.dataset.id));
    if (inv) showInvoiceDetail(inv);
  }));
  container.querySelectorAll('.print-inv-btn').forEach(b => b.addEventListener('click', e => {
    const inv = invoicesCache.find(i => i.id == parseInt(b.dataset.id));
    if (inv) window.printInvoice(inv, { preview: true, format: 'thermal' });
  }));
  container.querySelectorAll('.delete-inv-btn').forEach(b => b.addEventListener('click', async e => {
    if (await confirmDialog('حذف الفاتورة؟')) {
      await apiCall('/invoices?id=' + b.dataset.id, 'DELETE');
      loadInvoices();
    }
  }));
}

function showInvoiceDetail(inv) {
  const lines = (inv.invoice_lines || []).map(l => {
    const item = itemsCache.find(i => i.id == l.item_id);
    const unit = unitsCache.find(u => u.id == l.unit_id);
    return `<tr><td>${item ? item.name : '-'}</td><td>${l.quantity} ${unit ? unit.name : ''}</td><td>${formatNumber(l.unit_price)}</td><td>${formatNumber(l.total)}</td></tr>`;
  }).join('');
  const modal = openModal({
    title: `فاتورة ${inv.type === 'sale' ? 'بيع' : 'شراء'} ${inv.reference || ''}`,
    bodyHTML: `<div class="table-wrap"><table class="table"><thead><tr><th>المادة</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${lines}</tbody></table></div>
    <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div><strong>الإجمالي:</strong> ${formatNumber(inv.total)}</div><div><strong>المدفوع:</strong> ${formatNumber(inv.paid || 0)}</div><div><strong>المتبقي:</strong> ${formatNumber(inv.balance || 0)}</div></div>`,
    footerHTML: `<button class="btn btn-secondary" id="det-close">إغلاق</button>`
  });
  modal.element.querySelector('#det-close').onclick = () => modal.close();
}

window.printInvoice = function (invoice, options = {}) {
  const { preview = false } = options;
  const linesHTML = (invoice.invoice_lines || []).map(l => {
    const item = itemsCache.find(i => i.id == l.item_id);
    const unit = unitsCache.find(u => u.id == l.unit_id);
    return `<div class="row"><span>${item ? item.name : '-'}</span><span>${l.quantity} ${unit ? unit.name : ''} x ${formatNumber(l.unit_price)}</span><span>${formatNumber(l.total)}</span></div>`;
  }).join('');
  const thermalHTML = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><style>@page{size:80mm auto;margin:0}body{width:80mm;font-size:12px;padding:4mm;font-family:sans-serif}.center{text-align:center}.bold{font-weight:900}.line{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between}.total{font-size:18px;color:#2563eb}</style></head><body><div class="center"><div class="bold">الراجحي للمحاسبة</div><div>فاتورة ${invoice.type === 'sale' ? 'بيع' : 'شراء'}</div></div><div class="line"></div><div class="row"><span>التاريخ:</span><span>${formatDate(invoice.date)}</span></div><div class="row"><span>المرجع:</span><span>${invoice.reference || '-'}</span></div>${linesHTML}<div class="line"></div><div class="row total"><span>الإجمالي</span><span>${formatNumber(invoice.total)}</span></div></body></html>`;
  if (preview) {
    const modal = openModal({ title: 'معاينة الطباعة', bodyHTML: `<iframe srcdoc="${thermalHTML.replace(/"/g, '&quot;')}" style="width:100%;height:400px;"></iframe>`, footerHTML: `<button class="btn btn-primary" id="print-now">طباعة</button>` });
    modal.element.querySelector('#print-now').onclick = () => { modal.close(); window.print(); };
    return;
  }
  const w = window.open('', '_blank');
  w.document.write(thermalHTML);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

  // ===== المدفوعات =====
  async function loadPayments() {
    const payments = await apiCall('/payments', 'GET');
    const tc = document.getElementById('tab-content');
    tc.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">الدفعات</h3><button class="btn btn-primary btn-sm" id="btn-add-pmt">${ICONS.plus} إضافة</button></div></div>`;
    payments.forEach(p => {
      const isIn = !!p.customer_id;
      tc.innerHTML += `<div class="card" style="border-right:3px solid ${isIn ? 'var(--success)' : 'var(--danger)'};"><div style="font-weight:900;font-size:20px;color:${isIn ? 'var(--success)' : 'var(--danger)'};">${isIn ? '+' : '-'} ${formatNumber(p.amount)}</div><div style="font-size:13px;color:var(--text-muted);">${formatDate(p.payment_date)} · ${p.notes || ''}</div></div>`;
    });
    document.getElementById('btn-add-pmt')?.addEventListener('click', showAddPaymentModal);
  }

  function showAddPaymentModal() {
    const body = `<div class="form-group"><select class="select" id="pmt-type"><option value="customer">مقبوضات</option><option value="supplier">مدفوعات</option></select></div>
    <div class="form-group" id="pmt-cust-block"><select class="select" id="pmt-customer"><option value="">اختر</option>${customersCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select></div>
    <div class="form-group" id="pmt-supp-block" style="display:none"><select class="select" id="pmt-supplier"><option value="">اختر</option>${suppliersCache.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
    <div class="form-group"><input class="input" id="pmt-amount" type="number" placeholder="المبلغ"></div>
    <div class="form-group"><input class="input" id="pmt-date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
    <div class="form-group"><textarea class="textarea" id="pmt-notes" placeholder="ملاحظات"></textarea></div>`;
    const modal = openModal({ title: 'تسجيل دفعة', bodyHTML: body, footerHTML: `<button class="btn btn-secondary" id="pmt-cancel">إلغاء</button><button class="btn btn-primary" id="pmt-save">${ICONS.check} حفظ</button>` });
    modal.element.querySelector('#pmt-type').addEventListener('change', function () {
      document.getElementById('pmt-cust-block').style.display = this.value === 'customer' ? 'block' : 'none';
      document.getElementById('pmt-supp-block').style.display = this.value === 'supplier' ? 'block' : 'none';
    });
    modal.element.querySelector('#pmt-save').onclick = async () => {
      const type = modal.element.querySelector('#pmt-type').value;
      const amount = parseFloat(modal.element.querySelector('#pmt-amount').value);
      if (!amount) return showToast('المبلغ مطلوب', 'error');
      await apiCall('/payments', 'POST', {
        customer_id: type === 'customer' ? modal.element.querySelector('#pmt-customer').value || null : null,
        supplier_id: type === 'supplier' ? modal.element.querySelector('#pmt-supplier').value || null : null,
        amount,
        payment_date: modal.element.querySelector('#pmt-date').value,
        notes: modal.element.querySelector('#pmt-notes').value.trim()
      });
      modal.close();
      showToast('تم الحفظ', 'success');
      loadPayments();
    };
    modal.element.querySelector('#pmt-cancel').onclick = () => modal.close();
  }

  // ===== المصاريف =====
  async function loadExpenses() {
    const expenses = await apiCall('/expenses', 'GET');
    const tc = document.getElementById('tab-content');
    tc.innerHTML = `<div class="card"><div class="card-header"><h3 class="card-title">المصاريف</h3><button class="btn btn-primary btn-sm" id="btn-add-exp">${ICONS.plus} إضافة</button></div></div>`;
    expenses.forEach(ex => tc.innerHTML += `<div class="card" style="border-right:3px solid var(--danger);"><div style="font-weight:900;font-size:20px;color:var(--danger);">${formatNumber(ex.amount)}</div><div>${formatDate(ex.expense_date)} · ${ex.description || ''}</div></div>`);
    document.getElementById('btn-add-exp')?.addEventListener('click', () => {
      showFormModal({
        title: 'إضافة مصروف',
        fields: [
          { id: 'amount', label: 'المبلغ', type: 'number' },
          { id: 'expense_date', label: 'التاريخ', type: 'date' },
          { id: 'description', label: 'الوصف' }
        ],
        initialValues: { expense_date: new Date().toISOString().split('T')[0] },
        onSave: v => apiCall('/expenses', 'POST', v),
        onSuccess: loadExpenses
      });
    });
  }

  // ===== التقارير =====
  function loadReports() {
    const tc = document.getElementById('tab-content');
    tc.innerHTML = `<div class="card"><h3 class="card-title">التقارير المالية</h3></div>
    <div class="report-card" id="rpt-dash"><div class="report-icon">📊</div><div class="report-info"><h4>لوحة التحكم</h4></div></div>
    <div class="report-card" id="rpt-trial"><div class="report-icon">📋</div><div class="report-info"><h4>ميزان المراجعة</h4></div></div>
    <div class="report-card" id="rpt-income"><div class="report-icon">📈</div><div class="report-info"><h4>قائمة الدخل</h4></div></div>
    <div class="report-card" id="rpt-balance"><div class="report-icon">⚖️</div><div class="report-info"><h4>الميزانية العمومية</h4></div></div>
    <div class="report-card" id="rpt-cust"><div class="report-icon">👤</div><div class="report-info"><h4>كشف حساب عميل</h4></div></div>
    <div class="report-card" id="rpt-supp"><div class="report-icon">🏭</div><div class="report-info"><h4>كشف حساب مورد</h4></div></div>`;
    document.getElementById('rpt-dash').onclick = loadDashboard;
    document.getElementById('rpt-trial').onclick = loadTrialBalance;
    document.getElementById('rpt-income').onclick = loadIncomeStatement;
    document.getElementById('rpt-balance').onclick = loadBalanceSheet;
    document.getElementById('rpt-cust').onclick = loadCustomerStatementForm;
    document.getElementById('rpt-supp').onclick = loadSupplierStatementForm;
  }

  async function loadTrialBalance() {
    const invoices = await apiCall('/invoices', 'GET');
    const expenses = await apiCall('/expenses', 'GET');
    const totalSales = invoices.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
    const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const html = `<div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-trial" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>ميزان المراجعة</h3>
      <div class="table-wrap"><table class="table"><thead><tr><th>الحساب</th><th>مدين</th><th>دائن</th></tr></thead><tbody>
      <tr><td>المبيعات</td><td></td><td>${formatNumber(totalSales)}</td></tr>
      <tr><td>المشتريات</td><td>${formatNumber(totalPurchases)}</td><td></td></tr>
      <tr><td>المصاريف</td><td>${formatNumber(totalExpenses)}</td><td></td></tr>
      </tbody></table></div></div>`;
    document.getElementById('tab-content').innerHTML = html;
    document.getElementById('back-from-trial').addEventListener('click', () => navigateTo('reports'));
  }

  async function loadIncomeStatement() {
    const invoices = await apiCall('/invoices', 'GET');
    const expenses = await apiCall('/expenses', 'GET');
    const totalSales = invoices.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
    const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const net = totalSales - totalPurchases - totalExpenses;
    document.getElementById('tab-content').innerHTML = `<div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-income" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>قائمة الدخل</h3>
      <p>الإيرادات: ${formatNumber(totalSales)}</p><p>تكلفة المبيعات: ${formatNumber(totalPurchases)}</p><p>المصاريف: ${formatNumber(totalExpenses)}</p>
      <hr><h2 style="color:${net >= 0 ? 'var(--success)' : 'var(--danger)'}">صافي الربح: ${formatNumber(net)}</h2></div>`;
    document.getElementById('back-from-income').addEventListener('click', () => navigateTo('reports'));
  }

  async function loadBalanceSheet() {
    const customers = await apiCall('/customers', 'GET');
    const suppliers = await apiCall('/suppliers', 'GET');
    const custBalance = customers.reduce((s, c) => s + (c.balance || 0), 0);
    const suppBalance = suppliers.reduce((s, s2) => s + (s2.balance || 0), 0);
    document.getElementById('tab-content').innerHTML = `<div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-balance" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>الميزانية العمومية</h3>
      <p>ذمم مدينة: ${formatNumber(custBalance)}</p><p>ذمم دائنة: ${formatNumber(suppBalance)}</p></div>`;
    document.getElementById('back-from-balance').addEventListener('click', () => navigateTo('reports'));
  }

  async function loadCustomerStatementForm() {
    const customers = await apiCall('/customers', 'GET');
    const opts = customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('tab-content').innerHTML = `<div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-cust" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>كشف حساب عميل</h3>
      <select class="select" id="cust-sel">${opts}</select>
      <button class="btn btn-primary" id="btn-show-cust">عرض</button>
      <div id="stmt-result"></div></div>`;
    document.getElementById('back-from-cust').addEventListener('click', () => navigateTo('reports'));
    document.getElementById('btn-show-cust').onclick = async () => {
      const id = document.getElementById('cust-sel').value;
      const invoices = await apiCall('/invoices', 'GET');
      const payments = await apiCall('/payments', 'GET');
      const custInvs = invoices.filter(i => i.customer_id == id);
      const custPmts = payments.filter(p => p.customer_id == id);
      let html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>';
      custInvs.forEach(i => html += `<tr><td>${formatDate(i.date)}</td><td>فاتورة ${i.reference || ''}</td><td>${formatNumber(i.total)}</td></tr>`);
      custPmts.forEach(p => html += `<tr><td>${formatDate(p.payment_date)}</td><td>دفعة</td><td style="color:var(--success);">-${formatNumber(p.amount)}</td></tr>`);
      html += '</tbody></table></div>';
      document.getElementById('stmt-result').innerHTML = html;
    };
  }

  async function loadSupplierStatementForm() {
    const suppliers = await apiCall('/suppliers', 'GET');
    const opts = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    document.getElementById('tab-content').innerHTML = `<div class="card">
      <button class="btn btn-secondary btn-sm" id="back-from-supp" style="margin-bottom:12px;">🔙 رجوع</button>
      <h3>كشف حساب مورد</h3>
      <select class="select" id="supp-sel">${opts}</select>
      <button class="btn btn-primary" id="btn-show-supp">عرض</button>
      <div id="stmt-result"></div></div>`;
    document.getElementById('back-from-supp').addEventListener('click', () => navigateTo('reports'));
    document.getElementById('btn-show-supp').onclick = async () => {
      const id = document.getElementById('supp-sel').value;
      const invoices = await apiCall('/invoices', 'GET');
      const payments = await apiCall('/payments', 'GET');
      const suppInvs = invoices.filter(i => i.supplier_id == id);
      const suppPmts = payments.filter(p => p.supplier_id == id);
      let html = '<div class="table-wrap"><table class="table"><thead><tr><th>التاريخ</th><th>البيان</th><th>المبلغ</th></tr></thead><tbody>';
      suppInvs.forEach(i => html += `<tr><td>${formatDate(i.date)}</td><td>فاتورة ${i.reference || ''}</td><td>${formatNumber(i.total)}</td></tr>`);
      suppPmts.forEach(p => html += `<tr><td>${formatDate(p.payment_date)}</td><td>دفعة</td><td style="color:var(--danger);">-${formatNumber(p.amount)}</td></tr>`);
      html += '</tbody></table></div>';
      document.getElementById('stmt-result').innerHTML = html;
    };
  }

  // ===== لوحة التحكم (مع تصدير واستيراد آمن) =====
  async function loadDashboard() {
    const invoices = await apiCall('/invoices', 'GET');
    const totalSales = invoices.filter(i => i.type === 'sale').reduce((s, i) => s + i.total, 0);
    const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((s, i) => s + i.total, 0);
    const expenses = await apiCall('/expenses', 'GET');
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const net = totalSales - totalPurchases - totalExpenses;
    const tc = document.getElementById('tab-content');
    tc.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card profit"><div class="stat-label">صافي الربح</div><div class="stat-value ${net >= 0 ? 'positive' : 'negative'}">${formatNumber(net)}</div></div>
        <div class="stat-card cash"><div class="stat-label">المبيعات</div><div class="stat-value">${formatNumber(totalSales)}</div></div>
        <div class="stat-card receivables"><div class="stat-label">المشتريات</div><div class="stat-value">${formatNumber(totalPurchases)}</div></div>
        <div class="stat-card payables"><div class="stat-label">المصاريف</div><div class="stat-value">${formatNumber(totalExpenses)}</div></div>
      </div>
      <div class="card">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-primary" id="btn-export"><span style="display:flex;align-items:center;gap:6px;">📤 تصدير البيانات</span></button>
          <button class="btn btn-secondary" id="btn-import"><span style="display:flex;align-items:center;gap:6px;">📥 استيراد البيانات</span></button>
        </div>
      </div>`;
    document.getElementById('btn-export').onclick = showExportDialog;
    document.getElementById('btn-import').onclick = () => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json';
      inp.onchange = e => handleImport(e.target.files[0]);
      inp.click();
    };
  }

  // ===== تصدير البيانات =====
  async function showExportDialog() {
    const tables = ['items', 'customers', 'suppliers', 'categories', 'units', 'invoices', 'invoiceLines', 'payments', 'expenses'];
    const names = { items:'المواد', customers:'العملاء', suppliers:'الموردين', categories:'التصنيفات', units:'الوحدات', invoices:'الفواتير', invoiceLines:'بنود الفواتير', payments:'الدفعات', expenses:'المصاريف' };
    const statsHTML = (await Promise.all(tables.map(async t => {
      const data = await getTable(t).toArray();
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span>${names[t]}</span><span style="font-weight:700;">${data.length} سجل</span></div>`;
    }))).join('');
    const supportsFilePicker = 'showSaveFilePicker' in window;
    const modal = openModal({
      title: 'تصدير البيانات',
      bodyHTML: `<p style="margin-bottom:12px;color:var(--text-secondary);">سيتم تصدير جميع بياناتك إلى ملف JSON.</p>
        <div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">
          <div style="font-weight:700;margin-bottom:8px;">محتوى التصدير</div>${statsHTML}
        </div>
        <p style="font-size:13px;color:var(--text-muted);">${supportsFilePicker ? '💡 المتصفح يدعم اختيار مكان الحفظ.' : '⚠️ سيتم الحفظ في مجلد "التنزيلات" الافتراضي.'}</p>`,
      footerHTML: `<button class="btn btn-secondary" id="exp-cancel">إلغاء</button><button class="btn btn-primary" id="exp-confirm">📥 بدء التصدير</button>`
    });
    modal.element.querySelector('#exp-cancel').onclick = () => modal.close();
    modal.element.querySelector('#exp-confirm').onclick = async () => {
      modal.close();
      const data = {};
      for (const t of tables) data[t] = await getTable(t).toArray();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const fileName = `alrajhi-backup-${new Date().toISOString().slice(0,10)}.json`;
      if (supportsFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({ suggestedName: fileName, types: [{ description: 'ملف JSON', accept: {'application/json':['.json']} }] });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          showToast(`✅ تم حفظ الملف بنجاح: ${fileName}`, 'success');
        } catch (err) { if (err.name !== 'AbortError') showToast('فشل التصدير: ' + err.message, 'error'); }
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        a.click();
        showToast(`✅ تم تنزيل "${fileName}" إلى مجلد التنزيلات`, 'success');
      }
    };
  }

  // ===== استيراد البيانات (مع معاملة آمنة) =====
  async function handleImport(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (typeof data !== 'object' || Array.isArray(data)) throw new Error('تنسيق الملف غير صحيح');
      
      // ترتيب الجداول لضمان العلاقات
      const priorityOrder = ['categories','units','customers','suppliers','items','invoices','invoiceLines','payments','expenses'];
      const sortedTables = Object.keys(data).sort((a,b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b));
      if (!sortedTables.length) throw new Error('الملف فارغ');

      let totalRecords = 0;
      const tableDetails = sortedTables.map(t => {
        const count = Array.isArray(data[t]) ? data[t].length : 0;
        totalRecords += count;
        return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);"><span>${t}</span><span style="font-weight:700;">${count} سجل</span></div>`;
      }).join('');

      const modal = openModal({
        title: 'معاينة ملف الاستيراد',
        bodyHTML: `<p>تم العثور على <strong>${sortedTables.length} جداول</strong> تحتوي على <strong>${totalRecords} سجل</strong>.</p>
          <div style="background:var(--bg);border-radius:12px;padding:12px;margin-bottom:16px;">${tableDetails}</div>
          <p style="color:var(--danger);">⚠️ تحذير: سيتم <strong>مسح جميع بياناتك الحالية</strong> واستبدالها بهذا الملف.</p>`,
        footerHTML: `<button class="btn btn-secondary" id="imp-cancel">إلغاء</button><button class="btn btn-danger" id="imp-confirm">استيراد واستبدال</button>`
      });
      modal.element.querySelector('#imp-cancel').onclick = () => modal.close();
      modal.element.querySelector('#imp-confirm').onclick = async () => {
        modal.close();
        const tableNames = sortedTables.filter(t => Array.isArray(data[t]));
        try {
          // معاملة واحدة لضمان الذرية
          await db.transaction('rw', tableNames, async () => {
            for (const table of tableNames) {
              const tableObj = getTable(table);
              await tableObj.clear();
              for (const row of data[table]) await tableObj.add(row);
            }
          });
          showToast('تم استيراد البيانات بنجاح', 'success');
        } catch (innerError) {
          showToast('فشل الاستيراد: ' + innerError.message, 'error');
          return;
        }

        // تحديث جميع الكاشات وحساب أرصدة الفواتير المباشر
        [itemsCache, customersCache, suppliersCache, invoicesCache, categoriesCache, unitsCache] = await Promise.all([
          apiCall('/items', 'GET'),
          apiCall('/customers', 'GET'),
          apiCall('/suppliers', 'GET'),
          apiCall('/invoices', 'GET'),
          apiCall('/definitions?type=category', 'GET'),
          apiCall('/definitions?type=unit', 'GET'),
          apiCall('/payments', 'GET').then(payments => {
            invoicesCache.forEach(inv => {
              const pmts = payments.filter(p => p.invoice_id == inv.id);
              inv.paid = pmts.reduce((s, p) => s + p.amount, 0);
              inv.balance = inv.total - inv.paid;
            });
          })
        ]);
        loadDashboard();
      };
    } catch (e) {
      showToast('فشل استيراد الملف: ' + e.message, 'error');
    }
  }

  // ===== التنقل =====
  const tabsConfig = {
    dashboard: { title: 'لوحة التحكم', icon: ICONS.home },
    items: { title: 'المواد', icon: ICONS.box },
    'sale-invoice': { title: 'فاتورة بيع', icon: ICONS.cart },
    'purchase-invoice': { title: 'فاتورة شراء', icon: ICONS.download },
    customers: { title: 'العملاء', icon: ICONS.users },
    suppliers: { title: 'الموردين', icon: ICONS.factory },
    categories: { title: 'التصنيفات', icon: ICONS.tag },
    units: { title: 'الوحدات', icon: ICONS.scale },
    payments: { title: 'الدفعات', icon: ICONS.wallet },
    expenses: { title: 'المصاريف', icon: ICONS.dollar },
    invoices: { title: 'الفواتير', icon: ICONS.fileText },
    reports: { title: 'التقارير', icon: ICONS.chart }
  };

  function setActiveTab(tab) {
    document.querySelectorAll('.nav-item, .bottom-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    document.getElementById('page-title').textContent = tabsConfig[tab]?.title || '';
  }

  function navigateTo(tab) {
    setActiveTab(tab);
    document.getElementById('more-menu').style.display = 'none';
    document.getElementById('sidebar').classList.remove('open');
    const content = document.getElementById('tab-content');
    content.style.opacity = '0';
    setTimeout(async () => {
      switch (tab) {
        case 'dashboard': loadDashboard(); break;
        case 'items': loadItems(); break;
        case 'sale-invoice': showInvoiceModal('sale'); break;
        case 'purchase-invoice': showInvoiceModal('purchase'); break;
        case 'customers': loadGenericSection('/customers', 'customers'); break;
        case 'suppliers': loadGenericSection('/suppliers', 'suppliers'); break;
        case 'categories': loadGenericSection('/definitions?type=category', 'categories'); break;
        case 'units': loadUnitsSection(); break;
        case 'payments': loadPayments(); break;
        case 'expenses': loadExpenses(); break;
        case 'invoices': loadInvoices(); break;
        case 'reports': loadReports(); break;
        case 'more': document.getElementById('more-menu').style.display = 'flex'; lockScroll(); break;
      }
      content.style.transition = 'opacity 0.3s';
      content.style.opacity = '1';
    }, 50);
  }

  function initNavigation() {
    const sidebarNav = document.getElementById('sidebar-nav');
    const sheetGrid = document.getElementById('sheet-grid');
    const mainTabs = ['dashboard', 'items', 'sale-invoice', 'customers', 'suppliers', 'categories', 'units', 'payments', 'expenses', 'invoices', 'reports'];
    const moreTabs = ['purchase-invoice', 'customers', 'suppliers', 'categories', 'units', 'payments', 'expenses', 'reports'];

    mainTabs.forEach(key => {
      const cfg = tabsConfig[key];
      const btn = document.createElement('button');
      btn.className = 'nav-item' + (key === 'dashboard' ? ' active' : '');
      btn.dataset.tab = key;
      btn.innerHTML = `${cfg.icon} <span>${cfg.title}</span>`;
      btn.onclick = () => navigateTo(key);
      sidebarNav.appendChild(btn);
    });

    moreTabs.forEach(key => {
      const cfg = tabsConfig[key];
      const btn = document.createElement('button');
      btn.className = 'sheet-item';
      btn.dataset.tab = key;
      btn.innerHTML = `${cfg.icon} <span>${cfg.title}</span>`;
      btn.onclick = () => { unlockScroll(); navigateTo(key); };
      sheetGrid.appendChild(btn);
    });
  }

  // ربط الأحداث
  document.getElementById('menu-toggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.querySelector('.sheet-backdrop').addEventListener('click', () => { document.getElementById('more-menu').style.display = 'none'; unlockScroll(); });
  document.querySelectorAll('.bottom-item').forEach(b => b.addEventListener('click', () => {
    const tab = b.dataset.tab;
    if (tab === 'more') { document.getElementById('more-menu').style.display = 'flex'; lockScroll(); }
    else if (tab) navigateTo(tab);
  }));
  document.getElementById('btn-help').addEventListener('click', () => openModal({ title: 'مساعدة', bodyHTML: '<p>نظام الراجحي للمحاسبة - نسخة Offline</p>' }));

  // بدء التطبيق
  async function initApp() {
    try {
      [itemsCache, customersCache, suppliersCache, invoicesCache, categoriesCache, unitsCache] = await Promise.all([
        apiCall('/items', 'GET'), apiCall('/customers', 'GET'), apiCall('/suppliers', 'GET'),
        apiCall('/invoices', 'GET'), apiCall('/definitions?type=category', 'GET'), apiCall('/definitions?type=unit', 'GET')
      ]);
      initNavigation();
      loadDashboard();
      document.getElementById('loading-screen').classList.add('hidden');
    } catch (e) {
      showToast(e.message, 'error');
      document.getElementById('loading-screen').classList.add('hidden');
    }
  }
  initApp();
})();

