/* Scène SVG : bâtiment en coupe, groupe extérieur, unités intérieures, liaisons. */
(function () {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const svg = document.getElementById('scene');
const G = 810, BX = 520, IX0 = 542, IX1 = 1538, RX0 = 456, MX = 440;

const S = {
  sys: 'mono', types: ['mural'], support: 'mural', drain: 'gravite', zoning: true, diff: 'rond',
  mode: 'cool', power: true, xray: false, labels: false, fault: null, zones: [true, true, true],
  apports: {}, def: null, view: 'coupe', reprise: 'couloir', salonD: '2x160'
};
const NAMES = {
  groupe: 'Groupe extérieur', compresseur: 'Compresseur', v4v: 'Vanne 4 voies', echext: 'Échangeur extérieur',
  detendeur: 'Détendeur', ventilo: 'Ventilateur', liaison: 'Liaisons frigorifiques', interco: 'Câble d’interconnexion',
  alim: 'Câble d’alimentation', disj: 'Disjoncteur dédié', support: 'Support', goulotte: 'Goulotte',
  condensats: 'Évacuation des condensats', pompe: 'Pompe de relevage', uint: 'Unité intérieure', thermostat: 'Thermostat',
  gaine: 'Gaine de soufflage', registre: 'Registre motorisé', bouche: 'Bouche de soufflage', reprise: 'Grille de reprise filtrante', diametre: 'Diamètre de gaine',
  refnet: 'Refnet', plenum: 'Plénum de soufflage', detalon: 'Jour sous la porte (détalonnage)', 'u-gainable': 'Gainable'
};
let hot = {}, labs = [], rooms = [], units = [], temps = [], L = null, gid = 0, spotId = null, layers = {};

function el(tag, a, p) {
  const e = document.createElementNS(NS, tag);
  for (const k in a) { if (k === 'text') e.textContent = a[k]; else if (a[k] != null) e.setAttribute(k, a[k]); }
  if (p) p.appendChild(e);
  return e;
}
const R = (x, y, w, h, a, p) => el('rect', Object.assign({ x, y, width: w, height: h }, a || {}), p);
const P = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function tube(p, d, kind, dir, w, extra) {
  el('path', { d, class: 'tb-case', 'stroke-width': w + 3 }, p);
  el('path', Object.assign({ d, class: 'tb ' + kind, 'stroke-width': w }, extra || {}), p);
  el('path', { d, class: 'tb-flow ' + dir, 'stroke-width': Math.max(1.6, w - 2.6) }, p);
}
function insul(d, w) {
  el('path', { d, class: 'insul-o xhide', 'stroke-width': w + 8 }, layers.insul);
  el('path', { d, class: 'insul xhide', 'stroke-width': w + 6 }, layers.insul);
}
function hs(id, x, y, lx, ly, xr, r) {
  if (hot[id]) return;
  hot[id] = { x, y, r: r || 62 };
  if (lx != null) labs.push({ id, x, y, lx, ly, xr });
}
const air = (d, cls, w) => { el('path', { d, class: 'air halo ' + cls, 'stroke-width': (w || 4) * 3 }, layers.air); return el('path', { d, class: 'air ' + cls, 'stroke-width': w || 4 }, layers.air); };
function defs() {
  const d = layers.defs;
  const lg = (id, stops, h) => { const g = el('linearGradient', { id, x1: 0, y1: 0, x2: h ? 1 : 0, y2: h ? 0 : 1 }, d); stops.forEach(([o, c]) => el('stop', { offset: o, 'stop-color': c }, g)); };
  lg('gBody', [[0, '#ffffff'], [0.65, '#f4f6f7'], [1, '#dde2e6']]);
  lg('gMetal', [[0, '#fafaf8'], [1, '#d9ddda']]);
  lg('gComp', [[0, '#1b252d'], [0.32, '#627381'], [0.6, '#34424e'], [1, '#182027']], true);
  lg('gBrass', [[0, '#ecc670'], [1, '#a47426']]);
  lg('gWall', [[0, '#fcf8f0'], [1, '#eee5d5']]);
  lg('gPlen', [[0, '#bdb19d'], [1, '#d9cfbe']]);
  lg('gFloor', [[0, '#c79d6c'], [1, '#a2764a']]);
  const p = el('pattern', { id: 'hatch', width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, d);
  R(0, 0, 9, 9, { fill: '#c6b9a4' }, p); el('line', { x1: 1, y1: 0, x2: 1, y2: 9, stroke: '#a59781', 'stroke-width': 1.6 }, p);
  const rg = el('radialGradient', { id: 'gFan' }, d); el('stop', { offset: 0, 'stop-color': '#1b232a' }, rg); el('stop', { offset: 1, 'stop-color': '#48545e' }, rg);
  const f = el('filter', { id: 'sh', x: '-15%', y: '-15%', width: '130%', height: '150%' }, d);
  el('feDropShadow', { dx: 0, dy: 5, stdDeviation: 5, 'flood-color': '#2a2218', 'flood-opacity': 0.24 }, f);
}

/* ---------- Disposition ---------- */
function layout() {
  const vrf = S.sys === 'vrf', gm = S.sys === 'mono' && S.types[0] === 'gainable';
  const cols = (S.sys === 'mono' && !gm) ? 1 : 3;
  const fl = vrf ? [{ top: 150, h: 330, pl: 60 }, { top: 480, h: 330, pl: 60 }] : [{ top: 350, h: 460, pl: 104 }];
  const rw = (IX1 - IX0 - (cols - 1) * 12) / cols;
  const names = vrf ? ['Bureau 1', 'Bureau 2', 'Salle de réunion', 'Accueil', 'Open space', 'Salle de pause']
    : cols === 1 ? ['Séjour'] : ['Séjour', 'Chambre', 'Bureau'];
  rooms = [];
  fl.forEach((f, fi) => {
    for (let c = 0; c < cols; c++) rooms.push({ x: IX0 + c * (rw + 12), y: f.top, w: rw, h: f.h, ceil: f.top + f.pl, floor: f.top + f.h, f: fi, c, name: names[rooms.length] });
  });
  if (temps.length !== rooms.length) temps = rooms.map(() => S.mode === 'cool' ? 29.5 : 15.5);
  return { vrf, gm, cols, fl, rw, s: vrf ? 0.78 : 1, single: cols === 1 };
}
const unitCount = () => S.sys === 'mono' ? 1 : S.sys === 'multi' ? 3 : 6;

/* ---------- Extérieur ---------- */
function drawOutside(g) {
  const d = el('defs', {}, svg);
  const mk = (id, a, b) => { const lg = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: 900 }, d); el('stop', { offset: 0, 'stop-color': a }, lg); el('stop', { offset: 1, 'stop-color': b }, lg); };
  mk('skyS', '#9fd3f2', '#e6f4fb'); mk('skyW', '#b9c4ce', '#eceff2');
  R(-3000, -2000, 7600, 2000 + G, { fill: 'url(#skyW)' }, g);
  R(-3000, -2000, 7600, 2000 + G, { fill: 'url(#skyS)', class: 's-only' }, g);
  // soleil
  const sun = el('g', { class: 's-only' }, g);
  const rays = el('g', { class: 'rays' }, sun);
  el('circle', { cx: 330, cy: 105, r: 92, fill: 'none' }, rays);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; el('line', { x1: 330 + Math.cos(a) * 58, y1: 105 + Math.sin(a) * 58, x2: 330 + Math.cos(a) * 84, y2: 105 + Math.sin(a) * 84, stroke: '#f7c23c', 'stroke-width': 7, 'stroke-linecap': 'round' }, rays); }
  el('circle', { cx: 330, cy: 105, r: 46, fill: '#f9cf45' }, sun);
  // nuages d'hiver et neige
  const win = el('g', { class: 'w-only' }, g);
  [[90, 150, 1], [300, 90, 1.3]].forEach(([x, y, k]) => { el('ellipse', { cx: x, cy: y, rx: 80 * k, ry: 24 * k, fill: '#f6f8fa' }, win); el('ellipse', { cx: x + 46 * k, cy: y - 16 * k, rx: 52 * k, ry: 26 * k, fill: '#f6f8fa' }, win); });
  for (let i = 0; i < 34; i++) {
    const x = (i * 97) % 500 + 8, r = 2 + (i % 3);
    el('circle', { cx: x, cy: 0, r, fill: '#fff', class: 'flake', style: `animation-duration:${5 + (i % 5)}s;animation-delay:-${(i * 0.7) % 9}s` }, win);
  }
  // nuages d'été et collines
  const cl = el('g', { class: 's-only' }, g);
  [[120, 190, 0.9, 70], [1250, 120, 1.2, 95], [760, 70, 0.8, 120]].forEach(([x, y, k, t]) => { const c = el('g', { class: 'cloud', style: `animation-duration:${t}s` }, cl); [[0, 0, 70, 22], [40, -16, 46, 24], [-34, -8, 36, 18]].forEach(([a, b, rx, ry]) => el('ellipse', { cx: x + a * k, cy: y + b * k, rx: rx * k, ry: ry * k, fill: '#fff', opacity: 0.9 }, c)); });
  el('path', { d: `M-3000 ${G} L-3000 760 L0 760 Q130 700 290 752 Q420 790 520 770 L520 ${G} Z M1560 ${G} L1560 772 Q1590 756 1600 760 L4600 760 L4600 ${G} Z`, class: 'hill', fill: '#a9cf86' }, g);
  // sol
  R(-3000, G, 7600, 2000, { class: 'grass', fill: '#8dbb62' }, g);
  R(-3000, G, 7600, 7, { fill: 'rgba(40,60,20,.16)' }, g);
  // arbre
  R(46, 640, 14, G - 640, { fill: '#7a5a3e' }, g);
  const leaf = el('g', { class: 's-only' }, g);
  [[53, 600, 62], [20, 640, 40], [90, 640, 42]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#6fa24c' }, leaf));
  const bare = el('g', { class: 'w-only', stroke: '#7a5a3e', 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none' }, g);
  el('path', { d: 'M53 645 L20 590 M53 645 L92 585 M53 660 L53 560 M53 600 L74 570' }, bare);
  // température extérieure
  el('text', { x: 24, y: 40, class: 'tout-l', text: 'Température extérieure' }, g);
  el('text', { x: 24, y: 76, class: 'tout', id: 'tOut' }, g);
}

/* ---------- Portes détalonnées (gainable, reprise centralisée) ---------- */
function drawDoors(g) {
  if (!L.gm) return;
  rooms.slice(0, 2).forEach((r, c) => {
    const px = r.x + r.w, f = r.floor, dg = el('g', { 'data-info': 'detalon' }, g);
    R(px, f - 205, 12, 198, { fill: 'url(#gWall)', stroke: '#b3a892' }, dg);
    R(px + 4, f - 203, 5, 186, { fill: '#a9825a', stroke: '#6c5038', 'stroke-width': 0.8 }, dg);
    el('circle', { cx: px + 6.5, cy: f - 105, r: 3, fill: '#d9c27a' }, dg);
    air(`M${px + 100} ${f - 74} C${px + 60} ${f - 16} ${px + 30} ${f - 12} ${px + 6} ${f - 12} S${px - 56} ${f - 16} ${px - 90} ${f - 60}`, 'ret', 3);
    if (c === 0) hs('detalon', px + 6, f - 12, px - 210, f - 84, false, 60);
  });
}
/* ---------- Bâtiment ---------- */
function drawBuilding(g) {
  const top = L.fl[0].top;
  if (L.vrf) { R(506, top - 24, 1068, 24, { fill: '#7d8791' }, g); R(506, top - 34, 1068, 12, { fill: '#5d6770' }, g); }
  else { el('polygon', { points: `486,${top} 1040,${top - 152} 1594,${top}`, fill: '#9a4e3a' }, g); el('polygon', { points: `548,${top} 1040,${top - 122} 1532,${top}`, fill: '#ead9b0' }, g); }
  R(BX, top, 1040, G - top, { fill: 'url(#hatch)', stroke: '#8f8370', 'stroke-width': 1.5 }, g);
  R(506, G, 1068, 26, { fill: '#8f8a80' }, g);
  rooms.forEach((r, i) => {
    R(r.x, r.y + 6, r.w, r.ceil - r.y - 6, { fill: 'url(#gPlen)' }, g);
    R(r.x, r.ceil, r.w, r.floor - r.ceil, { fill: 'url(#gWall)' }, g);
    // fenêtre
    const wd = L.single ? { x: r.x + 640, y: r.ceil + 96, w: 300, h: r.floor - r.ceil - 111 }
      : L.vrf ? { x: r.x + r.w - 120, y: r.ceil + 100, w: 92, h: 96 } : { x: r.x + r.w - 130, y: r.ceil + 160, w: 100, h: 120 };
    R(wd.x - 5, wd.y - 5, wd.w + 10, wd.h + 10, { fill: '#fff', stroke: '#a99f90' }, g);
    R(wd.x, wd.y, wd.w, wd.h, { class: 'glass', fill: '#bfe3f6' }, g);
    el('line', { x1: wd.x + wd.w / 2, y1: wd.y, x2: wd.x + wd.w / 2, y2: wd.y + wd.h, stroke: '#fff', 'stroke-width': 5 }, g);
    el('path', { d: `M${wd.x + 10} ${wd.y + wd.h * 0.5} L${wd.x + wd.w * 0.3} ${wd.y + 8} M${wd.x + 24} ${wd.y + wd.h * 0.62} L${wd.x + wd.w * 0.42} ${wd.y + 14}`, stroke: '#fff', 'stroke-width': 4, opacity: 0.5, 'stroke-linecap': 'round' }, g);
    r.win = wd;
    R(r.x, r.ceil - 4, r.w, 5, { fill: '#fff', stroke: '#a99f90', 'stroke-width': 1 }, g);
    R(r.x, r.floor - 15, r.w, 8, { fill: '#ebe4d6' }, g);
    R(r.x, r.floor - 7, r.w, 7, { fill: 'url(#gFloor)' }, g);
    R(r.x, r.ceil + 1, r.w, 14, { fill: 'rgba(60,45,25,.07)' }, g);
    el('text', { x: r.x + 12, y: r.floor - 24, class: 'rname', text: r.name }, g);
    R(r.x, r.ceil, r.w, r.floor - r.ceil, { class: 'tint', id: 'tint' + i, fill: 'rgba(0,0,0,0)' }, layers.tint);
  });
}
function furniture(g) {
  const f = L.s;
  const shd = (x, y, w) => el('ellipse', { cx: x + w / 2, cy: y + 4, rx: w / 2 + 10, ry: 5, fill: 'rgba(70,45,20,.2)' }, g);
  const sofa = (x, y, k) => { shd(x, y, 170 * k); R(x, y - 62 * k, 170 * k, 36 * k, { rx: 8, fill: '#5f7f8f' }, g); R(x - 8 * k, y - 40 * k, 186 * k, 30 * k, { rx: 8, fill: '#6f93a5' }, g); R(x, y - 12 * k, 8 * k, 6 * k, { fill: '#3d3d3d' }, g); R(x + 162 * k, y - 12 * k, 8 * k, 6 * k, { fill: '#3d3d3d' }, g); };
  const bed = (x, y, k) => { shd(x, y, 170 * k); R(x, y - 34 * k, 170 * k, 24 * k, { rx: 5, fill: '#e9e3d8', stroke: '#b5ab9a' }, g); R(x, y - 58 * k, 12 * k, 52 * k, { rx: 3, fill: '#8a6a4b' }, g); R(x + 16 * k, y - 44 * k, 44 * k, 14 * k, { rx: 6, fill: '#fff', stroke: '#c8c0b2' }, g); R(x + 66 * k, y - 36 * k, 104 * k, 22 * k, { rx: 5, fill: '#b9646a' }, g); };
  const desk = (x, y, k) => { shd(x, y, 160 * k); R(x, y - 64 * k, 160 * k, 8 * k, { fill: '#8a6a4b' }, g); R(x + 8 * k, y - 56 * k, 6 * k, 50 * k, { fill: '#6c5038' }, g); R(x + 146 * k, y - 56 * k, 6 * k, 50 * k, { fill: '#6c5038' }, g); R(x + 54 * k, y - 104 * k, 58 * k, 36 * k, { rx: 3, fill: '#2f3a44' }, g); R(x + 78 * k, y - 68 * k, 10 * k, 5 * k, { fill: '#2f3a44' }, g); };
  const plant = (x, y, k) => { shd(x - 14 * k, y, 28 * k); R(x - 12 * k, y - 28 * k, 24 * k, 22 * k, { rx: 3, fill: '#b5673e' }, g); [[0, -56, 20], [-14, -42, 15], [14, -44, 15]].forEach(([a, b, r]) => el('circle', { cx: x + a * k, cy: y + b * k, r: r * k, fill: '#5d9150' }, g)); };
  rooms.forEach((r, i) => {
    const fy = r.floor - 6, t = units[L.gm ? 0 : i] ? units[L.gm ? 0 : i].type : '';
    if (L.single) {
      el('ellipse', { cx: r.x + 494, cy: fy + 2, rx: 170, ry: 6, fill: '#c9a584' }, g);
      R(r.x + 150, r.ceil + 130, 96, 66, { fill: '#fff', stroke: '#6c5038', 'stroke-width': 4 }, g);
      el('path', { d: `M${r.x + 156} ${r.ceil + 190} l26 -30 l16 16 l18 -24 l24 38 Z`, fill: '#8fb7c9' }, g);
      el('circle', { cx: r.x + 224, cy: r.ceil + 148, r: 7, fill: '#f2c14e' }, g);
      shd(r.x + 336, fy, 28); R(r.x + 348, fy - 150, 4, 150, { fill: '#4a4f55' }, g);
      el('path', { d: `M${r.x + 330} ${fy - 150} l8 -34 h24 l8 34 Z`, fill: '#f3e3b8', stroke: '#c9b582' }, g);
      sofa(r.x + 400, fy, 1.1); plant(r.x + 615, fy, 1.2); return;
    }
    if (t === 'console' && !L.gm) { plant(r.x + r.w - 26, fy, f); return; }
    const x = r.x + r.w - 196 * f;
    [sofa, bed, desk][L.vrf ? 2 : r.c](x, fy, f * 0.95);
  });
}

/* ---------- Unités intérieures ---------- */
function coil(g, x, yg, xr, rows) {
  const yl = yg + 7, id = 'gi' + (gid++);
  const lg = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 0, y1: rows[0], x2: 0, y2: rows[3] }, layers.defs);
  el('stop', { offset: 0, class: 'st-il' }, lg); el('stop', { offset: 1, class: 'st-ig' }, lg);
  const pts = [[x, yl], [x + 12, yl], [x + 12, rows[0]], [xr, rows[0]], [xr, rows[1]], [x + 34, rows[1]], [x + 34, rows[2]], [xr, rows[2]], [xr, rows[3]], [x + 24, rows[3]], [x + 24, yg], [x, yg]];
  tube(g, P(pts), '', 'd-c', 4.4, { stroke: `url(#${id})` });
}
function fanAir(x0, x1, y0, e0, e1, ey, n, r, cls) {
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5, sx = lerp(x0, x1, t), ex = clamp(lerp(e0, e1, t), r.x + 16, r.x + r.w - 16);
    air(`M${sx} ${y0} C${sx} ${y0 + (ey - y0) * 0.45} ${ex} ${y0 + (ey - y0) * 0.5} ${ex} ${ey}`, cls || 'sup', 3 + (i % 2) * 1.5);
  }
}
function drawUnit(u, k) {
  const r = u.room, s = L.s, g = el('g', { 'data-info': 'u-' + u.type }, layers.units), gi = layers.pipes, t = u.type;
  const cas = () => el('g', { class: 'casing', filter: 'url(#sh)' }, g);
  const body = { fill: 'url(#gBody)', stroke: '#9aa3ab', 'stroke-width': 1.4 };
  let x, y, w, h;
  if (t === 'mural') {
    w = 230 * s; h = 74 * s; x = r.x + (r.w - w) / 2; y = r.ceil + 34 * s;
    u.port = { x, y: y + 40 * s };
    coil(gi, x, u.port.y, x + w - 16 * s, [y + 62 * s, y + 48 * s, y + 34 * s, y + 18 * s]);
    const c = cas(); R(x, y, w, h, Object.assign({ rx: 14 * s }, body), c);
    el('path', { d: `M${x + 8 * s} ${y + h - 16 * s} H${x + w - 8 * s}`, stroke: '#c2c8cd', 'stroke-width': 1.4 }, c);
    R(x + 14 * s, y + h - 9 * s, w - 28 * s, 6 * s, { rx: 3 * s, fill: '#56606a' }, c);
    el('circle', { cx: x + w - 22 * s, cy: y + 16 * s, r: 3.2 * s, class: 'led' }, c);
    fanAir(x + 24 * s, x + w - 24 * s, y + h + 4, x - 70 * s, x + w + 70 * s, r.floor - 26, 5, r);
    [0.25, 0.5, 0.75].forEach(q => air(`M${x + w * q + (q - 0.5) * 70} ${r.ceil + 6} Q${x + w * q} ${r.ceil + 16 * s} ${x + w * q} ${y - 2}`, 'ret', 3));
    u.dr = { x: x + w - 4, y: y + h - 8 * s };
  } else if (t === 'cassette') {
    const cx = r.x + r.w / 2; w = 150 * s; h = 44 * s; x = cx - w / 2; y = r.ceil - h - 2;
    u.port = { x, y: r.ceil - 22 * s };
    coil(gi, x, u.port.y, x + w - 12 * s, [r.ceil - 7 * s, r.ceil - 15 * s, r.ceil - 29 * s, r.ceil - 37 * s]);
    const c = cas(); R(x, y, w, h, Object.assign({ rx: 4 }, body, { fill: '#e7eaec' }), c);
    R(cx - 100 * s, r.ceil, 200 * s, 11 * s, Object.assign({ rx: 3 }, body), g);
    R(cx - 54 * s, r.ceil + 4 * s, 108 * s, 4 * s, { fill: '#56606a' }, g);
    [-1, 1].forEach(sd => [0.5, 1].forEach((q, i) => {
      const ex = clamp(cx + sd * (120 + 150 * q) * s, r.x + 18, r.x + r.w - 18);
      air(`M${cx + sd * 96 * s} ${r.ceil + 13 * s} C${cx + sd * 170 * s} ${r.ceil + 18 * s} ${ex} ${r.ceil + 70 * s} ${ex} ${r.floor - 30 - i * 70 * s}`, 'sup', 3.5 + i);
    }));
    [-28, 0, 28].forEach(o => air(`M${cx + o * 2.2 * s} ${r.ceil + 130 * s} Q${cx + o * s} ${r.ceil + 60 * s} ${cx + o * s} ${r.ceil + 13 * s}`, 'ret', 3));
    u.inPlenum = true;
  } else if (t === 'plafonnier') {
    w = 240 * s; h = 50 * s; x = r.x + Math.max(70, r.w * 0.16); y = r.ceil + 3;
    u.port = { x, y: y + 24 * s };
    coil(gi, x, u.port.y, x + w - 14 * s, [y + 42 * s, y + 35 * s, y + 15 * s, y + 8 * s]);
    const c = cas(); el('path', { d: `M${x} ${y} H${x + w} V${y + h * 0.55} Q${x + w} ${y + h} ${x + w - 30 * s} ${y + h} H${x} Z`, fill: body.fill, stroke: body.stroke, 'stroke-width': 1.4 }, c);
    R(x + 30 * s, y + h - 9 * s, w * 0.5, 5 * s, { fill: '#56606a' }, c);
    el('circle', { cx: x + w - 18 * s, cy: y + 12 * s, r: 3.2 * s, class: 'led' }, c);
    [0, 1, 2].forEach(i => {
      const ex = clamp(x + w + (150 + i * 110) * s, r.x + 18, r.x + r.w - 18);
      air(`M${x + w + 3} ${y + (22 + i * 9) * s} C${x + w + 110 * s} ${y + (26 + i * 12) * s} ${ex} ${y + 110 * s} ${ex} ${r.floor - 28 - (2 - i) * 40 * s}`, 'sup', 3.4 + i * 0.7);
    });
    [0.25, 0.5].forEach(q => air(`M${x + w * q - 30} ${y + h + 110 * s} Q${x + w * q} ${y + h + 50 * s} ${x + w * q + 12} ${y + h + 2}`, 'ret', 3));
    u.dr = { x: x + w - 4, y: y + h - 6 * s };
  } else if (t === 'console') {
    w = 190 * s; h = 130 * s; x = r.x + 110; y = r.floor - 6 - h;
    u.port = { x, y: y + h * 0.5 };
    coil(gi, x, u.port.y, x + w - 14 * s, [y + h - 22 * s, y + h * 0.7, y + h * 0.36, y + 20 * s]);
    const c = cas(); R(x, y, w, h, Object.assign({ rx: 10 * s }, body), c);
    R(x + 14 * s, y + 8 * s, w - 28 * s, 7 * s, { rx: 3, fill: '#56606a' }, c);
    for (let i = 0; i < 4; i++) R(x + 18 * s, y + h - (16 + i * 8) * s, w - 36 * s, 3 * s, { fill: '#c5cbd0' }, c);
    el('circle', { cx: x + w - 20 * s, cy: y + 30 * s, r: 3.2 * s, class: 'led' }, c);
    [0, 1, 2, 3].forEach(i => {
      const sx = x + (30 + i * 43) * s, ex = clamp(x + w * 0.5 + (i - 0.6) * 150 * s, r.x + 18, r.x + r.w - 18);
      air(`M${sx} ${y - 2} C${sx} ${y - 130 * s} ${ex} ${y - 190 * s} ${ex} ${y - 80 * s + i * 22 * s}`, 'sup', 3.4 + (i % 2));
    });
    [0, 1].forEach(i => air(`M${x + w + (110 + i * 60) * s} ${r.floor - 22 - i * 16} Q${x + w + 40 * s} ${r.floor - 20} ${x + w - 4} ${y + h - (14 + i * 10) * s}`, 'ret', 3));
    u.dr = { x: x + w - 4, y: y + h - 14 * s };
  } else {
    w = 150 * s; h = 50 * s; x = r.x + 30; y = r.ceil - h - 4;
    u.port = { x, y: y + h / 2 }; u.inPlenum = true;
    coil(gi, x, u.port.y, x + w - 12 * s, [y + h - 7 * s, y + h - 15 * s, y + 15 * s, y + 7 * s]);
    const c = cas(); R(x, y, w, h, Object.assign({ rx: 3 }, body, { fill: '#dfe3e6' }), c);
    el('text', { x: x + w / 2, y: y + h / 2 + 5, 'text-anchor': 'middle', 'font-size': 12 * s, fill: '#6a747c', 'font-weight': 600, text: 'GAINABLE' }, c);
    // reprise
    const gr = el('g', { 'data-info': 'reprise' }, layers.units);
    R(x + 10 * s, r.ceil - 5, 70 * s, 10, { fill: '#fff', stroke: '#8d969e' }, gr);
    for (let i = 1; i < 9; i++) el('line', { x1: x + (10 + i * 7.6) * s, y1: r.ceil - 4, x2: x + (10 + i * 7.6) * s, y2: r.ceil + 4, stroke: '#8d969e' }, gr);
    [20, 45, 70].forEach((o, i) => air(`M${x + (o + (i - 1) * 40) * s} ${r.ceil + 120 * s} Q${x + o * s} ${r.ceil + 50 * s} ${x + o * s} ${r.ceil + 8}`, 'ret', 3));
    hs('reprise', x + 45 * s, r.ceil, r.x + 16, r.ceil + 134 * s);
    // plénum et gaines
    const served = L.gm ? rooms : [r], bx = x + w, gd = layers.units;
    const pl = el('g', { 'data-info': 'plenum' }, gd);
    const pTop = r.ceil - 9 - (served.length - 1) * 15 - 8;
    R(bx, pTop, 24 * s, r.ceil - 1 - pTop, { fill: '#c3c9ce', stroke: '#8d969e' }, pl);
    hs('plenum', bx + 12 * s, pTop + 4, bx + 10, pTop - 34);
    served.forEach((zr, zi) => {
      const by = r.ceil - 9 - zi * 15, open = !(L.gm && S.zoning) || S.zones[zi];
      const xd = zr === r ? r.x + Math.min(r.w - 54, 270) : zr.x + zr.w / 2;
      const d = P([[bx + 24 * s, by], [xd, by], [xd, r.ceil - 2]]);
      const gg = el('g', { 'data-info': 'gaine' }, gd);
      el('path', { d, fill: 'none', stroke: '#8d969e', 'stroke-width': 13 * (s < 1 ? 0.9 : 1), 'stroke-linejoin': 'round' }, gg);
      el('path', { d, fill: 'none', stroke: open ? '#d5dadf' : '#b8bcbf', 'stroke-width': 10.5 * (s < 1 ? 0.9 : 1), 'stroke-linejoin': 'round' }, gg);
      el('path', { d, fill: 'none', stroke: '#9aa3ab', 'stroke-width': 10.5 * (s < 1 ? 0.9 : 1), 'stroke-dasharray': '1.5 7' }, gg);
      if (open) el('path', { d, class: 'air sup', 'stroke-width': 3, style: 'opacity:.9' }, gd);
      if (zi === served.length - 1) hs('gaine', (bx + xd) / 2 + 40, by, (bx + xd) / 2, r.ceil + 190 * s);
      if (L.gm && S.zoning) {
        const rg = el('g', { 'data-info': 'registre' }, gd), rx = bx + 24 * s + 16;
        el('circle', { cx: rx, cy: by, r: 7.5, fill: '#fff', stroke: '#39434c', 'stroke-width': 1.5 }, rg);
        el('line', { x1: rx - 6, y1: by, x2: rx + 6, y2: by, stroke: open ? '#1f8a4d' : '#c43c2c', 'stroke-width': 3, 'stroke-linecap': 'round', transform: open ? '' : `rotate(90 ${rx} ${by})` }, rg);
        if (zi === 0) hs('registre', rx, by, r.x + 196, r.ceil + 92);
      }
      // bouche
      const bg = el('g', { 'data-info': 'bouche', opacity: open ? 1 : 0.55 }, gd), c0 = zr.ceil;
      if (S.diff === 'rond') {
        el('polygon', { points: `${xd - 13 * s},${c0 - 3} ${xd + 13 * s},${c0 - 3} ${xd + 30 * s},${c0 + 9 * s} ${xd - 30 * s},${c0 + 9 * s}`, fill: '#fff', stroke: '#8d969e' }, bg);
        el('line', { x1: xd - 20 * s, y1: c0 + 4 * s, x2: xd + 20 * s, y2: c0 + 4 * s, stroke: '#8d969e' }, bg);
        if (open) [-1, 1].forEach(sd => [0, 1].forEach(i => {
          const ex = clamp(xd + sd * (110 + i * 60) * s, zr.x + 16, zr.x + zr.w - 16);
          air(`M${xd + sd * 26 * s} ${c0 + 12 * s} C${xd + sd * 90 * s} ${c0 + 14 * s} ${ex} ${c0 + 60 * s} ${ex} ${zr.floor - 40 - i * 60 * s}`, 'sup', 3.4 + i);
        }));
      } else {
        R(xd - 44 * s, c0 - 3, 88 * s, 9 * s, { fill: '#fff', stroke: '#8d969e' }, bg);
        for (let i = 1; i < 11; i++) el('line', { x1: xd + (-44 + i * 8) * s, y1: c0 - 2, x2: xd + (-44 + i * 8 + (i < 6 ? -3 : 3)) * s, y2: c0 + 5 * s, stroke: '#8d969e' }, bg);
        if (open) [-1, 0, 1].forEach(sd => {
          const ex = clamp(xd + sd * 95 * s, zr.x + 16, zr.x + zr.w - 16);
          air(`M${xd + sd * 30 * s} ${c0 + 10 * s} C${xd + sd * 34 * s} ${c0 + 120 * s} ${ex} ${c0 + 160 * s} ${ex} ${zr.floor - 40}`, 'sup', 4);
        });
      }
      if (zi === served.length - 1) hs('bouche', xd, c0 + 4, xd - 150, c0 + 62 * s);
    });
  }
  Object.assign(u, { x, y, w, h });
  R(x + (t === 'gainable' || t === 'cassette' ? 0 : 0), y, w, h, { fill: 'none', stroke: '#6f7981', 'stroke-width': 1.2, rx: t === 'mural' ? 14 * s : t === 'console' ? 10 * s : 4, 'pointer-events': 'none' }, g);
  // filtre encrassé
  R(x + 10 * s, t === 'console' ? y + h - 40 * s : y + 2, w - 20 * s, 9 * s, { class: 'fonly f-filtre', fill: '#7a5a3c', opacity: 0.85, rx: 2 }, layers.over);
  if (k === 0) {
    hs('uint', x + w / 2, y + h / 2, t === 'gainable' ? r.x + 60 : x + w * 0.7, u.inPlenum ? r.ceil + 50 * s : y + h + 70 * s, false, Math.max(w, h) * 0.62);
    // manque de fluide : givre sur l'échangeur
    const fr = el('g', { class: 'fonly f-fluide' }, layers.over);
    for (let i = 0; i < 9; i++) el('circle', { cx: x + 14 + (i % 5) * 9, cy: u.port.y + 4 + ((i * 7) % 16) - 4, r: 5 + (i % 3), fill: '#fff', opacity: 0.85 }, fr);
  }
}

