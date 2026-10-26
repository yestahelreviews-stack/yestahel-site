// «ليل هادي» shared pieces: one card, stamp and price markup for the pages site/build.js writes
// (site/b/render.js runs this file in node:vm) and for what the browser draws (search results,
// filters, suggestions). Products carry their page (href) and cleared photo (ph) already.
//   Kit({ A, KIND, depts, cmpOf, base }) -> { card, cards, pic, stamp, … }
(function () {
  'use strict';
  window.Kit = function Kit({ A, KIND, depts, cmpOf = () => null, base = '' }) {
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    // Root-absolute links get the preview prefix in the browser; the build adds its own on write.
    const u = s => (base && /^\/(?!\/)/.test(s) ? base + s : s);
    const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
    const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const dAr = iso => { const [, m, d] = String(iso || '').split('-').map(Number); return m ? `${d} ${MONTHS[m - 1]}` : ''; };
    const money = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
    const short = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
    const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
    const deptName = s => depts[s] || '';
    const kindName = k => (KIND[k] || ['منتجات'])[0];
    const pendingLabel = p => (p && p.episode != null ? 'الحكم قريباً' : 'لم نحكم بعد');
    const dotCls = (i, on) => { const d = Math.abs(i - on); return d === 0 ? 'on' : d === 1 ? 'n1' : d === 2 ? 'n2' : 'n3'; };

    const img = (ph, eager = false) => `<img src="${esc(u(ph.src))}" alt="${esc(ph.alt)}"${ph.size ? ` width="${ph.size[0]}" height="${ph.size[1]}"` : ''}${eager ? '' : ' loading="lazy"'} decoding="async">`;
    // A photo is shown with its source («الصورة من …»): partners make it a condition (FitNeeds).
    const cap = ph => (ph && ph.caption ? `<span class="phc">${esc(ph.caption)}</span>` : '');
    // The cleared photo when there is one, else the product's drawing (art.js), never a store image.
    // mode 'cap': the photo carries its source on it; 'tiny': a thumbnail with no room for the
    // source shows the drawing instead (the product's own page shows the photo and its source).
    const pic = (p, view = 0, cls = 't', mode = '') => {
      const ph = view === 0 && mode !== 'tiny' ? p.ph : null;
      return ph ? `<div class="${cls} photo">${img(ph)}${mode === 'cap' ? cap(ph) : ''}</div>` : `<div class="${cls}" style="background:${A.tint(p.kind, p.id)}">${A.svg(p.kind, { seed: p.id, view, label: view ? '' : p.title })}</div>`;
    };
    // lazy: an empty tile that ui.js draws when it shows (hidden tabs stay light).
    const kpic = (kind, seed, cls = 't', lazy = false) => (lazy
      ? `<div class="${cls} lz" style="background:${A.tint(kind, seed)}" data-kind="${esc(kind)}" data-seed="${esc(seed)}"></div>`
      : `<div class="${cls}" style="background:${A.tint(kind, seed)}">${A.svg(kind, { seed })}</div>`);
    const stamp = (v, cls = '', p = null) => (v === true ? `<span class="stamp ${cls}">${ic('check', 's')} يستاهل</span>` : v === false ? `<span class="stamp no ${cls}">${ic('x', 's')} ما يستاهل</span>` : `<span class="stamp wait ${cls}">${pendingLabel(p)}</span>`);
    const stampMini = p => (p.verdict === true ? `<span class="vpill"><span class="ok">${ic('check', 'xs')} يستاهل</span></span>` : p.verdict === false ? '<span class="vpill"><span class="no">ما يستاهل</span></span>' : `<span class="vpill"><span class="wait">${pendingLabel(p)}</span></span>`);
    const priceTag = p => (p.price != null
      ? `<div class="price"><span class="cur">ر.س</span><b class="num">${money(p.price)}</b><span class="src">${esc(p.store || '')}</span></div>`
      : '<div class="price none"><b>السعر عند المتجر</b></div>');
    const secH = (title, sub, more, extra = '') => `<div class="sec-h${extra ? ' wrapme' : ''}"><h2>${title}${sub ? `<small>${sub}</small>` : ''}</h2>${extra}${more ? `<a class="more" href="${u(more)}">عرض الكل ${ic('chev-l', 's')}</a>` : ''}</div>`;
    const rail = (inner, cls = '') => `<div class="rail-wrap"><button class="arw p" type="button" data-act="rail-prev" aria-label="السابق">${ic('chev-r')}</button><div class="rail ${cls}">${inner}</div><button class="arw n" type="button" data-act="rail-next" aria-label="التالي">${ic('chev-l')}</button></div>`;

    function ribbon(p) {
      if (p.verdict === true) return `<span class="ribbon yes">${ic('check', 'xs')} يستاهل</span>`;
      if (p.verdict === false) return '<span class="ribbon no">ما يستاهل</span>';
      if (/الأولى|الأول |الأكثر|الأعلى|رقم 1/.test(p.why || '')) return '<span class="ribbon">الأكثر شعبية</span>';
      return '';
    }
    function vpill(p) {
      const v = p.verdict === true ? `<span class="ok">${ic('check', 'xs')} يستاهل</span>` : p.verdict === false ? `<span class="no">${ic('x', 'xs')} ما يستاهل</span>` : `<span class="wait">${pendingLabel(p)}</span>`;
      const extra = p.video ? '<span class="sep"></span><span class="mut">فيه فيديو</span>' : p.verdict != null ? '<span class="sep"></span><span class="mut">حكمنا</span>' : '';
      return `<span class="vpill">${v}${extra}</span>`;
    }
    function nudges(p) {
      const L = [];
      if (p.why) L.push(['trend', short(p.why, 44)]);
      if (p.video) L.push(['video', 'راجعناه بالفيديو']);
      if (cmpOf(p.id)) L.push(['scale', 'له مقارنة جاهزة']);
      if (p.pros && p.pros[0]) L.push(['check', short(p.pros[0], 42)]);
      if (p.price != null && p.store) L.push(['store', `سعره في ${p.store}`]);
      const three = L.slice(0, 3);
      if (three.length < 2) return `<div class="nudge"><ul style="animation:none">${three.map(([i, t]) => `<li>${ic(i, 'xs')}${esc(t)}</li>`).join('')}</ul></div>`;
      while (three.length < 3) three.push(three[0]);
      return `<div class="nudge"><ul style="animation-delay:-${hash(p.id) % 9}s">${[...three, three[0]].map(([i, t]) => `<li>${ic(i, 'xs')}${esc(t)}</li>`).join('')}</ul></div>`;
    }
    // A product card. With a cleared photo the card shows it alone; otherwise three drawing
    // views, the first inline (o.lazy: drawn by ui.js when shown) and the others on demand.
    // o.d: the card carries its department, for the department tabs on /deals/.
    function card(p, o = {}) {
      const ph = p.ph;
      const views = ph ? [0] : [0, 1, 3];
      return `<article class="card${o.compact ? ' compact' : ''}"${o.d ? ` data-d="${esc(p.dept)}"` : ''}>
      <a class="card-img${ph ? ' ph' : ''}" href="${u(p.href)}" style="background:${ph ? '#fff' : A.tint(p.kind, p.id)}" tabindex="-1" aria-hidden="true"${ph ? '' : ` data-kind="${esc(p.kind)}" data-seed="${esc(p.id)}"`}>
        <div class="slides" data-i="0">${views.map((v, i) => `<div class="slide${i ? '' : ' on'}"${i || o.lazy ? ` data-view="${v}"` : ''}>${ph ? img(ph) : i || o.lazy ? '' : A.svg(p.kind, { seed: p.id, view: v, label: p.title })}</div>`).join('')}</div>
        ${cap(ph)}${ribbon(p)}
        ${views.length > 1 ? `<button class="iarw p" type="button" data-act="img-prev" aria-label="الصورة السابقة">${ic('chev-r', 's')}</button><button class="iarw n" type="button" data-act="img-next" aria-label="الصورة التالية">${ic('chev-l', 's')}</button>
        <div class="idots">${views.map((_, i) => `<i class="${dotCls(i, 0)}"></i>`).join('')}</div>` : ''}
        ${o.deal && p.price != null ? `<span class="dpill">سعر مسجّل</span>` : p.video ? `<span class="vbadge">${ic('play', 'xs')} فيديو</span>` : ''}
      </a>
      <a class="card-b" href="${u(p.href)}">
        <h3 class="card-t">${esc(p.title)}</h3>
        ${vpill(p)}
        ${priceTag(p)}
        ${o.compact ? '' : nudges(p)}
        ${o.compact ? '' : `<div class="card-f">${p.store ? `<span class="spill">${ic('store', 'xs')} ${esc(p.store)}</span>` : ''}${cmpOf(p.id) ? `<span class="spill cmp">${ic('scale', 'xs')} مقارنة</span>` : ''}</div>`}
      </a>
    </article>`;
    }
    const cards = (list, o) => list.map(p => card(p, o)).join('');

    return { esc, u, ic, dAr, money, short, hash, deptName, kindName, pendingLabel, dotCls, img, cap, pic, kpic, stamp, stampMini, priceTag, secH, rail, ribbon, vpill, nudges, card, cards, MONTHS };
  };
  // A store link's ids, for «الصق رابطك» (/check/): noon's product id, Amazon's ASIN, Jarir's and
  // Extra's product numbers, and the bare address for every store. The build indexes our products
  // with it (links.js) and the page reads the pasted link with it, so both sides agree.
  window.Kit.linkKeys = raw => {
    let x;
    try { x = new URL(String(raw || '').trim()); } catch { return []; }
    if (!/^https?:$/.test(x.protocol)) return [];
    const host = x.hostname.toLowerCase().replace(/^www\./, ''), path = x.pathname;
    const keys = [];
    const hit = (re, pre, up = true) => { const m = path.match(re); if (m) keys.push(`${pre}:${up ? m[1].toUpperCase() : m[1]}`); };
    if (/(^|\.)noon\.com$/.test(host)) hit(/\/([A-Z0-9]{9,})\/p(?:\/|$)/i, 'noon');
    if (/(^|\.)amazon\.[a-z.]+$/.test(host)) hit(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?]|$)/i, 'amz');
    if (/(^|\.)jarir\.com$/.test(host)) hit(/-(\d{5,})\.html$/i, 'jarir', false);
    if (/(^|\.)extra\.com$/.test(host)) hit(/\/p\/([A-Z0-9]{6,})(?:\/|$)/i, 'extra');
    keys.push(`url:${host}${path.replace(/\/+$/, '').toLowerCase()}`);
    return keys;
  };
  // art.js numbers its gradients from 1 on every page, and the page's own drawings already use
  // those ids: drawings made in the browser get a «c» prefix (ids and their url(#…) references).
  window.Kit.browserArt = A => Object.assign({}, A, { svg: (k, o) => A.svg(k, o).replace(/(id="|url\(#)([ghos]\d+)/g, '$1c$2') });
})();
