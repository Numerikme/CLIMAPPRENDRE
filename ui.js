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
  reprise: ['Grille de reprise filtrante', 'L’air de la pièce repart vers le gainable par cette grille. Elle doit toujours être filtrante : le filtre arrête la poussière avant qu’elle n’encrasse l’échangeur du gainable. La reprise se raccorde à l’arrière du gainable.', 'Ce que l’on souffle, il faut pouvoir le reprendre. Reprise dans le couloir ou centralisée : les portes doivent être détalonnées pour laisser l’air revenir.'],
  refnet: ['Refnet', 'Sur un VRF, un seul réseau de tubes part du groupe et dessert les unités les unes après les autres, en série. À chaque unité, un refnet (raccord en Y) prélève ce dont elle a besoin et laisse passer le reste vers la suivante. Autre montage possible : un répartiteur par niveau, d’où part une liaison vers chaque unité.', 'Multi-split : une liaison par unité. VRF : un réseau commun et des refnets. La dernière unité de la ligne n’en a pas besoin.'],
  detalon: ['Détalonnage des portes', 'Quand la reprise est centralisée ou placée dans le couloir, l’air soufflé dans chaque pièce doit pouvoir revenir jusqu’à la grille, même porte fermée. On laisse donc un jour sous les portes : c’est le détalonnage.', 'Sans détalonnage, la pièce se met en surpression : le débit chute, la porte siffle et la température n’est pas atteinte.'],
  plan: ['Focus gainable', 'Une seule machine, posée au centre de la maison dans les combles, traite le salon et les trois chambres. À l’avant, le plénum répartit l’air dans les gaines ; à l’arrière, la reprise filtrante ramène l’air ; sur le côté partent les liaisons vers le groupe extérieur. Chaque bouche souffle vers la fenêtre, à l’opposé de la porte et de la reprise.', 'Changez le type de bouche, le zoning et la reprise à gauche. Cliquez sur un thermostat pour fermer une zone.'],
  debit: ['Débit d’air par pièce', 'Chaque pièce reçoit un débit adapté à son volume : surface × hauteur sous plafond (2,5 m) × 5 brassages par heure. Une chambre de 12 m² : 12 × 2,5 × 5 = 150 m³/h. Le salon de 35 m² : 437,5 m³/h.', 'Quand une zone est fermée, le gainable réduit sa ventilation : le débit total baisse, les autres pièces gardent leur débit.'],
  diametre: ['Diamètre des gaines', 'Une gaine Ø160 transporte au maximum environ 300 m³/h, une Ø200 environ 450 m³/h. Le salon de 35 m² demande 437,5 m³/h : une seule Ø160 ne suffit pas, l’air siffle et la pièce n’atteint pas la consigne. Solutions : une Ø200, ou deux Ø160 avec deux bouches.', 'Chambres de 12 et 18 m² : 150 et 225 m³/h, une Ø160 suffit. Testez les trois choix pour le salon à gauche.'],
  porte: ['Porte', 'Vue de dessus, l’arc en pointillés montre l’ouverture de la porte.', 'Avec une reprise dans le couloir, l’air de la pièce repasse sous la porte : il faut la détalonner.'],
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
  S.mode = m; S.def = null; endDef();
  if (m === 'heat' && S.fault === 'pente') S.fault = null;
  C.resetTemps(); C.refresh(); sync(); showHome(); renderFaults();
}
$$('.modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));

let sel = -1;
function sync() {
  document.body.classList.toggle('heat', S.mode === 'heat');
  $$('.modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === S.mode));
  const cur = { sys: S.sys, type: sel >= 0 ? S.types[sel] : S.types[0], support: S.sys === 'vrf' ? 'sol' : S.support, drain: S.drain, diff: S.diff, reprise: S.reprise, salonD: S.salonD, zoning: S.zoning ? '1' : '0', power: S.power ? '1' : '0' };
  $$('.seg').forEach(seg => [...seg.children].forEach(b => b.classList.toggle('on', b.dataset.val === cur[seg.dataset.set])));
  $('[data-set=support] [data-val=mural]').disabled = S.sys === 'vrf';
  $('#bX').classList.toggle('on', S.xray); $('#bL').classList.toggle('on', S.labels);
  $('#legend').classList.toggle('show', S.xray && $('#dock').hidden);
  const pv = S.view === 'plan', gain = pv || S.types.includes('gainable'), gm = pv || (S.sys === 'mono' && gain);
  $('#secGain').hidden = !gain; $('#segZone').hidden = !gm; $('#zoneHint').hidden = !(gm && S.zoning); $('#segRep').hidden = !pv; $('#secSalon').hidden = !pv;
  document.body.classList.toggle('planview', pv); $('#bP').classList.toggle('on', pv);
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
  if (k === 'reprise') showInfo(v === 'couloir' ? 'detalon' : 'reprise');
  if (k === 'salonD') showInfo('diametre');
  if (k === 'support') showInfo('support');
}));
function setView(v) { if (S.view === v) return; S.view = v; C.spot(null); C.build(); sync(); if (v === 'plan') showInfo('plan'); else showHome(); }
$('#bP').onclick = () => { stopDef(); setView(S.view === 'plan' ? 'coupe' : 'plan'); };
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
// Dégivrage mis en scène : Rayon X allumé le temps de la démo, projecteur sur la vanne puis l’échangeur
let defX = null;
function defrost() {
  setView('coupe');
  if (S.mode !== 'heat') setMode('heat');
  S.power = true; S.fault = null; clearTimeout(defT);
  if (defX === null) defX = S.xray;
  S.xray = true;
  S.def = 'frost'; C.refresh(); sync(); renderFaults(); C.spot('echext');
  status('1/4 · Mode chaud : l’échangeur extérieur est glacé, le givre se forme');
  defT = setTimeout(() => {
    S.def = 'defrost'; C.refresh(); C.spot('v4v');
    status('2/4 · La vanne 4 voies bascule : le cycle s’inverse, comme en mode froid');
    defT = setTimeout(() => {
      C.spot('echext');
      status('3/4 · Le gaz chaud (en rouge) part dehors et fait fondre le givre. Ventilateurs à l’arrêt');
      defT = setTimeout(() => {
        S.def = null; C.refresh(); C.spot('v4v');
        status('4/4 · La vanne rebascule : le chauffage reprend');
        defT = setTimeout(endDef, 2800);
      }, 5200);
    }, 2600);
  }, 4200);
}
function endDef() {
  clearTimeout(defT); status(''); C.spot(null);
  if (defX !== null) { S.xray = defX; defX = null; C.refresh(); sync(); }
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
  $('#dockAns').innerHTML = ''; $('#dockPrev').hidden = false; $('#dockPrev').disabled = i === 0; $('#dockHelp').hidden = true; $('#dockHud').hidden = true;
  $('#dockNext').textContent = i === TOUR.length - 1 ? 'Terminer' : 'Suivant';
  C.spot(s[0]);
}
function closeDock() { ti = -1; quiz.on = false; quiz.find = null; S.quizfind = false; C.spot(null); C.refresh(); dock(false); endQuiz(); }
const stopDef = () => { S.def = null; endDef(); };
$('#bT').onclick = () => { stopDef(); endQuiz(); setView('coupe'); dock(true); tourGo(0); };
$('#dockClose').onclick = closeDock;
$('#dockPrev').onclick = () => { if (!quiz.on && ti > 0) tourGo(ti - 1); };
$('#dockNext').onclick = () => { if (quiz.on) return quizNext(); if (ti < TOUR.length - 1) tourGo(ti + 1); else closeDock(); };
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#qover').hidden) return closeDock();
  if ($('#dock').hidden || /INPUT|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') $('#dockNext').click(); if (e.key === 'ArrowLeft') $('#dockPrev').click(); if (e.key === 'Escape') closeDock();
});

