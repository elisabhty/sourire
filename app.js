/* Sourire — suivi de traitement orthodontique (PWA).
   Tout reste sur l'appareil : infos dans localStorage, photos dans IndexedDB. Aucun serveur. */
(() => {
'use strict';

// ---------- Constantes ----------
const VIEWS = [
  ['face', 'Sourire de face', 'Face'], ['droite', 'Côté droit', 'Droite'], ['gauche', 'Côté gauche', 'Gauche'],
  ['haut', 'Arcade du haut', 'Haut'], ['bas', 'Arcade du bas', 'Bas'], ['profil', 'Visage de profil', 'Profil'],
];
const VIEW_LABEL = Object.fromEntries(VIEWS.map(v => [v[0], v[1]]));
const VIEW_SHORT = Object.fromEntries(VIEWS.map(v => [v[0], v[2]]));
const TYPES = [['bagues', 'Bagues'], ['aligneurs', 'Aligneurs'], ['lingual', 'Lingual'], ['contention', 'Contention'], ['autre', 'Autre']];
const TYPE_LABEL = Object.fromEntries(TYPES);
const TABS = [['home', 'Accueil', 'home'], ['photos', 'Photos', 'photos'], ['compare', 'Comparer', 'compare'], ['suivi', 'Suivi', 'calendar'], ['share', 'Cabinet', 'cabinet']];
const KEY = 'sourire.v1';
const DAY = 864e5;

// ---------- Icônes (style SF Symbols) ----------
const P = {
  home: '<path d="M4 10.2 12 3.8l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H5.5A1.5 1.5 0 0 1 4 19z"/>',
  photos: '<rect x="3" y="4.5" width="18" height="15" rx="3.5"/><circle cx="8.8" cy="9.6" r="1.7"/><path d="m21 15.5-4.6-4.6a1.2 1.2 0 0 0-1.7 0L6.5 19.4"/>',
  compare: '<rect x="3" y="4" width="18" height="16" rx="3.5"/><path d="M12 2.5v19M7.5 10 5.8 12l1.7 2M16.5 10l1.7 2-1.7 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v3.5M16 3v3.5M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
  cabinet: '<rect x="3" y="7" width="18" height="13" rx="3.5"/><path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7M12 10.5v6M9 13.5h6"/>',
  camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.8" r="3.6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  xmark: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  share: '<path d="M12 14.5V3.5M7.8 7.7 12 3.5l4.2 4.2"/><path d="M8 10.5H6.5A2.5 2.5 0 0 0 4 13v5.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V13a2.5 2.5 0 0 0-2.5-2.5H16"/>',
  trash: '<path d="M4 6.5h16M9.5 3.5h5M6.3 6.5l.9 12.7A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.8l.9-12.7M10 10.5v6M14 10.5v6"/>',
  pencil: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  play: '<path d="M8 5.2v13.6c0 .8.9 1.3 1.6.8l10-6.8a1 1 0 0 0 0-1.6l-10-6.8C8.9 3.9 8 4.4 8 5.2z" fill="currentColor"/>',
  pause: '<path d="M8.5 5.5v13M15.5 5.5v13" stroke-width="3.2"/>',
  doc: '<path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  down: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
  up: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 20h14"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c.7-3.5 3-5.5 6-5.5s5.3 2 6 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.5c2.4.2 4 1.9 4.5 4.5"/>',
  flip: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><path d="M8.8 12.3a3.2 3.2 0 0 1 5.6-1.8M15.2 13.3a3.2 3.2 0 0 1-5.6 1.8M14.6 8.6v2h-2M9.4 17v-2h2"/>',
  layers: '<rect x="3.5" y="3.5" width="12" height="12" rx="3"/><rect x="8.5" y="8.5" width="12" height="12" rx="3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10.5" rx="2.8"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6h.01"/>',
  chevL: '<path d="m15 5-7 7 7 7"/>',
  chevR: '<path d="m9 5 7 7-7 7"/>',
  sparkle: '<path d="M12 3.5 13.8 10l6.7 2-6.7 2L12 20.5 10.2 14l-6.7-2 6.7-2z"/>',
};
const ic = (n, s = 22) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const CHEV = '<svg class="chev" viewBox="0 0 8 14" aria-hidden="true"><path d="m1.5 1.5 5 5.5-5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const UPDOWN = '<svg class="chev ud" viewBox="0 0 10 16" aria-hidden="true"><path d="m2 6 3-3 3 3M2 10l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---------- Utilitaires ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y || 2000, (m || 1) - 1, d || 1); };
const fmt = (s, o = { day: 'numeric', month: 'long', year: 'numeric' }) => toDate(s).toLocaleDateString('fr-FR', o);
const fmtShort = s => fmt(s, { day: 'numeric', month: 'short' }).replace('.', '');
const fmtMY = s => fmt(s, { month: 'short', year: 'numeric' }).replace('.', '');
const monthAbbr = s => fmt(s, { month: 'short' }).replace('.', '');
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
const addMonths = (s, n) => { const d = toDate(s); d.setMonth(d.getMonth() + n); return iso(d); };
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
const euro = n => Number(n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const size = n => n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} Ko` : `${(n / 1e6).toFixed(1).replace('.', ',')} Mo`;
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const rel = d => { const n = daysBetween(iso(), d); return n === 0 ? "aujourd’hui" : n === 1 ? 'demain' : n > 1 ? `dans ${n} jours` : n === -1 ? 'hier' : `il y a ${-n} jours`; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const initial = p => (p?.name || '?').trim().charAt(0).toUpperCase();
const opts = (list, sel) => list.map(([v, l]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`).join('');

// Retour haptique léger (iOS 18+ : un interrupteur natif déclenche la vibration).
const hapticEl = $('#haptic');
const haptic = () => { try { hapticEl.click(); navigator.vibrate?.(8); } catch { /* rien */ } };

let hudTimer;
function hud(msg, icon = 'check', ms = 2200) {
  const h = $('#hud');
  h.innerHTML = `${ic(icon, 20)}<span>${esc(msg)}</span>`;
  h.classList.add('on');
  clearTimeout(hudTimer); hudTimer = setTimeout(() => h.classList.remove('on'), ms);
}

// ---------- État ----------
const blank = () => ({ profiles: [], activeId: null, photos: [], rdv: [], questions: [], payments: [] });
let state = blank();
try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* état neuf */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { hud('Stockage plein', 'info'); } };
const me = () => state.profiles.find(p => p.id === state.activeId) || null;
const mine = k => state[k].filter(x => x.profileId === state.activeId);
const myPhotos = view => mine('photos').filter(p => !view || view === 'all' || p.view === view)
  .sort((a, b) => a.date.localeCompare(b.date) || (a.t || 0) - (b.t || 0) || a.id.localeCompare(b.id));

const ui = { tab: 'home', filter: 'all', cmpView: null, cmpA: null, cmpB: null, cmpMode: 'slider', x: 50, fade: 50, ringDone: false };

// ---------- Photos (IndexedDB, gardées en mémoire pour un partage instantané) ----------
let db;
const blobs = new Map(), urls = new Map();
const openDB = () => new Promise((res, rej) => {
  const r = indexedDB.open('sourire', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('photos');
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
const tx = (mode, fn) => new Promise((res, rej) => {
  const t = db.transaction('photos', mode); const out = fn(t.objectStore('photos'));
  t.oncomplete = () => res(out.result); t.onerror = t.onabort = () => rej(t.error);
});
const remember = (id, b) => { blobs.set(id, b); urls.set(id, URL.createObjectURL(b)); };
const putBlob = (id, b) => tx('readwrite', s => s.put(b, id)).then(() => remember(id, b));
const delBlob = id => tx('readwrite', s => s.delete(id)).then(() => { URL.revokeObjectURL(urls.get(id)); urls.delete(id); blobs.delete(id); });
async function loadBlobs() {
  const keys = await tx('readonly', s => s.getAllKeys());
  const vals = await tx('readonly', s => s.getAll());
  keys.forEach((k, i) => remember(k, vals[i]));
}
const src = id => urls.get(id) || '';

const loadImage = b => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(b); });
async function bitmap(b) {
  try { return await createImageBitmap(b, { imageOrientation: 'from-image' }); } catch { return loadImage(b); }
}
// Réduit la photo (1600 px max, JPEG) pour ne pas saturer le téléphone.
async function shrink(file) {
  const bmp = await bitmap(file);
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  const k = Math.min(1, 1600 / Math.max(w0, h0));
  const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('conversion')), 'image/jpeg', 0.86));
}
async function cropCover(b, w, h) {
  const bmp = await bitmap(b);
  const bw = bmp.width || bmp.naturalWidth, bh = bmp.height || bmp.naturalHeight;
  const k = Math.max(w / bw, h / bh), sw = w / k, sh = h / k;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(bmp, (bw - sw) / 2, (bh - sh) / 2, sw, sh, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.82);
}
const blobToDataURL = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
const dataURLToBlob = async u => (await fetch(u)).blob();

