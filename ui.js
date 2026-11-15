/* Panneaux, visite guidée, quiz, pannes et dimensionnement. */
(function () {
'use strict';
const C = window.CLIM, S = C.S, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const svg = $('#scene');

/* ---------- Fiches ---------- */
const INFO = {
  groupe: ['Groupe extérieur', 'C’est le moteur de l’installation. Il contient le compresseur, un échangeur et un ventilateur. En été il rejette dehors la chaleur prise dans la pièce ; en hiver il capte la chaleur de l’air extérieur.', 'Il lui faut de l’air libre autour de lui : jamais enfermé, jamais collé contre un obstacle.'],
  compresseur: ['Compresseur', 'Le cœur du système. Il aspire le fluide sous forme de gaz et le comprime : en le comprimant, il le rend très chaud et le fait circuler dans tout le circuit.', 'C’est lui qui consomme l’électricité. Tout le reste ne fait qu’échanger de la chaleur.'],
  v4v: ['Vanne 4 voies', 'Un aiguillage. Elle envoie le gaz chaud du compresseur soit vers l’extérieur (mode froid), soit vers l’intérieur (mode chaud).', 'C’est grâce à elle qu’une clim est réversible. Passez de Froid à Chaud et regardez le tiroir se déplacer.'],
  echext: ['Échangeur extérieur', 'Un long tube en serpentin garni d’ailettes, traversé par l’air du ventilateur. En mode froid le fluide chaud s’y refroidit et devient liquide : il cède sa chaleur à l’air extérieur.', 'Mode froid : il rejette la chaleur. Mode chaud : il la capte.'],
  detendeur: ['Détendeur', 'Un rétrécissement réglable. Le liquide y passe en force : sa pression chute brutalement et il devient très froid, comme le gaz d’une bombe aérosol.', 'Le compresseur fait monter la pression, le détendeur la fait chuter. Entre les deux, on échange de la chaleur.'],
  ventilo: ['Ventilateur', 'Il force l’air à traverser l’échangeur. Sans air qui circule, pas d’échange de chaleur.', 'Un échangeur encrassé ou un ventilateur gêné, c’est une clim qui force et qui consomme.'],
  liaison: ['Liaisons frigorifiques', 'Deux tubes en cuivre isolés relient le groupe à l’unité intérieure : un petit pour le liquide, un gros pour le gaz. Le fluide y fait l’aller-retour en circuit fermé.', 'Le fluide ne se consomme pas. S’il en manque, c’est qu’il y a une fuite.'],
  interco: ['Câble d’interconnexion', 'Il relie l’unité intérieure au groupe extérieur. Il transporte l’alimentation de l’unité intérieure et les informations échangées entre les deux appareils.', 'Sans lui, les deux unités ne se parlent pas : la clim se met en défaut.'],
  alim: ['Câble d’alimentation', 'Il part du tableau électrique et alimente le groupe extérieur. Sa section dépend de la puissance de l’appareil et de la longueur du câble.', 'Une ligne réservée à la clim, rien d’autre branché dessus.'],
  disj: ['Disjoncteur dédié', 'Dans le tableau électrique, un disjoncteur protège uniquement la climatisation. Il coupe le courant en cas de surcharge ou de court-circuit.', 'Cliquez sur « Disjoncté » à gauche : tout s’arrête.'],
  support: ['Support du groupe', 'Le groupe se pose sur des équerres fixées au mur ou sur des supports au sol. Dans les deux cas, des plots en caoutchouc absorbent les vibrations.', 'Au mur : attention au bruit transmis dans la maison. Au sol : surélevé, pour l’eau de dégivrage et la neige.'],
  goulotte: ['Goulotte', 'Un cache en PVC qui habille et protège les liaisons, le câble et le tuyau de condensats. Activez le Rayon X pour voir ce qu’elle contient.', 'Une goulotte bien posée, c’est ce que le client voit tous les jours.'],
  condensats: ['Évacuation des condensats', 'En mode froid, l’humidité de l’air se dépose en gouttes sur l’échangeur froid, comme sur un verre sorti du frigo. Cette eau doit être évacuée, avec une pente continue.', 'Pas de pente, pas d’écoulement : l’eau finit sur le mur ou au sol.'],
  pompe: ['Pompe de relevage', 'Quand l’eau ne peut pas s’écouler toute seule par gravité, une petite pompe la remonte et l’envoie plus loin. Elle se loge dans la goulotte, dans l’unité ou dans le faux plafond.', 'Les cassettes en sont équipées d’origine, et souvent les gainables.'],
  thermostat: ['Thermostat', 'Il mesure la température de la pièce et demande à la clim de fournir plus ou moins de puissance pour atteindre la consigne.', 'En zoning, chaque pièce a le sien et commande son propre registre.'],
  gaine: ['Gaine de soufflage', 'Un conduit isolé, caché dans le faux plafond, qui amène l’air traité depuis le gainable jusqu’à chaque pièce.', 'Plus la gaine est longue et coudée, plus l’air a du mal à passer.'],
  plenum: ['Plénum de soufflage', 'Une boîte fixée en sortie du gainable. Elle répartit l’air entre les différentes gaines.', 'En zoning, c’est lui qui porte les registres motorisés.'],
  registre: ['Registre motorisé', 'Un volet dans la gaine, piloté par le thermostat de la pièce. Ouvert, l’air passe ; fermé, la pièce n’est plus servie.', 'C’est le zoning : une seule machine, une température par pièce.'],
  bouche: ['Bouche de soufflage', 'C’est par là que l’air arrive dans la pièce. Une bouche circulaire diffuse l’air en nappe le long du plafond ; une grille rectangulaire le dirige davantage.', 'Bien choisie et bien placée : pas de courant d’air sur les occupants.'],
  reprise: ['Grille de reprise', 'L’air de la pièce repart vers le gainable par cette grille, à travers un filtre. Il est traité puis renvoyé dans les gaines.', 'Ce que l’on souffle, il faut pouvoir le reprendre. Reprise dans le couloir ou centralisée : les portes doivent être détalonnées pour laisser l’air revenir.'],
  refnet: ['Refnet', 'Sur un VRF, un seul réseau de tubes part du groupe et dessert les unités les unes après les autres, en série. À chaque unité, un refnet (raccord en Y) prélève ce dont elle a besoin et laisse passer le reste vers la suivante. Autre montage possible : un répartiteur par niveau, d’où part une liaison vers chaque unité.', 'Multi-split : une liaison par unité. VRF : un réseau commun et des refnets. La dernière unité de la ligne n’en a pas besoin.'],
  detalon: ['Détalonnage des portes', 'Quand la reprise est centralisée ou placée dans le couloir, l’air soufflé dans chaque pièce doit pouvoir revenir jusqu’à la grille, même porte fermée. On laisse donc un jour sous les portes : c’est le détalonnage.', 'Sans détalonnage, la pièce se met en surpression : le débit chute, la porte siffle et la température n’est pas atteinte.'],
  'u-mural': ['Unité murale', 'La plus courante. Fixée en haut du mur, elle aspire l’air par le dessus et le souffle par le bas.', 'Simple et économique. Une unité par pièce.'],
  'u-cassette': ['Cassette', 'Encastrée dans le faux plafond, seule sa façade est visible. Elle souffle sur les côtés et reprend l’air au centre.', 'Idéale pour les bureaux et commerces. Pompe de relevage intégrée.'],
  'u-plafonnier': ['Plafonnier', 'Fixé sous le plafond, il souffle l’air à l’horizontale sur une grande portée.', 'Pour les grandes pièces sans faux plafond.'],
  'u-console': ['Console', 'Posée au sol ou en bas du mur, comme un radiateur. Elle souffle vers le haut.', 'Très appréciée en mode chaud, et quand on ne peut rien fixer en hauteur.'],
  'u-gainable': ['Gainable', 'L’unité est cachée dans le faux plafond. L’air est distribué par des gaines jusqu’à des bouches discrètes dans chaque pièce.', 'On ne voit que les bouches. Une machine peut traiter plusieurs pièces. Avec une reprise centralisée, pensez au détalonnage des portes.']
};
const SYS = {
  mono: 'Mono-split : un groupe extérieur, une unité intérieure.',
  multi: 'Multi-split : un groupe extérieur, plusieurs unités intérieures. Chacune a sa propre liaison.',
  vrf: 'VRF : un seul réseau de tubes pour tout le bâtiment. Les unités sont raccordées en série, avec un refnet à chaque piquage.'
};

function showHome() {
  const cool = S.mode === 'cool';
  $('#tab-info').innerHTML = `<div class="card">
    <h3>${cool ? 'En été, la chaleur sort de la pièce' : 'En hiver, la chaleur entre dans la pièce'}</h3>
    <p class="lead">Une clim ne fabrique ni froid ni chaud. Elle <b>déplace la chaleur</b> d’un endroit à un autre, grâce à un fluide qui tourne en boucle.</p>
    <ol class="steps">${(cool ? [
      ['var(--bpm)', 'Dans la pièce', 'Le fluide est froid. Il absorbe la chaleur de l’air et se transforme en gaz.'],
      ['var(--hpg)', 'Le compresseur', 'Il comprime ce gaz, qui devient très chaud.'],
      ['var(--hpl)', 'Dehors', 'Le gaz chaud cède sa chaleur à l’air extérieur et redevient liquide.'],
      ['var(--bpm)', 'Le détendeur', 'La pression chute, le liquide redevient froid. Et la boucle recommence.']
    ] : [
      ['var(--bpm)', 'Dehors', 'Le fluide est plus froid que l’air extérieur, même à −2 °C. Il capte sa chaleur et devient gaz.'],
      ['var(--hpg)', 'Le compresseur', 'Il comprime ce gaz, qui devient très chaud.'],
      ['var(--hpl)', 'Dans la pièce', 'Le gaz chaud cède sa chaleur à l’air de la pièce et redevient liquide.'],
      ['var(--bpm)', 'Le détendeur', 'La pression chute, le liquide redevient froid. Et la boucle recommence.']
    ]).map(s => `<li style="--c:${s[0]}"><b>${s[1]}</b>${s[2]}</li>`).join('')}</ol>
    <div class="keep"><b>Système affiché</b>${SYS[S.sys]}</div>
    <p class="tip">Cliquez sur n’importe quel élément du schéma pour savoir à quoi il sert. Activez le Rayon X pour voir le fluide circuler.</p>
  </div>`;
}
function showInfo(id) {
  const i = INFO[id]; if (!i) return;
  tab('info');
  $('#tab-info').innerHTML = `<div class="card"><button class="back">← Retour au principe</button><h3>${i[0]}</h3><p class="lead">${i[1]}</p><div class="keep"><b>À retenir</b>${i[2]}</div></div>`;
  $('#tab-info .back').onclick = showHome;
}
C.onPick = id => { if (quiz.find) return quizPick(id); showInfo(id === 'uint' ? 'u-' + S.types[0] : id); };

/* ---------- Commandes ---------- */
function tab(name) {
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  ['info', 'dim', 'pannes'].forEach(t => $('#tab-' + t).hidden = t !== name);
}
$$('.tabs button').forEach(b => b.onclick = () => tab(b.dataset.tab));

function setMode(m) {
  if (S.mode === m) return;
  S.mode = m; S.def = null; clearTimeout(defT); status('');
  if (m === 'heat' && S.fault === 'pente') S.fault = null;
  C.resetTemps(); C.refresh(); sync(); showHome(); renderFaults();
}
$$('.modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));

let sel = -1;
function sync() {
  document.body.classList.toggle('heat', S.mode === 'heat');
  $$('.modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
  const cur = { sys: S.sys, type: sel >= 0 ? S.types[sel] : S.types[0], support: S.sys === 'vrf' ? 'sol' : S.support, drain: S.drain, diff: S.diff, zoning: S.zoning ? '1' : '0', power: S.power ? '1' : '0' };
  $$('.seg').forEach(seg => [...seg.children].forEach(b => b.classList.toggle('on', b.dataset.val === cur[seg.dataset.set])));
  $('[data-set=support] [data-val=mural]').disabled = S.sys === 'vrf';
  $('#bX').classList.toggle('on', S.xray); $('#bL').classList.toggle('on', S.labels);
  $('#legend').classList.toggle('show', S.xray && $('#dock').hidden);
  const gain = S.types.includes('gainable'), gm = S.sys === 'mono' && gain;
  $('#secGain').hidden = !gain; $('#segZone').hidden = !gm; $('#zoneHint').hidden = !(gm && S.zoning);
  // choix de la pièce
  const n = C.unitCount(), w = $('#selWrap'); w.hidden = n < 2;
  if (n >= 2) {
    const names = C.rooms().map(r => r.name), s = $('#sel');
    s.innerHTML = '<option value="-1">Toutes les pièces</option>' + names.slice(0, n).map((nm, i) => `<option value="${i}">${nm}</option>`).join('');
    s.value = sel;
  }
}
$('#sel').onchange = e => { sel = +e.target.value; sync(); };
$$('.seg').forEach(seg => seg.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  const k = seg.dataset.set, v = b.dataset.val;
  if (k === 'sys') { S.sys = v; sel = -1; S.types = [S.types[0]]; S.zones = [true, true, true]; }
  else if (k === 'type') { if (sel >= 0 && S.sys !== 'mono') S.types[sel] = v; else S.types = S.types.map(() => v); showInfo('u-' + v); }
  else if (k === 'zoning') { S.zoning = v === '1'; S.zones = [true, true, true]; }
  else if (k === 'power') S.power = v === '1';
  else S[k] = v;
  C.build(); sync();
  if (k === 'sys') showHome();
  if (k === 'drain') showInfo(v === 'gravite' ? 'condensats' : 'pompe');
  if (k === 'support') showInfo('support');
}));
$('#bX').onclick = () => { S.xray = !S.xray; C.refresh(); sync(); };
$('#bL').onclick = () => { S.labels = !S.labels; C.refresh(); sync(); };
$('#bF').onclick = () => { document.body.classList.toggle('focus'); $('#bF').textContent = document.body.classList.contains('focus') ? 'Afficher les panneaux' : 'Plein écran'; };

function status(t) { const s = $('#status'); s.textContent = t; s.hidden = !t; }

/* ---------- Pannes et dégivrage ---------- */
const FAULTS = {
  filtre: ['Filtre encrassé', 'L’air ne passe plus', 'Le soufflage est faible, la pièce n’atteint plus la température demandée.', 'Le filtre est bouché par la poussière. Moins d’air traverse l’échangeur, donc moins de chaleur échangée. L’appareil force et consomme plus.', 'Nettoyer les filtres régulièrement. C’est le premier geste d’entretien à expliquer au client.'],
  fluide: ['Manque de fluide', 'Une fuite sur le circuit', 'Le fluide circule mal, du givre apparaît à l’entrée de l’échangeur intérieur, la clim ne rafraîchit presque plus.', 'Le circuit est fermé : s’il manque du fluide, il y a une fuite, souvent sur un raccord mal serré.', 'Rechercher et réparer la fuite avant de recharger. Seul un professionnel attesté peut manipuler le fluide.'],
  pente: ['Contre-pente des condensats', 'L’eau ne s’évacue pas', 'De l’eau coule de l’unité intérieure, le long du mur, jusqu’au sol.', 'Le tuyau d’évacuation remonte au lieu de descendre. L’eau stagne, le bac déborde.', 'Une pente continue vers l’évacuation. Si c’est impossible, on pose une pompe de relevage.'],
  obstrue: ['Groupe extérieur enfermé', 'Un cache trop fermé', 'L’air chaud rejeté tourne en rond et revient dans le groupe. La pièce se rafraîchit mal.', 'Le groupe ne peut plus évacuer la chaleur. La pression monte, il consomme davantage et finit par se mettre en sécurité.', 'Respecter les distances libres indiquées par le fabricant. Un cache-clim doit laisser passer l’air.']
};
let defT = 0;
function renderFaults() {
  const f = S.fault && FAULTS[S.fault];
  $('#tab-pannes').innerHTML = `<h3>Et si ça se passe mal ?</h3><p>Choisissez une panne ou une erreur de pose et observez le schéma.</p>
    ${Object.keys(FAULTS).map(k => `<button class="fault${S.fault === k ? ' on' : ''}" data-f="${k}">${FAULTS[k][0]}<small>${FAULTS[k][1]}</small></button>`).join('')}
    ${f ? `<dl class="fdesc card"><dt>Ce que l’on voit</dt><dd>${f[2]}</dd><dt>Pourquoi</dt><dd>${f[3]}</dd><dt>La bonne pratique</dt><dd>${f[4]}</dd></dl>` : ''}
    <h3 style="margin-top:22px">Le dégivrage</h3>
    <p>En hiver, l’échangeur extérieur est très froid : l’humidité de l’air y gèle. De temps en temps, la clim inverse son cycle quelques minutes pour faire fondre ce givre.</p>
    <button class="fault" id="bDef">Lancer un dégivrage<small>${S.mode === 'heat' ? 'Le cycle s’inverse, le soufflage se met en pause' : 'Passe en mode chaud puis lance la séquence'}</small></button>`;
  $$('#tab-pannes [data-f]').forEach(b => b.onclick = () => {
    const k = b.dataset.f; S.fault = S.fault === k ? null : k;
    if (S.fault === 'pente' && S.mode !== 'cool') setMode('cool');
    if (S.fault === 'pente') S.fault = 'pente';
    S.power = true; C.resetTemps(); C.refresh(); sync(); renderFaults();
  });
  $('#bDef').onclick = defrost;
}
function defrost() {
  if (S.mode !== 'heat') setMode('heat');
  S.power = true; S.fault = null; clearTimeout(defT);
  S.def = 'frost'; C.refresh(); sync(); renderFaults(); status('Le givre se forme sur l’échangeur extérieur…');
  defT = setTimeout(() => {
    S.def = 'defrost'; C.refresh(); status('Dégivrage : le cycle s’inverse, le gaz chaud fait fondre le givre');
    defT = setTimeout(() => { S.def = null; C.refresh(); status('Le chauffage reprend'); defT = setTimeout(() => status(''), 2200); }, 5500);
  }, 3600);
}

/* ---------- Dimensionnement ---------- */
const D = { surf: 30, haut: 2.5, ratio: 40, g: 1.1, tint: 20, text: -7, brass: 5, pers: 0, four: 0, serveur: 0, baie: 0, expo: 180, veranda: 0 };
const SIZES = [2, 2.5, 3.5, 4.2, 5, 6, 7.1, 8.5, 10, 12.5, 14, 16, 20, 25, 28];
const fmt = (n, d) => n.toLocaleString('fr-FR', { maximumFractionDigits: d == null ? 0 : d });
function renderDim() {
  const rng = (k, label, min, max, step, unit) => `<div class="row"><label for="d-${k}">${label}</label><output id="o-${k}"></output><input type="range" id="d-${k}" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${D[k]}" data-u="${unit}"></div>`;
  const chk = (k, label, sub, unit, def) => `<label class="chk"><input type="checkbox" data-c="${k}" data-def="${def}"><span>${label}<em>${sub}</em></span><input type="number" data-k="${k}" min="0" step="1" value="${def}" aria-label="${label} (${unit})"></label>`;
  $('#tab-dim').innerHTML = `<h3>Quelle puissance faut-il ?</h3>
    <p>Des ordres de grandeur pour un premier chiffrage. Une étude thermique reste la référence.</p>
    ${rng('surf', 'Surface de la pièce', 8, 150, 1, ' m²')}${rng('haut', 'Hauteur sous plafond', 2.2, 4, 0.1, ' m')}
    <div class="calc"><h4>1. Ratio rapide en froid</h4><div class="f" id="f-ratio"></div><div class="v" id="v-ratio"></div>${rng('ratio', 'Ratio retenu', 30, 60, 5, ' W/m³')}</div>
    <div class="calc"><h4>2. Les apports à combattre</h4>
      ${chk('pers', 'Personnes en plus', '≈ 120 W par personne', 'nombre', 4)}
      ${chk('four', 'Four, cuisson', 'puissance en W', 'W', 1500)}
      ${chk('serveur', 'Informatique, serveur', 'puissance en W : tout devient chaleur', 'W', 2000)}
      ${chk('baie', 'Grande surface vitrée', 'surface en m²', 'm²', 6)}
      <div class="row" style="margin-top:6px"><label for="d-expo">Exposition du vitrage</label><span></span><select id="d-expo" data-k="expo"><option value="50">Nord · ≈ 50 W/m²</option><option value="120">Est · ≈ 120 W/m²</option><option value="180" selected>Sud · ≈ 180 W/m²</option><option value="200">Ouest · ≈ 200 W/m²</option></select></div>
      ${chk('veranda', 'Véranda', 'surface en m², ≈ 250 W/m²', 'm²', 12)}
      <div class="f" id="f-app"></div><div class="v" id="v-app"></div></div>
    <div class="calc"><h4>3. Déperditions en chaud : G × V × ΔT</h4>
      <div class="row"><label for="d-g">Isolation du bâtiment</label><span></span><select id="d-g" data-k="g"><option value="0.6">Récent, très bien isolé · G = 0,6</option><option value="0.8">Bien isolé · G = 0,8</option><option value="1.1" selected>Isolation moyenne · G = 1,1</option><option value="1.5">Peu isolé · G = 1,5</option><option value="1.8">Non isolé · G = 1,8</option></select></div>
      ${rng('text', 'Température extérieure de base', -15, 5, 1, ' °C')}${rng('tint', 'Température intérieure voulue', 18, 23, 1, ' °C')}
      <div class="f" id="f-chaud"></div><div class="v" id="v-chaud"></div></div>
    <div class="calc"><h4>4. Taux de brassage</h4>${rng('brass', 'Volumes brassés par heure', 3, 10, 1, ' vol/h')}<div class="f" id="f-brass"></div><div class="v" id="v-brass"></div><div class="f" id="f-gaine"></div></div>
    <div class="result"><small>Puissance à installer</small><div class="v" id="v-res"></div><small id="v-det"></small>
      <div class="bar"><i id="b-froid" style="--c:#4aa3f0"></i></div><div class="bar"><i id="b-chaud" style="--c:#f0692a"></i></div></div>
    <p class="tip">Les apports cochés apparaissent dans la pièce quand le schéma est en mono-split.</p>`;
  $$('#tab-dim [data-k]').forEach(i => i.addEventListener('input', () => { const c = i.closest('.chk'); if (c && !c.querySelector('[data-c]').checked) return; D[i.dataset.k] = +i.value; calc(); }));
  $$('#tab-dim [data-c]').forEach(c => c.addEventListener('change', () => {
    const k = c.dataset.c; D[k] = c.checked ? +c.closest('.chk').querySelector('[data-k]').value : 0;
    S.apports[k] = c.checked; C.build(); calc();
  }));
  calc();
}
function calc() {
  $$('#tab-dim input[type=range]').forEach(i => $('#o-' + i.dataset.k).textContent = fmt(+i.value, 1) + i.dataset.u);
  const V = D.surf * D.haut, base = V * D.ratio;
  const app = D.pers * 120 + D.four + D.serveur + D.baie * D.expo + D.veranda * 250;
  const froid = base + app, dT = D.tint - D.text, chaud = D.g * V * dT, q = V * D.brass;
  const dia = Math.sqrt(4 * q / 3600 / (Math.PI * 4)) * 1000;
  $('#f-ratio').textContent = `${fmt(V, 1)} m³ × ${D.ratio} W/m³`; $('#v-ratio').textContent = fmt(base) + ' W';
  $('#f-app').textContent = app ? `${D.pers ? D.pers + ' × 120' : ''}${D.four ? ' + ' + D.four : ''}${D.serveur ? ' + ' + D.serveur : ''}${D.baie ? ' + ' + D.baie + ' × ' + D.expo : ''}${D.veranda ? ' + ' + D.veranda + ' × 250' : ''}`.replace(/^ \+ /, '') : 'Aucun apport particulier';
  $('#v-app').textContent = '+ ' + fmt(app) + ' W';
  $('#f-chaud').textContent = `${fmt(D.g, 1)} × ${fmt(V, 1)} m³ × ${dT} °C`; $('#v-chaud').textContent = fmt(chaud) + ' W';
  $('#f-brass').textContent = `${fmt(V, 1)} m³ × ${D.brass} vol/h`; $('#v-brass').textContent = fmt(q) + ' m³/h';
  $('#f-gaine').textContent = `Gaine principale d’un gainable : Ø ${fmt(Math.ceil(dia / 10) * 10)} mm environ, pour 4 m/s`;
  const need = Math.max(froid, chaud) / 1000, size = SIZES.find(s => s >= need) || SIZES[SIZES.length - 1];
  $('#v-res').textContent = fmt(size, 1) + ' kW';
  $('#v-det').textContent = `Froid ${fmt(froid / 1000, 1)} kW · Chaud ${fmt(chaud / 1000, 1)} kW · le plus exigeant décide`;
  const mx = Math.max(froid, chaud, 1);
  $('#b-froid').style.transform = `scaleX(${froid / mx})`; $('#b-chaud').style.transform = `scaleX(${chaud / mx})`;
}

/* ---------- Visite guidée ---------- */
const TOUR = [
  [null, 'Le principe', 'Une clim ne fabrique pas de froid. Elle prend la chaleur de la pièce et la transporte dehors. Regardez : dedans l’air ressort frais, dehors le groupe souffle de l’air chaud.', { mode: 'cool', xray: false }],
  ['uint', 'L’unité intérieure capte la chaleur', 'L’air chaud de la pièce traverse l’unité. Il y laisse sa chaleur et ressort rafraîchi. La température de la pièce descend peu à peu.', { xray: false }],
  ['liaison', 'Un fluide fait la navette', 'Regardons à l’intérieur. Un fluide circule en boucle fermée entre dedans et dehors, dans deux tubes en cuivre. C’est lui qui transporte la chaleur.', { xray: true }],
  ['uint', 'Dedans : le fluide froid absorbe la chaleur', 'Le fluide arrive froid (en bleu). En absorbant la chaleur de l’air, il se transforme en gaz, comme de l’eau qui bout, mais à basse température.', { xray: true }],
  ['compresseur', 'Le compresseur, le cœur du système', 'Il aspire ce gaz et le comprime. Comme dans une pompe à vélo, comprimer un gaz le chauffe : il ressort très chaud (en rouge).', { xray: true }],
  ['echext', 'Dehors : le fluide cède sa chaleur', 'Le gaz est plus chaud que l’air extérieur, même en été. Le ventilateur le refroidit : il cède sa chaleur et redevient liquide (en orange).', { xray: true }],
  ['detendeur', 'Le détendeur fait chuter la pression', 'Le liquide passe par un rétrécissement. Sa pression chute et il devient très froid. Il est prêt à repartir vers la pièce.', { xray: true }],
  ['condensats', 'L’eau de condensation', 'L’air qui refroidit dépose son humidité, comme la buée sur un verre froid. Cette eau doit être évacuée, par gravité ou avec une pompe de relevage.', { xray: true }],
  ['disj', 'L’électricité', 'Un disjoncteur dédié protège l’installation. Un câble alimente le groupe, un autre relie le groupe à l’unité intérieure pour l’alimenter et communiquer.', { xray: true }],
  ['v4v', 'On inverse tout : le mode chaud', 'La vanne 4 voies change le sens du fluide. Le gaz chaud part maintenant vers l’intérieur : c’est la pièce qui reçoit la chaleur.', { xray: true, mode: 'heat' }],
  ['groupe', 'En hiver, la chaleur vient de dehors', 'Même à −2 °C, l’air extérieur contient de la chaleur. Le fluide, encore plus froid, la capte et le compresseur la remonte en température. Pour 1 kWh d’électricité, on récupère 3 à 4 kWh de chaleur.', { xray: false, mode: 'heat' }]
];
let ti = -1;
function dock(show) { $('#dock').hidden = !show; $('.stage').classList.toggle('docked', show); sync(); }
function tourGo(i) {
  ti = i; const s = TOUR[i];
  if (s[3].mode) setMode(s[3].mode);
  if (s[3].xray != null) S.xray = s[3].xray;
  S.power = true; C.refresh(); sync();
  $('#dockStep').textContent = (i + 1) + ' / ' + TOUR.length; $('#dockTitle').textContent = s[1]; $('#dockText').textContent = s[2];
  $('#dockAns').innerHTML = ''; $('#dockPrev').hidden = false; $('#dockPrev').disabled = i === 0;
  $('#dockNext').textContent = i === TOUR.length - 1 ? 'Terminer' : 'Suivant';
  C.spot(s[0]);
}
function closeDock() { ti = -1; quiz.on = false; quiz.find = null; S.quizfind = false; C.spot(null); C.refresh(); dock(false); }
const stopDef = () => { S.def = null; clearTimeout(defT); status(''); };
$('#bT').onclick = () => { stopDef(); quiz.on = false; dock(true); tourGo(0); };
$('#dockClose').onclick = closeDock;
$('#dockPrev').onclick = () => { if (!quiz.on && ti > 0) tourGo(ti - 1); };
$('#dockNext').onclick = () => { if (quiz.on) return quizNext(); if (ti < TOUR.length - 1) tourGo(ti + 1); else closeDock(); };
document.addEventListener('keydown', e => {
  if ($('#dock').hidden || /INPUT|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') $('#dockNext').click(); if (e.key === 'ArrowLeft') $('#dockPrev').click(); if (e.key === 'Escape') closeDock();
});

/* ---------- Quiz ---------- */
const QUIZ = [
  { q: 'En mode froid, que fait une climatisation ?', a: ['Elle fabrique du froid', 'Elle déplace la chaleur de la pièce vers l’extérieur', 'Elle fait entrer l’air frais du dehors'], ok: 1, why: 'Elle transporte la chaleur. L’air de la pièce reste le même, il est simplement refroidi.' },
  { q: 'Montrez le compresseur sur le schéma.', find: 'compresseur', why: 'Il se trouve dans le groupe extérieur. C’est lui qui met le fluide en mouvement.' },
  { q: 'Quel organe permet de passer du froid au chaud ?', a: ['Le détendeur', 'Le disjoncteur', 'La vanne 4 voies'], ok: 2, why: 'La vanne 4 voies inverse le sens de circulation du fluide.' },
  { q: 'En mode chaud, que fait le groupe extérieur ?', a: ['Il capte la chaleur de l’air extérieur', 'Il rejette de la chaleur dehors', 'Il est à l’arrêt'], ok: 0, why: 'Même par temps froid, l’air extérieur contient de la chaleur que le fluide peut capter.' },
  { q: 'Dans un multi-split, comment sont raccordées les unités intérieures ?', a: ['Un réseau commun avec des refnets', 'Chacune a sa propre liaison jusqu’au groupe', 'Chacune a son propre groupe extérieur'], ok: 1, why: 'Une liaison par unité. Le réseau commun avec refnets, c’est le VRF.' },
  { q: 'Montrez le disjoncteur qui protège la clim.', find: 'disj', why: 'Dans le tableau électrique, un disjoncteur est réservé à la climatisation.' },
  { q: 'Une pièce de 20 m² sous 2,5 m de plafond. Avec 40 W/m³, quelle puissance ?', a: ['0,8 kW', '2 kW', '5 kW'], ok: 1, why: '20 × 2,5 = 50 m³, et 50 × 40 = 2 000 W.' },
  { q: 'Un brassage de 5 volumes par heure dans 50 m³, c’est quel débit d’air ?', a: ['10 m³/h', '250 m³/h', '2 500 m³/h'], ok: 1, why: '50 m³ × 5 = 250 m³/h.' },
  { q: 'À quoi sert une pompe de relevage ?', a: ['À faire circuler le fluide frigorigène', 'À évacuer l’eau quand elle ne peut pas s’écouler par gravité', 'À augmenter la puissance'], ok: 1, why: 'Elle remonte l’eau de condensation quand une pente naturelle est impossible.' },
  { q: 'Un filtre encrassé, qu’est-ce que ça change ?', a: ['Rien, c’est esthétique', 'Moins d’air passe : moins de puissance, plus de consommation', 'La clim souffle plus fort'], ok: 1, why: 'Moins d’air sur l’échangeur, c’est moins de chaleur échangée.' }
];
const quiz = { on: false, i: 0, score: 0, find: null, done: false };
function quizShow() {
  const q = QUIZ[quiz.i]; quiz.done = false; quiz.find = q.find || null;
  S.quizfind = !!q.find; if (q.find) { S.xray = true; S.mode = S.mode; } C.refresh(); sync(); C.spot(null);
  $('#dockStep').textContent = (quiz.i + 1) + ' / ' + QUIZ.length; $('#dockTitle').textContent = q.q;
  $('#dockText').textContent = q.find ? 'Cliquez sur le bon élément du schéma.' : '';
  $('#dockAns').innerHTML = q.find ? '' : q.a.map((a, i) => `<button data-i="${i}">${a}</button>`).join('');
  $$('#dockAns button').forEach(b => b.onclick = () => quizAnswer(+b.dataset.i === q.ok, b));
  $('#dockPrev').hidden = true; $('#dockNext').textContent = 'Passer';
}
function quizAnswer(good, btn) {
  if (quiz.done) return; quiz.done = true; const q = QUIZ[quiz.i];
  if (good) quiz.score++;
  if (btn) { btn.classList.add(good ? 'ok' : 'ko'); if (!good) $$('#dockAns button')[q.ok].classList.add('ok'); }
  $('#dockText').textContent = (good ? 'Exact. ' : 'Pas tout à fait. ') + q.why;
  if (q.find) { quiz.find = null; S.quizfind = false; C.refresh(); C.spot(q.find); }
  $('#dockNext').textContent = quiz.i === QUIZ.length - 1 ? 'Voir le score' : 'Question suivante';
}
function quizPick(id) { quizAnswer(id === quiz.find); }
function quizNext() {
  if (quiz.i >= QUIZ.length) return closeDock();
  quiz.i++;
  if (quiz.i < QUIZ.length) return quizShow();
  C.spot(null); quiz.find = null; S.quizfind = false; C.refresh();
  $('#dockStep').textContent = quiz.score + ' / ' + QUIZ.length;
  $('#dockTitle').textContent = quiz.score >= 8 ? 'Bravo, c’est acquis' : quiz.score >= 5 ? 'Bien, encore un petit effort' : 'À revoir ensemble';
  $('#dockText').textContent = 'Relancez le quiz ou reprenez la visite guidée pour revoir les points manqués.';
  $('#dockAns').innerHTML = ''; $('#dockNext').textContent = 'Fermer';
}
$('#bQ').onclick = () => { stopDef(); ti = -1; quiz.on = true; quiz.i = 0; quiz.score = 0; dock(true); quizShow(); };

/* ---------- Démarrage ---------- */
C.build(); sync(); showHome(); renderDim(); renderFaults();
})();
