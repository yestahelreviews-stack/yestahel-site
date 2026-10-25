// «ليل هادي» results in the browser (/search/ and department pages): every filter, sort and page
// is a real address; on the same page we redraw #res from data.js without reloading.
// Checkboxes apply at once on wide screens and wait for «اعرض النتائج» in the phone sheet.
(function () {
  'use strict';
  const box = document.getElementById('res');
  const D = window.YDATA, S = window.Search;
  if (!box || !D || !S || !window.Results) { document.documentElement.classList.remove('rq'); return; }
  const $ = (s, r = document) => r.querySelector(s);
  const A = window.Kit.browserArt(window.Art);
  const CMP = new Map();
  D.comparisons.forEach(c => { CMP.set(c.a, c); CMP.set(c.b, c); });
  const K = window.Kit({ A, KIND: S.KIND_AR, depts: D.depts, cmpOf: id => CMP.get(id) || null, base: D.base || '' });
  const R = window.Results({ D, S, A, K });
  const home = box.dataset.dept || '';
  const cur = () => R.state(new URLSearchParams(location.search), home);

  function render(scroll) {
    const f = cur();
    box.innerHTML = R.html(f);
    document.documentElement.classList.remove('rq');
    for (const q of document.querySelectorAll('input[name="q"]')) if (document.activeElement !== q) q.value = f.q;
    if (!home) document.title = f.q ? `${f.q} | بحث يستاهل؟` : 'البحث | يستاهل؟';
    if (scroll) scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + scrollY - 120) });
  }
  // Same page: redraw in place. Another page (a department, the search page): go there.
  function go(href) {
    const to = new URL(href, location.href);
    closeSheet();
    if (to.pathname !== location.pathname) { location.href = to.href; return; }
    history.pushState(null, '', to.pathname + to.search);
    render(true);
  }
  if (R.FKEYS.some(k => new URLSearchParams(location.search).has(k))) render(false);
  else document.documentElement.classList.remove('rq');
  addEventListener('popstate', () => render(false));

  // ---- phone sheets: sort and filter ----
  let pending = {};
  const sheet = document.createElement('div'), scrim = document.createElement('div');
  sheet.className = 'sheet'; sheet.id = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true');
  scrim.className = 'scrim'; scrim.id = 'scrim';
  document.body.append(scrim, sheet);
  function openSheet(title, body, foot = '') {
    sheet.innerHTML = `<div class="grab"></div><div class="sh"><b>${title}</b><button type="button" data-act="sheet-close" aria-label="إغلاق">${K.ic('x')}</button></div><div class="sb${foot ? ' filters-m' : ''}">${body}</div>${foot ? `<div class="sf">${foot}</div>` : ''}`;
    requestAnimationFrame(() => { sheet.classList.add('open'); scrim.classList.add('open'); });
  }
  function closeSheet() { sheet.classList.remove('open'); scrim.classList.remove('open'); }
  scrim.addEventListener('click', closeSheet);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

  document.addEventListener('click', e => {
    const inRes = e.target.closest('#res, #sheet');
    if (!inRes) return;
    const el = e.target.closest('[data-act]');
    if (!el) {
      const a = e.target.closest('a[href]');
      if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.origin === location.origin && a.pathname === location.pathname && !a.hash) { e.preventDefault(); go(a.href); }
      return;
    }
    const act = el.dataset.act;
    if (act === 'fg') el.parentElement.classList.toggle('closed');
    else if (act === 'brand-more') { el.parentElement.querySelectorAll('[data-more]').forEach(x => { x.hidden = false; }); el.remove(); }
    else if (act === 'price-go') {
      const fb = el.closest('.fbody');
      const min = fb.querySelector('[data-p="min"]').value.trim(), max = fb.querySelector('[data-p="max"]').value.trim();
      if (el.closest('#sheet')) Object.assign(pending, { min, max });
      else go(R.hrefWith(cur(), { min, max }));
    } else if (act === 'm-sort') {
      const f = cur(), s = R.compute(f).sort;
      openSheet('ترتيب حسب', R.SORTS.map(([k, t]) => `<a class="radio${s === k ? ' on' : ''}" href="${R.hrefWith(f, { sort: k })}">${t}<span class="dot"></span></a>`).join(''));
    } else if (act === 'm-filter') {
      const f = cur();
      pending = { ...f };
      openSheet('فلتر', R.filtersHtml(f, R.compute(f)), `<a class="btn ghost" href="${R.hrefWith(f, { kind: [], brand: [], store: [], verdict: [], video: false, min: '', max: '' })}">امسح الكل</a><button class="btn pri" type="button" data-act="m-apply">اعرض النتائج</button>`);
    } else if (act === 'm-apply') {
      const fb = sheet.querySelector('.prange');
      if (fb) Object.assign(pending, { min: fb.querySelector('[data-p="min"]').value.trim(), max: fb.querySelector('[data-p="max"]').value.trim() });
      go(R.hrefWith(cur(), pending));
    } else if (act === 'sheet-close') closeSheet();
  });
  document.addEventListener('change', e => {
    const inp = e.target;
    if (!inp.closest('#res, #sheet')) return;
    if (inp.matches('select[data-act="sort"]')) { go(R.hrefWith(cur(), { sort: inp.value })); return; }
    if (!inp.matches('input[type="checkbox"][data-f]')) return;
    const key = inp.dataset.f, val = inp.value;
    const inSheet = !!inp.closest('#sheet');
    const f = inSheet ? pending : cur();
    const patch = key === 'video' ? { video: inp.checked } : { [key]: inp.checked ? [...new Set([...(f[key] || []), val])] : (f[key] || []).filter(x => x !== val) };
    if (inSheet) Object.assign(pending, patch);
    else go(R.hrefWith(f, patch));
  });
  document.addEventListener('input', e => {
    if (!e.target.matches('[data-act="brand-filter"]')) return;
    const v = S.norm(e.target.value);
    e.target.parentElement.querySelectorAll('.bi').forEach(x => { x.hidden = v ? !x.dataset.b.includes(v) : x.hasAttribute('data-more'); });
  });
  // Enter in the price boxes runs «عرض النتائج».
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('#res .prange input')) { e.preventDefault(); e.target.closest('.fbody').querySelector('[data-act="price-go"]').click(); }
  });
})();
