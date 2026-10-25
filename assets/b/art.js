// Product drawings for prototype B: one calm SVG illustration per product kind,
// on a soft tinted background. No photos, no logos, no brand marks.
//   Art.svg(kind, { seed, view, label })  -> '<svg …>'
//   Art.tint(kind, seed)                  -> background colour for the image area
//   Art.mark(size)                        -> the Yestahel «؟» tile
(function () {
  'use strict';
  let uid = 0;

  const TINTS = {
    sand: '#F2ECE3', mint: '#E4F1EA', sky: '#E3ECF5', lilac: '#EBE7F4',
    peach: '#F6EAE3', sage: '#E7EEE2', stone: '#EBEDF0', blush: '#F4E8EB',
  };
  const KIND_TINT = {
    charger: 'sky', cable: 'stone', powerbank: 'sky', stand: 'stone', mouse: 'lilac', keyboard: 'lilac',
    earbuds: 'mint', headphones: 'lilac', phone: 'sky', tablet: 'stone', band: 'mint', thermos: 'sage',
    coffee: 'sand', dates: 'sand', perfume: 'blush', tube: 'blush', hairtool: 'peach', heater: 'peach',
    lantern: 'sand', tent: 'sage', chair: 'sage', mattress: 'sky', rug: 'peach', bag: 'sage', airfryer: 'stone',
    scale: 'mint', massager: 'lilac', purifier: 'sky', projector: 'stone', vacuum: 'mint', speaker: 'lilac',
    gamepad: 'lilac', toy: 'peach', car: 'sky', box: 'stone', laptop: 'stone', camera: 'sand', dumbbell: 'mint', stove: 'sand', humidifier: 'sky',
  };
  // Body colour pairs [face, edge]: white, graphite, silver, sand, navy, sage, clay, lavender.
  const BODIES = [
    ['#F8F8F6', '#D6DAE0'], ['#3B4149', '#2A2F35'], ['#CDD2D9', '#A9B0BA'], ['#DCCFBC', '#BDAC94'],
    ['#33435C', '#243045'], ['#93AD9E', '#718D7E'], ['#CB8E70', '#A86F53'], ['#E7E2F1', '#C5BDD9'],
  ];
  // Kinds that are nearly always one colour in real life.
  const FIXED = { dates: 3, coffee: 0, tent: 5, lantern: 1, rug: 6, toy: 0, perfume: 3, cable: 2, earbuds: 0, mattress: 4 };
  const INK = '#2A3038', METAL = '#BCC3CC';

  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const tint = (kind, seed) => {
    const names = Object.keys(TINTS);
    return TINTS[KIND_TINT[kind]] || TINTS[names[hash(seed) % names.length]];
  };

  // Small builders.
  const rr = (x, y, w, h, r, fill, more = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${more}/>`;
  const ci = (cx, cy, r, fill, more = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${more}/>`;
  const el = (cx, cy, rx, ry, fill, more = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${more}/>`;
  const pa = (d, fill, more = '') => `<path d="${d}" fill="${fill}" ${more}/>`;
  const ln = (d, stroke, w, more = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${more}/>`;
  // A body shape with its top-left sheen.
  const box = (x, y, w, h, r, b, more = '') => rr(x, y, w, h, r, b.f, `stroke="${b.s}" stroke-width="1.5" ${more}`) + rr(x, y, w, h, r, `url(#h${b.id})`, more);

  const DRAW = {
    charger: b => [
      rr(81, 26, 8, 26, 2.5, METAL), rr(111, 26, 8, 26, 2.5, METAL),
      box(60, 46, 80, 100, 20, b),
      rr(60, 46, 14, 100, 20, b.s, 'opacity=".35"'),
      rr(84, 110, 32, 8, 4, INK), rr(84, 124, 32, 8, 4, INK, 'opacity=".85"'),
      ci(100, 70, 2.6, b.a),
    ].join(''),
    cable: b => [
      ln('M100 56 C150 56 150 136 100 136 C56 136 56 66 98 66 C138 66 138 126 100 126 C66 126 66 76 98 76', b.s, 9),
      ln('M100 56 C150 56 150 136 100 136 C56 136 56 66 98 66 C138 66 138 126 100 126 C66 126 66 76 98 76', b.f, 6),
      ln('M60 110 C48 132 44 140 40 150', b.f, 6), ln('M140 110 C152 132 156 140 160 150', b.f, 6),
      rr(31, 146, 18, 26, 5, b.s, 'transform="rotate(18 40 159)"'), rr(35, 168, 10, 10, 2, METAL, 'transform="rotate(18 40 159)"'),
      rr(151, 146, 18, 26, 5, b.s, 'transform="rotate(-18 160 159)"'), rr(155, 168, 10, 10, 2, METAL, 'transform="rotate(-18 160 159)"'),
    ].join(''),
    powerbank: b => [
      box(56, 38, 88, 126, 18, b),
      rr(86, 44, 28, 6, 3, INK),
      ...[0, 1, 2, 3].map(i => ci(82 + i * 12, 148, 3, i < 3 ? b.a : '#CBD2DA')),
      rr(70, 70, 60, 4, 2, b.s, 'opacity=".5"'),
    ].join(''),
    stand: b => [
      rr(46, 150, 108, 12, 6, b.s), pa('M86 152 L104 152 L126 76 L112 72 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`),
      `<g transform="rotate(14 120 92)">${rr(94, 34, 54, 104, 11, INK)}${rr(98, 38, 46, 96, 8, `url(#s${b.id})`)}${rr(112, 42, 18, 5, 2.5, '#111')}</g>`,
      rr(96, 134, 36, 8, 4, b.s, 'transform="rotate(14 114 138)"'),
    ].join(''),
    mouse: b => [
      pa('M100 38 C132 38 144 62 144 100 C144 142 126 164 100 164 C74 164 56 142 56 100 C56 62 68 38 100 38 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`),
      pa('M100 38 C132 38 144 62 144 100 C144 142 126 164 100 164 C74 164 56 142 56 100 C56 62 68 38 100 38 Z', `url(#h${b.id})`),
      ln('M100 40 L100 92', b.s, 2), rr(95, 56, 10, 22, 5, INK), ln('M62 104 C80 110 120 110 138 104', b.s, 1.5, 'opacity=".6"'),
    ].join(''),
    keyboard: b => {
      let k = '';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) k += rr(38 + c * 12.6, 76 + r * 13, 10, 10, 2.5, r === 3 && c > 2 && c < 7 ? 'none' : b.s, 'opacity=".9"');
      return box(28, 66, 144, 74, 12, b) + k + rr(76, 115, 48, 10, 2.5, b.s);
    },
    earbuds: b => [
      box(56, 92, 88, 68, 30, b), ln('M58 116 H142', b.s, 1.5), ci(100, 136, 2.5, b.a),
      ci(80, 70, 15, b.f, `stroke="${b.s}" stroke-width="1.5"`), rr(75, 74, 10, 30, 5, b.f, `stroke="${b.s}" stroke-width="1.5"`), ci(80, 70, 6, INK, 'opacity=".8"'),
      ci(122, 64, 15, b.f, `stroke="${b.s}" stroke-width="1.5"`), rr(117, 68, 10, 30, 5, b.f, `stroke="${b.s}" stroke-width="1.5"`), ci(122, 64, 6, INK, 'opacity=".8"'),
    ].join(''),
    headphones: b => [
      ln('M48 112 C48 44 152 44 152 112', b.s, 14), ln('M48 112 C48 44 152 44 152 112', b.f, 10),
      box(32, 98, 34, 58, 15, b), rr(60, 106, 10, 42, 5, INK, 'opacity=".75"'),
      box(134, 98, 34, 58, 15, b), rr(130, 106, 10, 42, 5, INK, 'opacity=".75"'),
    ].join(''),
    phone: b => [rr(64, 26, 72, 148, 16, b.s), rr(67, 29, 66, 142, 13, INK), rr(70, 32, 60, 136, 10, `url(#s${b.id})`), rr(90, 38, 20, 6, 3, '#0D0F12'), rr(86, 158, 28, 3, 1.5, '#fff', 'opacity=".6"')].join(''),
    tablet: b => [rr(36, 42, 128, 116, 14, b.s), rr(39, 45, 122, 110, 11, INK), rr(44, 50, 112, 100, 7, `url(#s${b.id})`), ci(100, 47.5, 1.4, '#555')].join(''),
    band: b => [
      rr(84, 26, 32, 148, 14, b.s), rr(87, 26, 26, 148, 12, b.f, 'opacity=".9"'),
      rr(74, 66, 52, 68, 16, INK), rr(79, 71, 42, 58, 12, `url(#s${b.id})`),
      rr(87, 88, 26, 6, 3, '#fff', 'opacity=".85"'), rr(91, 100, 18, 4, 2, '#fff', 'opacity=".5"'),
    ].join(''),
    thermos: b => [
      box(80, 30, 40, 22, 7, { ...b, f: b.s }), rr(84, 52, 32, 8, 2, METAL),
      box(72, 58, 56, 110, 20, b), rr(72, 122, 56, 10, 0, b.s, 'opacity=".45"'),
    ].join(''),
    coffee: b => [
      el(100, 152, 56, 11, '#fff', `stroke="${b.s}" stroke-width="1.5"`),
      pa('M60 96 H140 C140 132 124 150 100 150 C76 150 60 132 60 96 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`),
      pa('M60 96 H140 C140 132 124 150 100 150 C76 150 60 132 60 96 Z', `url(#h${b.id})`),
      el(100, 96, 40, 8, '#6B4A33'), el(96, 95, 14, 2.4, '#8A6347', 'opacity=".8"'),
      ln('M139 104 C160 104 160 132 133 133', b.f, 8), ln('M139 104 C160 104 160 132 133 133', b.s, 1.5, 'opacity=".5"'),
      ln('M86 80 C80 70 92 64 86 52', '#fff', 3.5, 'opacity=".9"'), ln('M102 78 C96 66 110 60 103 46', '#fff', 3.5, 'opacity=".75"'), ln('M118 80 C112 70 124 64 118 54', '#fff', 3.5, 'opacity=".6"'),
    ].join(''),
    dates: b => {
      const D = [[70, 100, -20], [88, 94, 10], [108, 96, -8], [128, 100, 24], [80, 106, 40], [118, 106, -35], [98, 104, 0]];
      return pa('M42 110 H158 C158 146 132 164 100 164 C68 164 42 146 42 110 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`) +
        D.map(([x, y, r]) => el(x, y, 13, 7.5, '#7A4A2A', `transform="rotate(${r} ${x} ${y})"`) + el(x - 3, y - 2.5, 6, 2, '#A06A45', `transform="rotate(${r} ${x} ${y})"`)).join('') +
        el(100, 110, 58, 6, b.s, 'opacity=".55"') + pa('M42 110 H158 C158 146 132 164 100 164 C68 164 42 146 42 110 Z', `url(#h${b.id})`);
    },
    perfume: b => [
      box(82, 30, 36, 30, 5, { ...b, f: '#CDAE70', s: '#A88A50' }), rr(91, 58, 18, 10, 2, METAL),
      rr(56, 66, 88, 100, 16, b.a, 'opacity=".35" stroke="#fff" stroke-width="2"'),
      rr(62, 84, 76, 76, 11, b.s, 'opacity=".75"'), rr(56, 66, 88, 100, 16, `url(#h${b.id})`),
      rr(80, 104, 40, 26, 3, '#fff', 'opacity=".8"'), rr(88, 114, 24, 3, 1.5, INK, 'opacity=".5"'),
    ].join(''),
    tube: b => [
      rr(70, 34, 48, 12, 3, b.s), box(74, 44, 40, 104, 10, b), rr(84, 146, 20, 20, 4, INK, 'opacity=".85"'),
      rr(80, 80, 28, 30, 4, b.a, 'opacity=".55"'),
      box(118, 128, 46, 34, 9, { ...b, f: '#fff' }), rr(115, 118, 52, 14, 6, b.a),
    ].join(''),
    hairtool: b => [
      `<g transform="rotate(-8 100 100)">${box(84, 92, 28, 70, 13, b)}</g>`,
      box(46, 54, 104, 48, 24, b), rr(146, 62, 20, 32, 7, b.s),
      ci(64, 78, 17, b.s), ln('M56 78 H72 M64 70 V86', b.f, 2.5, 'opacity=".7"'), rr(92, 118, 10, 16, 4, b.a, 'transform="rotate(-8 100 100)"'),
    ].join(''),
    heater: b => [
      rr(46, 42, 108, 10, 5, b.s),
      ...[0, 1, 2, 3, 4, 5, 6].map(i => box(50 + i * 14.6, 50, 12, 104, 6, b)),
      rr(140, 64, 20, 36, 5, INK), ci(150, 76, 5, b.a), ci(150, 90, 3, '#fff', 'opacity=".7"'),
      ci(60, 162, 7, INK), ci(140, 162, 7, INK),
    ].join(''),
    lantern: b => [
      ln('M76 46 C76 18 124 18 124 46', INK, 4.5), rr(68, 40, 64, 16, 7, b.f),
      rr(74, 56, 52, 72, 8, `url(#g${b.id})`), ln('M86 58 V126 M114 58 V126', b.f, 2.5, 'opacity=".55"'),
      box(66, 126, 68, 26, 9, b), ci(100, 139, 3, b.a),
    ].join(''),
    tent: b => [
      pa('M34 154 L100 48 L166 154 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`), pa('M34 154 L100 48 L166 154 Z', `url(#h${b.id})`),
      pa('M100 48 L82 154 H118 Z', b.s), pa('M100 70 L90 154 H110 Z', INK, 'opacity=".55"'),
      ln('M100 48 L100 36', INK, 3), ln('M34 154 L20 160 M166 154 L180 160', INK, 1.5, 'opacity=".5"'),
    ].join(''),
    chair: b => [
      ln('M60 162 L138 98 M140 162 L62 98', INK, 5),
      box(60, 38, 80, 62, 10, b), pa('M54 96 Q100 116 146 96 L146 106 Q100 128 54 106 Z', b.s),
      rr(46, 90, 26, 7, 3.5, INK), rr(128, 90, 26, 7, 3.5, INK), rr(84, 50, 32, 4, 2, '#fff', 'opacity=".5"'),
    ].join(''),
    mattress: b => [
      box(26, 92, 148, 52, 20, b), rr(34, 98, 34, 40, 14, '#fff', 'opacity=".45"'),
      ln('M84 98 V138 M108 98 V138 M132 98 V138 M156 100 V136', b.s, 2, 'opacity=".8"'),
      box(146, 136, 30, 28, 9, { ...b, f: INK, s: '#111' }),
    ].join(''),
    rug: b => {
      let fr = '';
      for (let i = 0; i < 13; i++) fr += ln(`M${46 + i * 9} 46 V38 M${46 + i * 9} 158 V166`, b.s, 2);
      return fr + box(40, 46, 120, 112, 6, b) + rr(50, 56, 100, 92, 4, 'none', 'stroke="#fff" stroke-width="3" opacity=".8"') +
        pa('M100 72 L126 102 L100 132 L74 102 Z', '#fff', 'opacity=".75"') + pa('M100 86 L112 102 L100 118 L88 102 Z', b.s);
    },
    bag: b => [
      ln('M82 52 C82 32 118 32 118 52', INK, 5), box(58, 48, 84, 114, 26, b),
      box(70, 104, 60, 44, 13, { ...b, f: b.s }), ln('M76 112 H124', '#fff', 1.5, 'opacity=".6"'), rr(96, 60, 8, 22, 4, b.s),
    ].join(''),
    airfryer: b => [
      box(54, 38, 92, 128, 28, b), ci(100, 66, 15, INK), ci(100, 66, 9, 'none', `stroke="${b.a}" stroke-width="2.5"`),
      box(62, 94, 76, 62, 16, { ...b, f: b.s }), rr(88, 116, 24, 32, 7, INK),
    ].join(''),
    scale: b => [
      box(36, 58, 128, 108, 24, b), rr(76, 72, 48, 22, 6, INK),
      `<text x="100" y="88" text-anchor="middle" font-family="Tajawal, sans-serif" font-weight="700" font-size="12" fill="${b.a}">68.4</text>`,
      el(66, 140, 14, 18, b.s, 'opacity=".25"'), el(134, 140, 14, 18, b.s, 'opacity=".25"'),
    ].join(''),
    massager: b => [
      `<g transform="rotate(-10 118 66)">${box(104, 62, 28, 98, 12, b)}${rr(104, 138, 28, 8, 0, b.s, 'opacity=".5"')}</g>`,
      box(64, 44, 80, 30, 14, b), ci(56, 59, 17, INK), ci(56, 59, 8, b.a, 'opacity=".6"'), ci(126, 59, 3, b.a),
    ].join(''),
    projector: b => {
      let v = '';
      for (let i = 0; i < 5; i++) v += rr(52, 86 + i * 8, 34, 3, 1.5, b.s);
      return box(36, 68, 128, 74, 16, b) + v + ci(122, 105, 24, INK) + ci(122, 105, 15, `url(#s${b.id})`) + ci(116, 99, 4, '#fff', 'opacity=".7"') +
        rr(52, 142, 14, 8, 3, INK) + rr(134, 142, 14, 8, 3, INK);
    },
    vacuum: b => [
      pa('M60 88 L22 112 L28 122 L66 104 Z', b.s), box(54, 74, 76, 48, 22, b), rr(64, 82, 34, 32, 14, b.a, 'opacity=".45"'),
      ln('M128 86 C164 80 172 128 132 120', INK, 9), rr(122, 96, 10, 14, 4, b.a),
    ].join(''),
    speaker: b => {
      let g = '';
      for (let r = 0; r < 9; r++) for (let c = 0; c < 5; c++) g += ci(84 + c * 8, 70 + r * 9, 1.8, INK, 'opacity=".55"');
      return box(68, 40, 64, 126, 30, b) + g + rr(92, 48, 16, 6, 3, b.a);
    },
    purifier: b => {
      let g = '';
      for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) g += ci(80 + c * 8, 72 + r * 8.4, 1.6, b.s);
      return box(64, 32, 72, 136, 30, b) + rr(72, 40, 56, 14, 7, b.s) + g + ci(100, 158, 3, b.a);
    },
    gamepad: b => [
      pa('M62 80 C40 80 32 102 34 126 C36 148 52 158 64 150 C74 144 78 132 90 132 H110 C122 132 126 144 136 150 C148 158 164 148 166 126 C168 102 160 80 138 80 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`),
      pa('M62 80 C40 80 32 102 34 126 C36 148 52 158 64 150 C74 144 78 132 90 132 H110 C122 132 126 144 136 150 C148 158 164 148 166 126 C168 102 160 80 138 80 Z', `url(#h${b.id})`),
      rr(54, 100, 26, 8, 2, INK), rr(63, 91, 8, 26, 2, INK),
      ci(136, 94, 5, b.a), ci(148, 106, 5, INK), ci(124, 106, 5, INK), ci(136, 118, 5, INK),
      ci(88, 122, 10, INK), ci(112, 122, 10, INK), ci(88, 122, 5, b.s), ci(112, 122, 5, b.s),
    ].join(''),
    toy: () => [
      [48, 112, '#F2B8A2', 'ب'], [102, 112, '#A9C8E8', 'ت'], [75, 66, '#A8D5BE', 'ج'],
    ].map(([x, y, f, ch]) => rr(x, y, 48, 48, 9, f, 'stroke="#fff" stroke-width="2"') + rr(x + 6, y + 6, 36, 36, 6, '#fff', 'opacity=".55"') +
      `<text x="${x + 24}" y="${y + 33}" text-anchor="middle" font-family="Tajawal, sans-serif" font-weight="800" font-size="24" fill="${INK}">${ch}</text>`).join(''),
    car: b => [
      pa('M28 134 C28 122 36 116 48 114 L70 96 C78 88 88 86 100 86 H124 C136 86 144 92 152 100 L166 114 C174 116 178 124 178 134 V142 H28 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`),
      pa('M74 112 L86 98 C90 94 94 93 100 93 H110 V112 Z M116 112 V93 H124 C132 93 138 96 144 104 L150 112 Z', INK, 'opacity=".75"'),
      pa('M28 134 C28 122 36 116 48 114 L70 96 C78 88 88 86 100 86 H124 C136 86 144 92 152 100 L166 114 C174 116 178 124 178 134 V142 H28 Z', `url(#h${b.id})`),
      ci(62, 142, 15, INK), ci(62, 142, 6, METAL), ci(146, 142, 15, INK), ci(146, 142, 6, METAL), rr(166, 120, 10, 5, 2.5, '#FFE3A3'),
    ].join(''),
    box: b => [
      pa('M56 62 L80 44 H160 L136 62 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`), pa('M136 62 L160 44 V138 L136 158 Z', b.s),
      box(56, 62, 80, 96, 3, b), rr(56, 62, 80, 14, 0, b.a, 'opacity=".55"'), ci(96, 112, 16, 'none', `stroke="${INK}" stroke-width="3" opacity=".55"`),
      rr(90, 106, 12, 12, 3, INK, 'opacity=".55"'),
    ].join(''),
  };
  DRAW.laptop = b => [
    rr(42, 44, 116, 80, 8, b.s), rr(47, 49, 106, 70, 5, `url(#s${b.id})`), ci(100, 46.5, 1.2, '#555'),
    pa('M30 128 H170 L162 142 C161 145 158 146 155 146 H45 C42 146 39 145 38 142 Z', b.f, `stroke="${b.s}" stroke-width="1.5"`),
    rr(88, 128, 24, 4, 2, b.s), pa('M30 128 H170 L162 142 C161 145 158 146 155 146 H45 C42 146 39 145 38 142 Z', `url(#h${b.id})`),
  ].join('');
  DRAW.camera = b => [
    rr(52, 56, 26, 12, 4, b.s), box(36, 64, 128, 84, 16, { ...b, f: INK, s: '#15191E' }), rr(36, 86, 128, 40, 0, b.s, 'opacity=".5"'),
    ci(100, 106, 30, '#1B2027', 'stroke="#555C66" stroke-width="3"'), ci(100, 106, 19, `url(#s${b.id})`), ci(94, 100, 5, '#fff', 'opacity=".6"'),
    rr(138, 72, 14, 8, 3, b.a),
  ].join('');
  DRAW.dumbbell = b => [
    rr(52, 96, 96, 10, 5, METAL),
    box(40, 72, 18, 58, 6, { ...b, f: INK, s: '#15191E' }), box(26, 80, 16, 42, 5, { ...b, f: INK, s: '#15191E' }),
    box(142, 72, 18, 58, 6, { ...b, f: INK, s: '#15191E' }), box(158, 80, 16, 42, 5, { ...b, f: INK, s: '#15191E' }),
    rr(86, 94, 28, 14, 4, b.a, 'opacity=".8"'),
  ].join('');
  DRAW.stove = b => [
    box(40, 90, 120, 58, 12, b), rr(40, 90, 120, 10, 0, b.s, 'opacity=".5"'),
    el(100, 84, 40, 10, INK), el(100, 82, 26, 6, 'none', `stroke="${METAL}" stroke-width="3"`),
    ln('M74 82 L64 74 M126 82 L136 74 M100 72 V64', INK, 4), ci(136, 122, 9, INK), ci(136, 122, 4, b.a),
    rr(52, 112, 52, 22, 4, '#fff', 'opacity=".6"'),
  ].join('');
  // Room humidifier: a rounded tank, a water window, and mist rising from the nozzle.
  DRAW.humidifier = b => [
    box(62, 70, 76, 94, 30, b), rr(74, 104, 52, 40, 14, b.a, 'opacity=".28"'), rr(74, 124, 52, 20, 10, b.a, 'opacity=".35"'),
    rr(88, 58, 24, 16, 7, b.s), ci(100, 154, 3, b.a),
    ln('M100 54 C92 44 108 38 100 28', '#fff', 6, 'opacity=".95"'), ln('M88 52 C80 44 92 36 86 28', '#fff', 4, 'opacity=".7"'), ln('M112 52 C120 44 108 36 114 28', '#fff', 4, 'opacity=".7"'),
    ln('M100 54 C92 44 108 38 100 28', b.s, 1, 'opacity=".25"'),
  ].join('');
  DRAW.else = DRAW.box;

  // Camera angles for the gallery: front, turned, close-up, mirrored.
  const VIEWS = ['', 'rotate(-9 100 104) translate(2 4)', 'translate(100 92) scale(1.7) translate(-100 -92)', 'translate(200 0) scale(-1 1)'];

  function svg(kind, { seed = kind, view = 0, label = '', accent } = {}) {
    const id = ++uid;
    const h = hash(seed);
    const [f, s] = BODIES[FIXED[kind] ?? (h % BODIES.length)];
    const a = accent || ['#5E9C82', '#5C86B8', '#9A7BC4', '#C9875F', '#4E9AA8'][h % 5];
    const b = { f, s, a, id };
    const art = (DRAW[kind] || DRAW.box)(b);
    const dark = f === BODIES[1][0] || f === BODIES[4][0];
    const safe = String(label).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    return `<svg class="art" viewBox="0 0 200 200" role="img" aria-label="${safe}" xmlns="http://www.w3.org/2000/svg">` +
      `<defs><linearGradient id="h${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.28 : 0.6}"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="#1B2230"/></linearGradient>` +
      `<radialGradient id="g${id}"><stop offset="0" stop-color="#FFF4D6"/><stop offset="1" stop-color="#F0B65C"/></radialGradient>` +
      `<radialGradient id="o${id}"><stop offset="0" stop-color="#1D2939" stop-opacity=".22"/><stop offset="1" stop-color="#1D2939" stop-opacity="0"/></radialGradient></defs>` +
      ci(100, 98, 74, '#fff', 'opacity=".42"') +
      (view === 2 ? '' : el(100, 172, 62, 8, `url(#o${id})`)) +
      `<g transform="${VIEWS[view % VIEWS.length]}">${art}</g></svg>`;
  }

  const mark = (size = 32, { tile = '#D7FF3B', ink = '#0E0F13' } = {}) =>
    `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="26" fill="${tile}"/>` +
    `<path d="M67 33C67 21 58 14 48.5 14C37.5 14 30 21.5 30 31.5C30 42.5 39.5 46.5 45 51.5C48.5 54.8 50 58.5 50 64.5" fill="none" stroke="${ink}" stroke-width="11.5" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="50" cy="81.5" r="8.6" fill="${ink}"/><path d="M46.2 81.8L49 84.6L54.2 78.9" fill="none" stroke="${tile}" stroke-width="2.6" stroke-linecap="round"/></svg>`;

  window.Art = { svg, tint, mark, kinds: Object.keys(DRAW) };
})();
