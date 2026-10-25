// «الصق رابطك» (/check/): a pasted store link → our verdict when we reviewed that product. When we
// haven't, it shows the closest products we have (never called «the same») and a ready email or
// Instagram message to ask us. It all runs in the browser: the link leaves the device only when the
// visitor sends it. The form's data-api (brand key check_api) names an optional verdict service for
// links we don't have (docs/company/instant-verdict-plan.md); it is off until that service exists.
(function () {
  'use strict';
  const form = document.getElementById('chk'), out = document.getElementById('chk-out');
  const D = window.YDATA, S = window.Search, L = window.YLINKS;
  if (!form || !out || !D || !S || !L || !window.Kit) return;
  const CMP = new Map();
  D.comparisons.forEach(c => { CMP.set(c.a, c); CMP.set(c.b, c); });
  const K = window.Kit({ A: window.Kit.browserArt(window.Art), KIND: S.KIND_AR, depts: D.depts, cmpOf: id => CMP.get(id) || null, base: D.base || '' });
  const { esc, ic, u, short, money, dAr, pic, stamp } = K;
  const P = new Map(D.products.map(p => [p.id, p]));
  const input = form.querySelector('input[name="u"]');
  const API = /^https:\/\//.test(form.dataset.api || '') ? form.dataset.api : '';
  const MAIL = form.dataset.mail || '', IG = form.dataset.ig || '';
  // Short links hide the product; the visitor opens them and copies the full address.
  const SHORT = /^(?:amzn\.(?:to|eu|asia)|a\.co|s\.noon\.com|noon\.link|bit\.ly|t\.co|tinyurl\.com|goo\.gl|cutt\.ly|rb\.gy|is\.gd|shorturl\.at|t\.ly)$/i;
  const STORES = [[/noon\./, 'نون'], [/amazon\.|amzn\./, 'أمازون'], [/jarir\./, 'جرير'], [/extra\.com/, 'إكسترا'], [/decathlon\./, 'ديكاتلون'], [/saco\./, 'ساكو'], [/niceone/, 'نايس ون'], [/nahdi/, 'النهدي'], [/goldenscent/, 'قولدن سنت']];
  const firstUrl = t => (String(t || '').match(/https?:\/\/[^\s<>"']+/i) || [''])[0].replace(/[).,،؛]+$/, '');
  const hostOf = x => { try { return new URL(x).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; } };
  const storeOf = h => (STORES.find(([re]) => re.test(h)) || [null, h])[1];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));

  // Words in the link's address («anker-nano-ii-735-adaptor-…», Arabic slugs too) → the products
  // we have that share the most of them. Shown as «قريب منه», not as a match.
  const STOP = new Set(['black', 'white', 'blue', 'red', 'grey', 'gray', 'silver', 'gold', 'pink', 'green', 'with', 'for', 'and', 'the', 'new', 'pack', 'set', 'pcs', 'piece', 'pieces', 'original', 'saudi', 'ar', 'en', 'sa', 'ae', 'dp', 'ref', 'html', 'products', 'product', 'p', 'pdp', 'mobiles', 'tablets', 'accessories', 'electronics', 'اسود', 'ابيض', 'مع', 'من', 'الى', 'في', 'لون', 'قطعه']);
  function near(link) {
    let path = '';
    try { path = decodeURIComponent(new URL(link).pathname); } catch { return []; }
    const toks = [...new Set(S.norm(path.replace(/[-_/.+]+/g, ' ')).split(' ').filter(t => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t) && !/^[a-z]\d{8,}[a-z]?$/.test(t)))];
    if (toks.length < 2) return [];
    const model = t => /[a-z]/.test(t) && /\d/.test(t); // «a2147», «rhofr3001», «65w»
    const byWords = D.products.map(p => {
      const hay = ` ${S.norm([p.title, p.name, p.brand, p.desc].join(' '))} `;
      let s = 0, m = 0;
      for (const t of toks) if (hay.includes(` ${t}`) || hay.includes(t)) { s++; if (model(t)) m++; }
      return { p, s: s + m * 2 };
    }).filter(x => x.s >= 3).sort((a, b) => b.s - a.s).map(x => x.p);
    // Words search.js knows («anker», «charger») find the Arabic titles too: «شاحن أنكر».
    const known = toks.filter(t => S.parse(t).keys.length);
    const byKind = known.length >= 2 ? S.run(known.join(' ')).items : [];
    return [...new Set([...byWords, ...byKind])].slice(0, 3);
  }

  const sendBox = (link, lead) => {
    const body = `أبي حكمكم على هالمنتج:\n${link}\n\n`;
    return `<div class="chk-send"><h3>${ic('bulb', 's')} ${lead}</h3><p>أرسل لنا الرابط ونرد عليك بالحكم خلال يوم، وأكثر المنتجات طلباً نسوي لها حلقة.</p>
      <div class="chk-acts">${MAIL ? `<a class="btn buy" href="mailto:${MAIL}?subject=${encodeURIComponent('طلب حكم يستاهل؟')}&amp;body=${encodeURIComponent(body)}">${ic('chat', 's')} أرسله بالإيميل</a>` : ''}
      ${IG ? `<a class="btn ghost" href="https://ig.me/m/${esc(IG)}" target="_blank" rel="noopener" data-act="chk-ig" data-u="${esc(link)}">${ic('chat', 's')} رسالة إنستغرام</a>` : ''}
      <button class="btn ghost" type="button" data-act="chk-copy" data-u="${esc(link)}">انسخ الرابط</button></div>
      <p class="fnote">في إنستغرام الصق الرابط في الرسالة. الإيميل يفتح والرابط مكتوب فيه.</p></div>`;
  };
  const nearHtml = list => (list.length ? `<div class="chk-near"><h3>منتجات قريبة منه عندنا <span class="sub">مو بالضرورة نفس المنتج</span></h3><div class="sp-prods">${list.map(p => `<a class="sp-prod" href="${u(p.href)}">${pic(p, 0, 't', 'tiny')}<span><b>${esc(p.title)}</b><span class="mini">${K.stampMini(p)}${p.price != null ? `<strong>${money(p.price)} ر.س</strong>` : ''}</span></span></a>`).join('')}</div></div>` : '');

  // Our product for this link: its verdict, why, the last price we read, and where to go next.
  function found(p, link) {
    const c = CMP.get(p.id);
    const why = L.reasons[p.id] || '';
    const reviewed = p.episode != null;
    const head = !reviewed ? 'هالمنتج في قوائمنا، بس ما راجعناه للحين' : p.verdict === null ? 'راجعناه، والحكم قريباً' : 'راجعناه، وهذا حكمنا';
    return `<section class="chk-res${p.verdict === true ? ' yes' : p.verdict === false ? ' no' : ''}">
      <p class="cmp-kick">${ic(reviewed ? 'check' : 'info', 's')} ${head} · الرابط من ${esc(storeOf(hostOf(link)))}</p>
      <div class="chk-top">${pic(p, 0, 't', 'cap')}<div style="min-width:0"><h2>${esc(p.title)}</h2>${reviewed ? stamp(p.verdict, 'l', p) : ''}</div></div>
      ${why ? `<p class="chk-why">${esc(why)}</p>` : ''}
      <p class="chk-price">${p.price != null ? `${ic('clock', 's')} آخر سعر قريناه: <b>${money(p.price)} ر.س</b> في ${esc(p.store)} يوم ${dAr(p.priceDate)}` : `${ic('store', 's')} السعر في صفحة المتجر`}</p>
      <div class="chk-acts"><a class="btn pri" href="${u(p.href)}">${reviewed ? 'شوف الحكم كامل' : 'شوف صفحته عندنا'}</a>${c ? `<a class="btn ghost" href="${u(`/review/${c.slug}/`)}">${ic('scale', 's')} المقارنة</a>` : ''}<a class="btn ghost" href="${u(p.href)}#where">${ic('store', 's')} وين أرخص؟</a></div>
      ${reviewed ? '' : sendBox(link, 'تبي نراجعه؟')}
    </section>`;
  }
  // The verdict service's answer (contract in docs/company/dev-backlog.md): never our stamp.
  function auto(j, link) {
    if (!j || typeof j !== 'object') return null;
    if (j.kind === 'ours' && P.has(j.id)) return found(P.get(j.id), link);
    if (j.kind !== 'auto' || typeof j.headline !== 'string') return null;
    const pts = (Array.isArray(j.points) ? j.points : []).filter(x => x && typeof x.text === 'string').slice(0, 6);
    const src = (Array.isArray(j.sources) ? j.sources : []).filter(s => s && /^https:\/\//.test(s.url || '')).slice(0, 6);
    return `<section class="chk-res auto"><p class="cmp-kick">${ic('sparkle', 's')} حكم أولي آلي، مو مراجعة يستاهل${j.read_on ? ` · ${esc(dAr(j.read_on))}` : ''}</p>
      <h2>${esc(j.headline)}</h2>${pts.length ? `<ul class="whyl">${pts.map(x => `<li>${ic('info', 's')}<span>${esc(x.text)}</span></li>`).join('')}</ul>` : ''}
      ${src.length ? `<p class="fnote">المصادر: ${src.map(s => `<a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.label || hostOf(s.url))}</a>`).join('، ')}</p>` : ''}
      ${sendBox(link, 'تبي مراجعتنا الكاملة؟')}</section>`;
  }

  async function run(raw) {
    const text = String(raw || '').trim();
    if (!text) { input.focus(); return; }
    const link = firstUrl(text);
    out.innerHTML = `<div class="chk-run" role="status"><span class="spin" aria-hidden="true"></span><ol><li class="on">نقرأ الرابط…</li><li>ندوّر في أحكامنا…</li><li>نجهّز النتيجة…</li></ol></div>`;
    const steps = [...out.querySelectorAll('.chk-run li')];
    const step = async i => { await wait(380); steps.forEach((s, k) => s.classList.toggle('on', k === i)); };
    if (!link) { // words, not a link: search by name
      await step(1);
      const items = S.run(text).items.slice(0, 3);
      out.innerHTML = `<section class="chk-res"><p class="cmp-kick">${ic('info', 's')} هذا مو رابط، فدوّرنا بالاسم</p>${nearHtml(items) || '<p>ما لقينا شي بهالاسم.</p>'}<div class="chk-acts"><a class="btn ghost" href="${u(`/search/?q=${encodeURIComponent(text)}`)}">${ic('search', 's')} كل نتائج «${esc(short(text, 30))}»</a></div></section>`;
      return;
    }
    const host = hostOf(link);
    if (SHORT.test(host)) {
      await step(1);
      out.innerHTML = `<section class="chk-res"><p class="cmp-kick">${ic('info', 's')} هذا رابط مختصر</p><h2>افتح الرابط في المتصفح، وانسخ العنوان الكامل من فوق، والصقه هنا</h2><p>الرابط المختصر ما يبيّن المنتج. ولو ما زبط، أرسله لنا وحنا نشوفه.</p>${sendBox(link, 'أو أرسله لنا')}</section>`;
      return;
    }
    await step(1);
    const keys = window.Kit.linkKeys(link);
    const id = keys.map(k => L.keys[k]).find(Boolean);
    await step(2);
    await wait(200);
    if (id && P.has(id)) { out.innerHTML = found(P.get(id), link); return; }
    if (API) {
      try {
        const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: link }) });
        const html = r.ok ? auto(await r.json(), link) : null;
        if (html) { out.innerHTML = html; return; }
      } catch { /* service down: the visitor can still send it to us */ }
    }
    out.innerHTML = `<section class="chk-res none"><p class="cmp-kick">${ic('info', 's')} الرابط من ${esc(storeOf(host))}</p><h2>ما راجعناه للحين</h2>${nearHtml(near(link))}${sendBox(link, 'أرسله لنا ونراجعه')}</section>`;
  }

  const go = raw => {
    try { history.replaceState(null, '', `${location.pathname}?u=${encodeURIComponent(firstUrl(raw) || String(raw).trim())}`); } catch { /* file preview */ }
    run(raw);
  };
  form.addEventListener('submit', e => { e.preventDefault(); go(input.value); });
  // A paste is a check: no need to press «افحص».
  input.addEventListener('paste', () => setTimeout(() => { if (firstUrl(input.value)) go(input.value); }, 0));
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act^="chk-"]');
    if (!el) return;
    const v = el.dataset.u || '';
    if (el.dataset.act === 'chk-ex') { input.value = v; go(v); }
    else if (el.dataset.act === 'chk-copy' || el.dataset.act === 'chk-ig') {
      try { navigator.clipboard.writeText(v); } catch { /* no clipboard: the link is on the screen */ }
      if (el.dataset.act === 'chk-copy') { el.textContent = 'انسخ ✓'; setTimeout(() => { el.textContent = 'انسخ الرابط'; }, 1800); }
    }
  });
  const q = new URLSearchParams(location.search).get('u');
  if (q) { input.value = q; run(q); }
})();