/* ---------- Quiz : le défi clim, par niveaux ---------- */
// k : qcm (choix), vf (vrai/faux), find (cliquer sur le schéma), ordre (remettre dans l’ordre)
// set : réglage du schéma pour la question ; hint : coup de pouce ; why : explication
const LEVELS = [
  { t: 'Les bases', d: 'Comment une clim déplace la chaleur', q: [
    { k: 'qcm', q: 'En mode froid, que fait une climatisation ?', a: ['Elle fabrique du froid', 'Elle déplace la chaleur de la pièce vers l’extérieur', 'Elle fait entrer l’air frais du dehors'], ok: 1, hint: 'Regardez la couleur de l’air qui sort du groupe extérieur.', why: 'Elle transporte la chaleur. L’air de la pièce reste le même, il est simplement refroidi.' },
    { k: 'vf', q: 'En été, le groupe extérieur souffle de l’air chaud.', ok: true, set: { mode: 'cool' }, hint: 'Ce qu’on enlève de la pièce doit bien aller quelque part.', why: 'Vrai : il rejette dehors la chaleur retirée de la pièce.' },
    { k: 'qcm', q: 'Qu’est-ce qui transporte la chaleur entre l’intérieur et l’extérieur ?', a: ['L’air de la pièce', 'L’eau des condensats', 'Un fluide qui circule dans des tubes en cuivre'], ok: 2, set: { xray: true }, hint: 'Le Rayon X est allumé : regardez ce qui circule dans les tubes.', why: 'Le fluide frigorigène fait la navette en circuit fermé dans les liaisons en cuivre.' },
    { k: 'vf', q: 'Une clim réversible peut aussi chauffer en hiver.', ok: true, set: { mode: 'heat' }, hint: 'Regardez le bouton en haut de l’écran : Froid / Chaud.', why: 'Vrai : on inverse le sens du fluide, et la chaleur est captée dehors pour être apportée dedans.' },
    { k: 'qcm', q: 'En hiver, où le groupe extérieur trouve-t-il la chaleur ?', a: ['Dans l’air extérieur, même s’il fait froid', 'Dans une résistance électrique', 'Dans le sol du jardin'], ok: 0, set: { mode: 'heat' }, hint: 'Le ventilateur du groupe continue de tourner : il fait passer quelque chose dans l’échangeur.', why: 'Même à −2 °C, l’air contient de la chaleur. Le fluide, encore plus froid, sait la capter.' },
    { k: 'vf', q: 'Le fluide frigorigène s’use et doit être rechargé tous les ans.', ok: false, hint: 'Le circuit est fermé, comme un circuit de chauffage central.', why: 'Faux : le fluide tourne en circuit fermé. S’il en manque, c’est qu’il y a une fuite.' },
    { k: 'ordre', q: 'Remettez dans l’ordre le trajet de la chaleur en été.', a: ['La chaleur de la pièce entre dans l’unité intérieure', 'Le fluide l’emporte dans les tubes', 'Le compresseur la concentre', 'Le groupe extérieur la rejette dehors'], set: { xray: true }, hint: 'On part de la pièce et on finit dehors.', why: 'Pièce → fluide → compresseur → dehors : c’est tout le principe de la clim.' }
  ] },
  { t: 'Le matériel', d: 'Reconnaître chaque élément sur le schéma', q: [
    { k: 'find', q: 'Montrez le groupe extérieur.', find: 'groupe', hint: 'Il est dehors, fixé contre le mur.', why: 'Le groupe extérieur contient le compresseur, un échangeur et un ventilateur.' },
    { k: 'find', q: 'Montrez l’unité intérieure.', find: 'u-', hint: 'Elle est dans la pièce, en haut du mur.', why: 'C’est elle qui souffle l’air traité dans la pièce.' },
    { k: 'find', q: 'Montrez le disjoncteur dédié à la clim.', find: 'disj', hint: 'Cherchez le tableau électrique de la maison.', why: 'Un disjoncteur dans le tableau protège uniquement la climatisation.' },
    { k: 'find', q: 'Montrez le ventilateur du groupe extérieur.', find: 'ventilo', hint: 'Une grande hélice derrière la grille du groupe.', why: 'Il force l’air à traverser l’échangeur. Sans air, pas d’échange de chaleur.' },
    { k: 'find', q: 'Montrez les liaisons frigorifiques.', find: 'liaison', set: { xray: true }, hint: 'Deux tubes en cuivre qui relient le groupe à l’unité intérieure.', why: 'Un petit tube pour le liquide, un gros pour le gaz.' },
    { k: 'find', q: 'Montrez le compresseur.', find: 'compresseur', set: { xray: true }, hint: 'Dans le groupe extérieur, une grosse bouteille.', why: 'Le cœur du système : il comprime le gaz et le fait circuler.' },
    { k: 'find', q: 'Montrez la vanne 4 voies.', find: 'v4v', set: { xray: true }, hint: 'Un petit aiguillage collé au compresseur.', why: 'C’est elle qui inverse le sens du fluide pour passer du froid au chaud.' }
  ] },
  { t: 'La pose', d: 'Électricité, condensats, supports', q: [
    { k: 'vf', q: 'On peut brancher la clim sur une prise partagée avec d’autres appareils.', ok: false, hint: 'Regardez ce qui part du tableau électrique.', why: 'Faux : la clim a sa propre ligne et son propre disjoncteur.' },
    { k: 'qcm', q: 'Que cache la goulotte le long du mur ?', a: ['Les liaisons frigo, le câble et l’évacuation des condensats', 'Uniquement le câble électrique', 'L’air soufflé vers la pièce'], ok: 0, set: { xray: true, drain: 'goulotte' }, hint: 'Le Rayon X rend la goulotte transparente.', why: 'Tout passe dans la goulotte : liaisons, câble d’interconnexion et condensats.' },
    { k: 'qcm', q: 'Les condensats, c’est…', a: ['De l’eau venant de l’humidité de l’air', 'Une fuite de fluide frigorigène', 'De l’huile du compresseur'], ok: 0, hint: 'Pensez à la buée sur un verre sorti du frigo.', why: 'L’air qui refroidit dépose son humidité sur l’échangeur froid.' },
    { k: 'qcm', q: 'Pourquoi le tuyau de condensats doit-il toujours descendre ?', a: ['Pour que l’eau s’écoule toute seule', 'Pour refroidir l’eau', 'Pour que ce soit plus joli'], ok: 0, hint: 'L’eau ne remonte jamais toute seule.', why: 'Sans pente continue, l’eau stagne et finit par couler sur le mur.' },
    { k: 'find', q: 'Montrez la pompe de relevage.', find: 'pompe', set: { drain: 'goulotte', xray: true }, hint: 'Un petit boîtier bleu dans la goulotte, sous l’unité.', why: 'Elle remonte l’eau quand une pente naturelle est impossible.' },
    { k: 'qcm', q: 'À quoi servent les plots en caoutchouc sous le groupe ?', a: ['À absorber les vibrations et le bruit', 'À isoler du courant électrique', 'À augmenter la puissance'], ok: 0, hint: 'Le compresseur et le ventilateur tournent en permanence.', why: 'Ils évitent que les vibrations passent dans le mur et dans la maison.' },
    { k: 'vf', q: 'Le câble d’interconnexion permet aux deux unités de se parler.', ok: true, set: { xray: true }, hint: 'Il relie l’unité intérieure au groupe, en plus des tubes.', why: 'Vrai : il transporte l’alimentation et les informations entre les deux unités.' }
  ] },
  { t: 'Les systèmes', d: 'Multi-split, VRF, gainable', q: [
    { k: 'qcm', q: 'Dans ce multi-split, comment sont raccordées les unités ?', a: ['Un réseau commun avec des refnets', 'Chacune a sa propre liaison jusqu’au groupe', 'Chacune a son propre groupe'], ok: 1, set: { sys: 'multi', xray: true }, hint: 'Comptez les liaisons qui arrivent au groupe.', why: 'Une liaison par unité. Le réseau commun avec refnets, c’est le VRF.' },
    { k: 'qcm', q: 'Sur un VRF, comment s’appelle le raccord en Y à chaque piquage ?', a: ['Un refnet', 'Un détendeur', 'Un registre'], ok: 0, set: { sys: 'vrf', xray: true }, hint: 'Un mot anglais en six lettres.', why: 'Le refnet prélève le fluide pour une unité et laisse passer le reste.' },
    { k: 'find', q: 'Montrez un refnet sur ce VRF.', find: 'refnet', set: { sys: 'vrf', xray: true }, hint: 'Un petit Y sur le réseau, là où une unité se branche.', why: 'Un refnet par unité, sauf la dernière de la ligne.' },
    { k: 'qcm', q: 'Avec un gainable, que voit-on dans les pièces ?', a: ['Seulement des bouches et une grille de reprise', 'Une unité accrochée au mur', 'Rien du tout'], ok: 0, set: { types: 'gainable' }, hint: 'L’appareil est caché dans le faux plafond.', why: 'Tout est caché : on ne voit que les bouches de soufflage et la reprise.' },
    { k: 'vf', q: 'Avec le zoning, chaque pièce peut avoir sa propre température.', ok: true, set: { types: 'gainable', zoning: true }, hint: 'Chaque pièce a son thermostat.', why: 'Vrai : le thermostat de chaque pièce ouvre ou ferme son registre.' },
    { k: 'find', q: 'Montrez un registre motorisé.', find: 'registre', set: { types: 'gainable', zoning: true, xray: true }, hint: 'Un volet à la sortie du gainable, sur le départ d’une gaine.', why: 'Il ouvre ou ferme l’air d’une pièce, commandé par son thermostat.' },
    { k: 'qcm', q: 'Reprise d’air dans le couloir : que faut-il prévoir sur les portes ?', a: ['Un détalonnage, un jour sous la porte', 'Des portes vitrées', 'Rien de particulier'], ok: 0, set: { types: 'gainable' }, hint: 'L’air soufflé dans la chambre doit pouvoir revenir, porte fermée.', why: 'Sans détalonnage, la pièce se met en surpression et le débit chute.' }
  ] },
  { t: 'Pannes et bons réflexes', d: 'Reconnaître ce qui cloche', q: [
    { k: 'qcm', q: 'Un filtre encrassé, qu’est-ce que ça change ?', a: ['Rien, c’est esthétique', 'Moins d’air passe : moins de puissance, plus de consommation', 'La clim souffle plus fort'], ok: 1, set: { fault: 'filtre' }, hint: 'Regardez le débit d’air sous l’unité.', why: 'Moins d’air sur l’échangeur, c’est moins de chaleur échangée.' },
    { k: 'qcm', q: 'De l’eau coule de l’unité intérieure le long du mur. Cause la plus probable ?', a: ['Évacuation des condensats bouchée ou en contre-pente', 'Il manque du fluide', 'Le disjoncteur est trop petit'], ok: 0, set: { fault: 'pente' }, hint: 'C’est de l’eau, pas du fluide.', why: 'L’eau de condensation ne s’évacue plus : le bac déborde.' },
    { k: 'vf', q: 'En hiver, il est normal que le groupe s’arrête parfois de souffler et fume un peu.', ok: true, set: { mode: 'heat' }, hint: 'Par temps froid, du givre se forme sur l’échangeur.', why: 'Vrai : c’est le dégivrage. La « fumée » est de la vapeur d’eau.' },
    { k: 'qcm', q: 'Le groupe est coincé contre une haie. Conséquence ?', a: ['Il reprend son propre air et perd en efficacité', 'Aucune', 'Il fait moins de bruit'], ok: 0, set: { fault: 'obstrue' }, hint: 'Regardez où repart l’air soufflé.', why: 'Il recycle son air chaud : il force, consomme plus et peut se mettre en sécurité.' },
    { k: 'qcm', q: 'Il manque du fluide frigorigène. Que faut-il faire ?', a: ['Chercher et réparer la fuite avant de recharger', 'En rajouter chaque été', 'Changer le filtre'], ok: 0, set: { fault: 'fluide' }, hint: 'Le circuit est fermé : le fluide ne disparaît pas tout seul.', why: 'Recharger sans réparer, c’est retrouver la panne quelques mois plus tard.' },
    { k: 'qcm', q: 'Qui a le droit d’intervenir sur le fluide frigorigène ?', a: ['Un technicien titulaire de l’attestation d’aptitude', 'Tout le monde', 'N’importe quel électricien'], ok: 0, hint: 'Ces fluides sont réglementés.', why: 'La manipulation des fluides demande une attestation, pour la sécurité et l’environnement.' },
    { k: 'find', q: 'Montrez où part l’eau de condensation.', find: 'condensats', set: { xray: true }, hint: 'Un petit tuyau qui part de l’unité intérieure et goutte dehors.', why: 'Évacuation en pente continue, ou pompe de relevage si c’est impossible.' }
  ] },
  { t: 'Dimensionner', d: 'Les calculs de base, pas à pas', q: [
    { k: 'qcm', q: 'Une pièce de 4 m × 5 m sous 2,5 m de plafond. Quel volume ?', a: ['20 m³', '50 m³', '11,5 m³'], ok: 1, hint: 'Longueur × largeur × hauteur.', why: '4 × 5 = 20 m², puis 20 × 2,5 = 50 m³.' },
    { k: 'qcm', q: '50 m³ avec la règle des 40 W/m³ : quelle puissance ?', a: ['2 000 W, soit 2 kW', '200 W', '90 W'], ok: 0, hint: 'On multiplie le volume par 40.', why: '50 × 40 = 2 000 W = 2 kW.' },
    { k: 'qcm', q: 'Un brassage de 5 volumes par heure dans 50 m³, c’est quel débit d’air ?', a: ['10 m³/h', '250 m³/h', '2 500 m³/h'], ok: 1, hint: 'On renouvelle 5 fois le volume en une heure.', why: '50 × 5 = 250 m³/h.' },
    { k: 'qcm', q: 'Lequel augmente le besoin de froid ?', a: ['Une grande baie vitrée plein sud', 'Un plafond plus bas', 'Un sol carrelé'], ok: 0, hint: 'Pensez à ce qui fait entrer de la chaleur.', why: 'Le soleil à travers le vitrage est un gros apport de chaleur.' },
    { k: 'vf', q: 'Une salle serveur ou un four ajoutent de la chaleur à évacuer.', ok: true, hint: 'Tout appareil qui fonctionne chauffe.', why: 'Vrai : on ajoute ces apports au calcul de base.' },
    { k: 'qcm', q: 'Un séjour de 30 m² sous 2,5 m, à 40 W/m³ : environ ?', a: ['3 kW', '1 kW', '7,5 kW'], ok: 0, hint: 'D’abord le volume : 30 × 2,5.', why: '30 × 2,5 = 75 m³, et 75 × 40 = 3 000 W = 3 kW.' }
  ] }
];
const RANKS = [[0, 'Curieux'], [3, 'Apprenti'], [7, 'Installateur'], [11, 'Technicien'], [15, 'Expert clim']];
const QKEY = 'climapprendre-defi';
let best = { lv: {}, all: false };
try { best = Object.assign(best, JSON.parse(localStorage.getItem(QKEY)) || {}); } catch (e) { }
const qsave = () => { try { localStorage.setItem(QKEY, JSON.stringify(best)); } catch (e) { } };
const totStars = () => LEVELS.reduce((n, l, i) => n + ((best.lv[i] || {}).stars || 0), 0);
const rank = () => RANKS.filter(r => totStars() >= r[0]).pop()[1];
const unlocked = i => i === 0 || best.all || ((best.lv[i - 1] || {}).stars || 0) >= 1;
const starRow = n => [0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}">★</i>`).join('');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const quiz = { on: false, lv: 0, i: 0, base: 0, bonus: 0, streak: 0, bestStreak: 0, help: 2, done: false, find: null, tries: 0, helped: false, missed: [], ord: null, snap: null, cfg: '' };
const SNAP = ['view', 'reprise', 'salonD', 'sys', 'types', 'mode', 'xray', 'labels', 'zoning', 'zones', 'drain', 'support', 'diff', 'power', 'fault'];
const cur = () => LEVELS[quiz.lv].q[quiz.i];