/* ---------- Groupe extérieur ---------- */
function drawOutdoor() {
  const vrf = L.vrf, so = S.sys === 'mono' ? 1.15 : S.sys === 'multi' ? 1.25 : 1.3;
  const sup = vrf ? 'sol' : S.support, W = 260 * so, H = 176 * so;
  const bottom = sup === 'mural' ? 650 : 780, ox = MX - W, oy = bottom - H;
  const gs = layers.out;
  // support
  const sg = el('g', { 'data-info': 'support' }, gs);
  if (sup === 'mural') {
    R(ox + 8, bottom + 9, BX - ox - 8, 9, { fill: '#7b858e' }, sg);
    el('path', { d: `M${BX} ${bottom + 84} L${ox + W * 0.42} ${bottom + 16}`, stroke: '#7b858e', 'stroke-width': 8, 'stroke-linecap': 'round' }, sg);
    R(BX - 8, bottom + 2, 8, 92, { fill: '#5f6972' }, sg);
    [0, 1].forEach(i => R(ox + 24 + i * (W - 90), bottom, 42, 9, { fill: '#22282d', rx: 2 }, sg));
    hs('support', ox + W * 0.6, bottom + 14, ox + W - 110, bottom + 104);
  } else {
    el('ellipse', { cx: ox + W / 2, cy: 802, rx: W / 2 + 26, ry: 8, fill: 'rgba(40,50,30,.25)' }, sg);
    R(ox - 16, 800, W + 32, 12, { fill: '#b4b0a7', stroke: '#8f8a80' }, sg);
    [0, 1].forEach(i => R(ox + 18 + i * (W - 106), bottom, 70, 20, { fill: '#22282d', rx: 4 }, sg));
    hs('support', ox + W - 60, bottom + 10, ox + W - 160, 880);
  }
  const g = el('g', { transform: `translate(${ox} ${oy}) scale(${so})` }, gs);
  R(0, 0, 260, 176, { rx: 8, fill: '#e3e7ea' }, g);
  const lg = el('linearGradient', { id: 'goc', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 26, x2: 0, y2: 152 }, layers.defs);
  el('stop', { offset: 0, class: 'st-ot' }, lg); el('stop', { offset: 1, class: 'st-ob' }, lg);
  // circuit interne
  const ex = el('g', { 'data-info': 'echext' }, g), cp = [[118, 26]];
  for (let i = 0; i < 8; i++) { const yy = 26 + i * 18; cp.push(i % 2 ? [118, yy] : [16, yy]); if (i < 7) cp.push(i % 2 ? [118, yy + 18] : [16, yy + 18]); }
  for (let i = 0; i < 26; i++) el('line', { x1: 14 + i * 4.2, y1: 18, x2: 14 + i * 4.2, y2: 160, stroke: '#aab3ba', 'stroke-width': 0.8 }, ex);
  tube(ex, P(cp), '', 'd-c', 5, { stroke: 'url(#goc)' });
  tube(g, P([[163, 54], [163, 66], [134, 66], [134, 26], [118, 26]]), 'k-cl', 'd-c', 5);
  tube(g, P([[118, 152], [118, 164], [143, 164]]), 'k-la', 'd-c', 4);
  tube(g, P([[157, 164], [262, 164]]), 'k-lb', 'd-c', 4);
  tube(g, P([[203, 54], [203, 74], [246, 74], [246, 138], [262, 138]]), 'k-gas', 'd-h', 5);
  tube(g, P([[206, 120], [228, 120], [228, 20], [183, 20], [183, 38]]), 'k-dis', 'd-a', 5);
  tube(g, P([[183, 54], [183, 96]]), 'k-suc', 'd-a', 5);
  const cg = el('g', { 'data-info': 'compresseur', class: 'comp' }, g);
  R(160, 94, 46, 66, { rx: 13, fill: 'url(#gComp)', stroke: '#1d2831', 'stroke-width': 1.5 }, cg);
  R(160, 112, 46, 7, { fill: '#55646f' }, cg); R(166, 160, 34, 6, { fill: '#1d2831' }, cg);
  const vg = el('g', { 'data-info': 'v4v' }, g);
  R(151, 38, 64, 16, { rx: 6, fill: 'url(#gBrass)', stroke: '#7c5a1c', 'stroke-width': 1.2 }, vg);
  R(180, 44, 26, 7, { rx: 3.5, fill: '#fff3d6', stroke: '#7c5a1c', 'stroke-width': 1, class: 'slider' }, vg);
  const dg = el('g', { 'data-info': 'detendeur' }, g);
  el('polygon', { points: '142,155 158,173 158,155 142,173', fill: 'url(#gBrass)', stroke: '#7c5a1c', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, dg);
  // givre
  const fr = el('g', { class: 'frost' }, g);
  R(10, 14, 114, 150, { rx: 6, fill: '#fff', opacity: 0.78 }, fr);
  for (let i = 0; i < 22; i++) el('circle', { cx: 16 + (i * 37) % 104, cy: 22 + (i * 53) % 136, r: 4 + (i % 4), fill: '#eaf6ff' }, fr);
  // carrosserie
  const cs = el('g', { class: 'casing', 'data-info': 'groupe', filter: 'url(#sh)' }, g);
  if (vrf) {
    R(0, -44, 260, 220, { rx: 6, fill: 'url(#gMetal)', stroke: '#8d969e', 'stroke-width': 1.3 }, cs);
    for (let i = 0; i < 15; i++) R(12, 16 + i * 10, 112, 4, { fill: '#c9cfd3' }, cs);
    R(138, 14, 108, 150, { rx: 3, fill: '#e3e6e4', stroke: '#b2b9be' }, cs);
    R(20, -36, 220, 26, { rx: 4, fill: '#39434c' }, cs);
  } else {
    R(0, 0, 260, 176, { rx: 8, fill: 'url(#gMetal)', stroke: '#8d969e', 'stroke-width': 1.3 }, cs);
    el('line', { x1: 134, y1: 0, x2: 134, y2: 176, stroke: '#c4cacf' }, cs);
    R(150, 20, 60, 14, { rx: 2, fill: '#d9dedf' }, cs);
    for (let i = 0; i < 5; i++) R(150, 120 + i * 8, 92, 3, { fill: '#cdd3d6' }, cs);
    el('circle', { cx: 67, cy: 89, r: 58, fill: '#c9cfd2' }, cs); el('circle', { cx: 67, cy: 89, r: 55, fill: 'url(#gFan)' }, cs);
    [[8, 8], [252, 8], [8, 168], [252, 168]].forEach(([a, b]) => el('circle', { cx: a, cy: b, r: 2.2, fill: '#9aa3ab' }, cs));
  }
  const fg = el('g', { class: 'fanb', 'data-info': 'ventilo' }, g);
  if (vrf) {
    const tf = el('g', { class: 'topfan' }, fg);
    el('ellipse', { cx: 130, cy: -23, rx: 100, ry: 9, fill: '#aeb7bd' }, tf);
    el('ellipse', { cx: 130, cy: -23, rx: 14, ry: 6, fill: '#1d2831' }, fg);
    hs('ventilo', ox + 130 * so, oy - 23 * so, ox - 40, oy - 96);
  } else {
    const bl = el('g', { class: 'blades' }, fg);
    el('circle', { cx: 67, cy: 89, r: 52, fill: 'none' }, bl);
    for (let i = 0; i < 4; i++) el('path', { d: 'M67 89 C80 70 104 62 114 78 C104 86 88 92 67 89Z', fill: '#c5ccd1', transform: `rotate(${i * 90} 67 89)` }, bl);
    el('circle', { cx: 67, cy: 89, r: 9, fill: '#1d2831' }, fg);
    const gr = el('g', { class: 'casing', 'pointer-events': 'none' }, g);
    [12, 22, 32, 42, 52].forEach(r => el('circle', { cx: 67, cy: 89, r, fill: 'none', stroke: '#f2f4f2', 'stroke-width': 1.4 }, gr));
    [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].forEach(a => el('line', { x1: 67 - 54, y1: 89, x2: 67 + 54, y2: 89, stroke: '#f2f4f2', 'stroke-width': 1.2, transform: `rotate(${a} 67 89)` }, gr));
    hs('ventilo', ox + 67 * so, oy + 60 * so, ox - 40, oy - 30);
  }
  R(0, vrf ? -44 : 0, 260, vrf ? 220 : 176, { rx: 8, fill: 'none', stroke: '#59636c', 'stroke-width': 1.6, 'pointer-events': 'none' }, g);
  g.appendChild(fr);
  // vapeur et gouttes de dégivrage
  [50, 90, 130].forEach((xx, i) => el('path', { d: `M${xx} ${vrf ? -50 : -4} q-10 -22 0 -44 q10 -22 0 -44`, class: 'steam', style: `animation-delay:-${i * 0.4}s` }, g));
  [30, 70, 110].forEach((xx, i) => el('circle', { cx: xx, cy: 178, r: 3.5, fill: '#2f8fe6', class: 'mdrip', style: `animation-delay:-${i * 0.3}s` }, g));
  // air extérieur
  const top = oy - (vrf ? 44 * so : 0);
  if (vrf) [-60, -20, 20, 60].forEach((o, i) => air(`M${ox + (130 + o) * so} ${top - 4} C${ox + (130 + o) * so} ${top - 70} ${ox + (130 + o * 1.8) * so} ${top - 110} ${ox + (130 + o * 2.2) * so} ${top - 170}`, 'oair', 4 + (i % 2)));
  else [-34, -12, 12, 34].forEach((o, i) => air(`M${ox + 30 * so} ${oy + (89 + o) * so} C${ox - 40} ${oy + (89 + o) * so} ${ox - 80} ${oy + (60 + o * 1.6) * so} ${Math.max(6, ox - 150)} ${oy + (20 + o * 2.4) * so}`, 'oair', 4 + (i % 2)));
  el('text', { x: clamp(ox + W / 2, 150, 300), y: top - (vrf ? 196 : 104), class: 'anno', id: 'annoOut' }, layers.anno);
  // panne : cache-clim trop fermé
  const ob = el('g', { class: 'fonly f-obstrue' }, layers.over);
  R(ox - 14, oy - 10, W * 0.62, H + 20, { fill: '#9b7650', opacity: 0.93, rx: 3 }, ob);
  for (let i = 0; i < 9; i++) R(ox - 14, oy - 4 + i * (H + 14) / 9, W * 0.62, 3, { fill: '#6e5236' }, ob);
  el('path', { d: `M${ox + 30} ${oy + 30} C${ox - 70} ${oy - 20} ${ox - 20} ${oy - 90} ${ox + 90} ${oy - 60} C${ox + 150} ${oy - 44} ${ox + 150} ${oy - 20} ${ox + 110} ${oy - 4}`, class: 'recirc' }, ob);
  el('text', { x: ox + W * 0.3, y: oy + H / 2, 'text-anchor': 'middle', 'font-size': 40, 'font-weight': 700, fill: '#fff', class: 'warn', text: '!' }, ob);
  // repères
  const r1 = sup === 'mural' ? bottom + 62 : 842, r2 = sup === 'mural' ? bottom + 104 : 880;
  hs('groupe', ox + W * 0.5, oy + 6, ox + 96, vrf ? oy - 140 : oy - 66, false, W * 0.62);
  hot.groupe.y = oy + H / 2;
  hs('v4v', ox + 183 * so, oy + 46 * so, ox + 150 * so, vrf ? oy - 96 : oy - 30, true, 60);
  hs('echext', ox + 40 * so, oy + 150 * so, ox - 110, r1, true, 84);
  hot.echext.x = ox + 67 * so; hot.echext.y = oy + 89 * so;
  hs('compresseur', ox + 183 * so, oy + 126 * so, ox + W - 130, r1, true, 60);
  hs('detendeur', ox + 150 * so, oy + 164 * so, ox + 20, r2, true, 46);
  return { ox, oy, so, W, H, bottom };
}

/* ---------- Liaisons, électricité, condensats ---------- */
function refnet(x, y) {
  const g = el('g', { 'data-info': 'refnet' }, layers.over);
  R(x - 12, y - 5, 17, 18, { rx: 5, fill: 'url(#gBrass)', stroke: '#7c5a1c', 'stroke-width': 1.3 }, g);
  el('path', { d: `M${x - 8} ${y + 9} L${x - 3.5} ${y + 1} L${x + 1} ${y + 9}`, fill: 'none', stroke: '#7c5a1c', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, g);
}
function drawLinks(o) {
  const n = units.length, shared = L.vrf, pitch = 18;
  const maxO = (shared ? 0 : (n - 1) * pitch) + 13;
  const ey0 = o.oy + 164 * o.so - maxO - 2, gp = layers.pipes, gg = layers.gou;
  // bloc vannes de service
  const bt = Math.min(ey0 - 7, o.oy + 130 * o.so);
  R(MX - 3, bt, 13, o.oy + 171 * o.so - bt, { rx: 2, fill: 'url(#gBrass)', stroke: '#7c5a1c' }, layers.out);
  // goulotte extérieure
  const pyTop = L.fl[0].top + 6;
  const go = el('g', { 'data-info': 'goulotte' }, gg);
  R(RX0 - 8, pyTop - 5, maxO + 16, ey0 + maxO + 9 - pyTop + 5, { class: 'gou', rx: 3 }, go);
  R(MX + 10, ey0 - 8, RX0 - MX - 10 + maxO + 8, maxO + 17, { class: 'gou', rx: 3 }, go);
  hs('goulotte', RX0 + maxO / 2, pyTop + 40, RX0 + 40, pyTop - 60);
  units.forEach((u, k) => {
    const r = u.room, off = shared ? 0 : (n - 1 - k) * pitch, py = r.y + 6;
    const mk = (d, a) => { const oo = off + d; return P([[MX + 8, ey0 + oo], [RX0 + oo, ey0 + oo], [RX0 + oo, py + oo], [u.port.x - 16 - a, py + oo], [u.port.x - 16 - a, u.port.y + a], [u.port.x, u.port.y + a]]); };
    const lg = el('g', { 'data-info': 'liaison' }, gp);
    const dg = mk(0, 0), dl = mk(7, 7), dc = mk(13, 13);
    el('path', { d: mk(4, 4), fill: 'none', stroke: 'transparent', 'stroke-width': 22, 'pointer-events': 'stroke' }, lg); // zone cliquable élargie
    tube(lg, dg, 'k-gas', 'd-h', 5); tube(lg, dl, 'k-lb', 'd-c', 3.4);
    insul(dg, 5); insul(dl, 3.4);
    const cg = el('g', { 'data-info': 'interco' }, gp);
    el('path', { d: dc, class: 'cable' }, cg); el('path', { d: dc, class: 'pulse' }, cg);
    // goulotte intérieure
    if (!u.inPlenum) {
      const gi = el('g', { 'data-info': 'goulotte' }, gg), gx = u.port.x - 44;
      R(gx, r.ceil + 1, 34, u.port.y + 24 - r.ceil, { class: 'gou', rx: 2 }, gi);
      R(gx, u.port.y - 8, 44, 32, { class: 'gou', rx: 2 }, gi);
    }
    // refnets : un par unité sauf la dernière de chaque niveau
    if (shared && r.c < L.cols - 1) { refnet(u.port.x - 16, py); if (k === 1) hs('refnet', u.port.x - 16, py + 3, u.port.x + 30, r.ceil + 40); }
    if (k === n - 1 || (shared && k === 2)) hs('liaison', (RX0 + u.port.x) / 2 + (shared ? 200 : 60), py + off + 3, (RX0 + u.port.x) / 2 + 40, L.vrf ? r.ceil + 34 : r.y - 40);
    if (k === 0) hs('interco', u.port.x - 29, (py + off + u.port.y) / 2 + 8, u.port.x + (u.inPlenum ? 30 : -150), u.inPlenum ? r.ceil + 176 * L.s : r.ceil + 150);
    drawDrain(u, k, py + off + 17);
  });
  if (shared) rooms.filter(r => r.c === 0 && r.f > 0).forEach(r => refnet(RX0, r.y + 6));
  // perçage du mur
  R(BX, pyTop - 4, 22, maxO + 10, { fill: 'none', stroke: '#8d8475', 'stroke-dasharray': '3 3', class: 'xhide' }, gg);
  // tableau électrique et alimentation
  const pr = rooms.find(r => r.floor === G && r.c === 0), px = pr.x + 14, pyy = pr.floor - 212, yc = o.oy + 176 * o.so - 5;
  const ag = el('g', { 'data-info': 'alim' }, layers.pipes), da = P([[px + 4, pyy + 60], [531, pyy + 60], [531, yc], [MX + 6, yc]]);
  el('path', { d: da, class: 'cable alim' }, ag); el('path', { d: da, class: 'pulse', style: 'stroke-width:2.6' }, ag);
  hs('alim', 500, yc, o.bottom < 700 ? 380 : 440, o.bottom < 700 ? o.bottom + 146 : 880);
  const tg = el('g', {}, layers.units);
  R(px, pyy, 50, 90, { rx: 3, fill: '#fff', stroke: '#6a747c', 'stroke-width': 1.4 }, tg);
  R(px + 5, pyy + 6, 40, 4, { fill: '#c9d0d5' }, tg);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) R(px + 6 + i * 10, pyy + 18 + j * 34, 8, 24, { rx: 1, fill: '#e3e7ea', stroke: '#9aa3ab', 'stroke-width': 0.8 }, tg);
  const bg = el('g', { 'data-info': 'disj', id: 'breaker' }, tg);
  R(px + 5, pyy + 51, 10, 26, { rx: 1.5, fill: '#1c6fd1', stroke: '#124a8e' }, bg);
  R(px + 7, pyy + 55, 6, 8, { rx: 1, fill: '#fff', class: 'lever' }, bg);
  hs('disj', px + 10, pyy + 64, px + 70, pyy + 150, false, 48);
}
function drawDrain(u, k, yq) {
  const g = el('g', { 'data-info': 'condensats' }, layers.pipes), r = u.room;
  // cassette : pompe intégrée d'origine ; gainable : pompe seulement si on la choisit
  const pump = u.type === 'cassette' || S.drain !== 'gravite';
  if (!pump && u.inPlenum) {
    // gainable en gravitaire : évacuation en pente dans le faux plafond puis descente le long du mur
    const by = Math.min(u.port.y + 16, u.y + u.h - 3), vx = u.port.x - 35;
    const d = P([[u.port.x + 6, by], [vx, by + 3], [vx, yq], [515, yq + 8], [515, G - 50]]);
    el('path', { d, class: 'drain', style: 'stroke-width:2.6' }, g); el('path', { d, class: 'drops' }, g);
    el('circle', { cx: 515, cy: G - 46, r: 2.6, fill: '#2f8fe6', class: 'drip' }, g);
    if (k === 0) hs('condensats', 515, G - 90, 548, G - 88, false, 50);
  } else if (!pump) {
    const d = P([[u.dr.x, u.dr.y], [u.dr.x + 46, u.dr.y + 8]]);
    el('path', { d, class: 'drain' }, g); el('path', { d, class: 'drops' }, g);
    R(u.dr.x + 44, u.dr.y + 2, 9, 34, { rx: 2, fill: '#aeb8c0', stroke: '#7d8891' }, g);
    el('circle', { cx: u.dr.x + 48.5, cy: u.dr.y + 38, r: 2.6, fill: '#2f8fe6', class: 'drip' }, g);
    if (k === 0) hs('condensats', u.dr.x + 30, u.dr.y + 6, u.dr.x + 10, u.dr.y + 92, false, 50);
  } else {
    const by = Math.min(u.port.y + 16, u.y + u.h - 3), vx = u.port.x - 35;
    const d = P([[u.port.x + 6, by], [vx, by], [vx, yq], [515, yq], [515, G - 50]]);
    el('path', { d, class: 'drain', style: 'stroke-width:2.6' }, g); el('path', { d, class: 'drops' }, g);
    el('circle', { cx: 515, cy: G - 46, r: 2.6, fill: '#2f8fe6', class: 'drip' }, g);
    const inG = !u.inPlenum && S.drain === 'goulotte';
    const pg = el('g', { 'data-info': 'pompe' }, inG ? layers.over : layers.units), bx = inG ? vx - 9 : u.port.x + 8, byy = inG ? by - 26 : by - 9;
    R(bx, byy, inG ? 18 : 24, inG ? 14 : 11, { rx: 2, fill: '#2a86c9', stroke: '#16517d' }, pg);
    el('circle', { cx: bx + 5, cy: byy + 5.5, r: 2, fill: '#fff', class: S.mode === 'cool' ? 'warn' : '' }, pg);
    if (k === 0) { hs('pompe', bx + 9, byy + 6, u.port.x - 20, u.inPlenum ? r.ceil + 218 * L.s : u.port.y + 96, false, 44); hs('condensats', 515, G - 90, 548, G - 88, false, 50); }
  }
  if (k === 0) {
    // panne : contre-pente
    const lk = el('g', { class: 'fonly f-pente' }, layers.over), bx = u.x + u.w * 0.3, by = u.y + u.h;
    el('path', { d: `M${bx - 8} ${by} q4 60 -2 ${Math.max(40, (r.floor - by) * 0.5)}`, stroke: '#9bb7c9', 'stroke-width': 9, fill: 'none', opacity: 0.5, 'stroke-linecap': 'round' }, lk);
    [0, 1, 2].forEach(i => el('circle', { cx: bx + i * 10 - 10, cy: by + 4, r: 3.6, fill: '#2f8fe6', class: 'leak', style: `animation-delay:-${i * 0.4}s` }, lk));
    el('ellipse', { cx: bx, cy: r.floor - 7, rx: 54, ry: 5, fill: '#2f8fe6', opacity: 0.55 }, lk);
  }
}

/* ---------- Thermostats, apports ---------- */
function drawThermos() {
  rooms.forEach((r, i) => {
    const zon = L.gm && S.zoning, open = !zon || S.zones[r.c];
    const x = L.single ? r.x + r.w - 76 : r.x + r.w - 46, y = r.ceil + (L.vrf ? 52 : 116);
    const g = el('g', { class: 'thermo' + (open ? '' : ' closed') }, layers.over);
    if (zon) g.setAttribute('data-zone', r.c); else g.setAttribute('data-info', 'thermostat');
    R(x - 26, y, 74, 30, { rx: 4 }, g);
    el('text', { x: x + 11, y: y + 21, id: 't' + i }, g);
    if (i === (L.single ? 0 : rooms.length - 1)) hs('thermostat', x + 11, y + 28, L.single ? x - 70 : x - 84, L.single ? y - 14 : y + 70, false, 50);
  });
}
function drawApports() {
  if (!L.single) return;
  const r = rooms[0], g = layers.over, a = S.apports, fy = r.floor - 6;
  const wave = (x, y) => [-12, 0, 12].forEach((o, i) => el('path', { d: `M${x + o} ${y} q-7 -16 0 -32 q7 -16 0 -32`, class: 'heatwave', style: `animation-delay:-${i * 0.3}s` }, g));
  if (a.pers) [0, 1].forEach(i => { const x = r.x + 300 + i * 44; el('circle', { cx: x, cy: fy - 122, r: 13, fill: '#d9a57c' }, g); R(x - 15, fy - 108, 30, 62, { rx: 12, fill: i ? '#3f6f8f' : '#b5553c' }, g); R(x - 12, fy - 50, 10, 50, { fill: '#39434c' }, g); R(x + 2, fy - 50, 10, 50, { fill: '#39434c' }, g); if (!i) wave(x + 22, fy - 140); });
  if (a.four) { const x = r.x + 16; R(x, fy - 84, 76, 84, { rx: 3, fill: '#d9dde0', stroke: '#6a747c' }, g); R(x + 8, fy - 58, 60, 44, { rx: 3, fill: '#2a3037' }, g); R(x + 14, fy - 52, 48, 32, { fill: '#e4672c', class: 'warn' }, g); wave(x + 38, fy - 92); }
  if (a.serveur) { const x = r.x + r.w - 150; R(x, fy - 168, 58, 168, { rx: 3, fill: '#2a3037', stroke: '#11161b' }, g); for (let i = 0; i < 9; i++) { R(x + 6, fy - 160 + i * 17, 46, 11, { fill: '#3e4852' }, g); el('circle', { cx: x + 46, cy: fy - 154.5 + i * 17, r: 2, fill: '#3bd16f', class: i % 2 ? 'warn' : '' }, g); } wave(x + 29, fy - 176); }
  if (a.baie || a.veranda) { const w = r.win, k = a.veranda ? 1.5 : 1; el('polygon', { points: `${w.x},${w.y} ${w.x + w.w},${w.y} ${w.x + w.w - 60 * k},${fy} ${w.x - 220 * k},${fy}`, fill: '#f9cf45', opacity: 0.32, class: 's-only' }, g); wave(w.x - 40, fy - 10); wave(w.x + 120, fy - 10); }
}

/* ---------- Étiquettes et projecteur ---------- */
function drawLabels() {
  const g = layers.labels;
  labs.forEach(l => {
    const name = l.id === 'uint' ? 'Unité intérieure' : l.id === 'bouche' ? (S.diff === 'rond' ? 'Bouche circulaire' : 'Grille rectangulaire') : NAMES[l.id];
    const tx = l.x, ty = l.y, w = name.length * 8.3 + 18, lx = clamp(l.lx, 6, 1594 - w), ly = clamp(l.ly, 26, 886);
    const lg = el('g', { class: 'lab-g' + (l.xr ? ' lx' : ''), 'data-info': l.id }, g);
    el('line', { x1: tx, y1: ty, x2: clamp(tx, lx + 8, lx + w - 8), y2: ly + (ly < ty ? 0 : -24) }, lg);
    el('circle', { cx: tx, cy: ty, r: 4 }, lg);
    R(lx, ly - 24, w, 28, { rx: 3 }, lg);
    el('text', { x: lx + 9, y: ly - 5, text: name }, lg);
  });
  const sp = el('g', { class: 'spot' }, layers.spot);
  const m = el('mask', { id: 'spm' }, layers.defs);
  R(-3000, -3000, 9000, 9000, { fill: '#fff' }, m);
  el('circle', { id: 'spc', cx: 800, cy: 450, r: 2600, fill: '#000' }, m);
  R(-3000, -3000, 9000, 9000, { fill: 'rgba(22,30,38,.62)', mask: 'url(#spm)' }, sp);
  el('circle', { id: 'spr', class: 'ring', cx: 800, cy: 450, r: 2600 }, sp);
}
let spotCur = { x: 800, y: 450, r: 2600 }, spotAnim = 0;
function spot(id) {
  spotId = id;
  const h = id && hot[id], to = h ? { x: h.x, y: h.y, r: h.r } : { x: 800, y: 450, r: 2600 };
  svg.classList.toggle('spoton', !!h);
  const from = Object.assign({}, spotCur), t0 = performance.now();
  cancelAnimationFrame(spotAnim);
  (function step(now) {
    const t = Math.min(1, (now - t0) / 600), e = 1 - Math.pow(1 - t, 3);
    spotCur = { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), r: lerp(from.r, to.r, e) };
    ['spc', 'spr'].forEach(i => { const c = document.getElementById(i); if (c) { c.setAttribute('cx', spotCur.x); c.setAttribute('cy', spotCur.y); c.setAttribute('r', spotCur.r); } });
    if (t < 1) spotAnim = requestAnimationFrame(step);
  })(t0);
}

