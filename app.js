/* Sourire — suivi de traitement orthodontique.
   Tout est stocké sur l'appareil : les infos dans localStorage, les photos dans IndexedDB.
   Rien n'est envoyé sur un serveur. */
(() => {
'use strict';

// ---------- Constantes ----------
const VIEWS = [
  ['face', 'Sourire de face'], ['droite', 'Côté droit'], ['gauche', 'Côté gauche'],
  ['haut', 'Arcade du haut'], ['bas', 'Arcade du bas'], ['profil', 'Visage de profil'],
];
const VIEW_LABEL = Object.fromEntries(VIEWS);
const TYPES = [['bagues', 'Bagues'], ['aligneurs', 'Aligneurs'], ['lingual', 'Lingual'], ['contention', 'Contention'], ['autre', 'Autre']];
const TYPE_LABEL = Object.fromEntries(TYPES);
const KEY = 'sourire.v1';
const DAY = 864e5;

// ---------- Utilitaires ----------
const $ = (s, el = document) => el.querySelector(s);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmt = (s, o = { day: 'numeric', month: 'long', year: 'numeric' }) => toDate(s).toLocaleDateString('fr-FR', o);
const fmtShort = s => fmt(s, { day: 'numeric', month: 'short', year: '2-digit' });
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
const addMonths = (s, n) => { const d = toDate(s); d.setMonth(d.getMonth() + n); return iso(d); };
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
const euro = n => Number(n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

// ---------- État ----------
const blank = () => ({ profiles: [], activeId: null, photos: [], rdv: [], questions: [], payments: [] });
let state = blank();
try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* état neuf */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { toast('Stockage plein : impossible d’enregistrer'); } };
const me = () => state.profiles.find(p => p.id === state.activeId) || null;
const mine = k => state[k].filter(x => x.profileId === state.activeId);
const myPhotos = (view) => mine('photos').filter(p => !view || view === 'all' || p.view === view)
  .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

let ui = { tab: 'home', filter: 'all', cmpView: null, cmpA: null, cmpB: null, cmpMode: 'slider' };

// ---------- Photos (IndexedDB) ----------
let db;
const urls = new Map();
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('sourire', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
const tx = (mode, fn) => new Promise((res, rej) => {
  const t = db.transaction('photos', mode); const out = fn(t.objectStore('photos'));
  t.oncomplete = () => res(out.result); t.onerror = t.onabort = () => rej(t.error);
});
const putBlob = (id, blob) => tx('readwrite', s => s.put(blob, id)).then(() => urls.set(id, URL.createObjectURL(blob)));
const delBlob = id => tx('readwrite', s => s.delete(id)).then(() => { URL.revokeObjectURL(urls.get(id)); urls.delete(id); });
const getBlob = id => tx('readonly', s => s.get(id));
async function loadBlobs() {
  const keys = await tx('readonly', s => s.getAllKeys());
  const vals = await tx('readonly', s => s.getAll());
  keys.forEach((k, i) => urls.set(k, URL.createObjectURL(vals[i])));
}
const src = id => urls.get(id) || '';

// Réduit la photo (1600 px max, JPEG) pour ne pas saturer le téléphone.
async function shrink(file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  }
  const w0 = bmp.width || bmp.naturalWidth, h0 = bmp.height || bmp.naturalHeight;
  const k = Math.min(1, 1600 / Math.max(w0, h0));
  const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error('conversion')), 'image/jpeg', 0.86));
}
const blobToDataURL = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
const dataURLToBlob = u => fetch(u).then(r => r.blob());