function over(html) { const o = $('#qover'); o.innerHTML = html; o.hidden = !html; }
function applySet(set) {
  set = set || {};
  if (S.view !== 'coupe') { S.view = 'coupe'; quiz.cfg = ''; }
  const c = { sys: 'mono', types: 'mural', xray: false, zoning: true, drain: 'gravite', fault: null, mode: 'cool', ...set };
  setMode(c.mode);
  S.labels = false; S.power = true; S.fault = c.fault; S.xray = c.xray;
  const key = [c.sys, c.types, c.zoning, c.drain].join('|');
  if (key !== quiz.cfg) {
    quiz.cfg = key;
    S.sys = c.sys; S.types = [c.types]; S.zoning = c.zoning; S.zones = [true, true, true]; S.drain = c.drain;
    C.build();
  }
}
function endQuiz() {
  if (!quiz.snap) return;
  const s = JSON.parse(quiz.snap); quiz.snap = null; quiz.on = false; quiz.find = null; quiz.cfg = '';
  S.quizfind = false; setMode(s.mode); Object.assign(S, s); C.build(); sync(); renderFaults();
  over(''); $('#dockHud').hidden = true; $('#dockHelp').hidden = true;
}

function qMap() {
  quiz.on = false; quiz.find = null; S.quizfind = false; C.spot(null);
  if ($('#dock').hidden === false) dock(false);
  const t = totStars();
  over(`<div class="qcard">
    <div class="qtop"><div><h3>Le défi clim</h3><p>Six niveaux, du plus simple au plus technique. Une étoile suffit pour ouvrir le niveau suivant.</p></div>
    <div class="qrank"><span>Grade</span><b>${rank()}</b><small>${t} étoile${t > 1 ? 's' : ''} sur ${LEVELS.length * 3}</small></div></div>
    <div class="qlevels">${LEVELS.map((L, i) => { const u = unlocked(i), b = best.lv[i] || {}; return `<button class="qlv${u ? '' : ' locked'}${b.stars ? ' played' : ''}" data-lv="${i}"${u ? '' : ' disabled'}>
      <span class="qn">${i + 1}</span><b>${L.t}</b><small>${L.d}</small>
      <span class="qfoot"><span class="qstars">${starRow(b.stars || 0)}</span>${u ? (b.pts ? `<em>${b.pts} pts</em>` : `<em>${L.q.length} questions</em>`) : '<em>Verrouillé</em>'}</span></button>`; }).join('')}</div>
    <div class="qbar"><button id="qAll">${best.all ? 'Remettre les verrous' : 'Formateur : tout débloquer'}</button><button id="qReset">Effacer les scores</button><span></span><button id="qClose" class="primary">Fermer</button></div>
  </div>`);
  $$('#qover .qlv').forEach(b => b.onclick = () => qStart(+b.dataset.lv));
  $('#qAll').onclick = () => { best.all = !best.all; qsave(); qMap(); };
  $('#qReset').onclick = () => { if (confirm('Effacer toutes les étoiles et les scores de ce poste ?')) { best = { lv: {}, all: best.all }; qsave(); qMap(); } };
  $('#qClose').onclick = closeDock;
}
function qStart(lv) {
  Object.assign(quiz, { on: true, lv, i: 0, base: 0, bonus: 0, streak: 0, bestStreak: 0, help: 2, missed: [] });
  over(''); dock(true); quizShow();
}
function hud(pop) {
  const L = LEVELS[quiz.lv], n = L.q.length;
  const pips = L.q.map((q, i) => `<i class="${i < quiz.i ? (quiz.res[i] || '') : i === quiz.i ? 'now' : ''}"></i>`).join('');
  $('#dockHud').innerHTML = `<span class="hl">Niveau ${quiz.lv + 1} · ${L.t}</span><span class="pips">${pips}</span><span class="hs"><b>${quiz.base + quiz.bonus}</b> pts</span>${quiz.streak >= 2 ? `<span class="hstreak">Série de ${quiz.streak}</span>` : ''}${pop ? `<span class="hpop">${pop}</span>` : ''}`;
  $('#dockHud').hidden = false;
  $('#dockStep').textContent = (quiz.i + 1) + ' / ' + n;
  $('#dockHelp').textContent = 'Coup de pouce (' + quiz.help + ')';
  $('#dockHelp').disabled = quiz.help <= 0 || quiz.done;
}
function quizShow() {
  const q = cur(); if (quiz.i === 0) quiz.res = [];
  Object.assign(quiz, { done: false, tries: 0, helped: false, find: q.k === 'find' ? q.find : null, ord: null });
  applySet(q.set);
  S.quizfind = q.k === 'find'; C.refresh(); sync(); C.spot(null);
  $('#dockTitle').textContent = q.q;
  $('#dockText').textContent = q.k === 'find' ? 'Cliquez sur le bon élément du schéma.' : q.k === 'ordre' ? 'Cliquez les étapes dans le bon ordre.' : '';
  const A = $('#dockAns');
  if (q.k === 'qcm') A.innerHTML = shuffle(q.a.map((a, i) => i)).map(i => `<button data-i="${i}">${q.a[i]}</button>`).join('');
  else if (q.k === 'vf') A.innerHTML = '<button data-v="1" class="vf">Vrai</button><button data-v="0" class="vf">Faux</button>';
  else if (q.k === 'ordre') { quiz.ord = { n: 0, err: 0 }; A.innerHTML = shuffle(q.a.map((a, i) => i)).map(i => `<button data-o="${i}">${q.a[i]}</button>`).join(''); }
  else A.innerHTML = '';
  A.className = 'dock-answers' + (q.k === 'ordre' ? ' ordre' : '');
  $$('#dockAns [data-i]').forEach(b => b.onclick = () => { b.classList.add(+b.dataset.i === q.ok ? 'ok' : 'ko'); if (+b.dataset.i !== q.ok) $(`#dockAns [data-i="${q.ok}"]`).classList.add('ok'); finish(+b.dataset.i === q.ok); });
  $$('#dockAns [data-v]').forEach(b => b.onclick = () => { const g = (b.dataset.v === '1') === q.ok; b.classList.add(g ? 'ok' : 'ko'); if (!g) $(`#dockAns [data-v="${q.ok ? 1 : 0}"]`).classList.add('ok'); finish(g); });
  $$('#dockAns [data-o]').forEach(b => b.onclick = () => ordPick(b));
  $('#dockPrev').hidden = true; $('#dockHelp').hidden = false; $('#dockNext').textContent = 'Passer';
  hud();
}
function ordPick(b) {
  if (quiz.done || b.classList.contains('ok')) return;
  const q = cur(), o = quiz.ord;
  if (+b.dataset.o === o.n) { o.n++; b.classList.remove('next'); b.classList.add('ok'); b.dataset.n = o.n; if (o.n === q.a.length) finish(o.err <= 1, o.err === 1); }
  else { o.err++; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); $('#dockText').textContent = o.err === 1 ? 'Pas encore celle-là. Une erreur permise.' : 'Encore raté : cette question ne rapportera rien, mais terminez l’ordre.'; }
}
function finish(good, partial) {
  if (quiz.done) return; quiz.done = true;
  const q = cur(), full = good && !partial && !quiz.helped && quiz.tries === 0;
  const pts = good ? (full ? 100 : 50) : 0;
  let bonus = 0;
  if (full) { quiz.streak++; if (quiz.streak >= 3) bonus = 25; } else if (!good) quiz.streak = 0;
  quiz.bestStreak = Math.max(quiz.bestStreak, quiz.streak);
  quiz.base += pts; quiz.bonus += bonus;
  quiz.res[quiz.i] = full ? 'ok' : good ? 'mid' : 'ko';
  if (!good) quiz.missed.push(q);
  if (q.k === 'ordre' && !good) $$('#dockAns [data-o]').forEach(b => { if (!b.classList.contains('ok')) { b.classList.add('ok'); b.dataset.n = +b.dataset.o + 1; } });
  $('#dockText').textContent = (full ? 'Bravo ! ' : good ? 'Correct. ' : 'Pas tout à fait. ') + q.why;
  if (q.k === 'find') { quiz.find = null; S.quizfind = false; C.refresh(); C.spot(q.find === 'u-' ? 'uint' : q.find); }
  $('#dockAns').classList.add('done');
  $('#dockNext').textContent = quiz.i === LEVELS[quiz.lv].q.length - 1 ? 'Voir le résultat' : 'Question suivante';
  hud(pts ? '+' + (pts + bonus) + (bonus ? ' (série)' : '') : '');
  if (!good) { const d = $('#dock'); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); }
}
function quizPick(id) {
  if (quiz.done) return;
  const q = cur(), ok = id === q.find || (q.find === 'u-' && id.startsWith('u-'));
  if (ok) return finish(true, quiz.tries > 0);
  quiz.tries++;
  if (quiz.tries < 2) {
    const nm = INFO[id] ? INFO[id][0] : 'un autre élément';
    $('#dockText').textContent = `Non, ça c’est : ${nm}. Encore un essai !`;
    const d = $('#dock'); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
  } else finish(false);
}
function quizHelp() {
  if (quiz.done || quiz.help <= 0 || quiz.helped) return;
  const q = cur(); quiz.help--; quiz.helped = true;
  $('#dockText').textContent = 'Coup de pouce : ' + q.hint;
  if (q.k === 'qcm') { const w = shuffle($$('#dockAns [data-i]').filter(b => +b.dataset.i !== q.ok))[0]; if (w) { w.disabled = true; w.classList.add('gone'); } }
  if (q.k === 'ordre') { const nb = $(`#dockAns [data-o="${quiz.ord.n}"]`); if (nb) nb.classList.add('next'); }
  hud();
}
function quizNext() {
  if (!quiz.on) return;
  if (!quiz.done) { quiz.tries = 2; finish(false); return; }
  quiz.i++;
  if (quiz.i < LEVELS[quiz.lv].q.length) return quizShow();
  qResult();
}
function qResult() {
  const L = LEVELS[quiz.lv], max = L.q.length * 100, r = quiz.base / max;
  const stars = r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.5 ? 1 : 0, total = quiz.base + quiz.bonus;
  const was = unlocked(quiz.lv + 1), b = best.lv[quiz.lv] || {};
  if (stars > (b.stars || 0) || (stars === (b.stars || 0) && total > (b.pts || 0))) { best.lv[quiz.lv] = { stars: Math.max(stars, b.stars || 0), pts: Math.max(total, b.pts || 0) }; qsave(); }
  const opened = !was && unlocked(quiz.lv + 1) && quiz.lv + 1 < LEVELS.length;
  quiz.on = false; quiz.find = null; S.quizfind = false; C.spot(null); C.refresh(); dock(false);
  const title = ['Pas encore… on recommence ?', 'Niveau réussi', 'Très bien !', 'Parfait !'][stars];
  over(`<div class="qcard qres">
    <p class="qkick">Niveau ${quiz.lv + 1} · ${L.t}</p>
    <div class="qbig">${[0, 1, 2].map(i => `<i class="${i < stars ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.35}s">★</i>`).join('')}</div>
    <h3>${title}</h3>
    <div class="qnums"><div><b>${total}</b><span>points</span></div><div><b>${quiz.res.filter(x => x === 'ok').length} / ${L.q.length}</b><span>du premier coup</span></div><div><b>${quiz.bestStreak}</b><span>meilleure série</span></div></div>
    ${opened ? `<p class="qopen">Niveau ${quiz.lv + 2} débloqué : ${LEVELS[quiz.lv + 1].t}</p>` : ''}
    ${stars === 0 ? '<p class="qtip">Il faut la moitié des points pour gagner une étoile. Les coups de pouce sont là pour ça !</p>' : ''}
    ${quiz.missed.length ? `<div class="qmiss"><b>À retenir</b>${quiz.missed.map(q => `<p><strong>${q.q}</strong> ${q.why}</p>`).join('')}</div>` : ''}
    <div class="qbar"><button id="qMapB">Tous les niveaux</button><button id="qAgain">Rejouer</button><span></span>${quiz.lv + 1 < LEVELS.length && unlocked(quiz.lv + 1) ? '<button id="qNextL" class="primary">Niveau suivant</button>' : '<button id="qEnd" class="primary">Terminer</button>'}</div>
  </div>`);
  $('#qMapB').onclick = qMap; $('#qAgain').onclick = () => qStart(quiz.lv);
  if ($('#qNextL')) $('#qNextL').onclick = () => qStart(quiz.lv + 1);
  if ($('#qEnd')) $('#qEnd').onclick = closeDock;
}
$('#dockHelp').onclick = quizHelp;
$('#bQ').onclick = () => {
  stopDef(); ti = -1;
  if (!quiz.snap) { const s = {}; SNAP.forEach(k => s[k] = S[k]); quiz.snap = JSON.stringify(s); quiz.cfg = ''; }
  qMap();
};

/* ---------- Démarrage ---------- */
C.build(); sync(); showHome(); renderDim(); renderFaults();
})();
