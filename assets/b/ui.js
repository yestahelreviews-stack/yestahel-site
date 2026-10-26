// «ليل هادي» interactions for the static pages (from docs/design/proto-b/app.js): hero slider,
// rail arrows, card image views, promo strip, countdown timers, product gallery, trend tabs,
// department and category tabs, and the header's search suggestions.
// Pages work without it. It keeps only the viewer's last searches, on their own device.
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const dotCls = (i, on) => { const d = Math.abs(i - on); return d === 0 ? 'on' : d === 1 ? 'n1' : d === 2 ? 'n2' : 'n3'; };
  const me = document.currentScript;
  // art.js numbers its gradients from 1 on every page; drawings made here get a «c» prefix.
  const draw = (kind, seed, view = 0) => window.Art.svg(kind, { seed, view }).replace(/(id="|url\(#)([ghos]\d+)/g, '$1c$2');
  // Tiles and card views that ship empty (hidden tabs) are drawn when they show.
  function drawLazy(root) {
    if (!window.Art || !root) return;
    $$('.lz:empty', root).forEach(t => { t.innerHTML = draw(t.dataset.kind, t.dataset.seed); });
    $$('.card-img[data-kind] .slide.on[data-view]:empty', root).forEach(s => { const b = s.closest('.card-img'); s.innerHTML = draw(b.dataset.kind, b.dataset.seed, +s.dataset.view); });
  }

  // Countdown to a date (data-to on .timer), Riyadh midnight.
  const timers = $$('.timer[data-to]');
  const tick = () => {
    for (const t of timers) {
      let s = Math.max(0, Math.floor((Date.parse(`${t.dataset.to}T00:00:00+03:00`) - Date.now()) / 1000));
      const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0'));
      $$('b[data-u]', t).forEach(b => { const x = v[b.dataset.u]; if (b.textContent !== x) b.textContent = x; });
    }
  };
  if (timers.length) { tick(); setInterval(tick, 1000); }

  // Promo strip: three messages, one at a time.
  const promo = $('#promo .promo-track');
  let pi = 0;
  const movePromo = d => { if (promo) { pi = (pi + d + 3) % 3; promo.style.transform = `translateX(${pi * 100}%)`; } };
  if (promo && !matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => movePromo(1), 4500);

  // Hero: [last clone, slides…, first clone]; the active slide sits in the middle.
  const hero = $('#hero');
  if (hero) {
    const track = $('.hero-track', hero), n = +hero.dataset.n;
    let k = 1, busy = false;
    const slides = () => $$('.hslide', track);
    const place = anim => {
      const W = hero.clientWidth, s = slides()[0], w = s.offsetWidth, g = 8;
      track.style.transition = anim ? '' : 'none';
      track.style.transform = `translateX(${k * (w + g) - (W - w) / 2}px)`; // RTL: slide k centred
      slides().forEach((el, i) => el.classList.toggle('on', i === k));
      $$('#hdots button').forEach((d, i) => d.classList.toggle('on', i === (k - 1 + n) % n));
    };
    const go = to => {
      if (busy) return;
      busy = true; k = to; place(true);
      setTimeout(() => { if (k === 0) { k = n; place(false); } else if (k === n + 1) { k = 1; place(false); } busy = false; }, 720);
    };
    place(false);
    hero._go = d => go(k + d);
    hero._to = i => go(i + 1);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => { if (!document.hidden && !hero.matches(':hover')) go(k + 1); }, 5000);
    addEventListener('resize', () => place(false));
    let x0 = null;
    track.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(k + (dx > 0 ? 1 : -1)); x0 = null; });
  }

  // Product gallery: drawing views by thumbnail, dots follow a swipe.
  const gal = $('#gal');
  const showGal = i => {
    $$('.gimg', gal).forEach((im, k) => { im.style.opacity = k === i ? 1 : 0; });
    $$('.thumbs button', gal).forEach((b, k) => b.classList.toggle('on', k === i));
    $$('.gdots i', gal).forEach((d, k) => d.classList.toggle('on', k === i));
  };
  const gtr = gal && $('.gtrack', gal);
  if (gtr) gtr.addEventListener('scroll', () => { const i = Math.round(Math.abs(gtr.scrollLeft) / gtr.clientWidth); $$('.gdots i', gal).forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true });

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (act === 'img-prev' || act === 'img-next') {
      stop();
      const box = el.closest('.card-img'), sl = $('.slides', box), n = sl.children.length;
      const i = (+sl.dataset.i + (act === 'img-next' ? 1 : -1) + n) % n;
      const next = sl.children[i]; // other views are drawn on first use (only the first is in the page)
      if (next && !next.firstChild && window.Art && box.dataset.kind) next.innerHTML = draw(box.dataset.kind, box.dataset.seed, +next.dataset.view);
      sl.dataset.i = i;
      sl.style.transform = `translateX(${i * 100}%)`;
      [...sl.children].forEach((s, k) => s.classList.toggle('on', k === i));
      $$('.idots i', box).forEach((d, k) => { d.className = dotCls(k, i); });
    } else if (act === 'rail-prev' || act === 'rail-next') {
      const r = el.parentElement.querySelector('.rail');
      r.scrollBy({ left: (act === 'rail-next' ? -1 : 1) * r.clientWidth * 0.85, behavior: 'smooth' });
    } else if (act === 'hero-prev' || act === 'hero-next') { stop(); hero._go(act === 'hero-next' ? 1 : -1); }
    else if (act === 'hero-go') hero._to(+el.dataset.i);
    else if (act === 'promo-prev' || act === 'promo-next') { stop(); movePromo(act === 'promo-next' ? 1 : -1); }
    else if (act === 'gal-go') showGal(+el.dataset.i);
    else if (act === 'seo') { const s = $('#seo'); s.classList.toggle('open'); el.textContent = s.classList.contains('open') ? 'اقرأ أقل' : 'اقرأ أكثر'; }
    else if (act === 'trend-mkt') {
      $$('[data-act="trend-mkt"]').forEach(b => b.classList.toggle('on', b === el));
      $$('[data-trend]').forEach(t => { t.hidden = t.dataset.trend !== el.dataset.m; });
    } else if (act === 'dtab') dtab(el.dataset.d);
    else if (act === 'tabgo') { // tabs inside one section (home: «تحت 100 ر.س في كل قسم»)
      const sec = el.closest('[data-tabs]');
      $$('[data-act="tabgo"]', sec).forEach(b => { const on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      $$('[data-tp]', sec).forEach(p => { p.hidden = p.dataset.tp !== el.dataset.t; });
      drawLazy($(`[data-tp="${el.dataset.t}"]`, sec));
    }
    else if (act === 'cat') { catGo(el.dataset.d); try { history.replaceState(null, '', `#${el.dataset.d}`); } catch { /* file preview */ } }
    else if (act === 'clear-searches') { stop(); LS.set('searches', []); refill(); }
    else if (act === 'close-ms') closeMs();
  });

  // Department tabs (/compare/, /deals/): show one department's cards; «?dept=» picks one on arrival.
  function dtab(d) {
    $$('[data-act="dtab"]').forEach(b => { const on = b.dataset.d === d; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    $$('[data-d]:not([data-act])').forEach(x => { x.hidden = !!d && x.dataset.d !== d; });
    $$('.sec').forEach(s => { const items = $$('[data-d]:not([data-act])', s); if (items.length) s.hidden = items.every(x => x.hidden); });
  }
  const dq = new URLSearchParams(location.search).get('dept');
  if (dq && $$('[data-act="dtab"]').some(b => b.dataset.d === dq)) dtab(dq);

  // /categories/: one department at a time; «#<dept>» opens that one.
  function catGo(d) {
    const btn = $$('.cats-side [data-act="cat"]').find(b => b.dataset.d === d);
    if (!btn) return;
    $$('.cats-side [data-act="cat"]').forEach(b => { const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    $$('.cat-p').forEach(p => { p.hidden = p.id !== `cat-${d}`; });
    drawLazy(document.getElementById(`cat-${d}`));
    const main = $('.cats-main');
    if (main && main.getBoundingClientRect().top < 0) main.scrollIntoView({ block: 'start' });
  }
  if ($('.cats-side') && location.hash.length > 1) { try { catGo(decodeURIComponent(location.hash.slice(1))); } catch { /* bad hash */ } }

  // ---- header search: suggestions from data.js + search.js, loaded on first focus ----------------
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(`yb.${k}`); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`yb.${k}`, JSON.stringify(v)); } catch { /* private mode */ } },
  };
  let K = null, S = null, D = null, P = null, libs = null;
  const asset = n => new URL(`${n}.js${new URL(me.src).search}`, me.src).href;
  const load = n => new Promise((ok, no) => { const s = document.createElement('script'); s.src = asset(n); s.onload = ok; s.onerror = no; document.head.append(s); });
  const need = () => libs || (libs = (async () => {
    if (!window.YDATA) await load('data');
    if (!window.Search) await load('search');
    if (!window.Kit) await load('kit');
    D = window.YDATA; S = window.Search;
    const CMP = new Map();
    D.comparisons.forEach(c => { CMP.set(c.a, c); CMP.set(c.b, c); });
    K = window.Kit({ A: window.Kit.browserArt(window.Art), KIND: S.KIND_AR, depts: D.depts, cmpOf: id => CMP.get(id) || null, base: D.base || '' });
    P = new Map(D.products.map(p => [p.id, p]));
  })());
  const record = t => {
    t = String(t || '').trim();
    if (!t) return;
    const n = x => (S ? S.norm(x) : x);
    LS.set('searches', [t, ...LS.get('searches', []).filter(x => n(x) !== n(t))].slice(0, 8));
  };
  // A store link typed or pasted in the search box goes to «الصق رابطك» (/check/).
  function toCheck(e, inp) {
    const m = inp.value.match(/https?:\/\/\S+/i);
    if (!m) return false;
    e.preventDefault();
    location.href = `${inp.form.getAttribute('action').replace(/search\/?$/, 'check/')}?u=${encodeURIComponent(m[0])}`;
    return true;
  }
  const EXAMPLES = ['ارخص شاحن ايفون', 'هدية تحت 200', 'انكر ولا يوجرين', 'للكشتة', 'قلايه'];
  function spContent(q) {
    const { esc, ic, pic, kpic, short, money, stampMini, u } = K;
    const sUrl = t => u(`/search/?q=${encodeURIComponent(t)}`);
    q = q.trim();
    if (!q) {
      const recent = LS.get('searches', []).filter(x => typeof x === 'string').slice(0, 8);
      const trending = [...new Set([...S.POPULAR.slice(0, 10), ...((D.trends.sa || { items: [] }).items.slice(0, 8).map(i => short(i.name, 26).replace('…', '')))])].slice(0, 18);
      const tile = t => { const top = S.run(t).items[0]; return `<a href="${sUrl(t)}" data-q="${esc(t)}">${top ? pic(top, 0, 't', 'tiny') : kpic('box', t)}<span>${esc(t)}</span></a>`; };
      return (recent.length
        ? `<div class="sp-sec"><h4>آخر أشياء بحثت عنها <button type="button" data-act="clear-searches">امسح</button></h4><div class="recent">${recent.map(tile).join('')}</div></div>`
        : `<div class="sp-sec"><h4>جرّب تسأل بطريقتك</h4><div class="recent">${EXAMPLES.map(tile).join('')}</div></div>`)
        + `<div class="sp-sec"><h4>عمليات البحث الشائعة</h4><div class="tchips">${trending.map(t => `<a href="${sUrl(t)}" data-q="${esc(t)}">${ic('trend', 'xs')}${esc(t)}</a>`).join('')}</div></div>
        <div class="sp-foot">${ic('sparkle', 's')} نفهم «ايفون» و«iPhone»، و«للكشتة» و«هدية» و«تحت 100»، ولو كتبت منتجين نعطيك المقارنة.</div>`;
    }
    if (/^https?:\/\//i.test(q)) return `<div class="sugg"><a class="cmp" href="${u(`/check/?u=${encodeURIComponent(q)}`)}">${ic('external')}<span>هذا رابط منتج: <b>افحصه ونقولك يستاهل ولا لا</b></span><span class="in">الصق رابطك</span></a></div>`;
    const r = S.run(q);
    const rows = [];
    const c = r.cmp && r.cmp.comparison;
    if (c && P.get(c.a) && P.get(c.b)) rows.push(`<a class="cmp" href="${u(`/review/${c.slug}/`)}">${ic('scale')}<span>قارن: <b>${esc(short(P.get(c.a).title, 34))}</b> ولا <b>${esc(short(P.get(c.b).title, 34))}</b></span><span class="in">مقارنة جاهزة</span></a>`);
    if (r.labels.length) rows.push(`<a class="intent" href="${sUrl(q)}" data-q="${esc(q)}">${ic('sparkle')}<span>فهمنا: <b>${r.labels.map(esc).join(' · ')}</b></span><span class="in">${r.items.length} نتيجة</span></a>`);
    const sugg = S.suggest(q, 8);
    rows.push(...sugg.map(s => `<a href="${sUrl(s.text)}" data-q="${esc(s.text)}">${ic('search', 's')}<span>${s.html}</span></a>`));
    if (!sugg.length && !r.labels.length) rows.push(`<a href="${sUrl(q)}" data-q="${esc(q)}">${ic('search', 's')}<span>ابحث عن <b>${esc(q)}</b></span></a>`);
    const prods = r.items.slice(0, 4);
    return `<div class="sugg">${rows.join('')}</div>${prods.length ? `<div class="sp-sec"><h4>منتجات مقترحة</h4></div><div class="sp-prods">${prods.map(p => `<a class="sp-prod" href="${u(p.href)}">${pic(p, 0, 't', 'tiny')}<span><b>${esc(p.title)}</b><span class="mini">${stampMini(p)}${p.price != null ? `<strong>${money(p.price)} ر.س</strong>` : ''}</span></span></a>`).join('')}</div>` : ''}`;
  }
  // A link in the panel with a search in it goes to «last searches».
  document.addEventListener('click', e => { const a = e.target.closest('#sp [data-q], #msearch [data-q], .tpills a, .cloud a'); if (a) record(a.dataset.q || a.textContent); }, true);

  // Desktop: a panel under the box, arrows to move, Enter to go.
  const q = $('#q'), sp = $('#sp'), ov = $('#overlay');
  let sel = -1;
  const fill = () => { sel = -1; sp.innerHTML = spContent(q.value); };
  const closeSp = () => { if (sp) sp.classList.remove('open'); if (ov) ov.classList.remove('open'); if (q) q.setAttribute('aria-expanded', 'false'); };
  if (q && sp) {
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('focus', () => need().then(() => { fill(); sp.classList.add('open'); if (ov) ov.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }).catch(() => {}));
    let t;
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { if (K) fill(); }, 70); });
    q.addEventListener('keydown', e => {
      const rows = $$('.sugg a', sp);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!rows.length) return;
        sel = e.key === 'ArrowDown' ? (sel + 1 >= rows.length ? -1 : sel + 1) : (sel - 1 < -1 ? rows.length - 1 : sel - 1);
        rows.forEach((r, i) => r.classList.toggle('sel', i === sel));
        if (rows[sel] && rows[sel].dataset.q) q.value = rows[sel].dataset.q;
      } else if (e.key === 'Enter' && rows[sel] && !rows[sel].dataset.q) { e.preventDefault(); location.href = rows[sel].href; }
      else if (e.key === 'Escape') { closeSp(); q.blur(); }
    });
    q.form.addEventListener('submit', e => { if (!q.value.trim()) e.preventDefault(); else if (!toCheck(e, q)) record(q.value); });
    if (ov) ov.addEventListener('click', closeSp);
    document.addEventListener('click', e => { if (!e.target.closest('#dsearch')) closeSp(); });
    addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); } });
  }

  // Phones: the header box opens a full-screen search.
  const mq0 = $('#mq0'), ms = $('#msearch');
  let refillMs = null;
  function openMs() {
    ms.innerHTML = `<div class="mtop"><button type="button" class="back" data-act="close-ms" aria-label="رجوع"><svg class="ic l" aria-hidden="true"><use href="#i-chev-r"/></svg></button><form role="search" action="${mq0.form.getAttribute('action')}" method="get"><label class="sbox"><svg class="ic" aria-hidden="true"><use href="#i-search"/></svg><input id="mq" name="q" type="search" autocomplete="off" enterkeyhint="search" placeholder="وش تبي تشتري؟" aria-label="ابحث"></label></form></div><div class="mbody" id="mbody"></div>`;
    ms.classList.add('open');
    document.body.style.overflow = 'hidden';
    const inp = $('#mq', ms), body = $('#mbody', ms);
    inp.value = mq0.value;
    inp.focus(); // in the same tap, so phones open the keyboard
    refillMs = () => { if (K) body.innerHTML = spContent(inp.value); };
    need().then(refillMs).catch(() => {});
    let t;
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(refillMs, 70); });
    inp.form.addEventListener('submit', e => { if (!inp.value.trim()) e.preventDefault(); else if (!toCheck(e, inp)) record(inp.value); });
  }
  function closeMs() { if (!ms) return; ms.classList.remove('open'); document.body.style.overflow = ''; refillMs = null; }
  if (mq0 && ms) mq0.addEventListener('focus', () => { mq0.blur(); openMs(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMs(); });
  function refill() { if (refillMs) refillMs(); else if (q && sp && sp.classList.contains('open')) fill(); }
})();