// ---------- Calculs ----------
function progress(p) {
  if (!p?.start || !p.months) return null;
  const end = addMonths(p.start, Number(p.months));
  const total = daysBetween(p.start, end), done = daysBetween(p.start, iso());
  const pct = Math.max(0, Math.min(100, Math.round(done / total * 100)));
  const left = Math.max(0, daysBetween(iso(), end));
  const leftTxt = left === 0 ? 'Fin estimée atteinte' : left < 45 ? `${plural(left, 'jour')} restants` : `Environ ${Math.round(left / 30.4)} mois restants`;
  return { end, pct, left, leftTxt, day: Math.max(0, done) };
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
const rel = d => { const n = daysBetween(iso(), d); return n === 0 ? "aujourd’hui" : n === 1 ? 'demain' : n > 1 ? `dans ${n} jours` : n === -1 ? 'hier' : `il y a ${-n} jours`; };

// ---------- Feuille (formulaire) ----------
let sheetSubmit = null;
function openSheet({ title, body, ok = 'Enregistrer', onSubmit, onDelete, deleteLabel = 'Supprimer' }) {
  const f = $('#sheetForm');
  f.innerHTML = `<h2>${esc(title)}</h2>${body}
    <div class="btns">${onSubmit ? `<button class="btn" value="ok">${esc(ok)}</button>` : ''}
    ${onDelete ? `<button type="button" class="btn danger" data-del>${esc(deleteLabel)}</button>` : ''}
    <button type="button" class="btn ghost" data-close>${onSubmit ? 'Annuler' : 'Fermer'}</button></div>`;
  sheetSubmit = onSubmit;
  $('[data-close]', f).onclick = () => $('#sheet').close();
  if (onDelete) $('[data-del]', f).onclick = () => { if (confirm('Confirmer la suppression ?')) { $('#sheet').close(); onDelete(); } };
  $('#sheet').showModal();
}
$('#sheetForm').addEventListener('submit', async e => {
  e.preventDefault();
  if (!sheetSubmit) return;
  const btn = $('button[value=ok]', e.target); btn.disabled = true;
  try { const r = await sheetSubmit(new FormData(e.target), e.target); if (r !== false) $('#sheet').close(); }
  catch (err) { console.error(err); toast('Oups, ça n’a pas fonctionné'); }
  btn.disabled = false;
});
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') e.target.close(); });
const opts = (list, sel) => list.map(([v, l]) => `<option value="${v}"${v === sel ? ' selected' : ''}>${esc(l)}</option>`).join('');

// ---------- Profils ----------
function profileSheet(p) {
  const isNew = !p; p = p || { type: 'bagues', start: iso(), months: 18, alignDays: 14 };
  openSheet({
    title: isNew ? 'Nouveau profil' : 'Modifier le profil', ok: isNew ? 'Créer' : 'Enregistrer',
    body: `
      <label>Prénom<input name="name" required maxlength="30" value="${esc(p.name)}" placeholder="Ex. Elisa" autocomplete="given-name"></label>
      <label>Type d’appareil<select name="type" id="ptype">${opts(TYPES, p.type)}</select></label>
      <div class="two"><label>Début du traitement<input type="date" name="start" required value="${esc(p.start)}"></label>
      <label>Durée estimée (mois)<input type="number" name="months" min="1" max="120" inputmode="numeric" value="${esc(p.months)}"></label></div>
      <label>Orthodontiste / cabinet<input name="practitioner" maxlength="60" value="${esc(p.practitioner)}" placeholder="Facultatif"></label>
      <div id="alignBox" class="two"><label>Nombre d’aligneurs<input type="number" name="alignTotal" min="1" max="200" inputmode="numeric" value="${esc(p.alignTotal)}"></label>
      <label>Changer tous les (jours)<input type="number" name="alignDays" min="1" max="60" inputmode="numeric" value="${esc(p.alignDays || 14)}"></label>
      <label style="grid-column:1/-1">Date du 1er aligneur<input type="date" name="alignStart" value="${esc(p.alignStart || p.start)}"></label></div>`,
    onSubmit: fd => {
      const data = Object.fromEntries(fd); data.name = data.name.trim(); if (!data.name) return false;
      if (isNew) { const np = { id: uid(), ...data }; state.profiles.push(np); state.activeId = np.id; }
      else Object.assign(p, data);
      save(); render(); toast(isNew ? `Bienvenue ${data.name} !` : 'Profil mis à jour');
    },
    onDelete: isNew ? null : async () => {
      for (const ph of state.photos.filter(x => x.profileId === p.id)) await delBlob(ph.id);
      for (const k of ['photos', 'rdv', 'questions', 'payments']) state[k] = state[k].filter(x => x.profileId !== p.id);
      state.profiles = state.profiles.filter(x => x.id !== p.id); state.activeId = state.profiles[0]?.id || null;
      save(); render(); toast('Profil supprimé');
    },
    deleteLabel: 'Supprimer ce profil et ses photos',
  });
  const sync = () => { $('#alignBox').style.display = $('#ptype').value === 'aligneurs' ? '' : 'none'; };
  $('#ptype').onchange = sync; sync();
}
function profilesSheet() {
  if (!state.profiles.length) return profileSheet();
  openSheet({
    title: 'Qui suit son traitement ?',
    body: `<div class="list">${state.profiles.map(p => `<button type="button" class="item" data-pick="${p.id}">
      <span class="check ${p.id === state.activeId ? 'on' : ''}">✓</span><span class="grow"><b>${esc(p.name)}</b><span class="mute small">${esc(TYPE_LABEL[p.type] || '')}</span></span>
      <span class="link" data-edit="${p.id}">Modifier</span></button>`).join('')}</div>
      <button type="button" class="btn coral" data-new>+ Ajouter une personne</button>`,
  });
  const f = $('#sheetForm');
  f.querySelectorAll('[data-pick]').forEach(b => b.onclick = e => {
    const edit = e.target.closest('[data-edit]');
    $('#sheet').close();
    if (edit) return profileSheet(state.profiles.find(p => p.id === edit.dataset.edit));
    state.activeId = b.dataset.pick; ui.cmpA = ui.cmpB = ui.cmpView = null; ui.filter = 'all'; save(); render();
  });
  $('[data-new]', f).onclick = () => { $('#sheet').close(); profileSheet(); };
}

// ---------- Photos ----------
function photoSheet(preView) {
  openSheet({
    title: 'Ajouter des photos', ok: 'Ajouter',
    body: `
      <label>Photo(s)<input type="file" name="files" accept="image/*" multiple required></label>
      <label>Vue</label><div class="pick">${VIEWS.map(([v, l], i) => `<label><input type="radio" name="view" value="${v}" ${(preView ? v === preView : i === 0) ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <label>Date<input type="date" name="date" required value="${iso()}" max="${iso()}"></label>
      <label>Note<textarea name="note" maxlength="300" placeholder="Ex. après la pose de l’arc, gêne en bas à gauche…"></textarea></label>
      <p class="mute small">Astuce : même cadrage et même lumière à chaque fois, la comparaison sera bien plus parlante.</p>`,
    onSubmit: async fd => {
      const files = fd.getAll('files').filter(f => f && f.size);
      if (!files.length) return false;
      let n = 0;
      for (const f of files) {
        try {
          const blob = await shrink(f); const id = uid(); await putBlob(id, blob);
          state.photos.push({ id, profileId: state.activeId, date: fd.get('date'), view: fd.get('view'), note: fd.get('note').trim() }); n++;
        } catch (err) { console.error(err); }
      }
      save(); render();
      toast(n ? `${plural(n, 'photo')} ajoutée${n > 1 ? 's' : ''}` : 'Format de photo non pris en charge');
    },
  });
}
function editPhoto(p, after) {
  openSheet({
    title: 'Modifier la photo',
    body: `<label>Vue<select name="view">${opts(VIEWS, p.view)}</select></label>
      <label>Date<input type="date" name="date" required value="${p.date}" max="${iso()}"></label>
      <label>Note<textarea name="note" maxlength="300">${esc(p.note)}</textarea></label>`,
    onSubmit: fd => { Object.assign(p, { view: fd.get('view'), date: fd.get('date'), note: fd.get('note').trim() }); save(); render(); after?.(); },
    onDelete: async () => { state.photos = state.photos.filter(x => x.id !== p.id); await delBlob(p.id); save(); render(); closeViewer(); toast('Photo supprimée'); },
  });
}
async function sharePhotos(list) {
  const p = me();
  const files = [];
  for (const ph of list) { const b = await getBlob(ph.id); if (b) files.push(new File([b], `sourire-${p.name}-${ph.date}-${ph.view}.jpg`.replace(/\s+/g, '_'), { type: 'image/jpeg' })); }
  if (!files.length) return toast('Aucune photo à envoyer');
  try {
    if (navigator.canShare?.({ files })) { await navigator.share({ files, title: `Suivi orthodontique — ${p.name}` }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  for (const f of files) { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  toast('Photos téléchargées');
}

// ---------- Visionneuse / mode cabinet ----------
let vw = null;
function openViewer(list, i, cabinet = false) { if (!list.length) return; vw = { ids: list.map(p => p.id), i, cabinet }; drawViewer(); }
function closeViewer() { vw = null; $('#viewer').hidden = true; $('#viewer').innerHTML = ''; }
function drawViewer() {
  if (!vw) return;
  const list = vw.ids.map(id => state.photos.find(p => p.id === id)).filter(Boolean);
  if (!list.length) return closeViewer();
  vw.i = Math.max(0, Math.min(list.length - 1, vw.i));
  const ph = list[vw.i], p = me();
  const j = p?.start ? daysBetween(p.start, ph.date) : null;
  const el = $('#viewer'); el.hidden = false;
  el.innerHTML = `<div class="vt"><div><b>${esc(VIEW_LABEL[ph.view])}</b><small>${fmt(ph.date)}${j !== null && j >= 0 ? ` · J+${j}` : ''}${vw.cabinet ? ` · ${esc(p.name)}` : ''}</small></div>
      <button class="x" data-v="close" aria-label="Fermer">✕</button></div>
    <div class="stage"><img src="${src(ph.id)}" alt="${esc(VIEW_LABEL[ph.view])} du ${fmt(ph.date)}">
      <button class="nav p" data-v="prev" aria-label="Précédente">‹</button><button class="nav n" data-v="next" aria-label="Suivante">›</button></div>
    ${ph.note ? `<p class="note">${esc(ph.note)}</p>` : ''}
    <div class="dots">${vw.i + 1} / ${list.length}</div>
    <div class="vb">${vw.cabinet ? `<button data-v="prev">‹ Précédente</button><button data-v="next">Suivante ›</button>`
      : `<button data-v="share">Envoyer</button><button data-v="edit">Modifier</button>`}</div>`;
  el.onclick = e => {
    const a = e.target.closest('[data-v]')?.dataset.v; if (!a) return;
    if (a === 'close') closeViewer();
    else if (a === 'prev') { vw.i--; drawViewer(); }
    else if (a === 'next') { vw.i++; drawViewer(); }
    else if (a === 'share') sharePhotos([ph]);
    else if (a === 'edit') editPhoto(ph, drawViewer);
  };
}
let touchX = null;
$('#viewer').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
$('#viewer').addEventListener('touchend', e => {
  if (touchX === null || !vw) return; const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 50) { vw.i += dx < 0 ? 1 : -1; drawViewer(); }
}, { passive: true });
document.addEventListener('keydown', e => {
  if (!vw) return;
  if (e.key === 'Escape') closeViewer(); else if (e.key === 'ArrowLeft') { vw.i--; drawViewer(); } else if (e.key === 'ArrowRight') { vw.i++; drawViewer(); }
});

// ---------- Rendez-vous, questions, paiements ----------
function rdvSheet(r) {
  const isNew = !r; r = r || { date: iso(), time: '', title: 'Contrôle', note: '' };
  openSheet({
    title: isNew ? 'Nouveau rendez-vous' : 'Rendez-vous',
    body: `<label>Motif<input name="title" required maxlength="60" value="${esc(r.title)}" list="motifs"><datalist id="motifs"><option>Contrôle<option>Pose de l’appareil<option>Changement d’arc<option>Nouveaux aligneurs<option>Urgence<option>Dépose<option>Contention</datalist></label>
      <div class="two"><label>Date<input type="date" name="date" required value="${r.date}"></label><label>Heure<input type="time" name="time" value="${esc(r.time)}"></label></div>
      <label>Notes / ce que le praticien a dit<textarea name="note" maxlength="600">${esc(r.note)}</textarea></label>
      ${isNew ? '' : `<label class="row" style="font-size:15px;color:var(--ink)"><input type="checkbox" name="done" style="width:24px;min-height:24px;appearance:auto;-webkit-appearance:checkbox" ${r.done ? 'checked' : ''}> Rendez-vous passé</label>`}`,
    onSubmit: fd => {
      const d = { title: fd.get('title').trim(), date: fd.get('date'), time: fd.get('time'), note: fd.get('note').trim(), done: fd.get('done') === 'on' };
      if (isNew) state.rdv.push({ id: uid(), profileId: state.activeId, ...d }); else Object.assign(r, d);
      save(); render();
    },
    onDelete: isNew ? null : () => { state.rdv = state.rdv.filter(x => x.id !== r.id); save(); render(); },
  });
}
function questionSheet() {
  openSheet({
    title: 'Question pour l’orthodontiste', ok: 'Ajouter',
    body: `<label>Ta question<textarea name="text" required maxlength="300" placeholder="Ex. Est-ce normal que cette dent bouge encore ?"></textarea></label>`,
    onSubmit: fd => { const t = fd.get('text').trim(); if (!t) return false; state.questions.push({ id: uid(), profileId: state.activeId, text: t, done: false, date: iso() }); save(); render(); },
  });
}
function paySheet(x) {
  const isNew = !x; x = x || { label: 'Échéance', date: iso(), amount: '' };
  openSheet({
    title: isNew ? 'Nouvelle échéance' : 'Échéance',
    body: `<label>Libellé<input name="label" required maxlength="50" value="${esc(x.label)}"></label>
      <div class="two"><label>Date<input type="date" name="date" required value="${x.date}"></label>
      <label>Montant (€)<input type="number" name="amount" required min="0" step="0.01" inputmode="decimal" value="${esc(x.amount)}"></label></div>`,
    onSubmit: fd => {
      const d = { label: fd.get('label').trim(), date: fd.get('date'), amount: Number(fd.get('amount')) || 0 };
      if (isNew) state.payments.push({ id: uid(), profileId: state.activeId, paid: false, ...d }); else Object.assign(x, d);
      save(); render();
    },
    onDelete: isNew ? null : () => { state.payments = state.payments.filter(p => p.id !== x.id); save(); render(); },
  });
}

// ---------- Écrans ----------
const ICON_CAM = '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>';
const thumb = (ph, label) => `<button class="ph" data-open="${ph.id}"><img loading="lazy" src="${src(ph.id)}" alt="${esc(VIEW_LABEL[ph.view])} du ${fmt(ph.date)}"><em>${esc(label)}</em></button>`;

function vWelcome() {
  return `<div class="hello"><h1>Ton sourire,<br>semaine après semaine.</h1>
    <p class="mute">Prends tes dents en photo au fil du traitement, compare l’avant / après et montre l’évolution à ton orthodontiste.</p></div>
    <div class="card"><h3>Tes photos restent chez toi</h3><p class="mute">Elles sont enregistrées uniquement sur cet appareil. Rien n’est envoyé en ligne : c’est toi qui choisis quand et à qui les montrer.</p></div>
    <button class="btn coral" data-action="new-profile">Commencer</button>
    <button class="btn ghost" data-action="import">Restaurer une sauvegarde</button>`;
}

function vHome() {
  const p = me(), pr = progress(p), al = aligner(p), photos = myPhotos();
  const next = mine('rdv').filter(r => !r.done && r.date >= iso()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
  const last = photos.at(-1), since = last ? daysBetween(last.date, iso()) : null;
  const qs = mine('questions').filter(q => !q.done);
  return `<div class="hello"><h1>Bonjour ${esc(p.name)}</h1><p class="mute">${esc(TYPE_LABEL[p.type] || 'Traitement')}${p.practitioner ? ` · ${esc(p.practitioner)}` : ''}</p></div>
    ${pr ? `<div class="card teal"><div class="row"><div class="ring" style="--p:${pr.pct}"><b>${pr.pct}%</b></div>
      <div class="grow"><h3>${pr.leftTxt}</h3><p class="mute small" style="margin-top:6px">Jour ${pr.day} · début le ${fmt(p.start)}<br>Fin estimée : ${fmt(pr.end, { month: 'long', year: 'numeric' })}</p></div></div></div>` : ''}
    ${al ? `<div class="card"><div class="between"><h3>Aligneur ${al.n} sur ${al.total}</h3>${al.next ? `<span class="pill${al.inDays > 2 ? ' ok' : ''}">${al.inDays <= 0 ? 'À changer' : 'Suivant ' + rel(al.next)}</span>` : '<span class="pill ok">Dernier !</span>'}</div>
      <div class="bar"><i style="width:${Math.round(al.n / al.total * 100)}%"></i></div></div>` : ''}
    <div class="card"><div class="between"><h3>Photos</h3>${photos.length ? `<button class="link" data-tab="photos">Tout voir</button>` : ''}</div>
      ${photos.length ? `<p class="mute small">${plural(photos.length, 'photo')} · dernière ${since === 0 ? "aujourd’hui" : `il y a ${plural(since, 'jour')}`}${since >= 14 ? ' — c’est le moment d’en refaire une !' : ''}</p>
        <div class="strip">${photos.slice(-8).reverse().map(ph => thumb(ph, fmtShort(ph.date))).join('')}</div>`
        : `<p class="mute">Commence par une photo de départ : c’est elle qui rendra l’évolution visible.</p>`}
      <button class="btn coral" style="margin-top:14px" data-action="add-photo">${ICON_CAM.replace('<svg', '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"')} Ajouter une photo</button></div>
    <div class="card"><div class="between"><h3>Prochain rendez-vous</h3><button class="link" data-tab="suivi">Suivi</button></div>
      ${next ? `<button class="item" data-rdv="${next.id}">${dateBadge(next.date)}<span class="grow"><b>${esc(next.title)}</b><span class="mute small">${rel(next.date)}${next.time ? ` à ${esc(next.time)}` : ''}</span></span></button>`
        : `<p class="mute">Aucun rendez-vous prévu.</p><button class="btn ghost sm" style="margin-top:10px" data-action="add-rdv">+ Ajouter</button>`}</div>
    <div class="card"><div class="between"><h3>À demander à l’ortho</h3><button class="link" data-action="add-question">+ Ajouter</button></div>
      ${qs.length ? `<div class="list">${qs.map(qItem).join('')}</div>` : `<p class="mute">Note tes questions ici pour ne rien oublier au cabinet.</p>`}</div>`;
}
const dateBadge = (d, past) => `<span class="date${past ? ' past' : ''}"><b>${toDate(d).getDate()}</b><span>${fmt(d, { month: 'short' }).replace('.', '')}</span></span>`;
const qItem = q => `<div class="item${q.done ? ' done' : ''}"><button class="check${q.done ? ' on' : ''}" data-q="${q.id}" aria-label="Cocher">✓</button><span class="grow"><b>${esc(q.text)}</b></span><button class="mute" data-qdel="${q.id}" aria-label="Supprimer">✕</button></div>`;

function vPhotos() {
  const all = myPhotos();
  if (!all.length) return `<h1>Photos</h1><div class="card empty">${ICON_CAM}<h3>Aucune photo pour l’instant</h3>
    <p class="mute">Ajoute ta première photo : de face, de côté, ou des arcades.</p><button class="btn coral" data-action="add-photo">Ajouter une photo</button></div>`;
  const list = myPhotos(ui.filter).reverse();
  const groups = {};
  list.forEach(ph => (groups[ph.date.slice(0, 7)] ||= []).push(ph));
  const used = new Set(all.map(p => p.view));
  return `<div class="between"><h1>Photos</h1><button class="btn coral sm" data-action="add-photo">+ Ajouter</button></div>
    <div class="chips"><button class="chip${ui.filter === 'all' ? ' on' : ''}" data-filter="all">Toutes · ${all.length}</button>
      ${VIEWS.filter(([v]) => used.has(v)).map(([v, l]) => `<button class="chip${ui.filter === v ? ' on' : ''}" data-filter="${v}">${l}</button>`).join('')}</div>
    ${Object.entries(groups).map(([m, phs]) => `<div class="month">${fmt(m + '-01', { month: 'long', year: 'numeric' })}</div>
      <div class="grid">${phs.map(ph => thumb(ph, ui.filter === 'all' ? VIEW_LABEL[ph.view] : fmtShort(ph.date))).join('')}</div>`).join('')}`;
}

function vCompare() {
  const all = myPhotos();
  const byView = VIEWS.map(([v, l]) => [v, l, all.filter(p => p.view === v)]).filter(x => x[2].length >= 2);
  if (!byView.length) return `<h1>Comparer</h1><div class="card empty"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 3v18"/></svg>
    <h3>Il faut deux photos de la même vue</h3><p class="mute">Ajoute au moins deux photos prises sous le même angle à des dates différentes pour voir l’avant / après.</p>
    <button class="btn coral" data-action="add-photo">Ajouter une photo</button></div>`;
  if (!byView.some(x => x[0] === ui.cmpView)) { ui.cmpView = byView[0][0]; ui.cmpA = ui.cmpB = null; }
  const list = byView.find(x => x[0] === ui.cmpView)[2];
  if (!list.some(p => p.id === ui.cmpA)) ui.cmpA = list[0].id;
  if (!list.some(p => p.id === ui.cmpB)) ui.cmpB = list.at(-1).id;
  const a = list.find(p => p.id === ui.cmpA), b = list.find(p => p.id === ui.cmpB);
  const gap = Math.abs(daysBetween(a.date, b.date));
  const o = sel => list.map((p, i) => `<option value="${p.id}"${p.id === sel ? ' selected' : ''}>${fmtShort(p.date)}${list.filter(x => x.date === p.date).length > 1 ? ` (${i + 1})` : ''}</option>`).join('');
  return `<h1>Comparer</h1>
    <div class="chips">${byView.map(([v, l]) => `<button class="chip${v === ui.cmpView ? ' on' : ''}" data-cmpview="${v}">${l}</button>`).join('')}</div>
    ${ui.cmpMode === 'slider' ? `<div class="cmp" id="cmp"><img src="${src(a.id)}" alt="Avant"><img class="after" src="${src(b.id)}" alt="Après">
      <span class="tag l">Avant</span><span class="tag r">Après</span><div class="handle"></div>
      <input type="range" min="0" max="100" value="50" aria-label="Glisser pour comparer"></div>`
      : `<div class="side"><figure><img src="${src(a.id)}" alt="Avant"><figcaption>${fmt(a.date)}</figcaption></figure><figure><img src="${src(b.id)}" alt="Après"><figcaption>${fmt(b.date)}</figcaption></figure></div>`}
    <p class="mute small" style="text-align:center">${gap ? `${plural(gap, 'jour')} d’écart${gap > 60 ? ` (≈ ${Math.round(gap / 30.4)} mois)` : ''}` : 'Même jour'}</p>
    <div class="two"><label>Avant<select data-cmp="cmpA">${o(a.id)}</select></label><label>Après<select data-cmp="cmpB">${o(b.id)}</select></label></div>
    <div class="chips"><button class="chip${ui.cmpMode === 'slider' ? ' on' : ''}" data-cmpmode="slider">Curseur</button><button class="chip${ui.cmpMode === 'side' ? ' on' : ''}" data-cmpmode="side">Côte à côte</button></div>`;
}

function vSuivi() {
  const rdv = mine('rdv').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const up = rdv.filter(r => !r.done && r.date >= iso()), past = rdv.filter(r => r.done || r.date < iso()).reverse();
  const qs = mine('questions').sort((a, b) => a.done - b.done);
  const pay = mine('payments').sort((a, b) => a.date.localeCompare(b.date));
  const total = pay.reduce((s, x) => s + x.amount, 0), paid = pay.filter(x => x.paid).reduce((s, x) => s + x.amount, 0);
  const rItem = (r, isPast) => `<button class="item" data-rdv="${r.id}">${dateBadge(r.date, isPast)}<span class="grow"><b>${esc(r.title)}</b>
    <span class="mute small">${isPast ? fmt(r.date, { year: 'numeric', month: 'long' }) : rel(r.date)}${r.time ? ` · ${esc(r.time)}` : ''}${r.note ? ` · ${esc(r.note.slice(0, 60))}${r.note.length > 60 ? '…' : ''}` : ''}</span></span></button>`;
  return `<h1>Suivi</h1>
    <div class="card"><div class="between"><h3>Rendez-vous</h3><button class="link" data-action="add-rdv">+ Ajouter</button></div>
      ${up.length ? `<div class="list">${up.map(r => rItem(r)).join('')}</div>` : `<p class="mute">Aucun rendez-vous à venir.</p>`}</div>
    ${past.length ? `<div class="card"><h3>Historique</h3><div class="list">${past.map(r => rItem(r, true)).join('')}</div></div>` : ''}
    <div class="card"><div class="between"><h3>Questions pour l’ortho</h3><button class="link" data-action="add-question">+ Ajouter</button></div>
      ${qs.length ? `<div class="list">${qs.map(qItem).join('')}</div>` : `<p class="mute">Rien à demander pour l’instant.</p>`}</div>
    <div class="card"><div class="between"><h3>Paiements</h3><button class="link" data-action="add-pay">+ Ajouter</button></div>
      ${pay.length ? `<p class="mute small">${euro(paid)} réglés sur ${euro(total)} · reste ${euro(total - paid)}</p><div class="bar"><i style="width:${total ? Math.round(paid / total * 100) : 0}%"></i></div>
        <div class="list" style="margin-top:12px">${pay.map(x => `<div class="item${x.paid ? ' done' : ''}"><button class="check${x.paid ? ' on' : ''}" data-paid="${x.id}" aria-label="Marquer payé">✓</button>
          <button class="grow" data-pay="${x.id}" style="text-align:left"><b>${esc(x.label)}</b><span class="mute small">${fmt(x.date)}</span></button><span style="font-weight:600">${euro(x.amount)}</span></div>`).join('')}</div>`
        : `<p class="mute">Ajoute tes échéances pour suivre ce qui reste à régler.</p>`}</div>`;
}

function vShare() {
  const n = myPhotos().length, p = me();
  return `<h1>Au cabinet</h1><p class="mute">Montre ton évolution à ton orthodontiste ou ton dentiste, sur place ou à distance.</p>
    <div class="card teal"><h3>Mode cabinet</h3><p class="mute">Tes photos en plein écran, dans l’ordre chronologique. Tends simplement ton téléphone au praticien.</p>
      <div class="chips" style="margin-top:12px"><button class="chip" data-cab="all">Tout</button>${VIEWS.filter(([v]) => myPhotos(v).length).map(([v, l]) => `<button class="chip" data-cab="${v}">${l}</button>`).join('')}</div>
      ${n ? '' : '<p class="mute small" style="margin-top:10px">Ajoute d’abord des photos.</p>'}</div>
    <div class="card"><h3>Envoyer au praticien</h3><p class="mute">Un compte rendu PDF avec tes photos datées, tes rendez-vous et tes questions — ou les photos seules par mail / message.</p>
      <div class="btns" style="margin-top:12px"><button class="btn" data-action="pdf">Créer le compte rendu PDF</button><button class="btn ghost" data-action="share-all">Envoyer les photos</button></div></div>
    <div class="card"><h3>Sauvegarde</h3><p class="mute">Tes données vivent uniquement sur cet appareil. Exporte une sauvegarde de temps en temps, ou pour changer de téléphone.</p>
      <div class="btns" style="margin-top:12px"><button class="btn ghost" data-action="export">Exporter une sauvegarde</button><button class="btn ghost" data-action="import">Restaurer une sauvegarde</button></div></div>
    <button class="btn ghost" data-action="edit-profile">Modifier le profil de ${esc(p.name)}</button>
    <p class="mute small" style="text-align:center">Sourire ne remplace pas l’avis de ton praticien.</p>`;
}

const SCREENS = { home: vHome, photos: vPhotos, compare: vCompare, suivi: vSuivi, share: vShare };
function render() {
  const p = me();
  if (!p && state.profiles.length) { state.activeId = state.profiles[0].id; return render(); }
  document.querySelector('.tabs').style.display = p ? '' : 'none';
  $('.who').style.display = p ? '' : 'none';
  $('#whoName').textContent = p?.name || '';
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
  $('#view').innerHTML = p ? SCREENS[ui.tab]() : vWelcome();
  const cmp = $('#cmp');
  if (cmp) $('input', cmp).oninput = e => cmp.style.setProperty('--x', e.target.value + '%');
  if (vw) drawViewer();
}
function go(tab) { ui.tab = tab; render(); window.scrollTo(0, 0); }

// ---------- Compte rendu PDF ----------
async function makeReport() {
  const p = me(), pr = progress(p), al = aligner(p), photos = myPhotos();
  if (!photos.length) return toast('Ajoute d’abord des photos');
  const rdv = mine('rdv').sort((a, b) => a.date.localeCompare(b.date)), qs = mine('questions').filter(q => !q.done);
  const el = $('#report');
  el.innerHTML = `<h1>Suivi orthodontique — ${esc(p.name)}</h1>
    <p class="meta">${esc(TYPE_LABEL[p.type] || '')}${p.practitioner ? ` · ${esc(p.practitioner)}` : ''} · début le ${fmt(p.start)}${pr ? ` · fin estimée ${fmt(pr.end, { month: 'long', year: 'numeric' })} (${pr.pct} %)` : ''}${al ? ` · aligneur ${al.n}/${al.total}` : ''}<br>Compte rendu du ${fmt(iso())} · ${plural(photos.length, 'photo')}</p>
    ${VIEWS.map(([v, l]) => { const ls = photos.filter(x => x.view === v); return ls.length ? `<h2>${l}</h2><div class="rg">${ls.map(ph => `<figure><img src="${src(ph.id)}"><figcaption>${fmt(ph.date)}${p.start && ph.date >= p.start ? ` · J+${daysBetween(p.start, ph.date)}` : ''}${ph.note ? ` — ${esc(ph.note)}` : ''}</figcaption></figure>`).join('')}</div>` : ''; }).join('')}
    ${qs.length ? `<h2>Questions du patient</h2><ul>${qs.map(q => `<li>${esc(q.text)}</li>`).join('')}</ul>` : ''}
    ${rdv.length ? `<h2>Rendez-vous</h2><ul>${rdv.map(r => `<li><b>${fmt(r.date)}</b> — ${esc(r.title)}${r.note ? ` : ${esc(r.note)}` : ''}</li>`).join('')}</ul>` : ''}
    <footer>Photos prises par le patient avec l’application Sourire. Document informatif, sans valeur diagnostique.</footer>`;
  await Promise.all([...el.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
  toast('Choisis « Enregistrer en PDF » ou partage depuis l’aperçu');
  setTimeout(() => window.print(), 250);
}

// ---------- Sauvegarde ----------
async function exportBackup() {
  toast('Préparation de la sauvegarde…');
  const blobs = {};
  for (const ph of state.photos) { const b = await getBlob(ph.id); if (b) blobs[ph.id] = await blobToDataURL(b); }
  const file = new File([JSON.stringify({ app: 'sourire', version: 1, exported: new Date().toISOString(), state, blobs })], `sourire-sauvegarde-${iso()}.json`, { type: 'application/json' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function importBackup() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      if (data.app !== 'sourire' || !data.state) throw new Error('format');
      if (state.profiles.length && !confirm('Remplacer les données actuelles par celles de la sauvegarde ?')) return;
      for (const id of [...urls.keys()]) await delBlob(id);
      state = Object.assign(blank(), data.state);
      for (const [id, u] of Object.entries(data.blobs || {})) await putBlob(id, await dataURLToBlob(u));
      save(); ui.tab = 'home'; render(); toast('Sauvegarde restaurée');
    } catch (e) { console.error(e); toast('Fichier de sauvegarde invalide'); }
  };
  inp.click();
}

// ---------- Événements ----------
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab],[data-action],[data-open],[data-filter],[data-cmpview],[data-cmpmode],[data-rdv],[data-q],[data-qdel],[data-pay],[data-paid],[data-cab]');
  if (!t || t.closest('#sheet') || t.closest('#viewer')) return;
  const d = t.dataset;
  if (d.tab) return go(d.tab);
  if (d.open) { const list = ui.tab === 'photos' ? myPhotos(ui.filter) : myPhotos(); return openViewer(list, list.findIndex(p => p.id === d.open)); }
  if (d.filter) { ui.filter = d.filter; return render(); }
  if (d.cmpview) { ui.cmpView = d.cmpview; ui.cmpA = ui.cmpB = null; return render(); }
  if (d.cmpmode) { ui.cmpMode = d.cmpmode; return render(); }
  if (d.rdv) return rdvSheet(state.rdv.find(r => r.id === d.rdv));
  if (d.q) { const q = state.questions.find(x => x.id === d.q); q.done = !q.done; save(); return render(); }
  if (d.qdel) { state.questions = state.questions.filter(x => x.id !== d.qdel); save(); return render(); }
  if (d.pay) return paySheet(state.payments.find(x => x.id === d.pay));
  if (d.paid) { const x = state.payments.find(y => y.id === d.paid); x.paid = !x.paid; save(); return render(); }
  if (d.cab) { const l = myPhotos(d.cab); return l.length ? openViewer(l, 0, true) : toast('Ajoute d’abord des photos'); }
  ({
    'profiles': profilesSheet, 'new-profile': () => profileSheet(), 'edit-profile': () => profileSheet(me()),
    'add-photo': () => photoSheet(ui.tab === 'photos' && ui.filter !== 'all' ? ui.filter : ui.tab === 'compare' ? ui.cmpView : null),
    'add-rdv': () => rdvSheet(), 'add-question': questionSheet, 'add-pay': () => paySheet(),
    'pdf': makeReport, 'share-all': () => sharePhotos(myPhotos()), 'export': exportBackup, 'import': importBackup,
  })[d.action]?.();
});
document.addEventListener('change', e => { const k = e.target.dataset?.cmp; if (k) { ui[k] = e.target.value; render(); } });

// ---------- Démarrage ----------
(async () => {
  try { db = await openDB(); await loadBlobs(); } catch (e) { console.error(e); toast('Stockage des photos indisponible (navigation privée ?)'); }
  navigator.storage?.persist?.();
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