// ---------- Calculs ----------
function progress(p) {
  if (!p?.start || !p.months) return null;
  const end = addMonths(p.start, Number(p.months));
  const total = Math.max(1, daysBetween(p.start, end)), done = daysBetween(p.start, iso());
  const pct = Math.max(0, Math.min(100, Math.round(done / total * 100)));
  const left = Math.max(0, daysBetween(iso(), end));
  return { end, total, pct, left, day: Math.max(0, done) };
}
function aligner(p) {
  if (p?.type !== 'aligneurs' || !p.alignTotal || !p.alignStart) return null;
  const every = Number(p.alignDays) || 14, total = Number(p.alignTotal);
  const since = daysBetween(p.alignStart, iso());
  if (since < 0) return null;
  const n = Math.min(total, Math.floor(since / every) + 1);
  const next = n >= total ? null : addDays(p.alignStart, n * every);
  return { n, total, next, inDays: next ? daysBetween(iso(), next) : null };
}

// ---------- Calques : feuilles, menus, alertes ----------
const layers = [];
let vw = null, cam = null;
const syncLock = () => document.documentElement.classList.toggle('locked', layers.length > 0 || !!vw || !!cam);
function openLayer(html, { kind = '', onClose } = {}) {
  const el = document.createElement('div');
  el.className = `layer ${kind}`;
  el.innerHTML = `<div class="scrim"></div>${html}`;
  document.body.appendChild(el);
  const L = { el, onClose, close: v => closeLayer(L, v) };
  layers.push(L); syncLock();
  $('.scrim', el).onclick = () => L.close();
  return L;
}
function closeLayer(L, v) {
  if (L.closed) return; L.closed = true;
  L.el.classList.add('closing');
  layers.splice(layers.indexOf(L), 1);
  setTimeout(() => { L.el.remove(); syncLock(); }, 280);
  L.onClose?.(v);
}
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (layers.length) return layers.at(-1).close();
  if (vw) return closeViewer();
  if (cam) return closeCamera();
});

function alertBox({ title, message = '', ok = 'OK', cancel = 'Annuler', destructive = false }) {
  return new Promise(res => {
    const L = openLayer(`<div class="alert" role="alertdialog" aria-label="${esc(title)}"><div class="ab"><h3>${esc(title)}</h3>${message ? `<p>${esc(message)}</p>` : ''}</div>
      <div class="abtn ${cancel ? '' : 'one'}">${cancel ? `<button data-c>${esc(cancel)}</button>` : ''}<button data-o class="${destructive ? 'red' : 'bold'}">${esc(ok)}</button></div></div>`,
      { kind: 'center', onClose: v => res(!!v) });
    $('[data-o]', L.el).onclick = () => { haptic(); L.close(true); };
    if (cancel) $('[data-c]', L.el).onclick = () => L.close(false);
  });
}

// Les actions s'exécutent dans le geste de l'utilisateur (nécessaire pour ouvrir l'appareil photo / les fichiers).
function actionSheet(title, actions) {
  const L = openLayer(`<div class="asheet"><div class="grp">${title ? `<div class="ttl">${esc(title)}</div>` : ''}
    ${actions.map((a, i) => `<button data-i="${i}" class="${a.red ? 'red' : ''}">${a.icon ? ic(a.icon, 22) : ''}${esc(a.label)}${a.n != null ? ` <span class="n">${a.n}</span>` : ''}</button>`).join('')}</div>
    <div class="grp"><button class="cancel" data-c>Annuler</button></div></div>`, { kind: 'action' });
  $$('[data-i]', L.el).forEach(b => b.onclick = () => { L.close(); actions[b.dataset.i].run(); });
  $('[data-c]', L.el).onclick = () => L.close();
}

function sheet({ title, body, onOk, onDelete, deleteLabel = 'Supprimer', deleteMsg = '' }) {
  const L = openLayer(`<form class="sheet" novalidate autocomplete="off">
      <div class="grab"></div>
      <div class="sh-head"><button type="button" class="gbtn" data-x aria-label="Fermer">${ic('xmark', 18)}</button><div class="t">${esc(title)}</div>
        ${onOk ? `<button class="gbtn prim" aria-label="Valider">${ic('check', 20)}</button>` : '<span></span>'}</div>
      <div class="sh-body">${body}${onDelete ? `<div class="group mt"><button type="button" class="row danger" data-del>${esc(deleteLabel)}</button></div>` : ''}</div>
    </form>`);
  const f = $('form', L.el);
  $('[data-x]', f).onclick = () => L.close();
  $$('select.ovl', f).forEach(s => s.addEventListener('change', () => { const v = $('.v', s.closest('.row')); if (v) v.textContent = s.selectedOptions[0].text; }));
  f.onsubmit = async e => {
    e.preventDefault();
    if (!onOk) return;
    const bad = $$('[required]', f).find(i => !String(i.value).trim());
    if (bad) { bad.focus(); hud('Complète les champs requis', 'info'); return; }
    const btn = $('.gbtn.prim', f); btn.disabled = true;
    try { if (await onOk(new FormData(f), f) !== false) { haptic(); L.close(); } }
    catch (err) { console.error(err); hud('Oups, ça n’a pas fonctionné', 'info'); }
    btn.disabled = false;
  };
  if (onDelete) $('[data-del]', f).onclick = async () => {
    if (await alertBox({ title: `${deleteLabel} ?`, message: deleteMsg, ok: 'Supprimer', destructive: true })) { L.close(); onDelete(); }
  };
  dragToClose(L, f);
  return f;
}
function dragToClose(L, s) {
  let y0 = null, dy = 0;
  $$('.grab,.sh-head', s).forEach(z => {
    z.addEventListener('touchstart', e => { if (e.target.closest('button')) return; y0 = e.touches[0].clientY; dy = 0; s.style.transition = 'none'; }, { passive: true });
    z.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); s.style.transform = `translateY(${dy}px)`; }, { passive: true });
    z.addEventListener('touchend', () => { if (y0 === null) return; s.style.transition = ''; s.style.transform = ''; y0 = null; if (dy > 110) L.close(); });
  });
}
function shareFiles(files, title) {
  try {
    if (navigator.canShare?.({ files })) { navigator.share({ files, title }).catch(e => { if (e.name !== 'AbortError') download(files); }); return; }
  } catch { /* repli */ }
  download(files);
}
function download(files) {
  for (const f of files) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 8000);
  }
  hud(files.length > 1 ? 'Fichiers téléchargés' : 'Fichier téléchargé', 'down');
}
// Après une préparation longue, on redemande un tap : iOS n'ouvre le partage que dans un geste.
function readyToShare(files, title, sub, icon = 'doc') {
  const L = openLayer(`<div class="sheet"><div class="grab"></div><div class="ready"><div class="ready-ic">${ic(icon, 32)}</div>
    <h3>${esc(title)}</h3><p>${esc(sub)}</p><button class="btn" data-s>${ic('share', 20)}Partager</button><button class="btn soft" data-c>Fermer</button></div></div>`);
  $('[data-s]', L.el).onclick = () => shareFiles(files, title);
  $('[data-c]', L.el).onclick = () => L.close();
  dragToClose(L, $('.sheet', L.el));
}

