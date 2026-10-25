// «ليل هادي» results with prototype B's filters, for /search/ and every department page.
// The same file writes a department's first view on the server (site/b/render.js, node:vm), so
// its products are in the HTML, and every filter, sort and page in the browser (res.js).
// The state lives in the address: /search/?q=&dept=&kind=&brand=&store=&verdict=&video=&min=&max=&sort=&page=
// (a department with no words is its own page: /<dept>/?kind=…).
//   Results({ D, S, A, K }) -> { state, compute, html, filtersHtml, hrefWith, SORTS, FKEYS }
(function () {
  'use strict';
  window.Results = function Results({ D, S, A, K, deptUrl = d => `/${d}/` }) {
    const { esc, u, ic, short, deptName, kindName, pic, cards } = K;
    const KIND = S.KIND_AR;
    const own = (o, k) => k != null && Object.prototype.hasOwnProperty.call(o, k);
    const okDept = d => (own(D.depts, d) ? d : '');
    const CMP_OF = new Map();
    D.comparisons.forEach(c => { CMP_OF.set(c.a, c); CMP_OF.set(c.b, c); });
    const reviewUrl = c => `/review/${c.slug}/`;
    // Daily price recording hasn't started yet, so the «real discount» tools say when they open.
    const TRACK_READY = 'بعد 30 يوم من بداية التسجيل';
    const EXAMPLES = ['ارخص شاحن ايفون', 'هدية تحت 200', 'انكر ولا يوجرين', 'للكشتة', 'قلايه'];
    const SORTS = [['best', 'الأنسب'], ['verdict', 'حكمنا أولاً'], ['price', 'الأرخص'], ['price-desc', 'الأغلى'], ['video', 'فيه فيديو أولاً']];
    const VLABEL = { yes: 'يستاهل', no: 'ما يستاهل', none: 'لم نحكم بعد' };
    const FKEYS = ['q', 'dept', 'kind', 'brand', 'store', 'verdict', 'video', 'min', 'max', 'sort', 'page'];
    const qs = o => { const p = []; for (const [k, v] of Object.entries(o)) if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) p.push(`${k}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : v)}`); return p.length ? `?${p.join('&')}` : ''; };
    const listParam = (q, k) => (q.get(k) || '').split(',').filter(Boolean).slice(0, 20);
    const num = v => (/^\d{1,6}$/.test(v || '') ? v : '');
    const toggle = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    const tier = p => (p.verdict === true ? 0 : p.verdict === false ? 2 : 1);

    // q: URLSearchParams; home: the department whose page this is ('' on /search/).
    function state(q, home = '') {
      return {
        q: (q.get('q') || '').trim().slice(0, 80), dept: okDept(q.get('dept')) || okDept(home), kind: listParam(q, 'kind').filter(k => own(KIND, k)),
        brand: listParam(q, 'brand'), store: listParam(q, 'store'), verdict: listParam(q, 'verdict').filter(v => own(VLABEL, v)), video: q.get('video') === '1',
        min: num(q.get('min')), max: num(q.get('max')), sort: SORTS.some(([k]) => k === q.get('sort')) ? q.get('sort') : '', page: Math.max(1, parseInt(q.get('page'), 10) || 1), home: okDept(home),
      };
    }
    function hrefWith(f, patch) {
      const n = { ...f, ...patch };
      if (!('page' in patch)) n.page = 1;
      const o = { kind: n.kind, brand: n.brand, store: n.store, verdict: n.verdict, video: n.video ? 1 : '', min: n.min, max: n.max, sort: n.sort, page: n.page > 1 ? n.page : '' };
      return n.dept && !n.q ? u(deptUrl(n.dept) + qs(o)) : u('/search/' + qs({ q: n.q, dept: n.dept, ...o }));
    }
    function compute(f) {
      const run = f.q ? S.run(f.q) : { items: D.products.slice(), intent: {}, labels: [], cmp: null, loose: false };
      const intent = run.intent;
      let base = run.items;
      const dept = f.dept || '';
      if (dept && !intent.dept) base = base.filter(p => p.dept === dept);
      const max = f.max ? +f.max : null, min = f.min ? +f.min : null;
      const pass = (p, skip) => (skip === 'kind' || !f.kind.length || f.kind.includes(p.kind))
        && (skip === 'brand' || !f.brand.length || f.brand.includes(p.brand))
        && (skip === 'store' || !f.store.length || f.store.includes(p.store))
        && (skip === 'verdict' || !f.verdict.length || f.verdict.includes(p.verdict === true ? 'yes' : p.verdict === false ? 'no' : 'none'))
        && (skip === 'video' || !f.video || p.video)
        && (skip === 'price' || ((min == null || (p.price != null && p.price >= min)) && (max == null || (p.price != null && p.price <= max))))
        && (skip === 'dept' || !dept || p.dept === dept);
      const facet = (key, get) => {
        const o = {};
        for (const p of base) if (pass(p, key)) { const v = get(p); if (v) o[v] = (o[v] || 0) + 1; }
        return Object.entries(o).sort((a, b) => b[1] - a[1]);
      };
      const facets = {
        dept: facet('dept', p => p.dept), kind: facet('kind', p => p.kind), brand: facet('brand', p => p.brand), store: facet('store', p => p.store),
        verdict: facet('verdict', p => (p.verdict === true ? 'yes' : p.verdict === false ? 'no' : 'none')), video: base.filter(p => pass(p, 'video') && p.video).length,
      };
      let items = base.filter(p => pass(p));
      const sort = f.sort || intent.sort || 'best';
      const by = {
        price: (a, b) => (a.price ?? 1e9) - (b.price ?? 1e9), 'price-desc': (a, b) => (b.price ?? -1) - (a.price ?? -1),
        verdict: (a, b) => (b.verdict === true) - (a.verdict === true) || (b.video - a.video), video: (a, b) => b.video - a.video,
        // «الأنسب» with no words: our يستاهل picks first, then the list's own order, then ما يستاهل.
        best: f.q ? null : (a, b) => tier(a) - tier(b),
      };
      if (by[sort]) items = items.slice().sort(by[sort]);
      return { run, items, facets, sort, dept };
    }
    function filtersHtml(f, R) {
      const ck = (key, val, label, n, on, dis) => `<label class="ck${dis ? ' off' : ''}"><input type="checkbox" data-f="${key}" value="${esc(val)}"${on ? ' checked' : ''}${dis ? ' disabled' : ''}><span>${label}</span>${n != null ? `<span class="n">${n}</span>` : ''}</label>`;
      const grp = (title, body, o = {}) => `<div class="fg${o.closed ? ' closed' : ''}"><h4 data-act="fg">${title}${o.isNew ? '<span class="new">من يستاهل</span>' : ''}<span style="margin-inline-start:auto"></span>${ic('chev-d', 's')}</h4><div class="fbody">${body}</div></div>`;
      const brands = R.facets.brand;
      return [
        grp('حكمنا', R.facets.verdict.map(([v, n]) => ck('verdict', v, VLABEL[v], n, f.verdict.includes(v))).join('') + ck('video', '1', 'فيه مراجعة فيديو', R.facets.video, f.video), { isNew: true }),
        grp('الفئة', `${f.dept ? `<a class="morel" href="${hrefWith(f, { dept: '', kind: [] })}">${ic('chev-r', 'xs')} كل الفئات</a>` : ''}`
          + (f.dept ? '' : R.facets.dept.map(([d, n]) => `<a class="ck" href="${hrefWith(f, { dept: d })}"><span>${esc(deptName(d))}</span><span class="n">${n}</span></a>`).join(''))
          + (f.dept ? `<div style="padding-inline-start:8px"><b style="display:block;color:var(--ink);font-size:13px;margin:6px 0">${esc(deptName(f.dept))}</b>${R.facets.kind.map(([k, n]) => ck('kind', k, esc(kindName(k)), n, f.kind.includes(k))).join('')}</div>` : '')),
        brands.length ? grp('الماركة', `${brands.length > 8 ? '<input class="fsearch" placeholder="ابحث عن ماركة" aria-label="ابحث عن ماركة" data-act="brand-filter">' : ''}<div class="blist">${brands.map(([b, n], i) => `<div class="bi"${i >= 8 ? ' hidden data-more' : ''} data-b="${esc(S.norm(b))}">${ck('brand', b, esc(b), n, f.brand.includes(b))}</div>`).join('')}</div>${brands.length > 8 ? `<button class="morel" type="button" data-act="brand-more">عرض الكل (${brands.length})</button>` : ''}`) : '',
        grp('السعر (ر.س)', `<div class="prange"><input type="number" inputmode="numeric" placeholder="من" aria-label="السعر من" value="${esc(f.min)}" data-p="min" min="0"><span>–</span><input type="number" inputmode="numeric" placeholder="إلى" aria-label="السعر إلى" value="${esc(f.max)}" data-p="max" min="0"></div><button class="btn ghost sm block" type="button" style="margin-top:8px" data-act="price-go">عرض النتائج</button>`),
        grp('العروض', ck('deal', 'real', 'خصم حقيقي (نتأكد من سجل السعر)', null, false, true) + `<div class="fnote">نبدأ نسجّل الأسعار قريب. يشتغل هالفلتر ${TRACK_READY}.</div>`),
        grp('المتجر', R.facets.store.map(([s, n]) => ck('store', s, esc(s), n, f.store.includes(s))).join('')),
        f.dept ? '' : grp('نوع المنتج', R.facets.kind.slice(0, 12).map(([k, n]) => ck('kind', k, esc(kindName(k)), n, f.kind.includes(k))).join(''), { closed: R.facets.kind.length > 6 }),
      ].join('');
    }
    // Everything inside #res. On a department page the page's own heading sits above it.
    function html(f) {
      const R = compute(f);
      const { run, items } = R;
      const per = 20, pages = Math.max(1, Math.ceil(items.length / per)), page = Math.min(f.page, pages);
      const shown = items.slice((page - 1) * per, page * per);
      const title = f.q ? `<b>${items.length}</b> نتيجة لـ «<b>${esc(f.q)}</b>»` : f.dept ? `<b>${items.length}</b> منتج في <b>${esc(deptName(f.dept))}</b>` : `<b>${items.length}</b> منتج`;
      // Our comparison, where noon puts the sponsored brand row (only comparisons we wrote).
      let hint = '';
      const c = (run.cmp && run.cmp.comparison) || (f.q && items[0] ? CMP_OF.get(items[0].id) : null);
      if (c) {
        const a = D.products.find(p => p.id === c.a), b = D.products.find(p => p.id === c.b);
        if (a && b) hint = `<div class="hint"><span class="pair">${pic(a)}${pic(b)}</span><span><b>مقارنة جاهزة: ${esc(short(c.title, 60))}</b><p>نفس المعايير للاثنين، والحكم في الآخر</p></span><a class="btn pri sm" href="${u(reviewUrl(c))}">${ic('scale', 's')} قارنهم</a></div>`;
      }
      // A store link in the search box: «الصق رابطك» reads it (header search sends it there too).
      if (/^https?:\/\//i.test(f.q)) hint = `<div class="hint">${ic('external')}<span><b>هذا رابط منتج</b><p>نقرأ رقم المنتج من الرابط ونقولك حكمنا.</p></span><a class="btn pri sm" href="${u(`/check/?u=${encodeURIComponent(f.q)}`)}">افحص الرابط</a></div>`;
      const understood = run.labels && run.labels.length ? `<span class="chip ours on" style="pointer-events:none">${ic('sparkle', 's')} فهمنا: ${run.labels.map(esc).join(' · ')}</span>` : '';
      const yesOnly = f.verdict.length === 1 && f.verdict[0] === 'yes';
      const chips = [
        understood,
        `<a class="chip ours${yesOnly ? ' on' : ''}" href="${hrefWith(f, { verdict: yesOnly ? [] : ['yes'] })}">${ic('check', 's')} حكمنا: يستاهل فقط</a>`,
        `<a class="chip ours${f.video ? ' on' : ''}" href="${hrefWith(f, { video: !f.video })}">${ic('video', 's')} فيه فيديو</a>`,
        `<a class="chip${f.max === '100' ? ' on' : ''}" href="${hrefWith(f, { max: f.max === '100' ? '' : '100' })}">تحت 100 ر.س</a>`,
        `<span class="chip" style="opacity:.55" title="يشتغل ${TRACK_READY}">${ic('clock', 's')} خصم حقيقي</span>`,
        ...(f.dept ? [] : R.facets.dept.slice(0, 4).map(([d]) => `<a class="chip" href="${hrefWith(f, { dept: d })}">${esc(deptName(d))}</a>`)),
        ...R.facets.brand.slice(0, 5).map(([b]) => `<a class="chip${f.brand.includes(b) ? ' on' : ''}" href="${hrefWith(f, { brand: toggle(f.brand, b) })}">${esc(b)}</a>`),
      ].join('');
      const nActive = f.kind.length + f.brand.length + f.store.length + f.verdict.length + (f.video ? 1 : 0) + (f.min ? 1 : 0) + (f.max ? 1 : 0);
      const crumbs = f.home ? '' : `<nav class="crumbs" aria-label="مسار الصفحة"><a href="${u('/')}">الرئيسية</a>${ic('chev-l')}${f.dept ? `<a href="${u(deptUrl(f.dept))}">${esc(deptName(f.dept))}</a>${f.q ? ic('chev-l') : ''}` : ''}${f.q ? `<span>بحث: ${esc(f.q)}</span>` : ''}${!f.dept && !f.q ? '<span>كل المنتجات</span>' : ''}</nav>`;
      const pager = pages > 1 ? `<nav class="pager" aria-label="الصفحات">${page > 1 ? `<a class="pg" href="${hrefWith(f, { page: page - 1 })}" aria-label="السابقة">${ic('chev-r', 's')}</a>` : ''}${Array.from({ length: pages }, (_, i) => `<a class="pg${i + 1 === page ? ' on' : ''}" href="${hrefWith(f, { page: i + 1 })}"${i + 1 === page ? ' aria-current="page"' : ''}>${i + 1}</a>`).join('')}${page < pages ? `<a class="pg" href="${hrefWith(f, { page: page + 1 })}" aria-label="التالية">${ic('chev-l', 's')}</a>` : ''}</nav>` : '';
      const body = items.length
        ? `${run.loose ? `<div class="hint">${ic('info')}<span><b>ما لقينا كل الكلمات مع بعض</b><p>هذي أقرب النتائج لـ «${esc(f.q)}».</p></span></div>` : ''}<div class="grid">${cards(shown)}</div>${pager}`
        : `<div class="empty"><div class="ill" style="background:${A.tint('box', f.q || 'x')}">${A.svg('box', { seed: f.q || 'x' })}</div><h3>ما لقينا «${esc(f.q || 'هالفلتر')}»</h3><p>جرّب كلمة ثانية، أو شيل بعض الفلاتر.</p><div class="tchips" style="justify-content:center">${EXAMPLES.map(t => `<a href="${u('/search/' + qs({ q: t }))}">${esc(t)}</a>`).join('')}</div><a class="btn pri" style="margin-top:14px" href="mailto:yestahel.reviews@gmail.com?subject=${encodeURIComponent('اقتراح منتج نراجعه')}&amp;body=${encodeURIComponent(f.q || '')}">${ic('bulb', 's')} اقترحه علينا نراجعه</a></div>`;
      const head = f.home ? `<p class="rcount">${title}</p>` : `<h1>${title}</h1>`;
      return `${crumbs}
      <div class="res-head">${head}<label class="sortsel">ترتيب حسب: <select data-act="sort">${SORTS.map(([k, t]) => `<option value="${k}"${R.sort === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div>
      <div class="mres-bar"><span>${title}</span></div>
      <div class="qchips">${chips}</div>
      ${hint}
      <div class="res"><aside class="filters" aria-label="الفلاتر">${filtersHtml(f, R)}</aside><div style="min-width:0">${body}</div></div>
      <div class="mfab"><button type="button" data-act="m-sort">${ic('sort', 's')} ترتيب</button><span class="sep"></span><button type="button" data-act="m-filter">${ic('filter', 's')} فلتر${nActive ? `<span class="cnt">${nActive}</span>` : ''}</button></div>`;
    }
    return { state, compute, html, filtersHtml, hrefWith, SORTS, FKEYS, EXAMPLES };
  };
})();