/* ---------- Focus gainable : plan de la maison vue de dessus ---------- */
// Échelle : 72 px = 1 m. Hauteur sous plafond 2,5 m, brassage 5 volumes/heure.
// Le gainable et les gaines sont dans les combles : vue « à travers » le plafond.
const HSP = 2.5, BRASS = 5, CAPA = { 160: 300, 200: 450 };
const PL = {
  X0: 260, X1: 1268, Y0: 110, Y1: 787, HY0: 326, HY1: 427,
  // dir : sens du soufflage (−1 vers le haut, +1 vers le bas) = vers les fenêtres, à l’opposé de la porte et de la reprise
  rooms: [
    { name: 'Salon', x: 260, y: 427, w: 504, h: 360, m2: 35, dir: 1, door: [680, 740], rep: [630, 454], th: [276, 590] },
    { name: 'Chambre 1', x: 260, y: 110, w: 288, h: 216, m2: 12, dir: -1, door: [390, 450], rep: [500, 302], th: [276, 180] },
    { name: 'Chambre 2', x: 548, y: 110, w: 288, h: 216, m2: 12, dir: -1, door: [678, 738], rep: [788, 302], th: [564, 180] },
    { name: 'Chambre 3', x: 836, y: 110, w: 432, h: 216, m2: 18, dir: -1, door: [1030, 1090], rep: [1140, 302], th: [852, 180] }
  ],
  gain: { x: 722, y: 354, w: 100, h: 44 }, plen: { x: 694, y: 344, w: 28, h: 64 }, filt: { x: 822, y: 348, w: 22, h: 56 },
  grilleCouloir: { x: 884, y: 350, w: 30, h: 52 }, ext: { x: 1196, y: 816, w: 124, h: 48 }
};
const fmtN = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const planQ = r => r.m2 * HSP * BRASS;
const zoneOpen = j => !S.zoning || S.zones[j] !== false;
// gaines du salon selon le choix : [diamètre, bouche]
function salonDucts() {
  if (S.salonD === '2x160') return [[160, [380, 462]], [160, [560, 462]]];
  return [[S.salonD === '160' ? 160 : 200, [470, 462]]];
}
function roomDucts(r, j) {
  if (j === 0) return salonDucts();
  return [[160, [r.x + 78, 290]]];
}