// ---------- Profils ----------
function profileSheet(p) {
  const isNew = !p; const d = p || { type: 'bagues', start: iso(), months: 18, alignDays: 14 };
  const f = sheet({
    title: isNew ? 'Nouveau profil' : 'Profil',
    body: `
      <div class="group"><label class="row field"><span>Prénom</span><input name="name" required maxlength="30" value="${esc(d.name)}" placeholder="Requis" autocomplete="given-name" enterkeyhint="done"></label></div>
      <div class="sl">Traitement</div>
      <div class="group">
        <label class="row field"><span>Appareil</span><span class="v">${esc(TYPE_LABEL[d.type])}</span>${UPDOWN}<select class="ovl" name="type" id="ptype">${opts(TYPES, d.type)}</select></label>
        <label class="row field"><span>Début</span><span class="pad"></span><input type="date" name="start" required value="${esc(d.start)}"></label>
        <label class="row field"><span>Durée prévue</span><input type="number" name="months" min="1" max="120" inputmode="numeric" value="${esc(d.months)}" placeholder="18"><em>mois</em></label>
        <label class="row field"><span>Cabinet</span><input name="practitioner" maxlength="60" value="${esc(d.practitioner)}" placeholder="Facultatif"></label>
      </div>
      <div id="alignBox"><div class="sl">Aligneurs</div><div class="group">
        <label class="row field"><span>Nombre au total</span><input type="number" name="alignTotal" min="1" max="200" inputmode="numeric" value="${esc(d.alignTotal)}" placeholder="30"></label>
        <label class="row field"><span>Changer tous les</span><input type="number" name="alignDays" min="1" max="60" inputmode="numeric" value="${esc(d.alignDays || 14)}"><em>jours</em></label>
        <label class="row field"><span>1<sup>er</sup> aligneur</span><span class="pad"></span><input type="date" name="alignStart" value="${esc(d.alignStart || d.start)}"></label>
      </div></div>`,
    onOk: fd => {
      const data = Object.fromEntries(fd); data.name = data.name.trim();
      if (isNew) { const np = { id: uid(), ...data }; state.profiles.push(np); state.activeId = np.id; ui.tab = 'home'; ui.ringDone = false; }
      else Object.assign(p, data);
      save(); render(); hud(isNew ? `Bienvenue ${data.name} !` : 'Profil mis à jour', isNew ? 'sparkle' : 'check');
    },
    onDelete: isNew ? null : async () => {
      for (const ph of state.photos.filter(x => x.profileId === p.id)) await delBlob(ph.id).catch(() => {});
      for (const k of ['photos', 'rdv', 'questions', 'payments']) state[k] = state[k].filter(x => x.profileId !== p.id);
      state.profiles = state.profiles.filter(x => x.id !== p.id); state.activeId = state.profiles[0]?.id || null;
      save(); render(); hud('Profil supprimé', 'trash');
    },
    deleteLabel: 'Supprimer ce profil', deleteMsg: 'Toutes ses photos et ses données seront effacées de cet appareil.',
  });
  const sync = () => { $('#alignBox', f).style.display = $('#ptype', f).value === 'aligneurs' ? '' : 'none'; };
  $('#ptype', f).addEventListener('change', sync); sync();
}
function profilesSheet() {
  if (!state.profiles.length) return profileSheet();
  const f = sheet({
    title: 'Profils',
    body: `<div class="group">${state.profiles.map(p => `<div class="row ic prof tap" data-pick="${p.id}">
        <span class="tx"><span class="tile t-av">${esc(initial(p))}</span><span><span class="t">${esc(p.name)}</span><span class="s">${esc(TYPE_LABEL[p.type] || '')}</span></span></span>
        ${p.id === state.activeId ? `<span class="ck">${ic('check', 20)}</span>` : ''}<button type="button" class="info" data-edit="${p.id}" aria-label="Modifier ${esc(p.name)}">${ic('info', 22)}</button></div>`).join('')}
      </div>
      <div class="group mt"><button type="button" class="row ic tintc" data-new><span class="tile t-tint">${ic('plus', 18)}</span><span class="tx">Ajouter une personne</span></button></div>
      <p class="foot">Chaque personne a ses propres photos, rendez-vous et paiements.</p>`,
  });
  const L = layers.at(-1);
  f.addEventListener('click', e => {
    const edit = e.target.closest('[data-edit]'), pick = e.target.closest('[data-pick]');
    if (edit) { L.close(); return profileSheet(state.profiles.find(p => p.id === edit.dataset.edit)); }
    if (e.target.closest('[data-new]')) { L.close(); return profileSheet(); }
    if (pick) {
      L.close(); haptic();
      if (pick.dataset.pick !== state.activeId) {
        state.activeId = pick.dataset.pick; Object.assign(ui, { cmpA: null, cmpB: null, cmpView: null, filter: 'all', ringDone: false });
        save(); render(); hud(`Profil de ${me().name}`, 'people');
      }
    }
  });
}

