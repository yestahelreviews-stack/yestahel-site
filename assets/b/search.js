// Smart search for prototype B. Understands ا/أ/إ, ة/ه, ى/ي, Arabic digits,
// Arabic↔English brand names, shopping intents («ارخص», «للكشتة», «هدية», «تحت 100»)
// and two products typed together (it offers the comparison).
//   Search.run(q)        -> { items, intent, terms, cmp }
//   Search.suggest(q)    -> [{ text, html }]   (typed words in bold)
//   Search.norm(s), Search.mark(text, q)
(function () {
  'use strict';
  const D = window.YDATA;

  // ---- normalisation, keeping a map back to the original text for highlighting ----
  const TASHKEEL = /[ً-ٰٟـ]/;
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function normChar(c) {
    if (TASHKEEL.test(c)) return '';
    if ('أإآٱ'.includes(c)) return 'ا';
    if (c === 'ة') return 'ه';
    if (c === 'ى' || c === 'ئ') return 'ي';
    if (c === 'ؤ') return 'و';
    const d = AR_DIGITS.indexOf(c);
    if (d >= 0) return String(d);
    c = c.toLowerCase();
    return /[\p{L}\p{N}.]/u.test(c) ? c : ' ';
  }
  function normMap(s) {
    let n = '';
    const map = [];
    s = String(s || '');
    for (let i = 0; i < s.length; i++) {
      const c = normChar(s[i]);
      if (!c || (c === ' ' && (!n || n.endsWith(' ')))) continue;
      n += c;
      map.push(i);
    }
    if (n.endsWith(' ')) { n = n.slice(0, -1); map.pop(); }
    return { n, map };
  }
  const norm = s => normMap(s).n;

  // ---- synonyms: every member maps to one key that products carry too ----
  const GROUPS = {
    iphone: ['ايفون', 'اي فون', 'iphone', 'ابل', 'apple'], samsung: ['سامسونج', 'samsung', 'جالكسي', 'جلكسي', 'galaxy'],
    anker: ['انكر', 'anker'], ugreen: ['يوجرين', 'يو جرين', 'يوقرين', 'ugreen'], xiaomi: ['شاومي', 'شياومي', 'xiaomi'],
    redmi: ['ريدمي', 'redmi'], huawei: ['هواوي', 'huawei'], philips: ['فيليبس', 'فلبس', 'philips'], sony: ['سوني', 'sony'],
    logitech: ['لوجيتك', 'logitech'], baseus: ['باسيوس', 'baseus'], lenovo: ['لينوفو', 'lenovo'], tefal: ['تيفال', 'tefal'],
    powerbank: ['باور بانك', 'باوربانك', 'power bank', 'powerbank', 'بطاريه متنقله', 'شاحن متنقل'],
    charger: ['شاحن', 'شواحن', 'charger', 'راس شاحن', 'راس الشاحن'], cable: ['كيبل', 'كابل', 'كيابل', 'سلك', 'cable'],
    headphones: ['سماعه راس', 'هيدفون', 'headphones', 'headphone'], earbuds: ['سماعه', 'سماعات', 'ايربودز', 'earbuds', 'airpods', 'بودز'],
    band: ['ساعه ذكيه', 'ساعه', 'سوار', 'باند', 'watch', 'band'], airfryer: ['قلايه هوائيه', 'قلايه', 'اير فراير', 'air fryer', 'airfryer'],
    coffee: ['قهوه', 'كوفي', 'coffee', 'اسبريسو', 'نسبريسو'], dates: ['تمر', 'تمور', 'dates', 'سكري'],
    perfume: ['عطر', 'عطور', 'بخور', 'عود', 'perfume', 'oud', 'دهن عود'], heater: ['دفايه', 'دفايات', 'مدفاه', 'heater'],
    tent: ['خيمه', 'خيام', 'tent'], lantern: ['كشاف', 'فانوس', 'اضاءه', 'لمبه', 'lantern'], thermos: ['ترمس', 'ترامس', 'دله', 'غلايه', 'thermos'],
    phone: ['جوال', 'جوالات', 'موبايل', 'هاتف', 'phone'], gamepad: ['بلايستيشن', 'بلاستيشن', 'ps5', 'يد تحكم', 'جويستك', 'controller'],
    vacuum: ['مكنسه', 'مكانس', 'vacuum'], mouse: ['ماوس', 'فاره', 'mouse'], keyboard: ['كيبورد', 'لوحه مفاتيح', 'keyboard'],
    massager: ['مساج', 'مدلك', 'massage'], tablet: ['تابلت', 'ايباد', 'ipad', 'tablet'], scale: ['ميزان', 'scale'],
    chair: ['كرسي', 'كراسي', 'chair'], mattress: ['مرتبه', 'مراتب', 'mattress'], bag: ['شنطه', 'حقيبه', 'bag'],
    laptop: ['لابتوب', 'لاب توب', 'laptop', 'ماك بوك', 'macbook'], camera: ['كاميرا', 'كاميرات', 'camera'], stove: ['دافور', 'دوافير', 'موقد'],
    dumbbell: ['دمبل', 'دمبلز', 'dumbbell', 'اوزان'], humidifier: ['مرطب جو', 'مرطب الجو', 'مرطب هواء', 'humidifier'],
  };
  const MEMBERS = [];
  for (const [key, list] of Object.entries(GROUPS)) for (const m of list) MEMBERS.push([norm(m), key]);
  MEMBERS.sort((a, b) => b[0].length - a[0].length);

  // ---- intents: words that change the order or the filters, not what we match ----
  const INTENTS = [
    { re: /^(ارخص|الارخص|رخيص|رخيصه|ارخصها|cheap|cheapest)$/, set: { sort: 'price' }, label: 'الأرخص أولاً' },
    { re: /^(اقل سعر)$/, set: { sort: 'price' }, label: 'الأرخص أولاً' },
    { re: /^(افضل|احسن|الافضل|الاحسن|best)$/, set: { sort: 'verdict' }, label: 'حكمنا أولاً' },
    { re: /^(للكشته|كشته|الكشته|كشتات|للبر|البر|رحله|للرحلات|camping)$/, set: { dept: 'winter-camping' }, label: 'للكشتة والبر' },
    { re: /^(للشتاء|شتاء|شتوي|شتويه|الشتاء)$/, set: { dept: 'winter-camping' }, label: 'للشتاء' },
    { re: /^(هديه|هدايا|للهديه|هديه ل|gift)$/, set: { gift: true }, label: 'تصلح هدية' },
    { re: /^(يستاهل|تستاهل)$/, set: { yes: true }, label: 'حكمنا: يستاهل' },
    { re: /^(فيديو|بالفيديو)$/, set: { video: true }, label: 'فيه فيديو' },
    { re: /^(للاطفال|اطفال|للبيبي|بيبي|للمواليد)$/, set: { dept: 'baby-kids' }, label: 'للأطفال' },
    { re: /^(للسياره|السياره|سياره)$/, set: { dept: 'car' }, label: 'للسيارة' },
    { re: /^(للبيت|للمطبخ|مطبخ)$/, set: { dept: 'home-kitchen' }, label: 'للبيت والمطبخ' },
  ];
  const STOP = new Set(['ال', 'في', 'من', 'على', 'عن', 'ل', 'لل', 'و', 'مع', 'the', 'for', 'a', 'شي', 'ابي', 'ابغى', 'ابغي', 'احتاج', 'ابحث', 'افضلها', 'ريال', 'رس', 'ر.س', 'sar', 'ولا', 'او', 'vs', 'ضد', 'مقابل']);
  const GIFT_KINDS = new Set(['perfume', 'dates', 'coffee', 'earbuds', 'headphones', 'band', 'massager', 'hairtool', 'thermos', 'speaker', 'gamepad', 'toy']);

  // ---- kinds: [section name, one item] ----
  const KIND_AR = {
    charger: ['الشواحن', 'شاحن'], cable: ['الكيابل', 'كيبل'], powerbank: ['باور بانك', 'باور بانك'], stand: ['الحوامل', 'حامل'],
    mouse: ['الماوس', 'ماوس'], keyboard: ['الكيبوردات', 'كيبورد'], earbuds: ['سماعات لاسلكية', 'سماعة'], headphones: ['سماعات رأس', 'سماعة رأس'],
    phone: ['الجوالات', 'جوال'], tablet: ['التابلت', 'تابلت'], band: ['ساعات وأساور ذكية', 'ساعة ذكية'], thermos: ['ترامس وغلايات', 'ترمس'],
    coffee: ['القهوة', 'قهوة'], dates: ['التمور', 'تمر'], perfume: ['عطور وبخور', 'عطر'], tube: ['العناية والكريمات', 'كريم'],
    hairtool: ['أدوات الشعر', 'سشوار'], heater: ['الدفايات', 'دفاية'], lantern: ['الإضاءة والكشافات', 'كشاف'], tent: ['الخيام', 'خيمة'],
    chair: ['الكراسي', 'كرسي'], mattress: ['المراتب', 'مرتبة'], rug: ['السجاد والمفارش', 'مفرش'], bag: ['الشنط', 'شنطة'],
    airfryer: ['أجهزة المطبخ', 'جهاز مطبخ'], scale: ['الموازين', 'ميزان'], massager: ['المساج', 'جهاز مساج'], purifier: ['منقيات الهواء', 'منقي هواء'],
    projector: ['البروجكترات', 'بروجكتر'], vacuum: ['المكانس', 'مكنسة'], speaker: ['السماعات الخارجية', 'سماعة خارجية'],
    gamepad: ['الألعاب وأيادي التحكم', 'يد تحكم'], toy: ['ألعاب الأطفال', 'لعبة'], car: ['إكسسوارات السيارة', 'إكسسوار سيارة'], box: ['إلكترونيات', 'جهاز'],
    laptop: ['اللابتوبات', 'لابتوب'], camera: ['الكاميرات', 'كاميرا'], dumbbell: ['أدوات التمرين', 'دمبل'], stove: ['الدوافير', 'دافور'], humidifier: ['مرطبات الجو', 'مرطب جو'],
  };
  // A noon-style full title for episode products: the name, then what the description adds.
  // Names like «الشاحن الأكثر مبيعاً» are series labels, so the description leads instead.
  const GENERIC = /الأكثر|البديل|الأرخص|الرخيص|الأعلى/;
  function titleOf(p) {
    if (p.episode == null) return p.name;
    const name = String(p.name).replace(/\s*\([^)]*\)\s*$/, '').trim();
    const d = String(p.desc || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (!d) return name;
    if (GENERIC.test(name)) {
      if (!p.brand || norm(d).includes(norm(p.brand))) return d;
      if (/[A-Za-z0-9]/.test(p.brand)) return `${p.brand}، ${d}`;
      const sp = d.indexOf(' ');
      return sp > 0 ? d.slice(0, sp) + ' ' + p.brand + d.slice(sp) : p.brand + ' ' + d;
    }
    // Drop the description's opening words that the name already says.
    const bare = w => norm(w).replace(/^(?:وال|بال|ال)(?=..)/, '');
    const have = new Set(name.split(' ').map(bare));
    const words = d.split(' ');
    let i = 0;
    while (i < words.length && have.has(bare(words[i]))) i++;
    const extra = words.slice(i).join(' ').replace(/^[،,\s]+/, '').replace(/^و(?=\S{3})/, '');
    return extra ? `${name}، ${extra}` : name;
  }
  D.products.forEach(p => { p.title = titleOf(p); });

  // ---- product haystacks ----
  // Arabic glues «ال», «لل», «و», «ب» to the word: «للايفون» is still «ايفون».
  const bases = w => [w, ...['وال', 'بال', 'لل', 'ال', 'و', 'ب', 'ل'].filter(pre => w.startsWith(pre) && w.length - pre.length >= 3).map(pre => w.slice(pre.length))];
  function keysOf(text) {
    // «بدون عطر» says what the product is not.
    const n = ' ' + norm(text).replace(/(?:بدون|بلا|without)\s+\S+/g, ' ') + ' ';
    const words = new Set(n.trim().split(' ').flatMap(bases));
    const keys = new Set();
    for (const [m, key] of MEMBERS) if (m.includes(' ') ? n.includes(' ' + m + ' ') : words.has(m)) keys.add(key);
    return keys;
  }
  const docs = D.products.map(p => {
    const text = [p.title || p.name, p.name, p.brand, p.desc, D.depts[p.dept], KIND_AR[p.kind] && KIND_AR[p.kind][0], p.why].filter(Boolean).join(' ');
    const n = ' ' + norm(text) + ' ';
    // Synonym keys come from the product's own name, never from its department.
    const keys = keysOf([p.title, p.name, p.brand, p.desc].join(' '));
    keys.add(p.kind);
    // Keys the title itself says weigh more than ones only the description mentions («بدون عطر»).
    const titleKeys = keysOf(p.title || p.name);
    titleKeys.add(p.kind);
    return { p, n, title: ' ' + norm(p.title || p.name) + ' ', keys, titleKeys, words: n.trim().split(' ') };
  });

  function lev1(a, b) { // true when a and b are at most one edit apart
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, e = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++e > 1) return false;
      if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
    }
    return e + (a.length - i) + (b.length - j) <= 1;
  }
  const variants = t => {
    const v = [t];
    if (t.startsWith('ال') && t.length > 4) v.push(t.slice(2));
    if (t.startsWith('بال') && t.length > 5) v.push(t.slice(3));
    if (t.endsWith('ات') && t.length > 4) v.push(t.slice(0, -2), t.slice(0, -2) + 'ه');
    return v;
  };

  // Splits the query into match terms, synonym keys, intents and a price cap.
  function parse(q) {
    let n = norm(q);
    const intent = {}, labels = [];
    // «تحت 100» / «اقل من 200» / «under 50»
    n = n.replace(/(?:تحت|اقل من|ب?حدود|under|below)\s*(\d{2,5})/g, (_, d) => { intent.max = +d; labels.push(`تحت ${d} ر.س`); return ' '; });
    // Two products typed together: «انكر ولا يوجرين», «a vs b», «a او b».
    const sides = n.split(/\s+(?:ولا|او|vs|ضد|مقابل|versus)\s+/);
    const words = n.split(' ').filter(Boolean);
    const rest = [];
    for (let i = 0; i < words.length; i++) {
      const two = words[i + 1] ? words[i] + ' ' + words[i + 1] : null;
      const hit2 = two && INTENTS.find(it => it.re.test(two));
      const hit = hit2 || INTENTS.find(it => it.re.test(words[i]));
      if (!hit) { rest.push(words[i]); continue; }
      Object.assign(intent, hit.set);
      if (!labels.includes(hit.label)) labels.push(hit.label);
      if (hit2) i++;
    }
    // Synonym keys, longest phrase first.
    let left = ' ' + rest.join(' ') + ' ';
    const keys = [];
    for (const [m, key] of MEMBERS) {
      if (m.includes(' ') && left.includes(' ' + m + ' ')) { keys.push(key); left = left.replace(' ' + m + ' ', ' '); }
    }
    const terms = [];
    for (const w of left.trim().split(' ')) {
      if (!w || STOP.has(w)) continue;
      const hit = bases(w).map(b => MEMBERS.find(([m]) => m === b)).find(Boolean);
      if (hit) keys.push(hit[1]);
      else if (w.length > 1) terms.push(w);
    }
    return { intent, labels, keys: [...new Set(keys)], terms, two: sides.length === 2 && sides.every(Boolean) ? sides : null, n: norm(q) };
  }

  function scoreDoc(d, keys, terms) {
    let s = 0;
    for (const k of keys) {
      if (!d.keys.has(k)) return -1;
      s += d.titleKeys.has(k) ? 7 : 4;
    }
    for (const t of terms) {
      let got = 0;
      for (const v of variants(t)) {
        if (d.title.includes(' ' + v)) { got = 5; break; }
        if (d.n.includes(' ' + v)) got = Math.max(got, 3);
        else if (v.length >= 3 && d.n.includes(v)) got = Math.max(got, 2);
      }
      if (!got && t.length >= 4 && d.words.some(w => lev1(w, t))) got = 1;
      if (!got) return -1;
      s += got;
    }
    return s;
  }

  function run(q) {
    const P = parse(q);
    const { intent, keys, terms } = P;
    let scored = [];
    const any = keys.length || terms.length;
    for (const d of docs) {
      const s = any ? scoreDoc(d, keys, terms) : 1;
      if (s < 0) continue;
      scored.push({ p: d.p, s: s + (d.p.verdict === true ? 1 : 0) + (d.p.video ? 0.5 : 0) + (d.p.price != null ? 0.3 : 0) });
    }
    // Two products typed together: show both sides.
    const cmp = findCompare(P);
    if (cmp && P.two) {
      const seen = new Set(), both = [];
      for (const side of P.two) {
        const p2 = parse(side);
        for (const d of docs) {
          const s = scoreDoc(d, p2.keys, p2.terms);
          if (s >= 0 && !seen.has(d.p.id)) { seen.add(d.p.id); both.push({ p: d.p, s: s + ([cmp.a, cmp.b].includes(d.p.id) ? 10 : 0) }); }
        }
      }
      scored = both;
    }
    // Nothing for every word: fall back to any word, and say so.
    let loose = false;
    if (!scored.length && any) {
      loose = true;
      for (const d of docs) {
        let s = 0;
        for (const k of keys) if (d.keys.has(k)) s += 4;
        for (const t of terms) if (variants(t).some(v => d.n.includes(v))) s += 2;
        if (s > 0) scored.push({ p: d.p, s });
      }
    }
    if (intent.dept) scored = scored.filter(x => x.p.dept === intent.dept);
    if (intent.max) scored = scored.filter(x => x.p.price != null && x.p.price <= intent.max);
    if (intent.gift) scored = scored.filter(x => GIFT_KINDS.has(x.p.kind) || ['perfume-oud', 'coffee-dates'].includes(x.p.dept));
    if (intent.yes) scored = scored.filter(x => x.p.verdict === true);
    if (intent.video) scored = scored.filter(x => x.p.video);
    scored.sort((a, b) => b.s - a.s);
    return { items: scored.map(x => x.p), intent, labels: P.labels, keys, terms, cmp, loose };
  }

  // «انكر ولا يوجرين» or two brands typed together → our comparison, or the two best matches.
  function findCompare(P) {
    let sides = P.two;
    if (!sides) {
      const brands = P.keys.filter(k => ['iphone', 'samsung', 'anker', 'ugreen', 'xiaomi', 'redmi', 'huawei', 'philips', 'sony', 'logitech', 'baseus', 'lenovo', 'tefal'].includes(k));
      if (brands.length < 2) return null;
      sides = brands.slice(0, 2).map(b => GROUPS[b][0]);
      sides = sides.map(s => s + ' ' + P.terms.join(' '));
    }
    const best = side => {
      const p2 = parse(side);
      const ranked = docs.map(d => ({ d, s: scoreDoc(d, p2.keys, p2.terms) })).filter(x => x.s >= 0).sort((a, b) => b.s - a.s);
      return ranked.map(x => x.d.p);
    };
    const A = best(sides[0]), B = best(sides[1]);
    if (!A.length || !B.length) return null;
    const As = new Set(A.slice(0, 8).map(p => p.id)), Bs = new Set(B.slice(0, 8).map(p => p.id));
    const c = D.comparisons.find(c => (As.has(c.a) && Bs.has(c.b)) || (As.has(c.b) && Bs.has(c.a)));
    if (c) return { a: c.a, b: c.b, comparison: c };
    const a = A[0], b = B.find(p => p.id !== a.id && p.kind === a.kind) || B.find(p => p.id !== a.id);
    return b ? { a: a.id, b: b.id, comparison: null } : null;
  }

  // ---- suggestions ----
  const POPULAR = ['شاحن ايفون', 'باور بانك', 'سماعات بلوتوث', 'قلاية هوائية', 'دفاية', 'خيمة كشتة', 'ترمس قهوة', 'عطر عود', 'تمر سكري',
    'ساعة ذكية', 'ميزان ذكي', 'مكنسة سيارة', 'كيبل تايب سي', 'حامل جوال للسيارة', 'كشاف كشتة', 'غلاية', 'مساج', 'كرسي كشتة', 'هدية', 'ارخص شاحن'];
  const phrases = new Map();
  const add = (t, w = 1) => { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length < 2 || t.length > 48) return; const k = norm(t); if (!phrases.has(k) || phrases.get(k).w < w) phrases.set(k, { t, w }); };
  POPULAR.forEach(t => add(t, 3));
  Object.values(D.depts).forEach(t => add(t, 2));
  for (const p of D.products) {
    if (p.brand && KIND_AR[p.kind] && p.kind !== 'box') add(`${KIND_AR[p.kind][1]} ${p.brand}`, 2);
    add(p.episode == null ? p.name : p.title, 1);
  }
  for (const m of Object.values(D.trends)) m.items.forEach(i => add(i.name, 1));
  for (const c of D.comparisons) {
    const a = D.products.find(p => p.id === c.a), b = D.products.find(p => p.id === c.b);
    if (a && b && a.brand && b.brand && a.brand !== b.brand) add(`${a.brand} ولا ${b.brand}`, 2);
  }
  const PHRASES = [...phrases.entries()].map(([n, v]) => ({ n: ' ' + n, t: v.t, w: v.w }));

  function suggest(q, limit = 10) {
    const n = norm(q);
    if (!n) return [];
    const toks = n.split(' ');
    const out = [];
    for (const ph of PHRASES) {
      if (!toks.every(t => ph.n.includes(' ' + t) || (t.length > 2 && ph.n.includes(t)))) continue;
      const starts = ph.n.startsWith(' ' + n) ? 0 : ph.n.includes(' ' + n) ? 1 : 2;
      out.push({ ph, rank: starts * 10 - ph.w + ph.t.length / 40 });
    }
    out.sort((a, b) => a.rank - b.rank);
    return out.slice(0, limit).map(({ ph }) => ({ text: ph.t, html: mark(ph.t, q) }));
  }

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // Wraps the typed words, as they appear in the original text, in <b>.
  function mark(text, q) {
    const { n, map } = normMap(text);
    const on = new Array(text.length).fill(false);
    for (const t of norm(q).split(' ').filter(Boolean)) {
      let i = n.indexOf(t);
      while (i >= 0) {
        for (let k = i; k < i + t.length; k++) on[map[k]] = true;
        i = n.indexOf(t, i + t.length);
      }
    }
    // Include the marks that normalisation dropped (tashkeel) inside a bold run.
    let out = '', open = false;
    for (let i = 0; i < text.length; i++) {
      const b = on[i] || (open && TASHKEEL.test(text[i]));
      if (b && !open) { out += '<b>'; open = true; }
      if (!b && open) { out += '</b>'; open = false; }
      out += esc(text[i]);
    }
    return out + (open ? '</b>' : '');
  }

  window.Search = { run, suggest, norm, mark, parse, POPULAR, KIND_AR };
})();