function planGround(g) {
  R(-3000, -2000, 7600, 5000, { class: 'grass', fill: '#8dbb62' }, g);
  R(320, PL.Y1 + 8, 380, 56, { fill: '#c9a77c', stroke: '#a88759' }, g); // terrasse
  for (let i = 1; i < 8; i++) el('line', { x1: 320 + i * 50, y1: PL.Y1 + 8, x2: 320 + i * 50, y2: PL.Y1 + 64, stroke: '#b38f63' }, g);
  R(1100, PL.Y1 + 8, 72, 110, { fill: '#cfc8bb' }, g); // allée
  [[150, 200, 60], [150, 650, 50], [1470, 620, 62], [1500, 200, 44]].forEach(([x, y, r]) => {
    el('circle', { cx: x + 6, cy: y + 8, r, fill: 'rgba(30,50,20,.18)', class: 's-only' }, g);
    el('circle', { cx: x, cy: y, r, fill: '#6fa24c', class: 's-only' }, g);
    el('circle', { cx: x - r * 0.25, cy: y - r * 0.25, r: r * 0.55, fill: '#82b55c', class: 's-only' }, g);
    const w = el('g', { class: 'w-only', stroke: '#7a5a3e', 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; el('line', { x1: x, y1: y, x2: x + Math.cos(a) * r * 0.8, y2: y + Math.sin(a) * r * 0.8 }, w); }
  });
}
function planFloors(g) {
  PL.rooms.forEach((r, i) => {
    R(r.x, r.y, r.w, r.h, { fill: '#efe3cf' }, g);
    for (let k = 1; k * 24 < r.h; k++) el('line', { x1: r.x, y1: r.y + k * 24, x2: r.x + r.w, y2: r.y + k * 24, stroke: '#e4d5bd' }, g);
    R(r.x, r.y, r.w, r.h, { class: 'tint', id: 'tint' + i, fill: 'rgba(0,0,0,0)' }, layers.tint);
    R(r.x + 4, r.y + 4, r.w - 8, r.h - 8, {}, el('clipPath', { id: 'clipR' + i }, layers.defs)); // l’air reste dans la pièce
  });
  R(PL.X0, PL.HY0, PL.X1 - PL.X0, PL.HY1 - PL.HY0, { fill: '#e6e1d8' }, g);
  R(764, 427, 216, 360, { fill: '#dfe8eb' }, g); R(980, 427, 288, 360, { fill: '#e6e1d8' }, g);
  for (let x = 764; x < 980; x += 24) el('line', { x1: x, y1: 427, x2: x, y2: 787, stroke: '#cfdade' }, g);
  for (let y = 427; y < 787; y += 24) el('line', { x1: 764, y1: y, x2: 980, y2: y, stroke: '#cfdade' }, g);
}
function planFurniture(g) {
  const f = { fill: '#ddd3c2', stroke: '#a99f8d', 'stroke-width': 1.3 };
  PL.rooms.slice(1).forEach(r => {
    const bx = r.x + r.w - 160, by = r.y + 44; // lit tête contre le mur de droite
    R(bx, by, 144, 104, Object.assign({ rx: 6 }, f), g);
    R(bx + 108, by + 8, 28, 40, { rx: 5, fill: '#f6f1e8', stroke: '#a99f8d' }, g);
    R(bx + 108, by + 56, 28, 40, { rx: 5, fill: '#f6f1e8', stroke: '#a99f8d' }, g);
    R(bx, by, 98, 104, { rx: 4, fill: '#cbbfa9', stroke: '#a99f8d' }, g);
  });
  el('path', Object.assign({ d: 'M300 640 L500 640 L500 664 L326 664 L326 740 L300 740 Z' }, f), g); // canapé d’angle
  R(372, 690, 90, 46, Object.assign({ rx: 4 }, f), g);
  R(560, 600, 140, 80, Object.assign({ rx: 6 }, f), g); // table
  [[574, 586], [640, 586], [574, 680], [640, 680]].forEach(([x, y]) => R(x, y, 40, 14, Object.assign({ rx: 4 }, f), g));
  R(540, 766, 150, 14, f, g); // meuble TV
  R(782, 680, 180, 90, { rx: 30, fill: '#f4f8fa', stroke: '#9fb2ba' }, g); // baignoire
  el('circle', { cx: 940, cy: 470, r: 18, fill: '#f4f8fa', stroke: '#9fb2ba' }, g);
}
function planWalls(g) {
  const W = '#3d4247', wall = (x1, y1, x2, y2, w) => el('line', { x1, y1, x2, y2, stroke: W, 'stroke-width': w, 'stroke-linecap': 'square' }, g);
  const gaps = (fixed, a, b, list) => { let s = a; list.concat([[b, b]]).forEach(([g0, g1]) => { if (g0 > s) wall(s, fixed, g0, fixed, 8); s = g1; }); };
  wall(548, PL.Y0, 548, PL.HY0, 8); wall(836, PL.Y0, 836, PL.HY0, 8);
  gaps(PL.HY0, PL.X0, PL.X1, PL.rooms.slice(1).map(r => r.door));
  gaps(PL.HY1, PL.X0, PL.X1, [PL.rooms[0].door, [800, 850], [1010, 1090]]);
  wall(764, PL.HY1, 764, PL.Y1, 8); wall(980, PL.HY1, 980, PL.Y1, 8);
  const door = (x0, x1, y, dir) => {
    const L = x1 - x0, dg = el('g', { 'data-info': 'porte' }, g);
    el('line', { x1: x0, y1: y, x2: x0, y2: y + dir * L, stroke: '#6c5038', 'stroke-width': 3 }, dg);
    el('path', { d: `M${x0} ${y + dir * L} A${L} ${L} 0 0 ${dir > 0 ? 0 : 1} ${x1} ${y}`, fill: 'none', stroke: '#8d8270', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }, dg);
  };
  PL.rooms.slice(1).forEach(r => door(r.door[0], r.door[1], PL.HY0, -1));
  door(PL.rooms[0].door[0], PL.rooms[0].door[1], PL.HY1, 1); door(800, 850, PL.HY1, 1);
  R(PL.X0, PL.Y0, PL.X1 - PL.X0, PL.Y1 - PL.Y0, { fill: 'none', stroke: W, 'stroke-width': 16 }, g);
  const win = (x, y, w, h) => { R(x, y, w, h, { fill: '#f7fbfd', stroke: W, 'stroke-width': 1.5 }, g); el('line', { x1: x + (w > h ? 0 : w / 2), y1: y + (w > h ? h / 2 : 0), x2: x + (w > h ? w : w / 2), y2: y + (w > h ? h / 2 : h), stroke: '#7db5d6', 'stroke-width': 2 }, g); };
  [[300, 130], [588, 130], [900, 200]].forEach(([x, w]) => win(x, PL.Y0 - 8, w, 16));
  win(PL.X1 - 8, 150, 16, 120);
  [[300, 150], [520, 150]].forEach(([x, w]) => win(x, PL.Y1 - 8, w, 16));
  win(PL.X0 - 8, 520, 16, 150); win(830, PL.Y1 - 8, 70, 16);
  // porte d’entrée
  R(1100, PL.Y1 - 9, 72, 18, { fill: '#e6e1d8' }, g);
  el('line', { x1: 1100, y1: PL.Y1, x2: 1100, y2: PL.Y1 - 72, stroke: '#6c5038', 'stroke-width': 3 }, g);
  el('path', { d: `M1100 ${PL.Y1 - 72} A72 72 0 0 1 1172 ${PL.Y1}`, fill: 'none', stroke: '#8d8270', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }, g);
  [['Couloir', 380, 384], ['Salle de bain', 872, 560], ['Entrée', 1124, 600]].forEach(([t, x, y]) => el('text', { x, y, 'text-anchor': 'middle', class: 'pname small', text: t }, g));
}
function duct(d, w, kind, open, info, warn) {
  const gg = el('g', { 'data-info': info }, layers.units);
  const dark = warn ? '#c43c2c' : kind === 'rep' ? '#9c8f78' : '#8d969e', fill = kind === 'rep' ? '#d9ccb4' : open ? '#d5dadf' : '#b8bcbf';
  el('path', { d, fill: 'none', stroke: dark, 'stroke-width': w + 3, 'stroke-linecap': 'round' }, gg);
  el('path', { d, fill: 'none', stroke: fill, 'stroke-width': w, 'stroke-linecap': 'round' }, gg);
  const rings = el('path', { d, fill: 'none', stroke: kind === 'rep' ? '#c7b9a0' : '#c1c7cc', 'stroke-width': w - 3, 'stroke-dasharray': '1.2 9' }, gg);
  return rings;
}
function planBouche(x, y, dir, open, g) {
  const bg = el('g', { 'data-info': 'bouche', opacity: open ? 1 : 0.55 }, g);
  if (S.diff === 'rond') {
    el('circle', { cx: x, cy: y, r: 17, fill: '#fff', stroke: '#6f7981', 'stroke-width': 1.5 }, bg);
    el('circle', { cx: x, cy: y, r: 11, fill: 'none', stroke: '#9aa3ab' }, bg);
    el('circle', { cx: x, cy: y, r: 5, fill: '#dfe3e6', stroke: '#9aa3ab' }, bg);
  } else {
    R(x - 30, y - 9, 60, 18, { fill: '#fff', stroke: '#6f7981', 'stroke-width': 1.5 }, bg);
    for (let i = 1; i < 10; i++) el('line', { x1: x - 30 + i * 6, y1: y - 7, x2: x - 30 + i * 6, y2: y + 7, stroke: '#9aa3ab' }, bg);
  }
  if (!open) return;
  if (S.diff === 'rond') {
    // diffusion en éventail, côté fenêtre
    for (let k = 0; k < 6; k++) {
      const a = (dir < 0 ? -Math.PI : 0) + (k + 0.5) * Math.PI / 6, b = a + 0.3 * (k % 2 ? 1 : -1), r2 = 120 + (k % 3) * 24;
      air(`M${x + Math.cos(a) * 22} ${y + Math.sin(a) * 22} Q${x + Math.cos(a) * r2 * 0.6} ${y + Math.sin(a) * r2 * 0.6} ${x + Math.cos(b) * r2} ${y + Math.sin(b) * r2}`, 'sup', 3);
    }
  } else {
    // jet dirigé vers la fenêtre
    [-2, -1, 0, 1, 2].forEach(i => air(`M${x + i * 10} ${y + dir * 12} C${x + i * 13} ${y + dir * 80} ${x + i * 28} ${y + dir * 140} ${x + i * 40} ${y + dir * 200}`, 'sup', 3.4));
  }
}
// trajet d’une gaine souple, du plénum à la bouche
function planRoute(j, k, b) {
  const P0 = PL.plen, [x, y] = b;
  if (j === 3) { const sx = P0.x + 20; return `M${sx} ${P0.y} C${sx} ${P0.y - 40} ${x - 120} ${y + 6} ${x} ${y}`; } // chambre 3 : passe au-dessus du gainable
  if (j === 2) { const sx = P0.x + 8; return `M${sx} ${P0.y} C${sx} ${P0.y - 30} ${x} ${y + 40} ${x} ${y}`; }
  if (j === 1) { const sy = P0.y + 8; return `M${P0.x} ${sy} C${P0.x - 120} ${sy} ${x} ${y + 50} ${x} ${y}`; }
  const sy = P0.y + 34 + k * 20; return `M${P0.x} ${sy} C${P0.x - 90} ${sy} ${x} ${y - 70} ${x} ${y}`;
}
function planNetwork() {
  const gd = layers.units, P0 = PL.plen, G0 = PL.gain, F0 = PL.filt, reprCouloir = S.reprise !== 'pieces';
  const back = [F0.x + F0.w, F0.y + F0.h / 2];
  // ---- liaisons frigo et groupe extérieur (sur le côté du gainable)
  const E = PL.ext, lx = G0.x + 60, ly = G0.y + G0.h;
  const lg = el('g', { 'data-info': 'liaison' }, gd);
  [[0, 5, 'k-gas', 'd-h'], [9, 3.6, 'k-lb', 'd-c']].forEach(([o, w, k, dd]) => tube(lg, P([[lx + o, ly], [lx + o, ly + 18 + o], [E.x + 40 + o, ly + 18 + o], [E.x + 40 + o, E.y]]), k, dd, w));
  const cg = el('g', { 'data-info': 'interco' }, gd);
  el('path', { d: P([[lx + 18, ly], [lx + 18, ly + 36], [E.x + 62, ly + 36], [E.x + 62, E.y]]), class: 'cable' }, cg);
  hs('liaison', E.x + 44, 640, 1110, 700);
  const og = el('g', { 'data-info': 'groupe' }, gd);
  R(E.x, E.y, E.w, E.h, { rx: 4, fill: 'url(#gMetal)', stroke: '#6f7981', 'stroke-width': 1.5 }, og);
  for (let i = 1; i < 12; i++) el('line', { x1: E.x + i * 10, y1: E.y + 6, x2: E.x + i * 10, y2: E.y + E.h - 6, stroke: '#c4cacf' }, og);
  R(E.x + 8, E.y - 6, E.w - 16, 6, { fill: '#8f8a80' }, og);
  [-30, 0, 30].forEach((o, i) => air(`M${E.x + E.w / 2 + o} ${E.y + E.h + 8} C${E.x + E.w / 2 + o} ${E.y + E.h + 30} ${E.x + E.w / 2 + o * 1.6} ${E.y + E.h + 44} ${E.x + E.w / 2 + o * 2.2} ${E.y + E.h + 70}`, 'oair', 4 + (i % 2)));
  el('text', { x: E.x - 10, y: E.y + 30, 'text-anchor': 'end', class: 'pname small', text: 'Groupe extérieur' }, layers.over);
  // ---- reprise filtrante, à l’arrière du gainable
  const filtre = (x, y, w, h, g) => {
    R(x, y, w, h, { fill: '#fff', stroke: '#6f7981', 'stroke-width': 1.5 }, g);
    R(x + 4, y + 4, w - 8, h - 8, { fill: 'url(#filtre)', stroke: '#b3a37c' }, g);
  };
  if (reprCouloir) {
    const c = PL.grilleCouloir;
    duct(P([[c.x, c.y + c.h / 2], back]), 18, 'rep', true, 'reprise');
    filtre(c.x, c.y, c.w, c.h, el('g', { 'data-info': 'reprise' }, gd));
    hs('reprise', c.x + c.w / 2, c.y + 10, 960, 270);
    PL.rooms.forEach((r, j) => {
      if (!zoneOpen(j)) return;
      const dx = (r.door[0] + r.door[1]) / 2, inRoom = r.dir < 0 ? PL.HY0 - 30 : PL.HY1 + 30, out = r.dir < 0 ? PL.HY0 + 14 : PL.HY1 - 14;
      const sx = r.x + r.w * 0.5, sy = r.y + r.h * (r.dir < 0 ? 0.35 : 0.65), cy = c.y + c.h / 2 + (j - 1.5) * 6;
      air(`M${sx} ${sy} Q${dx} ${sy} ${dx} ${inRoom} L${dx} ${out} Q${dx} ${cy} ${dx + (c.x > dx ? 30 : -30)} ${cy} L${c.x + (c.x > dx ? -4 : c.w + 4)} ${cy}`, 'ret', 3);
      const dg = el('g', { 'data-info': 'detalon' }, layers.over), yy = r.dir < 0 ? PL.HY0 : PL.HY1;
      R(r.door[0] + 6, yy - 3, r.door[1] - r.door[0] - 12, 6, { fill: '#e2a417', rx: 2 }, dg);
      if (j === 2) hs('detalon', dx, yy, 600, 380);
    });
  } else {
    PL.rooms.forEach((r, j) => {
      const [x, y] = r.rep;
      duct(`M${x} ${y} C${x} ${y + (r.dir < 0 ? 60 : -60)} ${back[0] + 80} ${back[1]} ${back[0]} ${back[1]}`, 13, 'rep', true, 'reprise');
      filtre(x - 22, y - 13, 44, 26, el('g', { 'data-info': 'reprise' }, gd));
      if (zoneOpen(j)) [0, 1].forEach(i => {
        const sx = r.x + r.w * (0.35 + i * 0.3), sy = r.y + r.h * (r.dir < 0 ? 0.25 : 0.75);
        air(`M${sx} ${sy} Q${x} ${sy} ${x + (i ? 8 : -8)} ${y - r.dir * 16}`, 'ret', 3);
      });
      if (j === 2) hs('reprise', x, y, 960, 270);
    });
  }
  // ---- soufflage : une gaine par bouche, du plénum vers les pièces
  PL.rooms.forEach((r, j) => {
    const open = zoneOpen(j), list = roomDucts(r, j);
    list.forEach(([D, b], k) => {
      const d = planRoute(j, k, b), w = D === 200 ? 16 : 13;
      const under = j === 0 && S.salonD === '160';
      const rings = duct(d, w, 'sup', open, 'diametre', under);
      if (open) el('path', { d, class: 'air sup', 'stroke-width': 2.4, style: `opacity:.9${under ? ';animation-duration:2.2s' : ''}` }, layers.air);
      // étiquette du diamètre au milieu de la gaine
      const L = rings.getTotalLength(), m = rings.getPointAtLength(L * (j === 3 ? 0.62 : 0.5));
      const tg = el('g', { 'data-info': 'diametre' }, layers.over);
      R(m.x - 24, m.y - 11, 48, 21, { rx: 3, fill: under ? '#c43c2c' : '#fff', stroke: under ? '#c43c2c' : '#8d969e' }, tg);
      el('text', { x: m.x, y: m.y + 5, 'text-anchor': 'middle', class: 'pdiam' + (under ? ' warn' : ''), text: 'Ø' + D }, tg);
      if (j === 0 && k === 0) hs('diametre', m.x, m.y, 330, 700);
    });
    const keep = layers.air; layers.air = el('g', { 'clip-path': `url(#clipR${j})` }, keep);
    list.forEach(([D, b]) => planBouche(b[0], b[1], r.dir, open, layers.units));
    layers.air = keep;
    if (S.zoning) {
      const rg = el('g', { 'data-info': 'registre' }, layers.over), p0 = planRoute(j, 0, list[0][1]).match(/M([\d.]+) ([\d.]+)/);
      const rx = +p0[1] - (j <= 1 ? 12 : 0), ry = +p0[2] - (j >= 2 ? 12 : 0);
      el('circle', { cx: rx, cy: ry, r: 7.5, fill: '#fff', stroke: '#39434c', 'stroke-width': 1.5 }, rg);
      el('line', { x1: rx - 5.5, y1: ry, x2: rx + 5.5, y2: ry, stroke: open ? '#1f8a4d' : '#c43c2c', 'stroke-width': 3, 'stroke-linecap': 'round', transform: open ? '' : `rotate(90 ${rx} ${ry})` }, rg);
      if (j === 1) hs('registre', rx, ry, 470, 400);
    }
  });
  hs('bouche', PL.rooms[2].x + 78, 290, 640, 236);
  // ---- plénum, gainable, caisson filtre
  const pl = el('g', { 'data-info': 'plenum' }, gd);
  R(P0.x, P0.y, P0.w, P0.h, { fill: '#c3c9ce', stroke: '#6f7981', 'stroke-width': 1.5, rx: 2 }, pl);
  hs('plenum', P0.x + 8, P0.y + P0.h - 6, 560, 540);
  const ug = el('g', { 'data-info': 'u-gainable' }, gd);
  R(G0.x, G0.y, G0.w, G0.h, { fill: 'url(#gBody)', stroke: '#6f7981', 'stroke-width': 1.5, rx: 3 }, ug);
  el('text', { x: G0.x + G0.w / 2, y: G0.y + 27, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#5d6871', text: 'GAINABLE' }, ug);
  hs('u-gainable', G0.x + G0.w / 2, G0.y + G0.h - 6, 790, 476, false, 80);
  filtre(F0.x, F0.y, F0.w, F0.h, el('g', { 'data-info': 'reprise' }, gd));
  // ---- débit total
  const tot = PL.rooms.reduce((n, r, j) => n + (zoneOpen(j) ? planQ(r) : 0), 0);
  const tg = el('g', { 'data-info': 'debit' }, layers.anno);
  el('text', { x: PL.X1, y: PL.Y0 - 24, 'text-anchor': 'end', class: 'ptitle pq', text: `Débit total du gainable : ${fmtN(tot)} m³/h` }, tg);
}
function planRoomsInfo() {
  PL.rooms.forEach((r, j) => {
    const open = zoneOpen(j), q = planQ(r), top = r.dir < 0;
    const end = j === 0, tx = end ? r.x + r.w - 16 : r.x + 16, ty = top ? r.y + 34 : r.y + r.h - 78, an = end ? 'end' : 'start';
    const ig = el('g', { 'data-info': 'debit' }, layers.over);
    el('text', { x: tx, y: ty, 'text-anchor': an, class: 'pname', text: `${r.name} · ${r.m2} m²` }, ig);
    el('text', { x: tx, y: ty + 22, 'text-anchor': an, class: 'pq' + (open ? '' : ' off'), text: open ? `${r.m2} × 2,5 × 5 = ${fmtN(q)} m³/h` : 'zone fermée' }, ig);
    if (j === 0) {
      const ok = S.salonD !== '160', capa = S.salonD === '2x160' ? '2 × 300 = 600' : S.salonD === '200' ? '450' : '300';
      el('text', { x: tx, y: ty + 44, 'text-anchor': an, class: 'pq small' + (ok ? '' : ' warn'), text: `Gaines : ${capa} m³/h max ${ok ? '✓ suffisant' : '✗ trop petit'}` }, ig);
    }
    const [x, y] = r.th, g = el('g', { class: 'thermo' + (open ? '' : ' closed') }, layers.over);
    if (S.zoning) g.setAttribute('data-zone', j); else g.setAttribute('data-info', 'thermostat');
    R(x, y, 76, 32, { rx: 4 }, g);
    el('text', { x: x + 38, y: y + 22, id: 't' + j }, g);
    if (j === 3) hs('thermostat', x + 38, y + 30, 1120, 80);
  });
}
function buildPlan() {
  svg.setAttribute('viewBox', '236 64 1110 880');
  rooms = PL.rooms.map((r, j) => ({ name: r.name, x: r.x, w: r.w, c: j, ceil: r.y, floor: r.y + r.h }));
  while (S.zones.length < 4) S.zones.push(true);
  L = { gm: true, plan: true, single: false, s: 1, cols: 4 };
  if (temps.length !== rooms.length) resetTemps();
  units = [];
  const bg = el('g', {}, svg);
  layers.defs = el('defs', {}, svg);
  defs();
  const fp = el('pattern', { id: 'filtre', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, layers.defs);
  R(0, 0, 6, 6, { fill: '#f1e7c9' }, fp); el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#c9b27a', 'stroke-width': 2 }, fp);
  ['build', 'tint', 'furn', 'pipes', 'insul', 'out', 'units', 'gou', 'air', 'over', 'anno', 'labels', 'spot'].forEach(k => layers[k] = el('g', {}, svg));
  planGround(bg);
  planFloors(layers.build);
  planFurniture(layers.furn);
  planWalls(layers.furn);
  planNetwork();
  planRoomsInfo();
  el('text', { x: PL.X0, y: PL.Y0 - 24, class: 'ptitle', text: 'Vue de dessus · gainable et gaines dans les combles' }, layers.anno);
  drawLabels();
  refresh();
  if (spotId) { spotCur = { x: 800, y: 450, r: 2600 }; spot(spotId); }
}

/* ---------- Construction ---------- */
function build() {
  svg.innerHTML = ''; hot = {}; labs = []; gid = 0;
  if (S.view === 'plan') return buildPlan();
  svg.setAttribute('viewBox', '0 0 1600 900');
  const n = unitCount();
  while (S.types.length < n) S.types.push(S.types[0]);
  S.types.length = n;
  L = layout();
  layers = {};
  const bg = el('g', {}, svg);
  drawOutside(bg);
  layers.defs = el('defs', {}, svg);
  defs();
  ['build', 'tint', 'furn', 'pipes', 'insul', 'out', 'units', 'gou', 'air', 'over', 'anno', 'labels', 'spot'].forEach(k => layers[k] = el('g', {}, svg));
  units = S.types.map((type, k) => ({ type, room: rooms[k] }));
  drawBuilding(layers.build);
  drawDoors(layers.build);
  furniture(layers.furn);
  units.forEach(drawUnit);
  const o = drawOutdoor();
  drawLinks(o);
  drawThermos();
  drawApports();
  const r0 = rooms.find(r => r.floor === G && r.c === 0) || rooms[0];
  el('text', { x: L.single ? r0.x + r0.w / 2 : 1040, y: L.single ? r0.ceil + (r0.floor - r0.ceil) * 0.66 : G + 58, class: 'anno', id: 'annoIn' }, layers.anno);
  drawLabels();
  refresh();
  if (spotId) { spotCur = { x: 800, y: 450, r: 2600 }; spot(spotId); }
}
function refresh() {
  const cyc = S.def === 'defrost' ? 'cool' : S.mode;
  svg.setAttribute('class', [cyc, S.mode === 'cool' ? 'summer' : 'winter', S.power ? '' : 'off', S.xray ? 'xray' : '', S.labels ? 'lab' : '',
    S.fault ? 'fault-' + S.fault : '', S.def === 'frost' ? 'frosting' : S.def === 'defrost' ? 'frosting defrosting' : '', spotId && hot[spotId] ? 'spoton' : '', S.quizfind ? 'quizfind' : ''].join(' '));
  const cool = S.mode === 'cool', q = id => document.getElementById(id);
  if (q('tOut')) q('tOut').textContent = cool ? '35 °C' : '−2 °C';
  if (q('annoOut')) q('annoOut').textContent = !S.power ? 'À l’arrêt' : S.def === 'defrost' ? 'Dégivrage en cours' : cool ? 'La chaleur est rejetée dehors' : 'La chaleur est captée dehors';
  if (q('annoIn')) q('annoIn').textContent = !S.power ? '' : S.def === 'defrost' ? 'Soufflage en pause' : cool ? 'La chaleur de la pièce est captée' : 'La chaleur est restituée dans la pièce';
  paintTemps();
}
function paintTemps() {
  rooms.forEach((r, i) => {
    const T = temps[i], t = document.getElementById('t' + i), ti = document.getElementById('tint' + i);
    if (t) t.textContent = T.toFixed(1).replace('.', ',') + ' °C';
    if (ti) ti.setAttribute('fill', T > 25 ? `rgba(240,120,40,${Math.min(0.24, (T - 25) / 4.5 * 0.24).toFixed(3)})` : T < 20 ? `rgba(60,130,230,${Math.min(0.24, (20 - T) / 4.5 * 0.24).toFixed(3)})` : 'rgba(0,0,0,0)');
  });
}
function tick() {
  const cool = S.mode === 'cool', amb = cool ? 29.5 : 15.5;
  let set = cool ? 24 : 21;
  const pen = { filtre: 2.6, fluide: 3.6, obstrue: 3 }[S.fault] || 0;
  set += cool ? pen : -pen;
  rooms.forEach((r, i) => {
    const served = S.power && !S.def && (!(L.gm && S.zoning) || S.zones[r.c]);
    const under = L.plan && r.c === 0 && S.salonD === '160' ? (cool ? 2.5 : -2.5) : 0; // gaine trop petite : consigne non atteinte
    const target = served ? set + under : amb;
    temps[i] += (target - temps[i]) * (served ? 0.05 : 0.025);
  });
  paintTemps();
}
setInterval(tick, 250);
function resetTemps() { temps = rooms.map(() => S.mode === 'cool' ? 29.5 : 15.5); }

svg.addEventListener('click', e => {
  const z = e.target.closest('[data-zone]');
  if (z) { const c = +z.getAttribute('data-zone'); S.zones[c] = !S.zones[c]; build(); return; }
  const t = e.target.closest('[data-info]');
  if (t && window.CLIM.onPick) window.CLIM.onPick(t.getAttribute('data-info'));
});

window.CLIM = { S, NAMES, build, refresh, spot, resetTemps, unitCount, hot: () => hot, rooms: () => rooms, layout: () => L, onPick: null };
})();