// ---------- Ajout de photos ----------
function addPhotoMenu(preView) {
  actionSheet('Ajouter une photo', [
    { label: 'Appareil photo guidé', icon: 'camera', run: () => openCamera(preView) },
    { label: 'Choisir dans Photos', icon: 'photos', run: () => pickFromLibrary(preView) },
  ]);
}
function pickFromLibrary(preView) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true; inp.style.display = 'none';
  inp.onchange = () => { const files = [...inp.files]; inp.remove(); if (files.length) importSheet(files, preView); };
  document.body.appendChild(inp); inp.click();
}
function importSheet(files, preView) {
  const prevUrls = files.slice(0, 12).map(f => URL.createObjectURL(f));
  const lm = Math.min(...files.map(f => f.lastModified || Date.now()));
  const guess = iso(new Date(Math.min(lm, Date.now())));
  const view = preView || 'face';
  sheet({
    title: files.length > 1 ? `${files.length} photos` : 'Nouvelle photo',
    body: `<div class="prev">${prevUrls.map(u => `<img src="${u}" alt="">`).join('')}</div>
      <div class="sl">Vue</div>
      <div class="vpick">${VIEWS.map(([v, l]) => `<label><input type="radio" name="view" value="${v}" ${v === view ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <div class="group mt"><label class="row field"><span>Date</span><span class="pad"></span><input type="date" name="date" required value="${guess}" max="${iso()}"></label></div>
      <div class="group mt"><textarea class="note" name="note" maxlength="300" placeholder="Note (facultatif) — ex. après le changement d’arc, gêne en bas à gauche…"></textarea></div>`,
    onOk: async fd => {
      let n = 0;
      for (const f of files) {
        try {
          const b = await shrink(f), id = uid(); await putBlob(id, b);
          state.photos.push({ id, profileId: state.activeId, date: fd.get('date'), view: fd.get('view'), note: fd.get('note').trim(), t: Date.now() + n }); n++;
        } catch (err) { console.error(err); }
      }
      prevUrls.forEach(u => URL.revokeObjectURL(u));
      save(); render();
      hud(n ? `${plural(n, 'photo')} ajoutée${n > 1 ? 's' : ''}` : 'Format non pris en charge', n ? 'check' : 'info');
    },
  });
}
function editPhoto(ph) {
  sheet({
    title: 'Infos de la photo',
    body: `<div class="group">
        <label class="row field"><span>Vue</span><span class="v">${esc(VIEW_LABEL[ph.view])}</span>${UPDOWN}<select class="ovl" name="view">${opts(VIEWS.map(v => [v[0], v[1]]), ph.view)}</select></label>
        <label class="row field"><span>Date</span><span class="pad"></span><input type="date" name="date" required value="${ph.date}" max="${iso()}"></label></div>
      <div class="group mt"><textarea class="note" name="note" maxlength="300" placeholder="Note">${esc(ph.note)}</textarea></div>`,
    onOk: fd => { Object.assign(ph, { view: fd.get('view'), date: fd.get('date'), note: fd.get('note').trim() }); save(); render(); updateViewer(); },
  });
}
async function deletePhoto(ph) {
  if (!await alertBox({ title: 'Supprimer la photo ?', message: 'Elle sera effacée de cet appareil.', ok: 'Supprimer', destructive: true })) return;
  state.photos = state.photos.filter(x => x.id !== ph.id); await delBlob(ph.id).catch(() => {});
  save(); render();
  if (vw) { vw.ids = vw.ids.filter(id => id !== ph.id); vw.ids.length ? updateViewer() : closeViewer(); }
  hud('Photo supprimée', 'trash');
}
function sharePhotos(list) {
  const p = me();
  const files = list.filter(ph => blobs.has(ph.id)).map(ph => new File([blobs.get(ph.id)], `${p.name}-${ph.date}-${ph.view}.jpg`.replace(/\s+/g, '_'), { type: 'image/jpeg' }));
  if (!files.length) return hud('Aucune photo à envoyer', 'info');
  shareFiles(files, `Suivi orthodontique — ${p.name}`);
}

// ---------- Visionneuse / présentation / accéléré ----------
function openViewer(list, i = 0, mode = 'normal') {
  if (!list.length) return;
  vw = { ids: list.map(p => p.id), i, mode, timer: null };
  const el = $('#viewer'); el.hidden = false; el.className = '';
  el.innerHTML = `<div class="stage"><img alt=""></div>
    <div class="vtop"><button class="gl" data-v="close" aria-label="Fermer">${ic('xmark', 20)}</button><div class="c"><b></b><small></small></div><span></span></div>
    <div class="vbot"><p class="note"></p><div class="pos"></div><div class="tb">${mode === 'normal'
      ? `<button data-v="share" aria-label="Envoyer">${ic('share')}</button><button data-v="edit" aria-label="Modifier">${ic('pencil')}</button><button data-v="del" class="red" aria-label="Supprimer">${ic('trash')}</button>`
      : `<button data-v="prev" aria-label="Précédente">${ic('chevL')}</button><button data-v="play" aria-label="Lecture">${ic('play')}</button><button data-v="next" aria-label="Suivante">${ic('chevR')}</button>`}</div></div>`;
  syncLock(); updateViewer(true);
  if (mode === 'play') togglePlay(true);
}
function closeViewer() { if (!vw) return; clearInterval(vw.timer); vw = null; const el = $('#viewer'); el.hidden = true; el.innerHTML = ''; syncLock(); }
const vList = () => vw.ids.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
function updateViewer(first) {
  if (!vw) return;
  const list = vList(); if (!list.length) return closeViewer();
  vw.i = Math.max(0, Math.min(list.length - 1, vw.i));
  const ph = list[vw.i], p = me(), el = $('#viewer'), img = $('.stage img', el);
  const j = p?.start ? daysBetween(p.start, ph.date) : -1;
  const swap = () => { img.src = src(ph.id); img.alt = `${VIEW_LABEL[ph.view]} du ${fmt(ph.date)}`; img.style.opacity = 1; };
  if (first || img.getAttribute('src') === src(ph.id)) swap(); else { img.style.opacity = .15; setTimeout(swap, 140); }
  $('.vtop b', el).textContent = fmt(ph.date);
  $('.vtop small', el).textContent = `${VIEW_LABEL[ph.view]}${j >= 0 ? ` · J+${j}` : ''}${vw.mode !== 'normal' ? ` · ${p.name}` : ''}`;
  $('.note', el).textContent = ph.note || '';
  $('.pos', el).textContent = `${vw.i + 1} sur ${list.length}`;
  const pb = $('[data-v=play]', el); if (pb) pb.innerHTML = ic(vw.timer ? 'pause' : 'play');
}
function step(d) { if (!vw) return; const n = vList().length; vw.i = Math.max(0, Math.min(n - 1, vw.i + d)); updateViewer(); }
function togglePlay(on = !vw.timer) {
  clearInterval(vw.timer); vw.timer = null;
  if (on) {
    if (vw.i >= vList().length - 1) { vw.i = 0; updateViewer(); }
    vw.timer = setInterval(() => { if (!vw) return; if (vw.i >= vList().length - 1) { togglePlay(false); return; } step(1); }, 1200);
  }
  updateViewer(true);
}
$('#viewer').addEventListener('click', e => {
  if (!vw) return;
  const a = e.target.closest('[data-v]')?.dataset.v;
  const ph = vList()[vw.i];
  if (!a) { if (e.target.closest('.stage')) $('#viewer').classList.toggle('bare'); return; }
  ({
    close: closeViewer, prev: () => step(-1), next: () => step(1), play: () => togglePlay(),
    share: () => sharePhotos([ph]), edit: () => editPhoto(ph), del: () => deletePhoto(ph),
  })[a]?.();
});
let touchX = null;
$('#viewer').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
$('#viewer').addEventListener('touchend', e => {
  if (touchX === null || !vw) return; const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 50) { if (vw.timer) togglePlay(false); step(dx < 0 ? 1 : -1); }
}, { passive: true });
document.addEventListener('keydown', e => { if (vw && !layers.length) { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); } });

function presentMenu() {
  const all = myPhotos();
  if (!all.length) return hud('Ajoute d’abord des photos', 'info');
  actionSheet('Mode présentation — de la plus ancienne à la plus récente', [
    { label: 'Toutes les photos', n: all.length, run: () => openViewer(all, 0, 'cabinet') },
    ...VIEWS.filter(([v]) => myPhotos(v).length).map(([v, l]) => ({ label: l, n: myPhotos(v).length, run: () => openViewer(myPhotos(v), 0, 'cabinet') })),
  ]);
}

// ---------- Appareil photo guidé ----------
const DASH = 'fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="7 7" opacity=".85"';
const GUIDES = {
  smile: `<path d="M60 180 Q150 225 240 180 Q215 262 150 264 Q85 262 60 180Z" ${DASH}/>`,
  side: `<path d="M95 175 Q190 205 215 180 Q205 250 150 255 Q110 250 95 175Z" ${DASH}/>`,
  arc: `<path d="M70 300 C70 120 230 120 230 300" ${DASH}/>`,
  face: `<ellipse cx="150" cy="190" rx="78" ry="105" ${DASH}/>`,
};
const guideFor = v => ({ face: GUIDES.smile, droite: GUIDES.side, gauche: GUIDES.side, haut: GUIDES.arc, bas: GUIDES.arc, profil: GUIDES.face }[v]);
const GRID = '<path d="M100 0v400M200 0v400M0 133h300M0 267h300" stroke="#fff" stroke-opacity=".22" stroke-width="1"/>';
const takenToday = () => new Set(myPhotos().filter(p => p.date === iso()).map(p => p.view));

async function openCamera(view) {
  const today = takenToday();
  cam = { view: view || VIEWS.find(([v]) => !today.has(v))?.[0] || 'face', facing: 'user', stream: null, ghost: true, shot: null, shotUrl: null };
  const el = $('#camera'); el.hidden = false; el.className = '';
  el.innerHTML = `
    <div class="c-top"><button class="gl" data-c="close" aria-label="Fermer">${ic('xmark', 20)}</button><div class="c-title"></div>
      <button class="gl" data-c="ghost" aria-label="Superposer la photo précédente">${ic('layers', 20)}</button></div>
    <div class="c-mid"><div class="vf"><video playsinline muted autoplay></video><img class="ghost" alt=""><div class="guide"></div><img class="shot" alt="" hidden>
      <div class="nocam">${ic('camera', 40)}<span>Caméra indisponible. Autorise l’accès à la caméra dans Réglages, ou choisis une photo existante.</span><button class="btn sm" data-c="lib">Choisir dans Photos</button></div>
      <div class="flash"></div></div></div>
    <div class="modes">${VIEWS.map(([v, , s]) => `<button data-mode="${v}">${s}</button>`).join('')}</div>
    <div class="c-bot pre"><button class="c-thumb" data-c="thumb" aria-label="Voir les photos"></button><button class="shutter" data-c="shoot" aria-label="Prendre la photo"></button><button class="gl flip" data-c="flip" aria-label="Changer de caméra">${ic('flip', 22)}</button></div>
    <div class="c-bot post" hidden><button data-c="retake">Reprendre</button><button data-c="use" class="y">Utiliser</button></div>`;
  syncLock(); updateCamera(); await startStream();
}
async function startStream() {
  if (!cam) return;
  cam.stream?.getTracks().forEach(t => t.stop());
  const el = $('#camera');
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('non pris en charge');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cam.facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
    if (!cam) { stream.getTracks().forEach(t => t.stop()); return; }
    cam.stream = stream;
    const v = $('video', el); v.srcObject = stream; await v.play().catch(() => {});
    el.classList.remove('nocam');
  } catch (err) { console.warn(err); el.classList.add('nocam'); }
  updateCamera();
}
function closeCamera() {
  if (!cam) return;
  cam.stream?.getTracks().forEach(t => t.stop());
  if (cam.shotUrl) URL.revokeObjectURL(cam.shotUrl);
  cam = null; const el = $('#camera'); el.hidden = true; el.innerHTML = ''; syncLock(); render();
}
function updateCamera() {
  if (!cam) return;
  const el = $('#camera'), last = myPhotos(cam.view).at(-1), today = takenToday();
  $('.c-title', el).innerHTML = `${esc(VIEW_LABEL[cam.view])}<small>${last ? `Repère : photo du ${esc(fmtShort(last.date))}` : 'Première photo de cette vue'}</small>`;
  $('.vf', el).classList.toggle('mirror', cam.facing === 'user');
  const g = $('.ghost', el); g.hidden = !(cam.ghost && last); if (last) g.src = src(last.id);
  $('.guide', el).innerHTML = `<svg viewBox="0 0 300 400" preserveAspectRatio="none">${GRID}${cam.ghost && last ? '' : guideFor(cam.view)}</svg>`;
  $('[data-c=ghost]', el).classList.toggle('on', cam.ghost && !!last);
  $$('.modes button', el).forEach(b => { b.classList.toggle('on', b.dataset.mode === cam.view); b.classList.toggle('done', today.has(b.dataset.mode)); });
  $('.modes .on', el)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  const lp = myPhotos().at(-1); $('.c-thumb', el).innerHTML = lp ? `<img src="${src(lp.id)}" alt="">` : '';
  const shot = $('.shot', el); shot.hidden = !cam.shot; if (cam.shot) shot.src = cam.shotUrl;
  $('.c-bot.pre', el).hidden = !!cam.shot; $('.c-bot.post', el).hidden = !cam.shot;
}
function shoot() {
  const el = $('#camera'), v = $('video', el);
  if (!v.videoWidth) return hud('La caméra démarre…', 'camera');
  const vw0 = v.videoWidth, vh0 = v.videoHeight, ratio = 3 / 4;
  let sw = vw0, sh = vh0; if (vw0 / vh0 > ratio) sw = vh0 * ratio; else sh = vw0 / ratio;
  const k = Math.min(1, 1600 / Math.max(sw, sh));
  const c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  c.getContext('2d').drawImage(v, (vw0 - sw) / 2, (vh0 - sh) / 2, sw, sh, 0, 0, c.width, c.height);
  const fl = $('.flash', el); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
  haptic();
  c.toBlob(b => { if (!cam || !b) return; cam.shot = b; cam.shotUrl = URL.createObjectURL(b); updateCamera(); }, 'image/jpeg', 0.88);
}
async function useShot() {
  const id = uid(), view = cam.view;
  await putBlob(id, cam.shot);
  state.photos.push({ id, profileId: state.activeId, date: iso(), view, note: '', t: Date.now() }); save();
  URL.revokeObjectURL(cam.shotUrl); cam.shot = cam.shotUrl = null; haptic();
  const today = takenToday();
  const next = VIEWS.slice(VIEWS.findIndex(v => v[0] === view) + 1).find(([v]) => !today.has(v));
  if (next) { cam.view = next[0]; hud(`${VIEW_SHORT[view]} enregistrée · suivante : ${next[1].toLowerCase()}`); }
  else hud(`${VIEW_LABEL[view]} enregistrée`);
  updateCamera();
}
$('#camera').addEventListener('click', e => {
  if (!cam) return;
  const m = e.target.closest('[data-mode]'); if (m) { cam.view = m.dataset.mode; haptic(); return updateCamera(); }
  const a = e.target.closest('[data-c]')?.dataset.c;
  ({
    close: closeCamera, shoot,
    ghost: () => { cam.ghost = !cam.ghost; updateCamera(); },
    flip: () => { cam.facing = cam.facing === 'user' ? 'environment' : 'user'; startStream(); },
    retake: () => { URL.revokeObjectURL(cam.shotUrl); cam.shot = cam.shotUrl = null; updateCamera(); },
    use: useShot,
    lib: () => { const v = cam.view; closeCamera(); pickFromLibrary(v); },
    thumb: () => { closeCamera(); go('photos'); },
  })[a]?.();
});

// ---------- Rendez-vous, questions, paiements ----------
function rdvSheet(r) {
  const isNew = !r; const d = r || { date: addDays(iso(), 14), time: '', title: 'Contrôle', note: '' };
  sheet({
    title: isNew ? 'Rendez-vous' : d.title,
    body: `<div class="group">
        <label class="row field"><span>Motif</span><input name="title" required maxlength="60" value="${esc(d.title)}" list="motifs" enterkeyhint="done"></label>
        <label class="row field"><span>Date</span><span class="pad"></span><input type="date" name="date" required value="${d.date}"></label>
        <label class="row field"><span>Heure</span><span class="pad"></span><input type="time" name="time" value="${esc(d.time)}"></label>
        ${isNew ? '' : `<label class="row field"><span>Rendez-vous passé</span><span class="pad"></span><input type="checkbox" switch class="tog" name="done" ${d.done || d.date < iso() ? 'checked' : ''}></label>`}
      </div>
      <datalist id="motifs"><option>Contrôle<option>Pose de l’appareil<option>Changement d’arc<option>Nouveaux aligneurs<option>Urgence<option>Dépose<option>Contention</datalist>
      <div class="sl">Ce que le praticien a dit</div>
      <div class="group"><textarea class="note" name="note" maxlength="800" placeholder="Notes">${esc(d.note)}</textarea></div>`,
    onOk: fd => {
      const v = { title: fd.get('title').trim(), date: fd.get('date'), time: fd.get('time'), note: fd.get('note').trim(), done: fd.get('done') === 'on' };
      if (isNew) state.rdv.push({ id: uid(), profileId: state.activeId, ...v }); else Object.assign(r, v);
      save(); render(); if (isNew) hud(`Rendez-vous ${rel(v.date)}`, 'calendar');
    },
    onDelete: isNew ? null : () => { state.rdv = state.rdv.filter(x => x.id !== r.id); save(); render(); },
    deleteLabel: 'Supprimer le rendez-vous',
  });
}
function questionSheet(q) {
  sheet({
    title: q ? 'Question' : 'Question pour l’ortho',
    body: `<div class="group"><textarea class="note" name="text" required maxlength="300" placeholder="Ex. Est-ce normal que cette dent bouge encore ?">${esc(q?.text)}</textarea></div>
      <p class="foot">Elle apparaîtra dans ton compte rendu PDF.</p>`,
    onOk: fd => {
      const t = fd.get('text').trim();
      if (q) q.text = t; else state.questions.push({ id: uid(), profileId: state.activeId, text: t, done: false, date: iso() });
      save(); render();
    },
    onDelete: q ? () => { state.questions = state.questions.filter(x => x.id !== q.id); save(); render(); } : null,
    deleteLabel: 'Supprimer la question',
  });
}
function paySheet(x) {
  const isNew = !x; const d = x || { label: 'Échéance', date: iso(), amount: '' };
  sheet({
    title: isNew ? 'Échéance' : d.label,
    body: `<div class="group">
        <label class="row field"><span>Libellé</span><input name="label" required maxlength="50" value="${esc(d.label)}"></label>
        <label class="row field"><span>Date</span><span class="pad"></span><input type="date" name="date" required value="${d.date}"></label>
        <label class="row field"><span>Montant</span><input type="number" name="amount" required min="0" step="0.01" inputmode="decimal" value="${esc(d.amount)}" placeholder="0"><em>€</em></label></div>`,
    onOk: fd => {
      const v = { label: fd.get('label').trim(), date: fd.get('date'), amount: Number(String(fd.get('amount')).replace(',', '.')) || 0 };
      if (isNew) state.payments.push({ id: uid(), profileId: state.activeId, paid: false, ...v }); else Object.assign(x, v);
      save(); render();
    },
    onDelete: isNew ? null : () => { state.payments = state.payments.filter(p => p.id !== x.id); save(); render(); },
    deleteLabel: 'Supprimer l’échéance',
  });
}

// ---------- Glisser pour supprimer ----------
const closeSwipes = except => $$('.sw.open').forEach(s => s !== except && s.classList.remove('open'));
let sw = null;
document.addEventListener('touchstart', e => {
  const s = e.target.closest('#view .sw'); closeSwipes(s);
  if (!s || e.target.closest('.sw-del')) { sw = null; return; }
  sw = { s, x: e.touches[0].clientX, y: e.touches[0].clientY, base: s.classList.contains('open') ? -92 : 0, dx: 0, lock: null };
}, { passive: true });
document.addEventListener('touchmove', e => {
  if (!sw) return;
  const dx = e.touches[0].clientX - sw.x, dy = e.touches[0].clientY - sw.y;
  if (!sw.lock && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) sw.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  if (sw.lock !== 'x') return;
  sw.dx = dx; sw.s.classList.add('drag');
  $('.sw-c', sw.s).style.transform = `translateX(${Math.min(0, Math.max(-150, sw.base + dx))}px)`;
}, { passive: true });
document.addEventListener('touchend', () => {
  if (!sw) return;
  const { s } = sw; s.classList.remove('drag'); $('.sw-c', s).style.transform = '';
  if (sw.lock === 'x') { s.classList.toggle('open', sw.base + sw.dx < -44); s.dataset.justSwiped = '1'; setTimeout(() => delete s.dataset.justSwiped, 350); }
  sw = null;
});
const swipeRow = (key, cls, inner) => `<div class="sw ${cls}"><div class="sw-c">${inner}</div><button class="sw-del" data-swdel="${key}" aria-label="Supprimer">${ic('trash', 20)}<span>Supprimer</span></button></div>`;

// ---------- Écrans ----------
const thumb = (ph, label) => `<button class="th" data-open="${ph.id}"><img loading="lazy" src="${src(ph.id)}" alt="${esc(VIEW_LABEL[ph.view])} du ${fmt(ph.date)}">${label ? `<em>${esc(label)}</em>` : ''}</button>`;
const calTile = (d, past) => `<span class="cal ${past ? 'past' : ''}"><small>${esc(monthAbbr(d))}</small><b>${toDate(d).getDate()}</b></span>`;
const rdvRow = (r, past) => swipeRow(`rdv:${r.id}`, 'ic', `<button class="row" data-rdv="${r.id}">${calTile(r.date, past)}<span class="tx"><span class="t">${esc(r.title)}</span>
  <span class="s">${past ? fmt(r.date) : cap(rel(r.date))}${r.time ? ` · ${esc(r.time.replace(':', ' h '))}` : ''}${past && r.note ? ` · ${esc(r.note)}` : ''}</span></span>${CHEV}</button>`);
const qRow = q => swipeRow(`q:${q.id}`, 'cb', `<div class="row"><button class="cbx ${q.done ? 'on' : ''}" data-q="${q.id}" aria-label="${q.done ? 'Décocher' : 'Cocher'}">${ic('check')}</button>
  <button class="tx" data-qedit="${q.id}"><span class="t ${q.done ? 'done' : ''}" style="white-space:normal">${esc(q.text)}</span></button></div>`);
const emptyRow = t => `<div class="row muted"><span class="tx"><span class="t" style="white-space:normal">${esc(t)}</span></span></div>`;

function ring(pct, size = 108) {
  const C = 2 * Math.PI * 47;
  return `<div class="ring ${ui.ringDone ? '' : 'anim'}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 112 112" aria-hidden="true">
    <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD9A8"/><stop offset="1" stop-color="#FF6B6B"/></linearGradient></defs>
    <circle cx="56" cy="56" r="47" class="trk"/><circle cx="56" cy="56" r="47" class="prg" stroke="url(#rg)" stroke-dasharray="${C.toFixed(2)}" style="--c:${C.toFixed(2)};stroke-dashoffset:${(C * (1 - pct / 100)).toFixed(2)}"/></svg>
    <div class="rv"><b>${pct}<small>%</small></b></div></div>`;
}

function vWelcome() {
  const feats = [
    ['camera', 'Photos guidées', 'Ta photo précédente s’affiche en transparence pour garder le même cadrage à chaque fois.'],
    ['compare', 'Avant / après', 'Fais glisser pour voir tes dents bouger, ou regarde l’évolution en accéléré.'],
    ['cabinet', 'Prêt pour le cabinet', 'Mode présentation et compte rendu PDF à envoyer à ton orthodontiste.'],
    ['lock', 'Privé', 'Tes photos restent sur ton iPhone. Pas de compte, pas de serveur.'],
  ];
  return `<div class="welcome"><div class="w-top"><img class="w-icon" src="icon-512.png" alt=""><h1>Bienvenue dans<br><span>Sourire</span></h1></div>
    <div class="w-list">${feats.map(([i, t, d]) => `<div class="w-f"><span class="w-ic">${ic(i, 30)}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div>
    <div class="w-cta"><button class="btn" data-action="new-profile">Continuer</button><button class="lnk" data-action="import">Restaurer une sauvegarde</button></div></div>`;
}

function vHome() {
  const p = me(), pr = progress(p), al = aligner(p), photos = myPhotos();
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const next = mine('rdv').filter(r => !r.done && r.date >= iso()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const last = photos.at(-1), since = last ? daysBetween(last.date, iso()) : null;
  const qs = mine('questions').filter(q => !q.done);
  let hero = '';
  if (pr) {
    const big = pr.left < 45 ? `${pr.left}<small>j</small>` : `${Math.round(pr.left / 30.4)}<small>mois</small>`;
    const dots = photos.filter(x => x.date >= p.start && x.date <= pr.end).map(x => `<b style="left:${(daysBetween(p.start, x.date) / pr.total * 100).toFixed(1)}%"></b>`).join('');
    hero = `<div class="hero"><div class="hero-top">${ring(pr.pct)}<div><div class="eb">Jour ${pr.day} · ${esc(TYPE_LABEL[p.type] || '')}</div>
        <div class="big">${big}</div><div class="sub">${pr.left === 0 ? 'Fin estimée atteinte' : 'restants environ'}</div></div></div>
      <div class="tl"><div class="tl-bar"><i style="width:${pr.pct}%"></i>${dots}</div><div class="tl-l"><span>${esc(cap(fmtMY(p.start)))}</span><span>Fin ${esc(fmtMY(pr.end))}</span></div></div></div>`;
  }
  let aligns = '';
  if (al) {
    const pill = al.next ? (al.inDays <= 0 ? '<span class="pill warn">À changer aujourd’hui</span>' : `<span class="pill ${al.inDays <= 2 ? 'warn' : ''}">Suivant ${rel(al.next)}</span>`) : '<span class="pill">Dernier aligneur</span>';
    aligns = `<div class="card align"><div class="between"><div><div class="eyebrow">Aligneur</div><div class="big2">${al.n}<small> / ${al.total}</small></div></div>${pill}</div>
      ${al.total <= 50 ? `<div class="segs">${Array.from({ length: al.total }, (_, i) => `<i class="${i < al.n - 1 ? 'on' : i === al.n - 1 ? 'cur' : ''}"></i>`).join('')}</div>` : `<div class="bar6"><i style="width:${al.n / al.total * 100}%"></i></div>`}</div>`;
  }
  const photoSub = since === null ? 'Ta photo de départ' : since === 0 ? 'Déjà faite aujourd’hui' : `Dernière il y a ${plural(since, 'jour')}`;
  return `<div class="lt"><div class="eyebrow">${esc(today)}</div><h1>Bonjour ${esc(p.name)}</h1></div>
    ${hero}${aligns}
    <div class="actions">
      <button class="act" data-action="camera"><span class="tile t-tint">${ic('camera')}</span><span><b>Nouvelle photo</b><small class="${since >= 14 ? 'warn' : ''}">${photoSub}</small></span></button>
      <button class="act" data-action="present"><span class="tile t-coral">${ic('cabinet')}</span><span><b>Montrer à l’ortho</b><small>Mode présentation</small></span></button>
    </div>
    ${photos.length ? `<div class="sh"><h2>Dernières photos</h2><button data-tab="photos">Tout voir</button></div>
      <div class="strip">${photos.slice(-10).reverse().map(ph => thumb(ph, fmtShort(ph.date))).join('')}</div>` : ''}
    <div class="sh"><h2>Prochain rendez-vous</h2><button data-tab="suivi">Suivi</button></div>
    <div class="group">${next ? rdvRow(next) : `<button class="row ic tintc" data-action="add-rdv"><span class="tile t-red">${ic('calendar', 18)}</span><span class="tx">Ajouter un rendez-vous</span></button>`}</div>
    <div class="sh"><h2>À demander</h2><button data-action="add-question">Ajouter</button></div>
    <div class="group">${qs.length ? qs.map(qRow).join('') : emptyRow('Note ici tes questions pour ne rien oublier au cabinet.')}</div>`;
}

function vPhotos() {
  const all = myPhotos();
  if (!all.length) return `<div class="lt"><h1>Photos</h1></div><div class="empty"><div class="eic">${ic('camera', 40)}</div><h2>Aucune photo</h2>
    <p>Prends une première photo de départ : de face, de côté ou des arcades. C’est elle qui rendra l’évolution visible.</p>
    <button class="btn" data-action="camera">${ic('camera', 20)}Appareil photo guidé</button><button class="btn soft" data-action="library">Choisir dans Photos</button></div>`;
  if (ui.filter !== 'all' && !all.some(p => p.view === ui.filter)) ui.filter = 'all';
  const list = myPhotos(ui.filter).reverse(), groups = {};
  list.forEach(ph => (groups[ph.date.slice(0, 7)] ||= []).push(ph));
  const used = new Set(all.map(p => p.view));
  return `<div class="lt"><h1>Photos</h1><p>${plural(all.length, 'photo')} · depuis le ${fmt(all[0].date)}</p></div>
    <div class="chips"><button class="chip ${ui.filter === 'all' ? 'on' : ''}" data-filter="all">Toutes</button>
      ${VIEWS.filter(([v]) => used.has(v)).map(([v, l]) => `<button class="chip ${ui.filter === v ? 'on' : ''}" data-filter="${v}">${l}<small>${myPhotos(v).length}</small></button>`).join('')}</div>
    ${Object.entries(groups).map(([m, phs]) => `<div class="mh">${esc(cap(fmt(m + '-01', { month: 'long', year: 'numeric' })))}</div>
      <div class="pgrid">${phs.map(ph => thumb(ph, ui.filter === 'all' ? VIEW_SHORT[ph.view] : fmtShort(ph.date))).join('')}</div>`).join('')}`;
}

function vCompare() {
  const all = myPhotos();
  const byView = VIEWS.map(([v, l]) => [v, l, all.filter(p => p.view === v)]).filter(x => x[2].length >= 2);
  if (!byView.length) return `<div class="lt"><h1>Comparer</h1></div><div class="empty"><div class="eic">${ic('compare', 40)}</div><h2>Deux photos minimum</h2>
    <p>Ajoute au moins deux photos de la même vue, à des dates différentes, pour voir l’avant / après.</p><button class="btn" data-action="camera">${ic('camera', 20)}Prendre une photo</button></div>`;
  if (!byView.some(x => x[0] === ui.cmpView)) { ui.cmpView = byView[0][0]; ui.cmpA = ui.cmpB = null; }
  const list = byView.find(x => x[0] === ui.cmpView)[2];
  if (!list.some(p => p.id === ui.cmpA)) ui.cmpA = list[0].id;
  if (!list.some(p => p.id === ui.cmpB)) ui.cmpB = list.at(-1).id;
  const a = list.find(p => p.id === ui.cmpA), b = list.find(p => p.id === ui.cmpB);
  const gap = Math.abs(daysBetween(a.date, b.date));
  const gapTxt = gap === 0 ? 'Même jour' : gap > 60 ? `${Math.round(gap / 30.4)} mois d’écart` : `${plural(gap, 'jour')} d’écart`;
  const o = sel => list.map(p => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${fmt(p.date)}</option>`).join('');
  const modes = [['slider', 'Curseur'], ['side', 'Côte à côte'], ['fade', 'Fondu']];
  const viewer = ui.cmpMode === 'side'
    ? `<div class="side"><figure><img src="${src(a.id)}" alt="Avant"><figcaption>${fmt(a.date)}</figcaption></figure><figure><img src="${src(b.id)}" alt="Après"><figcaption>${fmt(b.date)}</figcaption></figure></div>`
    : `<div class="cmp ${ui.cmpMode === 'fade' ? 'fade' : ''}" id="cmp" style="--x:${ui.x}%;--o:${ui.fade / 100}"><img src="${src(a.id)}" alt="Avant"><img class="after" src="${src(b.id)}" alt="Après">
        <span class="lbl l">Avant</span><span class="lbl r">Après</span><div class="handle"></div></div>
      ${ui.cmpMode === 'fade' ? `<input type="range" class="ios" id="fadeR" min="0" max="100" value="${ui.fade}" style="--p:${ui.fade}%" aria-label="Fondu entre avant et après"><div class="rl"><span>Avant</span><span>Après</span></div>` : ''}`;
  return `<div class="lt"><h1>Comparer</h1><p>${gapTxt}</p></div>
    <div class="chips">${byView.map(([v, l, ls]) => `<button class="chip ${v === ui.cmpView ? 'on' : ''}" data-cmpview="${v}">${l}<small>${ls.length}</small></button>`).join('')}</div>
    <div class="seg">${modes.map(([m, l]) => `<button class="${ui.cmpMode === m ? 'on' : ''}" data-cmpmode="${m}">${l}</button>`).join('')}</div>
    ${viewer}
    <div class="group mt">
      <label class="row field"><span>Avant</span><span class="v">${fmt(a.date)}</span>${UPDOWN}<select class="ovl" data-cmp="cmpA">${o(a.id)}</select></label>
      <label class="row field"><span>Après</span><span class="v">${fmt(b.date)}</span>${UPDOWN}<select class="ovl" data-cmp="cmpB">${o(b.id)}</select></label>
    </div>
    <button class="btn soft mt" data-action="timelapse">${ic('play', 18)}Voir l’évolution en accéléré</button>`;
}

function vSuivi() {
  const rdv = mine('rdv').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const up = rdv.filter(r => !r.done && r.date >= iso()), past = rdv.filter(r => r.done || r.date < iso()).reverse();
  const qs = mine('questions').sort((a, b) => a.done - b.done);
  const pay = mine('payments').sort((a, b) => a.date.localeCompare(b.date));
  const total = pay.reduce((s, x) => s + x.amount, 0), paid = pay.filter(x => x.paid).reduce((s, x) => s + x.amount, 0);
  const add = act => `<button data-action="${act}" aria-label="Ajouter">${ic('plus', 22)}</button>`;
  const payRow = x => swipeRow(`pay:${x.id}`, 'cb', `<div class="row"><button class="cbx ${x.paid ? 'on' : ''}" data-paid="${x.id}" aria-label="${x.paid ? 'Marquer non payé' : 'Marquer payé'}">${ic('check')}</button>
    <button class="tx" data-pay="${x.id}"><span class="t ${x.paid ? 'done' : ''}">${esc(x.label)}</span><span class="s">${fmt(x.date)}</span></button><span class="amt">${euro(x.amount)}</span></div>`);
  return `<div class="lt"><h1>Suivi</h1></div>
    <div class="sh"><h2>Rendez-vous</h2>${add('add-rdv')}</div>
    <div class="group">${up.length ? up.map(r => rdvRow(r)).join('') : emptyRow('Aucun rendez-vous à venir')}</div>
    ${past.length ? `<div class="sh"><h2>Historique</h2></div><div class="group">${past.map(r => rdvRow(r, true)).join('')}</div>` : ''}
    <div class="sh"><h2>Questions</h2>${add('add-question')}</div>
    <div class="group">${qs.length ? qs.map(qRow).join('') : emptyRow('Rien à demander pour l’instant')}</div>
    ${qs.length ? '<p class="foot">Glisse une ligne vers la gauche pour la supprimer.</p>' : ''}
    <div class="sh"><h2>Paiements</h2>${add('add-pay')}</div>
    ${pay.length ? `<div class="card paysum"><div class="between"><div><div class="eyebrow">Réglé</div><div class="big2 num">${euro(paid)}</div></div>
        <div class="r"><div class="eyebrow">Reste</div><b>${euro(total - paid)}</b></div></div>
        <div class="bar6"><i style="width:${total ? paid / total * 100 : 0}%"></i></div></div>
      <div class="group mt">${pay.map(payRow).join('')}</div>`
      : `<div class="group">${emptyRow('Ajoute tes échéances pour suivre ce qu’il reste à régler')}</div>`}`;
}

function vShare() {
  const n = myPhotos().length, p = me();
  return `<div class="lt"><h1>Cabinet</h1><p>Montre ton évolution à ton orthodontiste.</p></div>
    <div class="hero cab"><div class="hero-ic">${ic('cabinet', 26)}</div><h2>Mode présentation</h2>
      <p>Tes photos en plein écran, de la plus ancienne à la plus récente. Tends simplement ton téléphone au praticien.</p>
      <button class="btn white" data-action="present">${ic('play', 18)}Lancer</button></div>
    <div class="sh"><h2>Envoyer</h2></div>
    <div class="group">
      <button class="row ic" data-action="pdf"><span class="tile t-blue">${ic('doc', 18)}</span><span class="tx"><span class="t">Compte rendu PDF</span><span class="s">Photos datées, rendez-vous et questions</span></span>${CHEV}</button>
      <button class="row ic" data-action="share-all"><span class="tile t-green">${ic('share', 18)}</span><span class="tx"><span class="t">Envoyer les photos</span><span class="s">${plural(n, 'photo')} par mail, message, AirDrop…</span></span>${CHEV}</button>
    </div>
    <div class="sh"><h2>Sauvegarde</h2></div>
    <div class="group">
      <button class="row ic" data-action="export"><span class="tile t-indigo">${ic('down', 18)}</span><span class="tx"><span class="t">Exporter une sauvegarde</span></span>${CHEV}</button>
      <button class="row ic" data-action="import"><span class="tile t-gray">${ic('up', 18)}</span><span class="tx"><span class="t">Restaurer une sauvegarde</span></span>${CHEV}</button>
    </div>
    <p class="foot">Tes photos restent uniquement sur cet appareil, rien n’est envoyé en ligne. Exporte une sauvegarde de temps en temps, et pour changer de téléphone.</p>
    <div class="sh"><h2>Profil</h2></div>
    <div class="group">
      <button class="row ic" data-action="edit-profile"><span class="tile t-av">${esc(initial(p))}</span><span class="tx"><span class="t">${esc(p.name)}</span><span class="s">${esc(TYPE_LABEL[p.type] || '')}${p.practitioner ? ` · ${esc(p.practitioner)}` : ''}</span></span>${CHEV}</button>
      <button class="row ic" data-action="profiles"><span class="tile t-orange">${ic('people', 18)}</span><span class="tx"><span class="t">Changer de personne</span></span>${CHEV}</button>
    </div>
    <p class="foot c">Sourire ne remplace pas l’avis de ton praticien.</p>`;
}

const SCREENS = { home: vHome, photos: vPhotos, compare: vCompare, suivi: vSuivi, share: vShare };
const TITLES = { home: 'Accueil', photos: 'Photos', compare: 'Comparer', suivi: 'Suivi', share: 'Cabinet' };

function render() {
  const p = me();
  if (!p && state.profiles.length) { state.activeId = state.profiles[0].id; save(); return render(); }
  document.body.classList.toggle('welcome', !p);
  if (!p) { $('#view').innerHTML = vWelcome(); return; }
  const extra = ui.tab === 'photos' ? `<button class="gbtn" data-action="add-photo" aria-label="Ajouter une photo">${ic('plus', 20)}</button>` : '';
  $('#bar').innerHTML = `<div></div><div class="bar-t">${TITLES[ui.tab]}</div><div class="bar-r">${extra}<button class="avatar" data-action="profiles" aria-label="Profils">${esc(initial(p))}</button></div>`;
  $('#tabs').style.setProperty('--i', TABS.findIndex(t => t[0] === ui.tab));
  $$('#tabs .tab').forEach(b => { const on = b.dataset.tab === ui.tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
  $('#view').innerHTML = SCREENS[ui.tab]();
  if (ui.tab === 'home') ui.ringDone = true;
  bindCompare(); onScroll();
}
function go(tab) {
  if (tab === ui.tab) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  haptic();
  const run = () => { ui.tab = tab; render(); window.scrollTo(0, 0); };
  document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches ? document.startViewTransition(run) : run();
}
function onScroll() {
  const y = window.scrollY, bar = $('#bar');
  bar.classList.toggle('scrolled', y > 4);
  bar.classList.toggle('titled', y > 40);
}
addEventListener('scroll', onScroll, { passive: true });

function bindCompare() {
  const c = $('#cmp'); if (!c) return;
  let on = false;
  const set = x => {
    const r = c.getBoundingClientRect(), v = Math.max(0, Math.min(100, (x - r.left) / r.width * 100));
    if (ui.cmpMode === 'fade') { ui.fade = v; c.style.setProperty('--o', v / 100); const rg = $('#fadeR'); if (rg) { rg.value = v; rg.style.setProperty('--p', v + '%'); } }
    else { ui.x = v; c.style.setProperty('--x', v + '%'); }
  };
  c.addEventListener('pointerdown', e => { on = true; c.setPointerCapture?.(e.pointerId); set(e.clientX); });
  c.addEventListener('pointermove', e => { if (on) set(e.clientX); });
  ['pointerup', 'pointercancel'].forEach(t => c.addEventListener(t, () => { on = false; }));
  const rg = $('#fadeR');
  if (rg) rg.addEventListener('input', () => { ui.fade = +rg.value; c.style.setProperty('--o', rg.value / 100); rg.style.setProperty('--p', rg.value + '%'); });
}

// ---------- Compte rendu PDF ----------
let jspdfP;
const loadPDF = () => jspdfP ||= new Promise((res, rej) => {
  const s = document.createElement('script'); s.src = 'vendor/jspdf.umd.min.js';
  s.onload = () => res(window.jspdf.jsPDF); s.onerror = () => { jspdfP = null; rej(new Error('jspdf')); };
  document.head.appendChild(s);
});
// Les polices PDF standard ne couvrent que le latin de base : on normalise la typographie.
const T = s => String(s ?? '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[  ]/g, ' ').replace(/€/g, 'EUR').replace(/[^\x00-\xFF]/g, '');
async function makeReport() {
  const p = me(), pr = progress(p), al = aligner(p), photos = myPhotos();
  if (!photos.length) return hud('Ajoute d’abord des photos', 'info');
  hud('Création du compte rendu…', 'doc', 15000);
  let jsPDF;
  try { jsPDF = await loadPDF(); } catch { return hud('Connexion nécessaire la première fois', 'info'); }
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 16, teal = [11, 110, 122], gray = [110, 110, 118];
  doc.setFillColor(...teal); doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text(T(`Suivi orthodontique - ${p.name}`), M, 18);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
  doc.text(T(`Compte rendu du ${fmt(iso())} · ${plural(photos.length, 'photo')}`), M, 27);
  let y = 50;
  doc.setFontSize(10.5);
  const meta = [
    ['Appareil', TYPE_LABEL[p.type] || '-'], ['Cabinet', p.practitioner || '-'], ['Début', fmt(p.start)],
    ...(pr ? [['Fin estimée', fmt(pr.end, { month: 'long', year: 'numeric' })], ['Avancement', `${pr.pct} % (jour ${pr.day})`]] : []),
    ...(al ? [['Aligneur', `${al.n} sur ${al.total}`]] : []),
  ];
  meta.forEach(([k, v], i) => {
    const x = M + (i % 2) * 92, yy = y + Math.floor(i / 2) * 7;
    doc.setTextColor(...gray); doc.text(T(k), x, yy); doc.setTextColor(30, 30, 30); doc.text(T(v), x + 28, yy);
  });
  y += Math.ceil(meta.length / 2) * 7 + 6;
  const ensure = h => { if (y + h > H - 18) { doc.addPage(); y = M + 4; } };
  const heading = t => { ensure(16); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...teal); doc.text(T(t), M, y); y += 3; doc.setDrawColor(220, 220, 225); doc.line(M, y, W - M, y); y += 6; doc.setFont('helvetica', 'normal'); };
  const gap = 5, cw = (W - 2 * M - 2 * gap) / 3, chh = cw * 4 / 3;
  for (const [v, l] of VIEWS) {
    const ls = photos.filter(x => x.view === v); if (!ls.length) continue;
    heading(`${l} (${ls.length})`);
    for (let i = 0; i < ls.length; i += 3) {
      ensure(chh + 14);
      for (let j = 0; j < 3 && i + j < ls.length; j++) {
        const ph = ls[i + j], x = M + j * (cw + gap);
        try { doc.addImage(await cropCover(blobs.get(ph.id), 540, 720), 'JPEG', x, y, cw, chh); } catch { /* image illisible */ }
        doc.setFontSize(8.5); doc.setTextColor(30, 30, 30);
        const jj = p.start && ph.date >= p.start ? ` · J+${daysBetween(p.start, ph.date)}` : '';
        doc.text(T(fmt(ph.date) + jj), x, y + chh + 4);
        if (ph.note) { doc.setTextColor(...gray); doc.text(doc.splitTextToSize(T(ph.note), cw).slice(0, 2), x, y + chh + 8); }
      }
      y += chh + 14;
    }
  }
  const lines = (txt, size = 10.5) => { doc.setFontSize(size); doc.setTextColor(30, 30, 30); const ls = doc.splitTextToSize(T(txt), W - 2 * M); ensure(ls.length * 5 + 2); doc.text(ls, M, y); y += ls.length * 5 + 2; };
  const qs = mine('questions').filter(q => !q.done);
  if (qs.length) { heading('Questions du patient'); qs.forEach(q => lines('-  ' + q.text)); y += 4; }
  const rdv = mine('rdv').sort((a, b) => a.date.localeCompare(b.date));
  if (rdv.length) { heading('Rendez-vous'); rdv.forEach(r => lines(`${fmt(r.date)} - ${r.title}${r.note ? ' : ' + r.note : ''}`)); }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text(T('Photos prises par le patient avec Sourire. Document informatif, sans valeur diagnostique.'), M, H - 9);
    doc.text(`${i} / ${pages}`, W - M, H - 9, { align: 'right' });
  }
  const file = new File([doc.output('blob')], T(`Compte-rendu-${p.name}-${iso()}.pdf`).replace(/\s+/g, '_'), { type: 'application/pdf' });
  $('#hud').classList.remove('on');
  readyToShare([file], 'Compte rendu prêt', `${plural(pages, 'page')} · ${plural(photos.length, 'photo')} · ${size(file.size)}`);
}

// ---------- Sauvegarde ----------
async function exportBackup() {
  hud('Préparation de la sauvegarde…', 'down', 15000);
  const data = {};
  for (const ph of state.photos) { const b = blobs.get(ph.id); if (b) data[ph.id] = await blobToDataURL(b); }
  const file = new File([JSON.stringify({ app: 'sourire', version: 1, exported: new Date().toISOString(), state, blobs: data })], `sourire-sauvegarde-${iso()}.json`, { type: 'application/json' });
  $('#hud').classList.remove('on');
  readyToShare([file], 'Sauvegarde prête', `${plural(state.photos.length, 'photo')} · ${size(file.size)} — garde-la dans Fichiers ou iCloud Drive.`, 'down');
}
function importBackup() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json'; inp.style.display = 'none';
  inp.onchange = async () => {
    const f = inp.files[0]; inp.remove(); if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'sourire' || !data.state) throw new Error('format');
      if (state.profiles.length && !await alertBox({ title: 'Remplacer les données ?', message: 'Les données actuelles de cet appareil seront remplacées par la sauvegarde.', ok: 'Remplacer', destructive: true })) return;
      for (const id of [...urls.keys()]) await delBlob(id).catch(() => {});
      state = Object.assign(blank(), data.state);
      for (const [id, u] of Object.entries(data.blobs || {})) await putBlob(id, await dataURLToBlob(u));
      save(); ui.tab = 'home'; ui.ringDone = false; render(); hud('Sauvegarde restaurée');
    } catch (e) { console.error(e); hud('Fichier de sauvegarde invalide', 'info'); }
  };
  document.body.appendChild(inp); inp.click();
}

// ---------- Événements ----------
const preView = () => (ui.tab === 'photos' && ui.filter !== 'all' ? ui.filter : null);
const ACTIONS = {
  'profiles': profilesSheet, 'new-profile': () => profileSheet(), 'edit-profile': () => profileSheet(me()),
  'camera': () => openCamera(preView()), 'library': () => pickFromLibrary(preView()), 'add-photo': () => addPhotoMenu(preView()),
  'present': presentMenu, 'timelapse': () => openViewer(myPhotos(ui.cmpView), 0, 'play'),
  'add-rdv': () => rdvSheet(), 'add-question': () => questionSheet(), 'add-pay': () => paySheet(),
  'pdf': () => makeReport().catch(e => { console.error(e); hud('Impossible de créer le PDF', 'info'); }),
  'share-all': () => sharePhotos(myPhotos()), 'export': exportBackup, 'import': importBackup,
};
document.addEventListener('click', e => {
  if (!e.target.closest('#view,#bar,#tabs')) return;
  if (e.target.closest('.sw')?.dataset.justSwiped) return;
  if ($('.sw.open') && !e.target.closest('.sw-del')) { closeSwipes(); return; }
  const t = e.target.closest('[data-tab],[data-action],[data-open],[data-filter],[data-cmpview],[data-cmpmode],[data-rdv],[data-q],[data-qedit],[data-pay],[data-paid],[data-swdel]');
  if (!t) return;
  const d = t.dataset;
  if (d.tab) return go(d.tab);
  if (d.open) { const list = ui.tab === 'photos' ? myPhotos(ui.filter) : myPhotos(); return openViewer(list, list.findIndex(p => p.id === d.open)); }
  if (d.filter) { ui.filter = d.filter; haptic(); return render(); }
  if (d.cmpview) { ui.cmpView = d.cmpview; ui.cmpA = ui.cmpB = null; haptic(); return render(); }
  if (d.cmpmode) { ui.cmpMode = d.cmpmode; haptic(); return render(); }
  if (d.rdv) return rdvSheet(state.rdv.find(r => r.id === d.rdv));
  if (d.q) { const q = state.questions.find(x => x.id === d.q); q.done = !q.done; save(); haptic(); return render(); }
  if (d.qedit) return questionSheet(state.questions.find(x => x.id === d.qedit));
  if (d.pay) return paySheet(state.payments.find(x => x.id === d.pay));
  if (d.paid) { const x = state.payments.find(y => y.id === d.paid); x.paid = !x.paid; save(); haptic(); return render(); }
  if (d.swdel) {
    const [k, id] = d.swdel.split(':'), key = { q: 'questions', pay: 'payments', rdv: 'rdv' }[k];
    state[key] = state[key].filter(x => x.id !== id); save(); haptic(); return render();
  }
  ACTIONS[d.action]?.();
});
document.addEventListener('change', e => { const k = e.target.dataset?.cmp; if (k && e.target.closest('#view')) { ui[k] = e.target.value; render(); } });

// ---------- Démarrage ----------
$('#tabs').innerHTML = '<span class="pill"></span>' + TABS.map(([id, label, icon]) => `<button class="tab" data-tab="${id}">${ic(icon, 25)}<span>${label}</span></button>`).join('');
(async () => {
  try { db = await openDB(); await loadBlobs(); } catch (e) { console.error(e); hud('Stockage des photos indisponible (navigation privée ?)', 'info', 4000); }
  navigator.storage?.persist?.();
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
