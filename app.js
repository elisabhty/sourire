/* Sourire — carnet de suivi de traitement orthodontique (PWA).
   Tout reste sur l'appareil : infos dans localStorage, photos dans IndexedDB. Aucun serveur, aucun compte.
   Sourire n'interprète jamais les photos ni les données : c'est un carnet, pas un outil de diagnostic. */
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
const RET_TYPES = [['amovible', 'Gouttière (amovible)'], ['fil', 'Fil collé'], ['les-deux', 'Fil + gouttière']];
const RET_NIGHTS = [['7', 'Toutes les nuits'], ['5', '5 nuits par semaine'], ['3', '3 nuits par semaine'], ['1', '1 nuit par semaine']];
const TABS = [['home', 'Accueil', 'home'], ['photos', 'Photos', 'photos'], ['suivi', 'Suivi', 'calendar'], ['guide', 'Guide', 'book'], ['share', 'Cabinet', 'cabinet']];
const KEY = 'sourire.v1';
const DAY = 864e5, HOUR = 36e5;
const BASE_SECU = 193.5; // base de remboursement par semestre (acte TO 90), barème indicatif nov. 2026

// ---------- Icônes (style SF Symbols) ----------
const P = {
  home: '<path d="M4 10.2 12 3.8l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H5.5A1.5 1.5 0 0 1 4 19z"/>',
  photos: '<rect x="3" y="4.5" width="18" height="15" rx="3.5"/><circle cx="8.8" cy="9.6" r="1.7"/><path d="m21 15.5-4.6-4.6a1.2 1.2 0 0 0-1.7 0L6.5 19.4"/>',
  compare: '<rect x="3" y="4" width="18" height="16" rx="3.5"/><path d="M12 2.5v19M7.5 10 5.8 12l1.7 2M16.5 10l1.7 2-1.7 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v3.5M16 3v3.5M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/>',
  calplus: '<rect x="3.5" y="5" width="17" height="15.5" rx="3.5"/><path d="M8 3v3.5M16 3v3.5M3.5 10h17M12 12.8v5M9.5 15.3h5"/>',
  cabinet: '<rect x="3" y="7" width="18" height="13" rx="3.5"/><path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7M12 10.5v6M9 13.5h6"/>',
  book: '<path d="M12 6.5C10 5 7.5 4.5 4 4.5v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-14c-3.5 0-6 .5-8 2z"/><path d="M12 6.5v14"/>',
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
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  alert: '<path d="M10.3 4.3 2.6 17.6a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z"/><path d="M12 9.5V14M12 17.2h.01"/>',
  phone: '<path d="M5 3.5h3.2l1.6 4.2-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4.2 1.6V17a2.5 2.5 0 0 1-2.5 2.5A15 15 0 0 1 2.5 6 2.5 2.5 0 0 1 5 3.5z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  band: '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="4.5"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 3.5-3 7h3v11"/>',
  drop: '<path d="M12 3.5s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.3A2.5 2.5 0 0 1 4 13.5z"/>',
  euro: '<path d="M17 6.8A6.5 6.5 0 1 0 17 17.2M4.5 10.5h8.5M4.5 13.5h7.5"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
};
const ic = (n, s = 22) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const CHEV = '<svg class="chev" viewBox="0 0 8 14" aria-hidden="true"><path d="m1.5 1.5 5 5.5-5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const UPDOWN = '<svg class="chev ud" viewBox="0 0 10 16" aria-hidden="true"><path d="m2 6 3-3 3 3M2 10l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ---------- Contenus du guide (généraux, renvoient toujours vers le praticien) ----------
const URGENT = 'Urgence vitale (difficulté à respirer ou à avaler, gonflement important du visage, saignement qui ne s’arrête pas) : appelle le 15 ou le 112.';
const GUIDE = [
  { id: 'demarrer', t: 'Bien démarrer', ic: 'sparkle', c: '#5856D6', for: 'all', body: [
    ['p', 'Les premiers jours, tout est nouveau : c’est normal de devoir s’habituer.'],
    ['h', 'La première semaine'],
    ['ul', ['Une gêne ou une sensibilité est fréquente : souvent plus forte le lendemain, elle diminue ensuite au fil de la semaine.', 'Privilégie les aliments mous, faciles à mâcher.', 'La cire orthodontique soulage ce qui frotte contre les joues ou les lèvres.', 'Avec des aligneurs ou un appareil lingual, la prononciation peut changer quelques jours : lire à voix haute aide à s’habituer.']],
    ['h', 'Sport et loisirs'],
    ['ul', ['Pour les sports de contact, demande à ton orthodontiste quel protège-dents utiliser.', 'Si tu joues d’un instrument à vent, parles-en : une adaptation est souvent nécessaire au début.']],
    ['h', 'La durée'],
    ['p', 'La durée annoncée est une estimation. Ton orthodontiste peut l’ajuster, par exemple avec des aligneurs supplémentaires. Tu peux modifier la date de fin et le nombre d’aligneurs dans ton profil à tout moment.'],
  ] },
  { id: 'douleur', t: 'Douleur : est-ce normal ?', ic: 'pulse', c: '#FF6B57', for: 'all', body: [
    ['p', 'Une gêne est fréquente après la pose, après un réglage ou avec un nouvel aligneur. Elle apparaît en général quelques heures après, est souvent maximale le lendemain, puis diminue sur environ une semaine. Elle est en général plus marquée avec des bagues qu’avec des aligneurs.'],
    ['h', 'Ce qui peut soulager'],
    ['ul', ['Des aliments mous ou frais : yaourts, purées, soupes tièdes, pâtes, œufs.', 'De la cire orthodontique sur ce qui frotte.', 'Pour un antidouleur, demande à ton orthodontiste ou à ton pharmacien lequel est adapté pour toi.']],
    ['call', 'Contacte ton cabinet si la douleur augmente au lieu de diminuer, dure plus de quelques jours, ou si une plaie ne guérit pas. En cas de gonflement ou de fièvre, consulte rapidement un médecin.'],
    ['tip', 'Note ta douleur chaque jour dans Suivi : elle apparaîtra dans ton compte rendu pour ton orthodontiste.'],
  ] },
  { id: 'manger', t: 'Manger avec un appareil', ic: 'food', c: '#FF9500', for: 'all', body: [
    ['h', 'À éviter avec des bagues'],
    ['ul', ['Ce qui est dur : bonbons durs, glaçons, noix entières, croûtes dures.', 'Ce qui colle : caramel, chewing-gum, pâtes de fruits.', 'Ce qu’on croque à pleines dents : pomme entière, maïs en épi. Coupe-les en petits morceaux.']],
    ['h', 'Les jours sensibles'],
    ['ul', ['Soupes, purées, compotes, yaourts, œufs brouillés, pâtes, poisson, riz.', 'Des aliments frais peuvent soulager.']],
    ['h', 'Avec des aligneurs'],
    ['ul', ['Retire-les pour manger et pour boire autre chose que de l’eau.', 'Brosse-toi les dents avant de les remettre.', 'Utilise le bouton « Je les retire » sur l’accueil pour suivre ton temps hors bouche.']],
    ['tip', 'Suis en priorité la liste remise par ton orthodontiste.'],
  ] },
  { id: 'hyg-bagues', t: 'Hygiène avec des bagues', ic: 'drop', c: '#0A84FF', for: ['bagues', 'lingual'], body: [
    ['p', 'Les bagues retiennent la plaque dentaire. Sans un brossage soigneux, des taches blanches (déminéralisation de l’émail) peuvent apparaître autour des brackets.'],
    ['ul', ['Brosse-toi les dents après chaque repas, au moins 2 minutes, avec un dentifrice fluoré.', 'Brosse au-dessus et en dessous de chaque bracket, en inclinant la brosse.', 'Passe des brossettes entre les brackets et sous le fil.', 'Le fil dentaire (avec un enfile-fil) ou un jet dentaire complète le nettoyage.', 'Continue tes contrôles chez ton dentiste habituel.']],
    ['tip', 'Coche ta routine chaque jour sur l’accueil : tu verras ta régularité dans Suivi.'],
  ] },
  { id: 'hyg-aligneurs', t: 'Hygiène avec des aligneurs', ic: 'drop', c: '#0A84FF', for: ['aligneurs', 'contention'], body: [
    ['ul', ['Brosse-toi les dents avant de remettre tes aligneurs : sinon, les restes de nourriture restent plaqués contre les dents.', 'Nettoie tes aligneurs (ou ta gouttière de contention) matin et soir avec une brosse souple et de l’eau froide ou tiède.', 'Évite l’eau chaude : elle peut les déformer.', 'Range-les toujours dans leur boîtier. C’est enveloppés dans une serviette qu’ils se perdent le plus.', 'Quand tu les portes, ne bois que de l’eau.']],
    ['tip', 'Pour le produit de nettoyage, suis la recommandation de ton orthodontiste.'],
  ] },
  { id: 'aligneurs', t: 'Bien porter ses aligneurs', ic: 'clock', c: '#0A8F8C', for: ['aligneurs'], body: [
    ['p', 'La consigne la plus courante est de porter ses aligneurs environ 22 h par jour, en les retirant seulement pour manger, boire autre chose que de l’eau et se brosser les dents. Ton orthodontiste peut te donner une consigne différente : c’est la sienne qui compte, et tu peux la régler dans ton profil.'],
    ['ul', ['Appuie sur « Je les retire » puis « Je les remets » sur l’accueil : tu vois ta marge restante pour la journée.', 'Un oubli ? Corrige l’heure à tout moment, même pour la veille.', 'Change d’aligneur selon le calendrier donné par ton orthodontiste.', 'Les études montrent qu’on surestime facilement son temps de port : noter ses retraits aide à rester réaliste.']],
    ['tip', 'Les changements d’aligneur peuvent être ajoutés au Calendrier de ton iPhone, avec une alerte (Cabinet → Rappels dans Calendrier).'],
  ] },
  { id: 'elastiques', t: 'Élastiques', ic: 'band', c: '#FF9500', for: 'all', body: [
    ['ul', ['Porte-les exactement comme ton orthodontiste l’a indiqué : position, nombre et durée.', 'Change de paire au moins une fois par jour : les élastiques perdent une grande partie de leur force en quelques heures.', 'Garde toujours un sachet sur toi.', 'Une gêne en les remettant est fréquente les premiers jours.', 'Ne double pas les élastiques et n’en change pas le modèle sans avis.']],
    ['call', 'Plus d’élastiques ? Contacte ton cabinet pour en obtenir. Active le suivi du stock dans ton profil pour être prévenu à temps.'],
  ] },
  { id: 'contention', t: 'La contention', ic: 'moon', c: '#5E5CE6', for: 'all', body: [
    ['p', 'Après le traitement, les dents ont tendance à revenir vers leur position d’origine : la contention les maintient. Elle est souvent prévue sur le long terme, parfois à vie, la nuit pour une gouttière. Les recommandations françaises (SFODF, 2023) insistent sur l’importance de bien la porter.'],
    ['h', 'Fil collé derrière les dents'],
    ['ul', ['Brosse bien autour du fil et passe le fil dentaire avec un enfile-fil.', 'Vérifie de temps en temps qu’il n’est pas décollé (avec la langue ou dans un miroir).']],
    ['h', 'Gouttière de contention'],
    ['ul', ['Porte-la selon la consigne de ton orthodontiste.', 'Nettoie-la comme des aligneurs et range-la dans son boîtier.', 'Si elle serre fort après quelques nuits sans la porter, parles-en à ton cabinet.']],
    ['call', 'Fil décollé, gouttière cassée ou perdue : contacte rapidement ton cabinet, sans attendre le prochain contrôle.'],
    ['tip', 'Passe ton profil en mode contention pour suivre tes nuits et faire une photo de contrôle tous les 3 mois, comparée à ta photo de fin de traitement.'],
  ] },
  { id: 'vie', t: 'Parler, sourire, sortir', ic: 'chat', c: '#AF52DE', for: 'all', body: [
    ['ul', ['Un léger zozotement est courant au début avec des aligneurs ou un appareil lingual. Il disparaît souvent en quelques jours : parler et lire à voix haute aide.', 'Se sentir moins à l’aise pour sourire est fréquent au début. En général, ça passe quand l’appareil devient une habitude.', 'Garde un petit kit sur toi : brosse à dents, cire, boîtier, élastiques, miroir.']],
  ] },
  { id: 'remboursement', t: 'Remboursement (France)', ic: 'euro', c: '#34C759', for: 'all', body: [
    ['p', 'Ces règles sont indicatives (novembre 2026). Vérifie-les sur ameli.fr et auprès de ta mutuelle.'],
    ['ul', ['L’Assurance Maladie prend en charge l’orthodontie si le traitement commence avant 16 ans, après accord préalable : l’orthodontiste remplit une demande que tu envoies à ta CPAM avant le début du traitement.', 'La base de remboursement est de 193,50 € par semestre de traitement actif, en général dans la limite de 6 semestres.', 'Les honoraires sont libres. Ta mutuelle peut couvrir une partie de la différence selon ta garantie, souvent exprimée en % de la base (par exemple 200 % = 387 € par semestre, Sécurité sociale comprise).', 'Après 16 ans, il n’y a en général pas de prise en charge, sauf situations particulières à vérifier avec ta CPAM.']],
    ['tip', 'Le calculateur dans Suivi → Paiements estime ton reste à charge par semestre.'],
  ] },
];
const PROBLEMS = [
  { id: 'bracket', t: 'Bracket décollé', steps: ['S’il tient encore au fil, ne tire pas dessus et laisse-le en place.', 'Si ça frotte, couvre-le avec de la cire orthodontique.', 'Évite les aliments durs et collants.', 'S’il s’est détaché complètement, garde-le pour ton rendez-vous.'], when: 'Préviens ton cabinet dans les prochains jours : ce n’est généralement pas une urgence, mais il faut le signaler.' },
  { id: 'fil', t: 'Fil qui pique', steps: ['Essaie de rabattre doucement le bout du fil avec une gomme de crayon ou un coton-tige propre.', 'Sinon, couvre-le avec de la cire orthodontique.', 'Ne coupe pas le fil toi-même sans l’avis de ton cabinet.'], when: 'Appelle ton cabinet si ça te blesse malgré la cire.' },
  { id: 'plaie', t: 'Irritation ou petite plaie', steps: ['Mets de la cire sur ce qui frotte.', 'Un rinçage à l’eau salée tiède peut apaiser.'], when: 'Si la plaie ne guérit pas après quelques jours ou semble s’infecter, contacte ton cabinet ou ton médecin.' },
  { id: 'elastique', t: 'Élastique cassé, plus d’élastiques', steps: ['Remplace l’élastique cassé par une nouvelle paire.', 'Si tu n’en as plus, ne les remplace pas par un autre modèle.'], when: 'Contacte ton cabinet pour en obtenir d’autres.' },
  { id: 'aligneur', t: 'Aligneur perdu ou cassé', steps: ['S’il est cassé, garde les morceaux.', 'Ne passe pas à l’aligneur suivant et ne reviens pas au précédent sans consigne.'], when: 'Contacte ton cabinet rapidement : il te dira quel aligneur porter en attendant.' },
  { id: 'serre', t: 'Aligneur qui blesse ou ne s’emboîte pas', steps: ['Une pression est fréquente les premiers jours d’un nouvel aligneur.', 'Si un bord blesse, ne le lime pas toi-même sans avis.'], when: 'S’il ne s’emboîte toujours pas après quelques jours, ou s’il te blesse, contacte ton cabinet.' },
  { id: 'contention', t: 'Contention décollée ou cassée', steps: ['Fil de contention décollé : évite d’appuyer dessus avec la langue et de croquer dessus.', 'Gouttière cassée ou perdue : garde les morceaux.'], when: 'Contacte ton cabinet rapidement : sans contention, les dents peuvent bouger.' },
  { id: 'douleur', t: 'Douleur', steps: ['Une gêne est fréquente 1 à 3 jours après un réglage ou un nouvel aligneur.', 'Aliments mous, cire sur ce qui frotte.', 'Pour un antidouleur, demande conseil à ton orthodontiste ou à ton pharmacien.'], when: 'Contacte ton cabinet si la douleur augmente ou dure plus de quelques jours. Gonflement ou fièvre : consulte rapidement un médecin.' },
  { id: 'choc', t: 'Choc, dent abîmée, appareil tordu', steps: ['Rince doucement à l’eau.', 'Ne remets pas en place toi-même un appareil déformé.'], when: 'Contacte ton cabinet ou ton dentiste rapidement.', urgent: true },
];

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
const wd = s => fmt(s, { weekday: 'narrow' });
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);
const addMonths = (s, n) => { const d = toDate(s); d.setMonth(d.getMonth() + n); return iso(d); };
const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return iso(d); };
const euro = n => Number(n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const size = n => n < 1e6 ? `${Math.max(1, Math.round(n / 1e3))} Ko` : `${(n / 1e6).toFixed(1).replace('.', ',')} Mo`;
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
const rel = d => { const n = daysBetween(iso(), d); return n === 0 ? "aujourd’hui" : n === 1 ? 'demain' : n > 1 ? `dans ${n} jours` : n === -1 ? 'hier' : `il y a ${-n} jours`; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const initial = p => (p?.name || '?').trim().charAt(0).toUpperCase();
const opts = (list, sel) => list.map(([v, l]) => `<option value="${v}"${String(v) === String(sel) ? ' selected' : ''}>${esc(l)}</option>`).join('');
const hm = ms => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hmFr = ms => hm(ms).replace(':', ' h ');
const dur = ms => { const m = Math.max(0, Math.round(ms / 6e4)), h = Math.floor(m / 60); return h ? `${h} h ${pad(m % 60)}` : `${m} min`; };
const hours1 = ms => (ms / HOUR).toFixed(1).replace('.', ',').replace(',0', '');
const num = v => Number(String(v ?? '').replace(',', '.')) || 0;
const telHref = s => 'tel:' + String(s || '').replace(/[^\d+]/g, '');

// Retour haptique léger (iOS 18+ : un interrupteur natif déclenche la vibration).
const hapticEl = $('#haptic');
const haptic = () => { try { hapticEl.click(); navigator.vibrate?.(8); } catch { /* rien */ } };

let hudTimer;
function hud(msg, icon = 'check', ms = 2400) {
  const h = $('#hud');
  h.innerHTML = `${ic(icon, 20)}<span>${esc(msg)}</span>`;
  h.classList.add('on');
  clearTimeout(hudTimer); hudTimer = setTimeout(() => h.classList.remove('on'), ms);
}

// ---------- État ----------
const blank = () => ({ profiles: [], activeId: null, photos: [], rdv: [], questions: [], payments: [], wear: [], pain: [], days: {} });
let state = blank();
try { state = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* état neuf */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { hud('Stockage plein', 'info'); } };
const me = () => state.profiles.find(p => p.id === state.activeId) || null;
const mineOf = (k, pid) => state[k].filter(x => x.profileId === pid);
const mine = k => mineOf(k, state.activeId);
const photosOf = (pid, view) => mineOf('photos', pid).filter(p => !view || view === 'all' || p.view === view)
  .sort((a, b) => a.date.localeCompare(b.date) || (a.t || 0) - (b.t || 0) || a.id.localeCompare(b.id));
const myPhotos = view => photosOf(state.activeId, view);
const isAlign = p => p?.type === 'aligneurs';
const isRet = p => p?.type === 'contention';
const hasNights = p => isRet(p) && p.retType !== 'fil';
const hasEl = p => p?.elOn === 'on';
const goalH = p => num(p?.wearGoal) || 22;

const ui = { tab: 'home', pmode: 'grid', filter: 'all', cmpView: null, cmpA: null, cmpB: null, cmpMode: 'slider', x: 50, fade: 50, ringDone: false };

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
async function bitmap(b) { try { return await createImageBitmap(b, { imageOrientation: 'from-image' }); } catch { return loadImage(b); } }
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

// ---------- Calculs du traitement ----------
function progress(p) {
  if (!p?.start || !p.months || isRet(p)) return null;
  const end = addMonths(p.start, num(p.months));
  const total = Math.max(1, daysBetween(p.start, end)), done = daysBetween(p.start, iso());
  const pct = Math.max(0, Math.min(100, Math.round(done / total * 100)));
  const left = Math.max(0, daysBetween(iso(), end));
  const ms = [100, 75, 50, 25].find(m => pct >= m);
  const msDate = ms ? addDays(p.start, Math.round(total * ms / 100)) : null;
  return { end, total, pct, left, day: Math.max(0, done), milestone: ms && daysBetween(msDate, iso()) <= 14 ? ms : null };
}
function aligner(p) {
  if (!isAlign(p) || !p.alignTotal || !p.alignStart) return null;
  const every = num(p.alignDays) || 14, total = num(p.alignTotal);
  const since = daysBetween(p.alignStart, iso());
  if (since < 0) return null;
  const n = Math.min(total, Math.floor(since / every) + 1);
  const curStart = addDays(p.alignStart, (n - 1) * every);
  const next = n >= total ? null : addDays(p.alignStart, n * every);
  return { n, total, every, next, curStart, changedToday: since > 0 && curStart === iso() && n > 1, inDays: next ? daysBetween(iso(), next) : null };
}
const alignerOn = (p, date) => { const every = num(p.alignDays) || 14; const d = daysBetween(p.alignStart, date); return d < 0 ? 0 : Math.floor(d / every) + 1; };

// ---------- Temps hors bouche (horodatages, jamais un minuteur qui tourne) ----------
const openWear = (pid = state.activeId) => state.wear.find(w => w.profileId === pid && !w.back);
const dayBounds = d => [toDate(d).getTime(), toDate(addDays(d, 1)).getTime()];
function outMs(pid, d) {
  const [s, e0] = dayBounds(d), e = Math.min(e0, Date.now()); let t = 0;
  for (const w of state.wear) if (w.profileId === pid) { const a = Math.max(w.out, s), b = Math.min(w.back ?? Date.now(), e); if (b > a) t += b - a; }
  return t;
}
const wearSince = pid => { const o = mineOf('wear', pid).map(w => w.out); return o.length ? iso(new Date(Math.min(...o))) : null; };
function wornMs(pid, d) { // null si le jour n'est pas suivi
  const since = wearSince(pid); if (!since || d < since || d > iso()) return null;
  const [s, e0] = dayBounds(d), e = Math.min(e0, Date.now());
  return e - s - outMs(pid, d);
}
function alignerWearSummary(p, count = 6) {
  const al = aligner(p), since = wearSince(p.id); if (!al || !since) return [];
  const out = [];
  for (let k = Math.max(1, al.n - count + 1); k <= al.n; k++) {
    const st = addDays(p.alignStart, (k - 1) * al.every), en = addDays(st, al.every);
    let tracked = 0, ok = 0;
    for (let d = st > since ? st : since; d < en && d < iso(); d = addDays(d, 1)) { tracked++; if (wornMs(p.id, d) >= goalH(p) * HOUR - 6e4) ok++; }
    if (tracked) out.push({ k, tracked, ok });
  }
  return out;
}

// ---------- Routine du jour, nuits, élastiques, douleur ----------
const dkey = (d, pid = state.activeId) => `${pid}|${d}`;
const dayGet = (d, pid) => state.days[dkey(d, pid)] || {};
function routine(p) {
  const it = [['brushAM', 'Brossage du matin'], ['brushPM', 'Brossage du soir']];
  if (['bagues', 'lingual'].includes(p.type)) it.push(['inter', 'Brossettes ou fil dentaire']);
  if (isAlign(p)) it.push(['clean', 'Aligneurs nettoyés']);
  if (isRet(p) && p.retType !== 'fil') it.push(['retClean', 'Gouttière de contention nettoyée']);
  if (hasEl(p)) it.push(['elastics', 'Élastiques : nouvelle paire']);
  return it;
}
function toggleDay(k, d = iso()) {
  const p = me(), key = dkey(d), o = { ...(state.days[key] || {}) };
  o[k] = !o[k]; if (!o[k]) delete o[k];
  if (Object.keys(o).length) state.days[key] = o; else delete state.days[key];
  if (k === 'elastics' && p.elStock !== undefined && p.elStock !== '' && num(p.elPerDay)) {
    p.elStock = Math.max(0, num(p.elStock) + (o[k] ? -1 : 1) * num(p.elPerDay));
    const left = elasticsLeft(p);
    if (left !== null && left < 7 && !mine('questions').some(q => !q.done && /élastique/i.test(q.text))) {
      state.questions.push({ id: uid(), profileId: p.id, text: 'Me redonner des élastiques', done: false, date: iso() });
      hud('Stock d’élastiques bas : ajouté à tes questions', 'band', 3200);
    }
  }
  save();
}
const elasticsLeft = p => (hasEl(p) && p.elStock !== undefined && p.elStock !== '' && num(p.elPerDay)) ? Math.floor(num(p.elStock) / num(p.elPerDay)) : null;
const nightsDone = (p, days = 7) => { let n = 0; for (let i = 1; i <= days; i++) if (dayGet(addDays(iso(), -i), p.id).night) n++; return n; };
const painOn = (d, pid = state.activeId) => state.pain.find(x => x.profileId === pid && x.date === d);
function painContext(p) {
  if (painOn(iso())) return null;
  const recentRdv = mine('rdv').find(r => r.date <= iso() && daysBetween(r.date, iso()) <= 3);
  if (recentRdv) return `Après ton rendez-vous (${recentRdv.title.toLowerCase()})`;
  const al = aligner(p);
  if (al && daysBetween(al.curStart, iso()) <= 2 && al.n > 1) return `Avec l’aligneur n° ${al.n}`;
  if (p.start && !isRet(p) && daysBetween(p.start, iso()) >= 0 && daysBetween(p.start, iso()) <= 7) return 'Première semaine de traitement';
  return null;
}
const painColor = l => `hsl(${Math.round(140 - l * 14)} 70% ${l > 6 ? 50 : 45}%)`;

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
  f.L = L;
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
function shareFiles(files, title, text) {
  try {
    const data = { files, title }; if (text) data.text = text;
    if (navigator.canShare?.(data)) { navigator.share(data).catch(e => { if (e.name !== 'AbortError') download(files); }); return; }
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
function readyToShare(files, title, sub, { icon = 'doc', primary = 'Partager', onPrimary, secondary } = {}) {
  const L = openLayer(`<div class="sheet"><div class="grab"></div><div class="ready"><div class="ready-ic">${ic(icon, 32)}</div>
    <h3>${esc(title)}</h3><p>${esc(sub)}</p><button class="btn" data-s>${ic(icon === 'calplus' ? 'calplus' : 'share', 20)}${esc(primary)}</button>
    ${secondary ? `<button class="btn soft" data-2>${esc(secondary)}</button>` : ''}<button class="btn soft" data-c>Fermer</button></div></div>`);
  $('[data-s]', L.el).onclick = () => (onPrimary ? onPrimary() : shareFiles(files, title));
  if (secondary) $('[data-2]', L.el).onclick = () => shareFiles(files, title);
  $('[data-c]', L.el).onclick = () => L.close();
  dragToClose(L, $('.sheet', L.el));
}
const field = (label, input, extra = '') => `<label class="row field"><span>${label}</span>${input}${extra}</label>`;
const dateField = (label, name, value, attrs = '') => `<label class="row field"><span>${label}</span><span class="pad"></span><input type="date" name="${name}" value="${esc(value)}" ${attrs}></label>`;
const selField = (label, name, list, value, id = '') => `<label class="row field"><span>${label}</span><span class="v">${esc((list.find(x => String(x[0]) === String(value)) || list[0])[1])}</span>${UPDOWN}<select class="ovl" name="${name}" ${id ? `id="${id}"` : ''}>${opts(list, value)}</select></label>`;
const togField = (label, name, on, id = '') => `<label class="row field"><span class="lbl">${label}</span><input type="checkbox" switch class="tog" name="${name}" ${on ? 'checked' : ''} ${id ? `id="${id}"` : ''}></label>`;

// ---------- Profils ----------
function profileSheet(p) {
  const isNew = !p; const d = p || { type: 'bagues', start: iso(), months: 18, alignDays: 14, wearGoal: 22, retNights: 7, retType: 'amovible', elPerDay: 2 };
  const f = sheet({
    title: isNew ? 'Nouveau profil' : 'Profil',
    body: `
      <div class="group">
        ${field('Prénom', `<input name="name" required maxlength="30" value="${esc(d.name)}" placeholder="Requis" autocomplete="given-name" enterkeyhint="done">`)}
        ${dateField('Naissance', 'birth', d.birth, `max="${iso()}"`)}
      </div>
      <p class="foot">Facultatif : la date de naissance sert seulement à vérifier la règle des 16 ans pour le remboursement.</p>
      <div class="sl">Traitement</div>
      <div class="group">
        ${selField('Appareil', 'type', TYPES, d.type, 'ptype')}
        <div id="boxTreat">${dateField('Début', 'start', d.start)}
        ${field('Durée prévue', `<input type="number" name="months" min="1" max="120" inputmode="numeric" value="${esc(d.months)}" placeholder="18">`, '<em>mois</em>')}</div>
      </div>
      <div id="boxAlign"><div class="sl">Aligneurs</div><div class="group">
        ${field('Nombre au total', `<input type="number" name="alignTotal" min="1" max="200" inputmode="numeric" value="${esc(d.alignTotal)}" placeholder="30">`)}
        ${field('Changer tous les', `<input type="number" name="alignDays" min="1" max="60" inputmode="numeric" value="${esc(d.alignDays || 14)}">`, '<em>jours</em>')}
        ${dateField('1<sup>er</sup> aligneur', 'alignStart', d.alignStart || d.start)}
        ${field('Port demandé', `<input type="number" name="wearGoal" min="1" max="24" step="0.5" inputmode="decimal" value="${esc(d.wearGoal || 22)}">`, '<em>h / jour</em>')}
      </div><p class="foot">Mets la consigne exacte de ton orthodontiste.</p></div>
      <div id="boxRet"><div class="sl">Contention</div><div class="group">
        ${selField('Type', 'retType', RET_TYPES, d.retType || 'amovible')}
        ${selField('Gouttière', 'retNights', RET_NIGHTS, d.retNights || 7)}
        ${dateField('Depuis le', 'retStart', d.retStart || iso())}
      </div></div>
      <div class="sl">Élastiques</div>
      <div class="group">
        ${togField('J’ai des élastiques', 'elOn', hasEl(d), 'elOn')}
        <div id="boxEl">
          ${field('Consigne', `<input name="elRule" maxlength="80" value="${esc(d.elRule)}" placeholder="ex. 2 de chaque côté, jour et nuit">`)}
          ${field('Utilisés par jour', `<input type="number" name="elPerDay" min="1" max="20" inputmode="numeric" value="${esc(d.elPerDay || 2)}">`)}
          ${field('Stock restant', `<input type="number" name="elStock" min="0" max="2000" inputmode="numeric" value="${esc(d.elStock)}" placeholder="facultatif">`)}
        </div>
      </div>
      ${!isNew && !isRet(p) ? '<div class="group mt"><button type="button" class="row center tintc" data-toret>Traitement terminé : passer en contention</button></div>' : ''}`,
    onOk: fd => {
      const data = Object.fromEntries(fd); data.name = data.name.trim(); data.elOn = fd.get('elOn') === 'on' ? 'on' : '';
      if (isNew) { const np = { id: uid(), ...data }; state.profiles.push(np); state.activeId = np.id; ui.tab = 'home'; ui.ringDone = false; }
      else Object.assign(p, data);
      save(); render(); hud(isNew ? `Bienvenue ${data.name} !` : 'Profil mis à jour', isNew ? 'sparkle' : 'check');
      if (isNew) setTimeout(() => clinicSheet(true), 700);
    },
    onDelete: isNew ? null : async () => {
      for (const ph of state.photos.filter(x => x.profileId === p.id)) await delBlob(ph.id).catch(() => {});
      for (const k of ['photos', 'rdv', 'questions', 'payments', 'wear', 'pain']) state[k] = state[k].filter(x => x.profileId !== p.id);
      for (const k of Object.keys(state.days)) if (k.startsWith(p.id + '|')) delete state.days[k];
      state.profiles = state.profiles.filter(x => x.id !== p.id); state.activeId = state.profiles[0]?.id || null;
      save(); render(); hud('Profil supprimé', 'trash');
    },
    deleteLabel: 'Supprimer ce profil', deleteMsg: 'Toutes ses photos et ses données seront effacées de cet appareil.',
  });
  const sync = () => {
    const t = $('#ptype', f).value;
    $('#boxAlign', f).style.display = t === 'aligneurs' ? '' : 'none';
    $('#boxRet', f).style.display = t === 'contention' ? '' : 'none';
    $('#boxTreat', f).style.display = t === 'contention' ? 'none' : '';
    $('#boxEl', f).style.display = $('#elOn', f).checked ? '' : 'none';
  };
  $('#ptype', f).addEventListener('change', sync); $('#elOn', f).addEventListener('change', sync); sync();
  $('[data-toret]', f)?.addEventListener('click', async () => {
    if (!await alertBox({ title: 'Passer en contention ?', message: 'Ton historique et tes photos sont conservés. Tu pourras suivre tes nuits et faire des photos de contrôle.', ok: 'Passer en contention' })) return;
    f.L.close();
    Object.assign(p, { prevType: p.type, type: 'contention', retStart: iso(), retType: p.retType || 'amovible', retNights: p.retNights || 7 });
    if (openWear(p.id)) openWear(p.id).back = Date.now();
    save(); ui.ringDone = false; render(); hud('Mode contention activé', 'moon');
  });
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
      <p class="foot">Chaque personne a ses propres photos, rendez-vous, routine et paiements. Idéal pour suivre plusieurs enfants.</p>`,
  });
  f.addEventListener('click', e => {
    const edit = e.target.closest('[data-edit]'), pick = e.target.closest('[data-pick]');
    if (edit) { f.L.close(); return profileSheet(state.profiles.find(p => p.id === edit.dataset.edit)); }
    if (e.target.closest('[data-new]')) { f.L.close(); return profileSheet(); }
    if (pick) { f.L.close(); switchProfile(pick.dataset.pick); }
  });
}
function switchProfile(id) {
  haptic();
  if (id === state.activeId) return;
  state.activeId = id; Object.assign(ui, { cmpA: null, cmpB: null, cmpView: null, filter: 'all', ringDone: false });
  save(); render(); window.scrollTo(0, 0); hud(`Profil de ${me().name}`, 'people');
}

// ---------- Mon cabinet ----------
function clinicSheet(firstTime) {
  const p = me();
  sheet({
    title: 'Mon cabinet',
    body: `${firstTime ? '<p class="foot" style="padding-top:0">Ajoute les coordonnées de ton cabinet pour l’appeler ou lui écrire en un geste, même en cas de souci. Tu peux le faire plus tard.</p>' : ''}
      <div class="group">
        ${field('Nom', `<input name="practitioner" maxlength="60" value="${esc(p.practitioner)}" placeholder="Dr …">`)}
        ${field('Téléphone', `<input type="tel" name="clinicPhone" maxlength="30" value="${esc(p.clinicPhone)}" placeholder="01 23 45 67 89" inputmode="tel">`)}
        ${field('E-mail', `<input type="email" name="clinicEmail" maxlength="80" value="${esc(p.clinicEmail)}" placeholder="facultatif" inputmode="email" autocapitalize="off">`)}
        ${field('Adresse', `<input name="clinicAddress" maxlength="120" value="${esc(p.clinicAddress)}" placeholder="facultatif">`)}
        ${field('Horaires', `<input name="clinicHours" maxlength="80" value="${esc(p.clinicHours)}" placeholder="ex. lun-ven 9 h-18 h">`)}
      </div>
      <div class="sl">Consignes du cabinet en cas de souci</div>
      <div class="group"><textarea class="note" name="clinicNotes" maxlength="600" placeholder="ex. hors horaires : laisser un message, ou appeler le …">${esc(p.clinicNotes)}</textarea></div>`,
    onOk: fd => { for (const [k, v] of fd) p[k] = String(v).trim(); save(); render(); hud('Cabinet enregistré'); },
  });
}
const clinicButtons = p => `<div class="contact">
  <a href="${p.clinicPhone ? telHref(p.clinicPhone) : '#'}" class="${p.clinicPhone ? '' : 'off'}">${ic('phone')}Appeler</a>
  <button data-action="message">${ic('chat')}Écrire</button>
  <a href="${p.clinicAddress ? 'https://maps.apple.com/?q=' + encodeURIComponent(p.clinicAddress) : '#'}" class="${p.clinicAddress ? '' : 'off'}" target="_blank" rel="noopener">${ic('pin')}Itinéraire</a></div>`;

// ---------- Message au cabinet ----------
function clinicSummary(p) {
  const al = aligner(p), lines = [`Bonjour, je suis ${p.name} (${(TYPE_LABEL[p.type] || '').toLowerCase()}${al ? `, aligneur n° ${al.n} sur ${al.total}` : ''}).`];
  if (isAlign(p) && wearSince(p.id)) {
    const days = [1, 2, 3, 4, 5, 6, 7].map(i => wornMs(p.id, addDays(iso(), -i))).filter(x => x !== null);
    if (days.length) lines.push(`Port moyen sur ${plural(days.length, 'jour')} : ${hours1(days.reduce((s, x) => s + x, 0) / days.length)} h par jour.`);
  }
  const pain = mine('pain').filter(x => daysBetween(x.date, iso()) <= 7).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (pain) lines.push(`Douleur notée le ${fmt(pain.date, { day: 'numeric', month: 'long' })} : ${pain.level}/10.`);
  return lines.join('\n');
}
function composeMessage({ text = '', photos = [], subject = '' } = {}) {
  const p = me();
  let files = photos.filter(ph => blobs.has(ph.id)).map(ph => new File([blobs.get(ph.id)], `${p.name}-${ph.date}-${ph.view}.jpg`.replace(/\s+/g, '_'), { type: 'image/jpeg' }));
  const f = sheet({
    title: 'Message au cabinet',
    body: `<div class="group"><textarea class="note" name="msg" style="min-height:170px" maxlength="2000">${esc(text)}</textarea></div>
      <div class="msgprev" id="mp"></div>
      <p class="foot">Le message s’ouvre dans la feuille de partage : choisis Mail, Messages ou WhatsApp. ${p.clinicEmail ? '' : 'Ajoute l’e-mail de ton cabinet dans « Mon cabinet » pour l’avoir sous la main.'}</p>`,
    onOk: fd => {
      const msg = fd.get('msg').trim();
      if (files.length) { shareFiles(files, subject || `Message de ${p.name}`, msg); return; }
      if (navigator.share) { navigator.share({ title: subject || `Message de ${p.name}`, text: msg }).catch(() => {}); return; }
      location.href = `mailto:${encodeURIComponent(p.clinicEmail || '')}?subject=${encodeURIComponent(subject || 'Suivi orthodontique')}&body=${encodeURIComponent(msg)}`;
    },
  });
  const draw = () => { $('#mp', f).innerHTML = files.map(fl => `<img src="${URL.createObjectURL(fl)}" alt="">`).join('') + `<button type="button" data-addph aria-label="Ajouter une photo">${ic('camera', 24)}</button>`; };
  draw();
  f.addEventListener('click', e => {
    if (!e.target.closest('[data-addph]')) return;
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
    inp.onchange = async () => { const fl = inp.files[0]; inp.remove(); if (!fl) return; const b = await shrink(fl).catch(() => null); if (b) { files.push(new File([b], `photo-${files.length + 1}.jpg`, { type: 'image/jpeg' })); draw(); } };
    document.body.appendChild(inp); inp.click();
  });
}

// ---------- J'ai un problème / guide ----------
function problemSheet() {
  const p = me();
  const list = PROBLEMS.filter(x => !(x.id === 'aligneur' || x.id === 'serre') || isAlign(p)).filter(x => !['bracket', 'fil'].includes(x.id) || ['bagues', 'lingual', 'autre'].includes(p.type) || !p.type);
  const f = sheet({
    title: 'J’ai un problème',
    body: `<div class="box urg" style="margin-top:0">${ic('alert', 20)}<span>${esc(URGENT)}</span></div>
      <div class="sl">Que se passe-t-il ?</div>
      <div class="group">${list.map(x => `<button type="button" class="row" data-pb="${x.id}"><span class="tx"><span class="t">${esc(x.t)}</span></span>${CHEV}</button>`).join('')}
        <button type="button" class="row" data-pb="autre"><span class="tx"><span class="t">Autre chose</span></span>${CHEV}</button></div>
      ${p.clinicPhone ? `<div class="group mt"><a class="row ic tintc" href="${telHref(p.clinicPhone)}" style="text-decoration:none"><span class="tile t-green">${ic('phone', 18)}</span><span class="tx">Appeler ${esc(p.practitioner || 'le cabinet')}</span></a></div>` : ''}
      <p class="src">Gestes provisoires inspirés des conseils de l’American Association of Orthodontists. Ils ne remplacent pas l’avis de ton orthodontiste.</p>`,
  });
  f.addEventListener('click', e => { const b = e.target.closest('[data-pb]'); if (b) { f.L.close(); problemDetail(b.dataset.pb); } });
}
function problemDetail(id) {
  const p = me(), x = PROBLEMS.find(y => y.id === id) || { t: 'Autre chose', steps: ['Prends une photo si c’est visible : elle aidera ton cabinet à comprendre.'], when: 'En cas de doute, appelle ton cabinet.' };
  const f = sheet({
    title: x.t,
    body: `<div class="art"><h4>En attendant</h4><ul>${x.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="box call">${ic('phone', 20)}<span>${esc(x.when)}${p.clinicNotes ? `<br><b>Consigne de ton cabinet :</b> ${esc(p.clinicNotes)}` : ''}</span></div>
      ${x.urgent ? `<div class="box urg">${ic('alert', 20)}<span>${esc(URGENT)}</span></div>` : ''}
      ${clinicButtons(p).replace('data-action="message"', 'type="button" data-msg')}
      <div class="group mt"><button type="button" class="row ic" data-q><span class="tile t-orange">${ic('list', 18)}</span><span class="tx">Ajouter à mes questions pour l’ortho</span></button></div>
      ${p.clinicPhone ? '' : '<p class="foot">Ajoute le téléphone de ton cabinet (onglet Cabinet) pour l’appeler d’ici.</p>'}`,
  });
  f.addEventListener('click', e => {
    if (e.target.closest('[data-msg]')) { f.L.close(); composeMessage({ text: `${clinicSummary(p)}\n\nProblème : ${x.t.toLowerCase()}, depuis le ${fmt(iso(), { day: 'numeric', month: 'long' })}.\n`, subject: `${x.t} — ${p.name}` }); }
    if (e.target.closest('[data-q]')) { state.questions.push({ id: uid(), profileId: p.id, text: `${x.t} (le ${fmtShort(iso())})`, done: false, date: iso() }); save(); render(); hud('Ajouté à tes questions'); }
  });
}
function articleSheet(id) {
  const a = GUIDE.find(g => g.id === id); if (!a) return;
  const html = a.body.map(([k, v]) => k === 'p' ? `<p>${esc(v)}</p>` : k === 'h' ? `<h4>${esc(v)}</h4>` : k === 'ul' ? `<ul>${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '').join('');
  const boxes = a.body.filter(([k]) => k === 'call' || k === 'tip').map(([k, v]) => `<div class="box ${k}">${ic(k === 'call' ? 'phone' : 'info', 20)}<span>${esc(v)}</span></div>`).join('');
  sheet({ title: a.t, body: `<div class="art">${html}</div>${boxes}<p class="src">Information générale, relue pour rester prudente. Elle ne remplace pas l’avis de ton orthodontiste : en cas de doute, appelle ton cabinet.</p>` });
}
const relevant = (g, p) => g.for === 'all' || g.for.includes(p.type);

// ---------- Saisies : port, aligneur, douleur, élastiques ----------
function toggleWear() {
  const p = me(), o = openWear();
  if (o) { o.back = Date.now(); hud(`Remis · ${dur(o.back - o.out)} hors bouche`, 'check'); }
  else { state.wear.push({ id: uid(), profileId: p.id, out: Date.now(), back: null }); hud('Chrono lancé : pense à les remettre', 'clock'); }
  save(); haptic(); render();
}
function wearListSheet() {
  const p = me(), since = Date.now() - 2 * DAY;
  const list = mine('wear').filter(w => (w.back ?? Date.now()) >= since).sort((a, b) => b.out - a.out);
  const f = sheet({
    title: 'Retraits récents',
    body: `<div class="group">${list.length ? list.map(w => `<button type="button" class="row" data-w="${w.id}"><span class="tx"><span class="t">${cap(rel(iso(new Date(w.out))))} · ${hmFr(w.out)} → ${w.back ? hmFr(w.back) : 'en cours'}</span>
        <span class="s">${dur((w.back ?? Date.now()) - w.out)} hors bouche</span></span>${CHEV}</button>`).join('') : '<div class="row muted"><span class="tx"><span class="t">Aucun retrait sur les 2 derniers jours</span></span></div>'}</div>
      <div class="group mt"><button type="button" class="row ic tintc" data-addw><span class="tile t-tint">${ic('plus', 18)}</span><span class="tx">Ajouter un retrait oublié</span></button></div>
      <p class="foot">Objectif : ${hours1(goalH(p) * HOUR)} h de port par jour, soit ${dur((24 - goalH(p)) * HOUR)} hors bouche au maximum.</p>`,
  });
  f.addEventListener('click', e => {
    const w = e.target.closest('[data-w]');
    if (w) { f.L.close(); wearEditSheet(state.wear.find(x => x.id === w.dataset.w)); }
    if (e.target.closest('[data-addw]')) { f.L.close(); wearEditSheet(null); }
  });
}
function wearEditSheet(w) {
  const isNew = !w, out = w ? w.out : Date.now() - 30 * 6e4;
  sheet({
    title: isNew ? 'Retrait oublié' : 'Retrait',
    body: `<div class="group">
      ${dateField('Date', 'date', iso(new Date(out)), `max="${iso()}" required`)}
      <label class="row field"><span>Retirés à</span><span class="pad"></span><input type="time" name="out" value="${hm(out)}" required></label>
      <label class="row field"><span>Remis à</span><span class="pad"></span><input type="time" name="back" value="${w?.back ? hm(w.back) : isNew ? hm(Date.now()) : ''}"></label></div>
      <p class="foot">Laisse « Remis à » vide s’ils sont encore hors de la bouche.</p>`,
    onOk: fd => {
      const d = toDate(fd.get('date')), [oh, om] = fd.get('out').split(':').map(Number);
      const o = new Date(d); o.setHours(oh, om, 0, 0);
      let b = null;
      if (fd.get('back')) { const [bh, bm] = fd.get('back').split(':').map(Number); const bb = new Date(d); bb.setHours(bh, bm, 0, 0); if (bb <= o) bb.setDate(bb.getDate() + 1); b = bb.getTime(); }
      if (o.getTime() > Date.now() || (b && b > Date.now() + 6e4)) { hud('Heure dans le futur', 'info'); return false; }
      if (!b && state.wear.some(x => x.profileId === state.activeId && !x.back && x !== w)) { hud('Un retrait est déjà en cours', 'info'); return false; }
      if (isNew) state.wear.push({ id: uid(), profileId: state.activeId, out: o.getTime(), back: b }); else Object.assign(w, { out: o.getTime(), back: b });
      save(); render(); hud('Corrigé');
    },
    onDelete: isNew ? null : () => { state.wear = state.wear.filter(x => x !== w); save(); render(); },
    deleteLabel: 'Supprimer ce retrait',
  });
}
function alignerSheet() {
  const p = me(), al = aligner(p);
  let n = al?.n || 1;
  const f = sheet({
    title: 'Aligneur en cours',
    body: `<div class="group">
        <div class="row field"><span>Je porte le n°</span><span class="pad"></span><div class="stepper"><button type="button" data-st="-1" aria-label="Moins">−</button><output id="stn">${n}</output><button type="button" data-st="1" aria-label="Plus">+</button></div></div>
        ${dateField('Depuis le', 'since', al?.curStart || iso(), `max="${iso()}"`)}
        ${field('Nombre au total', `<input type="number" name="alignTotal" min="1" max="200" inputmode="numeric" value="${esc(p.alignTotal)}">`)}
        ${field('Changer tous les', `<input type="number" name="alignDays" min="1" max="60" inputmode="numeric" value="${esc(p.alignDays || 14)}">`, '<em>jours</em>')}
      </div>
      <p class="foot">Ton orthodontiste a ajouté des aligneurs, ou tu as changé plus tôt ou plus tard que prévu ? Ajuste ici : le calendrier se recale automatiquement.</p>`,
    onOk: fd => {
      p.alignTotal = Math.max(n, num(fd.get('alignTotal')) || n); p.alignDays = num(fd.get('alignDays')) || 14;
      p.alignStart = addDays(fd.get('since') || iso(), -(n - 1) * p.alignDays);
      save(); render(); hud(`Aligneur n° ${n} enregistré`);
    },
  });
  f.addEventListener('click', e => { const b = e.target.closest('[data-st]'); if (b) { n = Math.max(1, n + Number(b.dataset.st)); $('#stn', f).textContent = n; haptic(); } });
}
function setPain(level, d = iso()) {
  const ex = painOn(d);
  if (ex) ex.level = level; else state.pain.push({ id: uid(), profileId: state.activeId, date: d, level, note: '' });
  save(); haptic(); render(); hud(`Douleur ${level}/10 notée`, 'pulse');
}
const painScale = sel => `<div class="scale">${Array.from({ length: 11 }, (_, i) => `<button data-pain="${i}" class="${sel === i ? 'on' : ''}" style="${sel === i ? `background:${painColor(i)}` : ''}" aria-label="${i} sur 10">${i}</button>`).join('')}</div>
  <div class="scale-l"><span>Aucune</span><span>Très forte</span></div>`;
function stockSheet() {
  const p = me();
  sheet({
    title: 'Stock d’élastiques',
    body: `<div class="group">${field('Il m’en reste', `<input type="number" name="elStock" min="0" max="5000" inputmode="numeric" value="${esc(p.elStock)}" placeholder="0">`)}
      ${field('Utilisés par jour', `<input type="number" name="elPerDay" min="1" max="20" inputmode="numeric" value="${esc(p.elPerDay || 2)}">`)}</div>
      <p class="foot">Chaque fois que tu coches « nouvelle paire », le stock baisse. Sous 7 jours de réserve, une question est ajoutée pour ton orthodontiste.</p>`,
    onOk: fd => { p.elStock = num(fd.get('elStock')); p.elPerDay = num(fd.get('elPerDay')) || 2; save(); render(); },
  });
}
function rbSheet() {
  const p = me(), rb = p.rb || {};
  sheet({
    title: 'Remboursement',
    body: `<div class="group">
        ${field('Honoraires / semestre', `<input type="number" name="fees" min="0" step="0.01" inputmode="decimal" value="${esc(rb.fees)}" placeholder="ex. 900">`, '<em>€</em>')}
        ${field('Garantie mutuelle', `<input type="number" name="pct" min="0" max="1000" inputmode="numeric" value="${esc(rb.pct)}" placeholder="ex. 200">`, '<em>% base</em>')}
        ${field('Semestres prévus', `<input type="number" name="sems" min="1" max="12" inputmode="numeric" value="${esc(rb.sems || 6)}">`)}
        ${field('Semestre en cours', `<input type="number" name="cur" min="1" max="12" inputmode="numeric" value="${esc(rb.cur || 1)}">`)}
      </div>
      <div class="sl">Démarches</div>
      <div class="group">${togField('Accord préalable reçu', 'accord', rb.accord)}${togField('Feuille de soins envoyée', 'feuille', rb.feuille)}${togField('Mutuelle remboursée', 'mut', rb.mut)}</div>
      <p class="foot">La garantie mutuelle s’exprime en % de la base de remboursement, Sécurité sociale comprise (indiqué sur ton tableau de garanties). Barème indicatif de novembre 2026 : vérifie sur ameli.fr.</p>`,
    onOk: fd => {
      p.rb = { fees: num(fd.get('fees')), pct: num(fd.get('pct')), sems: num(fd.get('sems')) || 6, cur: num(fd.get('cur')) || 1, accord: fd.get('accord') === 'on', feuille: fd.get('feuille') === 'on', mut: fd.get('mut') === 'on' };
      save(); render();
    },
  });
}
function rbCalc(p) {
  const rb = p.rb; if (!rb?.fees) return null;
  const ageAtStart = p.birth && p.start ? daysBetween(p.birth, p.start) / 365.25 : null;
  const eligible = ageAtStart === null || ageAtStart < 16;
  const secu = eligible ? Math.min(BASE_SECU, rb.fees) : 0;
  const totalCover = eligible ? Math.min(rb.fees, BASE_SECU * Math.max(rb.pct || 100, 100) / 100) : 0;
  const mut = Math.max(0, totalCover - secu);
  return { secu, mut, rest: Math.max(0, rb.fees - totalCover), eligible, ageAtStart, sems: rb.sems || 6 };
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
  sheet({
    title: files.length > 1 ? `${files.length} photos` : 'Nouvelle photo',
    body: `<div class="prev">${prevUrls.map(u => `<img src="${u}" alt="">`).join('')}</div>
      <div class="sl">Vue</div>
      <div class="vpick">${VIEWS.map(([v, l]) => `<label><input type="radio" name="view" value="${v}" ${v === (preView || 'face') ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <div class="group mt">${dateField('Date', 'date', guess, `required max="${iso()}"`)}</div>
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
    body: `<div class="group">${selField('Vue', 'view', VIEWS.map(v => [v[0], v[1]]), ph.view)}${dateField('Date', 'date', ph.date, `required max="${iso()}"`)}</div>
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
  const a = e.target.closest('[data-v]')?.dataset.v, ph = vList()[vw.i];
  if (!a) { if (e.target.closest('.stage')) $('#viewer').classList.toggle('bare'); return; }
  ({ close: closeViewer, prev: () => step(-1), next: () => step(1), play: () => togglePlay(), share: () => sharePhotos([ph]), edit: () => editPhoto(ph), del: () => deletePhoto(ph) })[a]?.();
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
        ${field('Motif', `<input name="title" required maxlength="60" value="${esc(d.title)}" list="motifs" enterkeyhint="done">`)}
        ${dateField('Date', 'date', d.date, 'required')}
        <label class="row field"><span>Heure</span><span class="pad"></span><input type="time" name="time" value="${esc(d.time)}"></label>
        ${isNew ? '' : togField('Rendez-vous passé', 'done', d.done || d.date < iso())}
      </div>
      <datalist id="motifs"><option>Contrôle<option>Pose de l’appareil<option>Changement d’arc<option>Nouveaux aligneurs<option>Urgence<option>Dépose<option>Contrôle de contention</datalist>
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
      <p class="foot">Elle apparaîtra dans ton compte rendu PDF et dans tes messages au cabinet.</p>`,
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
        ${field('Libellé', `<input name="label" required maxlength="50" value="${esc(d.label)}">`)}
        ${dateField('Date', 'date', d.date, 'required')}
        ${field('Montant', `<input type="number" name="amount" required min="0" step="0.01" inputmode="decimal" value="${esc(d.amount)}" placeholder="0">`, '<em>€</em>')}</div>`,
    onOk: fd => {
      const v = { label: fd.get('label').trim(), date: fd.get('date'), amount: num(fd.get('amount')) };
      if (isNew) state.payments.push({ id: uid(), profileId: state.activeId, paid: false, ...v }); else Object.assign(x, v);
      save(); render();
    },
    onDelete: isNew ? null : () => { state.payments = state.payments.filter(p => p.id !== x.id); save(); render(); },
    deleteLabel: 'Supprimer l’échéance',
  });
}

// ---------- Rappels dans le Calendrier iOS (.ics) : les alertes sont gérées par l'iPhone, sans serveur ----------
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const icsFold = l => { const out = []; while (l.length > 72) { out.push(l.slice(0, 72)); l = ' ' + l.slice(72); } out.push(l); return out.join('\r\n'); };
const icsD = d => d.replace(/-/g, '');
function icsEvent({ id, date, time, minutes = 30, title, desc = '', alarms = [], rrule }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VEVENT', `UID:${id}@sourire.app`, `DTSTAMP:${stamp}`, `SUMMARY:${icsEsc(title)}`];
  if (time) {
    const [h, m] = time.split(':').map(Number), end = new Date(toDate(date)); end.setHours(h, m + minutes);
    L.push(`DTSTART:${icsD(date)}T${pad(h)}${pad(m)}00`, `DTEND:${icsD(iso(end))}T${pad(end.getHours())}${pad(end.getMinutes())}00`);
  } else L.push(`DTSTART;VALUE=DATE:${icsD(date)}`, `DTEND;VALUE=DATE:${icsD(addDays(date, 1))}`);
  if (rrule) L.push(`RRULE:${rrule}`);
  if (desc) L.push(`DESCRIPTION:${icsEsc(desc)}`);
  for (const a of alarms) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(title)}`, `TRIGGER:${a}`, 'END:VALARM');
  L.push('END:VEVENT');
  return L.map(icsFold).join('\r\n');
}
function calendarSheet() {
  const p = me(), al = aligner(p), up = mine('rdv').filter(r => !r.done && r.date >= iso());
  const f = sheet({
    title: 'Rappels dans Calendrier',
    body: `<p class="foot" style="padding-top:0">Sourire crée un fichier de rappels à ajouter au Calendrier de ton iPhone. Les alertes sonnent même si l’app est fermée.</p>
      <div class="group">
        ${al ? togField(`Changements d’aligneur (${al.total - al.n} à venir)`, 'al', al.next) : ''}
        ${togField(`Rendez-vous à venir (${up.length})`, 'rdv', up.length)}
        ${hasEl(p) ? togField('Élastiques : nouvelle paire chaque jour', 'el', true) : ''}
        ${hasNights(p) ? togField('Contention : rappel le soir', 'night', true) : ''}
        ${togField('Photo de suivi toutes les 4 semaines', 'photo', !isRet(p))}
        ${isRet(p) ? togField('Photo de contrôle tous les 3 mois', 'ctl', true) : ''}
      </div>
      <div class="group mt"><label class="row field"><span>Heure des rappels</span><span class="pad"></span><input type="time" name="at" value="${esc(p.remindAt || '20:30')}"></label></div>
      <p class="foot">Si tu réimportes plus tard, supprime d’abord l’ancien calendrier « Sourire » pour éviter les doublons.</p>`,
    onOk: fd => {
      const at = fd.get('at') || '20:30'; p.remindAt = at; save();
      const ev = [], who = state.profiles.length > 1 ? `${p.name} · ` : '', end = progress(p)?.end || addMonths(iso(), 24);
      if (fd.get('al') === 'on' && al) for (let k = al.n + 1; k <= al.total; k++) {
        const d = addDays(p.alignStart, (k - 1) * al.every);
        ev.push(icsEvent({ id: `al-${p.id}-${k}`, date: d, title: `${who}Aligneur n° ${k}`, desc: 'Passer à l’aligneur suivant selon la consigne de ton orthodontiste. Pense à la photo dans Sourire.', alarms: ['PT8H'] }));
      }
      if (fd.get('rdv') === 'on') for (const r of up) ev.push(icsEvent({ id: `rdv-${r.id}`, date: r.date, time: r.time || null, title: `${who}Orthodontiste : ${r.title}`, desc: [p.practitioner, p.clinicAddress, p.clinicPhone].filter(Boolean).join('\n'), alarms: r.time ? ['-P1D', '-PT1H'] : ['-PT15H'] }));
      const until = `UNTIL=${icsD(end)}T235900`;
      if (fd.get('el') === 'on') ev.push(icsEvent({ id: `el-${p.id}`, date: iso(), time: at, minutes: 5, title: `${who}Élastiques : nouvelle paire`, desc: p.elRule || '', rrule: `FREQ=DAILY;${until}`, alarms: ['PT0S'] }));
      if (fd.get('night') === 'on') ev.push(icsEvent({ id: `night-${p.id}`, date: iso(), time: at, minutes: 5, title: `${who}Contention ce soir`, rrule: 'FREQ=DAILY', alarms: ['PT0S'] }));
      if (fd.get('photo') === 'on') ev.push(icsEvent({ id: `ph-${p.id}`, date: addDays(iso(), 28), title: `${who}Photo de suivi Sourire`, rrule: `FREQ=WEEKLY;INTERVAL=4;${until}`, alarms: ['PT18H'] }));
      if (fd.get('ctl') === 'on') ev.push(icsEvent({ id: `ctl-${p.id}`, date: addMonths(iso(), 3), title: `${who}Photo de contrôle de contention`, rrule: 'FREQ=MONTHLY;INTERVAL=3', alarms: ['PT18H'] }));
      if (!ev.length) { hud('Choisis au moins un rappel', 'info'); return false; }
      const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sourire//Suivi orthodontique//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:Sourire${who ? ' · ' + p.name : ''}`, ...ev, 'END:VCALENDAR'].join('\r\n');
      const file = new File([ics], `sourire-rappels-${p.name}.ics`.replace(/\s+/g, '_'), { type: 'text/calendar' });
      setTimeout(() => readyToShare([file], 'Rappels prêts', `${plural(ev.length, 'rappel')} pour ${p.name}`, { icon: 'calplus', primary: 'Ajouter au Calendrier', onPrimary: () => download([file]), secondary: 'Partager le fichier' }), 320);
    },
  });
  return f;
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

// ---------- Morceaux d'écran ----------
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
function wearCard() {
  const p = me(), o = openWear(), budget = (24 - goalH(p)) * HOUR, out = outMs(p.id, iso()), left = budget - out;
  const pct = Math.min(100, out / Math.max(budget, 1) * 100);
  const long = o && Date.now() - o.out > 4 * HOUR;
  return `<div class="wear ${o ? 'out' : ''}" id="wearCard"><div class="st"><span class="dot"></span>${o ? 'Aligneurs hors bouche' : 'Aligneurs en bouche'}</div>
    <div class="clock">${o ? dur(Date.now() - o.out).replace(/ (min|h)/g, '<small>$1</small>') : `${dur(out).replace(/ (min|h)/g, '<small>$1</small>')}`}</div>
    <div class="meta">${o ? `Retirés à ${hmFr(o.out)} · ${dur(out)} hors bouche aujourd’hui` : 'hors bouche aujourd’hui'}</div>
    <div class="wbar"><i class="${left < 0 ? 'over' : ''}" style="width:${pct}%"></i></div>
    <div class="meta">${left >= 0 ? `Marge restante pour ton objectif de ${hours1(goalH(p) * HOUR)} h : ${dur(left)}` : `Objectif de ${hours1(goalH(p) * HOUR)} h dépassé de ${dur(-left)} aujourd’hui`}</div>
    ${long ? `<div class="warnline">Oubli de les remettre ? Tu peux corriger l’heure.</div>` : ''}
    <div class="acts"><button class="btn main" data-action="wear">${o ? `${ic('check', 20)}Je les remets` : `${ic('clock', 20)}Je les retire`}</button><button class="fix" data-action="wear-list">Corriger</button></div></div>`;
}
function nightsCard(p) {
  const cells = Array.from({ length: 7 }, (_, i) => addDays(iso(), i - 6));
  return `<div class="card"><div class="cardh"><div><div class="eyebrow">Contention · ${esc((RET_NIGHTS.find(x => x[0] === String(p.retNights || 7)) || RET_NIGHTS[0])[1].toLowerCase())}</div>
      <h3>${nightsDone(p)} nuit${nightsDone(p) > 1 ? 's' : ''} sur les 7 dernières</h3></div></div>
    <div class="nights">${cells.map(d => `<button data-night="${d}" class="${dayGet(d, p.id).night ? 'on' : ''}" aria-label="Nuit du ${fmt(d)}"><i>${ic('check')}</i>${d === iso() ? 'ce soir' : cap(wd(d))}</button>`).join('')}</div></div>`;
}
function routineCard(p) {
  const items = routine(p), today = dayGet(iso(), p.id), n = items.filter(([k]) => today[k]).length, left = elasticsLeft(p);
  return `<div class="sh"><h2>Aujourd’hui</h2><span class="lnkb">${n}/${items.length}</span></div>
    <div class="group">${items.map(([k, l]) => `<div class="row"><button class="cbx ${today[k] ? 'on' : ''}" data-chk="${k}" aria-label="${esc(l)}">${ic('check')}</button><span class="tx"><span class="t ${today[k] ? 'done' : ''}">${esc(l)}</span>
      ${k === 'elastics' && p.elRule ? `<span class="s">${esc(p.elRule)}</span>` : ''}</span>${k === 'elastics' && left !== null ? `<span class="pill ${left < 7 ? 'warn' : ''}">${left} j de stock</span>` : ''}</div>`).join('')}</div>`;
}
function painCard(ctx) {
  return `<div class="card"><div class="cardh"><div><div class="eyebrow">${esc(ctx)}</div><h3>Comment vont tes dents aujourd’hui ?</h3></div></div>${painScale(null)}</div>`;
}
function familyCard() {
  const others = state.profiles.filter(p => p.id !== state.activeId); if (!others.length) return '';
  const status = p => {
    const al = aligner(p), r = mineOf('rdv', p.id).filter(x => !x.done && x.date >= iso()).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (al?.changedToday) return `<b>Aligneur n° ${al.n} aujourd’hui</b>`;
    if (openWear(p.id)) return `<b>Aligneurs hors bouche depuis ${dur(Date.now() - openWear(p.id).out)}</b>`;
    if (r && daysBetween(iso(), r.date) <= 7) return `Rendez-vous ${rel(r.date)}${r.time ? ` à ${r.time.replace(':', ' h ')}` : ''}`;
    if (al) return `Aligneur ${al.n}/${al.total}${al.next ? ` · suivant ${rel(al.next)}` : ''}`;
    return esc(TYPE_LABEL[p.type] || '');
  };
  return `<div class="sh"><h2>Famille</h2></div><div class="group">${others.map(p => `<button class="row ic fam" data-switch="${p.id}"><span class="tile t-av">${esc(initial(p))}</span><span class="tx"><span class="t">${esc(p.name)}</span><span class="s">${status(p)}</span></span>${CHEV}</button>`).join('')}</div>`;
}
const guideStrip = p => `<div class="sh"><h2>Fiches pratiques</h2><button data-tab="guide">Tout voir</button></div>
  <div class="gcards">${GUIDE.filter(g => relevant(g, p)).slice(0, 6).map(g => `<button class="gcard" data-art="${g.id}" style="background:linear-gradient(150deg,${g.c},color-mix(in srgb,${g.c} 70%,#000))"><span class="gi">${ic(g.ic, 18)}</span><b>${esc(g.t)}</b></button>`).join('')}</div>`;

// ---------- Écrans ----------
function vWelcome() {
  const feats = [
    ['camera', 'Photos guidées', 'Ta photo précédente s’affiche en transparence pour garder le même cadrage, et l’avant / après se fait en un geste.'],
    ['clock', 'Port, routine et rappels', 'Temps hors bouche des aligneurs, élastiques, contention, et rappels ajoutés au Calendrier de ton iPhone.'],
    ['alert', 'J’ai un problème', 'Les bons gestes en attendant, et ton cabinet à appeler ou à prévenir en un tap, même hors connexion.'],
    ['lock', 'Privé', 'Tout reste sur ton iPhone. Pas de compte, pas de serveur, plusieurs profils pour la famille.'],
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
  const qs = mine('questions').filter(q => !q.done), pctx = painContext(p);
  let hero = '';
  if (pr) {
    const big = pr.left < 45 ? `${pr.left}<small>j</small>` : `${Math.round(pr.left / 30.4)}<small>mois</small>`;
    const dots = photos.filter(x => x.date >= p.start && x.date <= pr.end).map(x => `<b style="left:${(daysBetween(p.start, x.date) / pr.total * 100).toFixed(1)}%"></b>`).join('');
    hero = `<div class="hero"><div class="hero-top">${ring(pr.pct)}<div><div class="eb">Jour ${pr.day} · ${esc(TYPE_LABEL[p.type] || '')}</div>
        <div class="big">${big}</div><div class="sub">${pr.left === 0 ? 'Fin estimée atteinte' : 'restants environ'}</div>
        ${pr.milestone ? `<div class="ms">${ic('sparkle')}${pr.milestone === 100 ? 'Fin estimée atteinte' : pr.milestone === 50 ? 'Mi-parcours franchi' : `Cap des ${pr.milestone} % franchi`}</div>` : ''}</div></div>
      <div class="tl"><div class="tl-bar"><i style="width:${pr.pct}%"></i>${dots}</div><div class="tl-l"><span>${esc(cap(fmtMY(p.start)))}</span><span>Fin ${esc(fmtMY(pr.end))}</span></div></div></div>`;
  } else if (isRet(p)) {
    const st = p.retStart || iso(), m = Math.floor(daysBetween(st, iso()) / 30.4), lastCtl = photos.at(-1)?.date || st, nextCtl = addMonths(lastCtl, 3);
    hero = `<div class="hero"><div class="eb">Contention · ${esc((RET_TYPES.find(x => x[0] === p.retType) || RET_TYPES[0])[1])}</div>
      <div class="big">${m ? `${m}<small>mois</small>` : `${daysBetween(st, iso())}<small>j</small>`}</div><div class="sub">depuis la fin du traitement</div>
      <div class="ms">${ic('camera')}Photo de contrôle ${nextCtl <= iso() ? 'à faire maintenant' : rel(nextCtl)}</div></div>`;
  }
  let aligns = '';
  if (al) {
    const pill = al.next ? (al.inDays <= 0 ? '<span class="pill warn">À changer aujourd’hui</span>' : `<span class="pill ${al.inDays <= 2 ? 'warn' : ''}">Suivant ${rel(al.next)}</span>`) : '<span class="pill">Dernier aligneur</span>';
    aligns = `<button class="card align" data-action="aligner" style="display:block;width:100%;text-align:left"><div class="between"><div><div class="eyebrow">Aligneur</div><div class="big2">${al.n}<small> / ${al.total}</small></div></div>${pill}</div>
      ${al.total <= 50 ? `<div class="segs">${Array.from({ length: al.total }, (_, i) => `<i class="${i < al.n - 1 ? 'on' : i === al.n - 1 ? 'cur' : ''}"></i>`).join('')}</div>` : `<div class="bar6"><i style="width:${al.n / al.total * 100}%"></i></div>`}</button>
      ${al.changedToday && since !== 0 ? `<button class="sos" data-action="camera" style="background:var(--tint-soft)"><span class="tile t-tint">${ic('camera', 20)}</span><span><b>Nouvel aligneur n° ${al.n}</b><small>Le bon moment pour une photo de suivi</small></span></button>` : ''}`;
  }
  const photoSub = since === null ? 'Ta photo de départ' : since === 0 ? 'Déjà faite aujourd’hui' : `Dernière il y a ${plural(since, 'jour')}`;
  return `<div class="lt"><div class="eyebrow">${esc(today)}</div><h1>Bonjour ${esc(p.name)}</h1></div>
    <div class="stack">
      ${isAlign(p) ? wearCard() : ''}${hasNights(p) ? nightsCard(p) : ''}
      ${pctx ? painCard(pctx) : ''}
      ${aligns}${hero}
    </div>
    <div class="actions">
      <button class="act" data-action="camera"><span class="tile t-tint">${ic('camera')}</span><span><b>Nouvelle photo</b><small class="${since >= 14 ? 'warn' : ''}">${photoSub}</small></span></button>
      <button class="act" data-action="problem"><span class="tile t-red">${ic('alert')}</span><span><b>J’ai un problème</b><small>Bracket, fil, douleur…</small></span></button>
    </div>
    ${routineCard(p)}
    ${photos.length ? `<div class="sh"><h2>Dernières photos</h2><button data-tab="photos">Tout voir</button></div>
      <div class="strip">${photos.slice(-10).reverse().map(ph => thumb(ph, fmtShort(ph.date))).join('')}</div>` : ''}
    <div class="sh"><h2>Prochain rendez-vous</h2><button data-tab="suivi">Suivi</button></div>
    <div class="group">${next ? rdvRow(next) : `<button class="row ic tintc" data-action="add-rdv"><span class="tile t-red">${ic('calendar', 18)}</span><span class="tx">Ajouter un rendez-vous</span></button>`}</div>
    ${familyCard()}
    <div class="sh"><h2>À demander</h2><button data-action="add-question">Ajouter</button></div>
    <div class="group">${qs.length ? qs.map(qRow).join('') : emptyRow('Note ici tes questions pour ne rien oublier au cabinet.')}</div>
    ${guideStrip(p)}`;
}
function vGallery() {
  const all = myPhotos();
  if (!all.length) return `<div class="empty"><div class="eic">${ic('camera', 40)}</div><h2>Aucune photo</h2>
    <p>Prends une première photo de départ : de face, de côté ou des arcades. C’est elle qui rendra l’évolution visible.</p>
    <button class="btn" data-action="camera">${ic('camera', 20)}Appareil photo guidé</button><button class="btn soft" data-action="library">Choisir dans Photos</button></div>`;
  if (ui.filter !== 'all' && !all.some(p => p.view === ui.filter)) ui.filter = 'all';
  const list = myPhotos(ui.filter).reverse(), groups = {};
  list.forEach(ph => (groups[ph.date.slice(0, 7)] ||= []).push(ph));
  const used = new Set(all.map(p => p.view));
  return `<div class="chips"><button class="chip ${ui.filter === 'all' ? 'on' : ''}" data-filter="all">Toutes</button>
      ${VIEWS.filter(([v]) => used.has(v)).map(([v, l]) => `<button class="chip ${ui.filter === v ? 'on' : ''}" data-filter="${v}">${l}<small>${myPhotos(v).length}</small></button>`).join('')}</div>
    ${Object.entries(groups).map(([m, phs]) => `<div class="mh">${esc(cap(fmt(m + '-01', { month: 'long', year: 'numeric' })))}</div>
      <div class="pgrid">${phs.map(ph => thumb(ph, ui.filter === 'all' ? VIEW_SHORT[ph.view] : fmtShort(ph.date))).join('')}</div>`).join('')}`;
}
function vCompare() {
  const all = myPhotos();
  const byView = VIEWS.map(([v, l]) => [v, l, all.filter(p => p.view === v)]).filter(x => x[2].length >= 2);
  if (!byView.length) return `<div class="empty"><div class="eic">${ic('compare', 40)}</div><h2>Deux photos minimum</h2>
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
  return `<div class="chips">${byView.map(([v, l, ls]) => `<button class="chip ${v === ui.cmpView ? 'on' : ''}" data-cmpview="${v}">${l}<small>${ls.length}</small></button>`).join('')}</div>
    <div class="seg">${modes.map(([m, l]) => `<button class="${ui.cmpMode === m ? 'on' : ''}" data-cmpmode="${m}">${l}</button>`).join('')}</div>
    ${viewer}
    <p class="foot c" style="padding-top:10px">${gapTxt}</p>
    <div class="group mt">
      <label class="row field"><span>Avant</span><span class="v">${fmt(a.date)}</span>${UPDOWN}<select class="ovl" data-cmp="cmpA">${o(a.id)}</select></label>
      <label class="row field"><span>Après</span><span class="v">${fmt(b.date)}</span>${UPDOWN}<select class="ovl" data-cmp="cmpB">${o(b.id)}</select></label>
    </div>
    ${a.id !== list[0].id || b.id !== list.at(-1).id ? '<button class="cmp-reset" data-action="cmp-reset">Première ↔ dernière photo</button>' : ''}
    <button class="btn soft mt" data-action="timelapse">${ic('play', 18)}Voir l’évolution en accéléré</button>`;
}
function vPhotos() {
  const all = myPhotos();
  return `<div class="lt"><h1>Photos</h1><p>${all.length ? `${plural(all.length, 'photo')} · depuis le ${fmt(all[0].date)}` : 'Ton carnet en images'}</p></div>
    <div class="seg top">${[['grid', 'Galerie'], ['compare', 'Comparer']].map(([m, l]) => `<button class="${ui.pmode === m ? 'on' : ''}" data-pmode="${m}">${l}</button>`).join('')}</div>
    ${ui.pmode === 'compare' ? vCompare() : vGallery()}`;
}
function vSuivi() {
  const p = me();
  const rdv = mine('rdv').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const up = rdv.filter(r => !r.done && r.date >= iso()), past = rdv.filter(r => r.done || r.date < iso()).reverse();
  const qs = mine('questions').sort((a, b) => a.done - b.done);
  const pay = mine('payments').sort((a, b) => a.date.localeCompare(b.date));
  const total = pay.reduce((s, x) => s + x.amount, 0), paid = pay.filter(x => x.paid).reduce((s, x) => s + x.amount, 0);
  const add = act => `<button data-action="${act}" aria-label="Ajouter">${ic('plus', 22)}</button>`;
  const payRow = x => swipeRow(`pay:${x.id}`, 'cb', `<div class="row"><button class="cbx ${x.paid ? 'on' : ''}" data-paid="${x.id}" aria-label="${x.paid ? 'Marquer non payé' : 'Marquer payé'}">${ic('check')}</button>
    <button class="tx" data-pay="${x.id}"><span class="t ${x.paid ? 'done' : ''}">${esc(x.label)}</span><span class="s">${fmt(x.date)}</span></button><span class="amt">${euro(x.amount)}</span></div>`);
  const days7 = Array.from({ length: 7 }, (_, i) => addDays(iso(), i - 6));
  // Port des aligneurs
  let wear = '';
  if (isAlign(p)) {
    const g = goalH(p), vals = days7.map(d => wornMs(p.id, d));
    const summ = alignerWearSummary(p);
    wear = `<div class="sh"><h2>Port des aligneurs</h2><button data-action="wear-list">Corriger</button></div>
      <div class="card">${wearSince(p.id) ? `<div class="eyebrow">Heures portées · 7 derniers jours</div>
        <div class="bars" style="--g:${g / 24}"><div class="goal"><span>${hours1(g * HOUR)} h</span></div>${days7.map((d, i) => { const v = vals[i]; const h = v === null ? 0 : v / HOUR; const full = d === iso() ? h : h;
          return `<div><i class="${v === null ? 'none' : d !== iso() && h < g - .02 ? 'low' : ''}" style="height:${v === null ? 3 : Math.max(3, full / 24 * 100)}%"></i><b>${d === iso() ? 'auj.' : cap(wd(d))}</b></div>`; }).join('')}</div>
        ${summ.length ? `<div class="calc">${summ.map(s => `<span>Aligneur n° ${s.k}</span><b>${s.ok}/${s.tracked} j à ${hours1(g * HOUR)} h ou plus</b>`).join('')}</div>` : ''}`
        : '<p class="meta" style="color:var(--label2);font-size:15px">Appuie sur « Je les retire » sur l’accueil quand tu enlèves tes aligneurs : ton temps de port apparaîtra ici, et dans le compte rendu pour ton orthodontiste.</p>'}</div>`;
  }
  // Contention
  let nights = '';
  if (hasNights(p)) {
    const d14 = Array.from({ length: 14 }, (_, i) => addDays(iso(), i - 14));
    nights = `<div class="sh"><h2>Contention</h2></div><div class="card"><div class="eyebrow">Nuits portées · 14 dernières</div>
      <div class="routine" style="grid-template-columns:repeat(14,1fr)">${d14.map(d => `<i class="${dayGet(d).night ? 'on' : ''}" style="background:${dayGet(d).night ? 'var(--indigo)' : ''}" title="${fmt(d)}"></i>`).join('')}</div>
      <div class="calc"><span>Sur 14 nuits</span><b>${nightsDone(p, 14)} portées</b><span>Consigne</span><b>${esc((RET_NIGHTS.find(x => x[0] === String(p.retNights || 7)) || RET_NIGHTS[0])[1])}</b></div></div>`;
  }
  // Douleur
  const d14 = Array.from({ length: 14 }, (_, i) => addDays(iso(), i - 13)), pt = painOn(iso());
  const pain = `<div class="sh"><h2>Douleur</h2></div><div class="card"><div class="eyebrow">Aujourd’hui</div>${painScale(pt ? pt.level : null)}
    ${mine('pain').some(x => daysBetween(x.date, iso()) < 14) ? `<div class="bars" style="--n:14;height:96px"><div class="goal" style="display:none"></div>${d14.map(d => { const x = painOn(d); return `<div><i class="${x ? 'pain' : 'none'}" style="height:${x ? Math.max(4, x.level * 10) : 3}%"></i><b>${toDate(d).getDate()}</b></div>`; }).join('')}</div>` : ''}
    <p class="foot" style="padding:10px 0 0">Information pour ton orthodontiste, visible dans le compte rendu. Douleur qui augmente ou dure : contacte ton cabinet.</p></div>`;
  // Routine
  const items = routine(p);
  const rout = `<div class="sh"><h2>Routine</h2></div><div class="card"><div class="routine"><span></span>${days7.map(d => `<span class="h">${d === iso() ? 'auj' : cap(wd(d))}</span>`).join('')}
    ${items.map(([k, l]) => `<span>${esc(l)}</span>${days7.map(d => `<i class="${dayGet(d)[k] ? 'on' : ''}"></i>`).join('')}`).join('')}</div></div>`;
  // Élastiques
  const left = elasticsLeft(p);
  const el = hasEl(p) ? `<div class="sh"><h2>Élastiques</h2><button data-action="stock">Stock</button></div><div class="card">
    <div class="calc" style="margin-top:0"><span>Consigne</span><b>${esc(p.elRule || '—')}</b><span>Par jour</span><b>${esc(p.elPerDay || '—')}</b><span>Stock</span><b>${left !== null ? `${num(p.elStock)} · ${left} jours` : 'non suivi'}</b></div>
    ${left !== null && left < 7 ? '<div class="box call">' + ic('band', 20) + '<span>Stock bas : pense à en redemander à ton cabinet.</span></div>' : ''}</div>` : '';
  // Remboursement
  const rc = rbCalc(p), rb = p.rb || {};
  const remb = `<div class="card mt"><div class="cardh"><div><div class="eyebrow">Sécu + mutuelle (France)</div><h3>Reste à charge estimé</h3></div><button class="lnkb" data-action="rb">${rc ? 'Modifier' : 'Calculer'}</button></div>
    ${rc ? `<div class="calc"><span>Honoraires / semestre</span><b>${euro(rb.fees)}</b><span>Sécurité sociale</span><b>${euro(rc.secu)}</b><span>Mutuelle (estimation)</span><b>${euro(rc.mut)}</b>
      <span class="tot">Reste / semestre</span><b class="tot">${euro(rc.rest)}</b><span>Sur ${rc.sems} semestres</span><b>${euro(rc.rest * rc.sems)}</b><span>Semestre en cours</span><b>${rb.cur || 1} / ${rc.sems}</b></div>
      ${!rc.eligible ? `<div class="box call">${ic('info', 20)}<span>Traitement commencé après 16 ans : en général, pas de prise en charge par la Sécurité sociale. Vérifie auprès de ta CPAM.</span></div>` : ''}
      ${rc.eligible && !rb.accord ? `<div class="box tip">${ic('info', 20)}<span>Pense à l’accord préalable de la CPAM, à demander avant le début du traitement.</span></div>` : ''}`
      : '<p class="meta" style="color:var(--label2);font-size:15px;margin-top:6px">Base de 193,50 € par semestre avant 16 ans, plus ta mutuelle. Barème indicatif (nov. 2026), à vérifier sur ameli.fr.</p>'}</div>`;
  return `<div class="lt"><h1>Suivi</h1><p>${esc(TYPE_LABEL[p.type] || '')}${aligner(p) ? ` · aligneur ${aligner(p).n}/${aligner(p).total}` : ''}</p></div>
    <div class="group"><button class="row ic" data-action="calendar"><span class="tile t-red">${ic('calplus', 18)}</span><span class="tx"><span class="t">Rappels dans Calendrier</span><span class="s">Aligneurs, rendez-vous, élastiques…</span></span>${CHEV}</button></div>
    ${wear}${nights}
    <div class="sh"><h2>Rendez-vous</h2>${add('add-rdv')}</div>
    <div class="group">${up.length ? up.map(r => rdvRow(r)).join('') : emptyRow('Aucun rendez-vous à venir')}</div>
    ${past.length ? `<div class="sh"><h2>Historique</h2></div><div class="group">${past.map(r => rdvRow(r, true)).join('')}</div>` : ''}
    ${pain}${el}${rout}
    <div class="sh"><h2>Questions</h2>${add('add-question')}</div>
    <div class="group">${qs.length ? qs.map(qRow).join('') : emptyRow('Rien à demander pour l’instant')}</div>
    ${qs.length ? '<p class="foot">Glisse une ligne vers la gauche pour la supprimer.</p>' : ''}
    <div class="sh"><h2>Paiements</h2>${add('add-pay')}</div>
    ${pay.length ? `<div class="card paysum"><div class="between"><div><div class="eyebrow">Réglé</div><div class="big2 num">${euro(paid)}</div></div>
        <div class="r"><div class="eyebrow">Reste</div><b>${euro(total - paid)}</b></div></div>
        <div class="bar6"><i style="width:${total ? paid / total * 100 : 0}%"></i></div></div>
      <div class="group mt">${pay.map(payRow).join('')}</div>`
      : `<div class="group">${emptyRow('Ajoute tes échéances pour suivre ce qu’il reste à régler')}</div>`}
    ${remb}`;
}
function vGuide() {
  const p = me(), mineG = GUIDE.filter(g => relevant(g, p)), others = GUIDE.filter(g => !relevant(g, p));
  const row = g => `<button class="row ic" data-art="${g.id}"><span class="tile" style="background:${g.c}">${ic(g.ic, 18)}</span><span class="tx"><span class="t">${esc(g.t)}</span></span>${CHEV}</button>`;
  return `<div class="lt"><h1>Guide</h1><p>Conseils généraux. Ton orthodontiste reste ta référence.</p></div>
    <button class="sos" data-action="problem"><span class="tile">${ic('alert', 20)}</span><span><b>J’ai un problème</b><small>Bracket, fil, aligneur perdu, contention, douleur…</small></span>${CHEV}</button>
    <div class="sh"><h2>Pour toi</h2></div><div class="group">${mineG.map(row).join('')}</div>
    ${others.length ? `<div class="sh"><h2>Autres fiches</h2></div><div class="group">${others.map(row).join('')}</div>` : ''}
    <p class="foot">Sources : American Association of Orthodontists, recommandations SFODF (2023), Assurance Maladie, littérature scientifique. Ces fiches donnent des repères généraux et ne remplacent pas un avis médical.</p>`;
}
function vShare() {
  const n = myPhotos().length, p = me(), hasClinic = p.practitioner || p.clinicPhone || p.clinicEmail;
  return `<div class="lt"><h1>Cabinet</h1><p>Montre ton évolution à ton orthodontiste.</p></div>
    <div class="card"><div class="cardh"><div><div class="eyebrow">Mon cabinet</div><h3>${esc(p.practitioner || 'Coordonnées du cabinet')}</h3></div><button class="lnkb" data-action="clinic">${hasClinic ? 'Modifier' : 'Ajouter'}</button></div>
      ${hasClinic ? `<div class="kv">${p.clinicPhone ? `<span>${esc(p.clinicPhone)}</span>` : ''}${p.clinicEmail ? `<span>${esc(p.clinicEmail)}</span>` : ''}${p.clinicHours ? `<span>${esc(p.clinicHours)}</span>` : ''}</div>` : '<div class="kv"><span>Téléphone, e-mail, horaires et consignes en cas de souci : tout sous la main, même hors connexion.</span></div>'}
      ${clinicButtons(p)}</div>
    <div class="hero cab mt"><div class="hero-ic">${ic('cabinet', 26)}</div><h2>Mode présentation</h2>
      <p>Tes photos en plein écran, de la plus ancienne à la plus récente. Tends simplement ton téléphone au praticien.</p>
      <button class="btn white" data-action="present">${ic('play', 18)}Lancer</button></div>
    <div class="sh"><h2>Envoyer</h2></div>
    <div class="group">
      <button class="row ic" data-action="message"><span class="tile t-tint">${ic('chat', 18)}</span><span class="tx"><span class="t">Message au cabinet</span><span class="s">Résumé, dernières photos et ta question</span></span>${CHEV}</button>
      <button class="row ic" data-action="pdf"><span class="tile t-blue">${ic('doc', 18)}</span><span class="tx"><span class="t">Compte rendu PDF</span><span class="s">Photos datées, port, douleur, rendez-vous, questions</span></span>${CHEV}</button>
      <button class="row ic" data-action="share-all"><span class="tile t-green">${ic('share', 18)}</span><span class="tx"><span class="t">Envoyer les photos</span><span class="s">${plural(n, 'photo')} par mail, message, AirDrop…</span></span>${CHEV}</button>
      <button class="row ic" data-action="calendar"><span class="tile t-red">${ic('calplus', 18)}</span><span class="tx"><span class="t">Rappels dans Calendrier</span><span class="s">Les alertes sonnent même app fermée</span></span>${CHEV}</button>
    </div>
    <div class="sh"><h2>Sauvegarde</h2></div>
    <div class="group">
      <button class="row ic" data-action="export"><span class="tile t-indigo">${ic('down', 18)}</span><span class="tx"><span class="t">Exporter une sauvegarde</span><span class="s">Protégée par mot de passe si tu veux</span></span>${CHEV}</button>
      <button class="row ic" data-action="import"><span class="tile t-gray">${ic('up', 18)}</span><span class="tx"><span class="t">Restaurer une sauvegarde</span></span>${CHEV}</button>
    </div>
    <p class="foot">Tes photos et ton journal restent uniquement sur cet appareil : pas de compte, pas de serveur, pas de mesure d’audience. Exporte une sauvegarde de temps en temps, et pour changer de téléphone.</p>
    <div class="sh"><h2>Profil</h2></div>
    <div class="group">
      <button class="row ic" data-action="edit-profile"><span class="tile t-av">${esc(initial(p))}</span><span class="tx"><span class="t">${esc(p.name)}</span><span class="s">${esc(TYPE_LABEL[p.type] || '')}</span></span>${CHEV}</button>
      <button class="row ic" data-action="profiles"><span class="tile t-orange">${ic('people', 18)}</span><span class="tx"><span class="t">Changer de personne</span></span>${CHEV}</button>
    </div>
    <p class="foot c">Sourire est un carnet personnel. Il n’interprète pas tes photos et ne remplace pas l’avis de ton orthodontiste.</p>`;
}

const SCREENS = { home: vHome, photos: vPhotos, suivi: vSuivi, guide: vGuide, share: vShare };
const TITLES = { home: 'Accueil', photos: 'Photos', suivi: 'Suivi', guide: 'Guide', share: 'Cabinet' };

function render() {
  const p = me();
  if (!p && state.profiles.length) { state.activeId = state.profiles[0].id; save(); return render(); }
  document.body.classList.toggle('welcome', !p);
  if (!p) { $('#view').innerHTML = vWelcome(); return; }
  if (!SCREENS[ui.tab]) ui.tab = 'home';
  const extra = ui.tab === 'photos' ? `<button class="gbtn" data-action="add-photo" aria-label="Ajouter une photo">${ic('plus', 20)}</button>` : '';
  $('#bar').innerHTML = `<div></div><div class="bar-t">${TITLES[ui.tab]}</div><div class="bar-r">${extra}<button class="avatar" data-action="profiles" aria-label="Profils">${esc(initial(p))}</button></div>`;
  $('#tabs').style.setProperty('--i', TABS.findIndex(t => t[0] === ui.tab));
  $$('#tabs .tab').forEach(b => { const on = b.dataset.tab === ui.tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
  $('#view').innerHTML = SCREENS[ui.tab]();
  if (ui.tab === 'home') ui.ringDone = true;
  bindCompare(); onScroll(); updateBadge();
}
function updateBadge() {
  let n = 0;
  for (const p of state.profiles) {
    const al = aligner(p); if (al?.changedToday) n++;
    if (mineOf('rdv', p.id).some(r => !r.done && r.date === iso())) n++;
    const left = elasticsLeft(p); if (left !== null && left < 3) n++;
  }
  try { if (n) navigator.setAppBadge?.(n)?.catch?.(() => {}); else navigator.clearAppBadge?.()?.catch?.(() => {}); } catch { /* non pris en charge */ }
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
const T = s => String(s ?? '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[\u202f\u00a0]/g, ' ').replace(/€/g, 'EUR').replace(/[−–—]/g, '-').replace(/[^\x00-\xFF]/g, '');
async function makeReport() {
  const p = me(), pr = progress(p), al = aligner(p), photos = myPhotos();
  if (!photos.length && !mine('wear').length && !mine('pain').length) return hud('Ajoute d’abord des photos', 'info');
  hud('Création du compte rendu…', 'doc', 15000);
  let jsPDF;
  try { jsPDF = await loadPDF(); } catch { return hud('Connexion nécessaire la première fois', 'info'); }
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 16, teal = [11, 110, 122], gray = [110, 110, 118], dark = [30, 30, 30];
  doc.setFillColor(...teal); doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
  doc.text(T(`Suivi orthodontique - ${p.name}`), M, 18);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
  doc.text(T(`Compte rendu du ${fmt(iso())} · ${plural(photos.length, 'photo')}`), M, 27);
  let y = 50;
  doc.setFontSize(10.5);
  const meta = [
    ['Appareil', TYPE_LABEL[p.type] || '-'], ['Cabinet', p.practitioner || '-'],
    ...(isRet(p) ? [['Contention depuis', fmt(p.retStart || iso())]] : [['Début', p.start ? fmt(p.start) : '-']]),
    ...(pr ? [['Fin estimée', fmt(pr.end, { month: 'long', year: 'numeric' })], ['Avancement', `${pr.pct} % (jour ${pr.day})`]] : []),
    ...(al ? [['Aligneur', `${al.n} sur ${al.total}`], ['Port demandé', `${hours1(goalH(p) * HOUR)} h / jour`]] : []),
    ...(hasEl(p) ? [['Élastiques', p.elRule || 'oui']] : []),
  ];
  meta.forEach(([k, v], i) => {
    const x = M + (i % 2) * 92, yy = y + Math.floor(i / 2) * 7;
    doc.setTextColor(...gray); doc.text(T(k), x, yy); doc.setTextColor(...dark); doc.text(doc.splitTextToSize(T(v), 58)[0], x + 30, yy);
  });
  y += Math.ceil(meta.length / 2) * 7 + 6;
  const ensure = h => { if (y + h > H - 18) { doc.addPage(); y = M + 4; } };
  const heading = t => { ensure(16); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...teal); doc.text(T(t), M, y); y += 3; doc.setDrawColor(220, 220, 225); doc.line(M, y, W - M, y); y += 6; doc.setFont('helvetica', 'normal'); };
  const lines = (txt, size = 10.5, color = dark) => { doc.setFontSize(size); doc.setTextColor(...color); const ls = doc.splitTextToSize(T(txt), W - 2 * M); ensure(ls.length * 5 + 2); doc.text(ls, M, y); y += ls.length * 5 + 2; };
  // Données saisies par le patient (aucune interprétation)
  if (isAlign(p) && wearSince(p.id)) {
    heading('Port des aligneurs (déclaré par le patient)');
    const days = Array.from({ length: 14 }, (_, i) => addDays(iso(), i - 14)).map(d => [d, wornMs(p.id, d)]).filter(([, v]) => v !== null);
    if (days.length) lines(`14 derniers jours : ${days.map(([d, v]) => `${fmt(d, { day: 'numeric', month: 'short' }).replace('.', '')} ${hours1(v)} h`).join(' · ')}`, 9.5);
    alignerWearSummary(p, 8).forEach(s => lines(`Aligneur n° ${s.k} : ${s.ok} jour(s) sur ${s.tracked} à ${hours1(goalH(p) * HOUR)} h ou plus`, 9.5));
    y += 3;
  }
  if (hasNights(p)) { heading('Contention (déclarée par le patient)'); lines(`Nuits portées : ${nightsDone(p, 7)} sur les 7 dernières, ${nightsDone(p, 30)} sur les 30 dernières.`); y += 3; }
  const pains = mine('pain').filter(x => daysBetween(x.date, iso()) <= 30).sort((a, b) => a.date.localeCompare(b.date));
  if (pains.length) { heading('Douleur notée (0 à 10)'); lines(pains.map(x => `${fmt(x.date, { day: 'numeric', month: 'short' }).replace('.', '')} : ${x.level}`).join(' · '), 9.5); y += 3; }
  const gap = 5, cw = (W - 2 * M - 2 * gap) / 3, chh = cw * 4 / 3;
  for (const [v, l] of VIEWS) {
    const ls = photos.filter(x => x.view === v); if (!ls.length) continue;
    heading(`${l} (${ls.length})`);
    for (let i = 0; i < ls.length; i += 3) {
      ensure(chh + 14);
      for (let j = 0; j < 3 && i + j < ls.length; j++) {
        const ph = ls[i + j], x = M + j * (cw + gap);
        try { doc.addImage(await cropCover(blobs.get(ph.id), 540, 720), 'JPEG', x, y, cw, chh); } catch { /* image illisible */ }
        doc.setFontSize(8.5); doc.setTextColor(...dark);
        const jj = p.start && ph.date >= p.start ? ` · J+${daysBetween(p.start, ph.date)}` : '';
        doc.text(T(fmt(ph.date) + jj), x, y + chh + 4);
        if (ph.note) { doc.setTextColor(...gray); doc.text(doc.splitTextToSize(T(ph.note), cw).slice(0, 2), x, y + chh + 8); }
      }
      y += chh + 14;
    }
  }
  const qs = mine('questions').filter(q => !q.done);
  if (qs.length) { heading('Questions du patient'); qs.forEach(q => lines('-  ' + q.text)); y += 4; }
  const rdv = mine('rdv').sort((a, b) => a.date.localeCompare(b.date));
  if (rdv.length) { heading('Rendez-vous'); rdv.forEach(r => lines(`${fmt(r.date)} - ${r.title}${r.note ? ' : ' + r.note : ''}`)); }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text(T('Données et photos saisies par le patient avec Sourire. Document informatif, sans valeur diagnostique.'), M, H - 9);
    doc.text(`${i} / ${pages}`, W - M, H - 9, { align: 'right' });
  }
  const file = new File([doc.output('blob')], T(`Compte-rendu-${p.name}-${iso()}.pdf`).replace(/\s+/g, '_'), { type: 'application/pdf' });
  $('#hud').classList.remove('on');
  readyToShare([file], 'Compte rendu prêt', `${plural(pages, 'page')} · ${plural(photos.length, 'photo')} · ${size(file.size)}`);
}

// ---------- Sauvegarde (chiffrement optionnel AES-GCM) ----------
const TE = new TextEncoder(), TD = new TextDecoder();
const b64 = async buf => (await blobToDataURL(new Blob([buf]))).split(',')[1];
const unb64 = async s => new Uint8Array(await (await fetch('data:application/octet-stream;base64,' + s)).arrayBuffer());
async function deriveKey(pw, salt) {
  const base = await crypto.subtle.importKey('raw', TE.encode(pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
function exportSheet() {
  sheet({
    title: 'Exporter une sauvegarde',
    body: `<div class="group">${field('Mot de passe', '<input type="password" name="pw" maxlength="100" placeholder="facultatif" autocomplete="new-password">')}</div>
      <p class="foot">Recommandé si tu envoies la sauvegarde par e-mail ou la ranges dans iCloud : tes photos de santé seront chiffrées. Sans ce mot de passe, la sauvegarde ne pourra pas être restaurée, note-le bien.</p>`,
    onOk: fd => { setTimeout(() => exportBackup(fd.get('pw')), 300); },
  });
}
async function exportBackup(pw) {
  hud('Préparation de la sauvegarde…', 'down', 20000);
  const data = {};
  for (const ph of state.photos) { const b = blobs.get(ph.id); if (b) data[ph.id] = await blobToDataURL(b); }
  let payload = JSON.stringify({ app: 'sourire', version: 3, exported: new Date().toISOString(), state, blobs: data });
  if (pw) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await deriveKey(pw, salt), TE.encode(payload));
    payload = JSON.stringify({ app: 'sourire', enc: 'aes-gcm-pbkdf2', salt: await b64(salt), iv: await b64(iv), data: await b64(ct) });
  }
  const file = new File([payload], `sourire-sauvegarde-${iso()}${pw ? '-chiffree' : ''}.json`, { type: 'application/json' });
  $('#hud').classList.remove('on');
  readyToShare([file], 'Sauvegarde prête', `${plural(state.photos.length, 'photo')} · ${size(file.size)}${pw ? ' · chiffrée' : ''} — garde-la dans Fichiers ou iCloud Drive.`, { icon: 'down' });
}
function importBackup() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json'; inp.style.display = 'none';
  inp.onchange = async () => {
    const f = inp.files[0]; inp.remove(); if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.app !== 'sourire') throw new Error('format');
      if (data.enc) {
        sheet({
          title: 'Sauvegarde chiffrée',
          body: `<div class="group">${field('Mot de passe', '<input type="password" name="pw" required maxlength="100" autocomplete="current-password">')}</div>`,
          onOk: async fd => {
            try {
              const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: await unb64(data.iv) }, await deriveKey(fd.get('pw'), await unb64(data.salt)), await unb64(data.data));
              setTimeout(() => restore(JSON.parse(TD.decode(pt))), 300);
            } catch { hud('Mot de passe incorrect', 'lock'); return false; }
          },
        });
      } else restore(data);
    } catch (e) { console.error(e); hud('Fichier de sauvegarde invalide', 'info'); }
  };
  document.body.appendChild(inp); inp.click();
}
async function restore(data) {
  if (!data?.state) return hud('Fichier de sauvegarde invalide', 'info');
  if (state.profiles.length && !await alertBox({ title: 'Remplacer les données ?', message: 'Les données actuelles de cet appareil seront remplacées par la sauvegarde.', ok: 'Remplacer', destructive: true })) return;
  for (const id of [...urls.keys()]) await delBlob(id).catch(() => {});
  state = Object.assign(blank(), data.state);
  for (const [id, u] of Object.entries(data.blobs || {})) await putBlob(id, await dataURLToBlob(u));
  save(); ui.tab = 'home'; ui.ringDone = false; render(); hud('Sauvegarde restaurée');
}

// ---------- Événements ----------
const preView = () => (ui.tab === 'photos' && ui.filter !== 'all' ? ui.filter : null);
const ACTIONS = {
  'profiles': profilesSheet, 'new-profile': () => profileSheet(), 'edit-profile': () => profileSheet(me()), 'clinic': () => clinicSheet(),
  'camera': () => openCamera(preView()), 'library': () => pickFromLibrary(preView()), 'add-photo': () => addPhotoMenu(preView()),
  'present': presentMenu, 'timelapse': () => openViewer(myPhotos(ui.cmpView), 0, 'play'),
  'cmp-reset': () => { ui.cmpA = ui.cmpB = null; render(); },
  'add-rdv': () => rdvSheet(), 'add-question': () => questionSheet(), 'add-pay': () => paySheet(),
  'wear': toggleWear, 'wear-list': wearListSheet, 'aligner': alignerSheet, 'stock': stockSheet, 'rb': rbSheet,
  'problem': problemSheet, 'calendar': calendarSheet,
  'message': () => { const p = me(), last = myPhotos().at(-1); const series = last ? myPhotos().filter(x => x.date === last.date) : []; composeMessage({ text: `${clinicSummary(p)}\n\n${mine('questions').filter(q => !q.done).map(q => `- ${q.text}`).join('\n')}\n`, photos: series.slice(0, 6), subject: `Suivi de ${p.name}` }); },
  'pdf': () => makeReport().catch(e => { console.error(e); hud('Impossible de créer le PDF', 'info'); }),
  'share-all': () => sharePhotos(myPhotos()), 'export': exportSheet, 'import': importBackup,
};
document.addEventListener('click', e => {
  if (!e.target.closest('#view,#bar,#tabs')) return;
  if (e.target.closest('.sw')?.dataset.justSwiped) return;
  if ($('.sw.open') && !e.target.closest('.sw-del')) { closeSwipes(); return; }
  const t = e.target.closest('[data-tab],[data-action],[data-open],[data-filter],[data-cmpview],[data-cmpmode],[data-pmode],[data-rdv],[data-q],[data-qedit],[data-pay],[data-paid],[data-swdel],[data-chk],[data-night],[data-pain],[data-art],[data-switch]');
  if (!t) return;
  const d = t.dataset;
  if (d.tab) return go(d.tab);
  if (d.open) { const list = ui.tab === 'photos' ? myPhotos(ui.filter) : myPhotos(); return openViewer(list, list.findIndex(p => p.id === d.open)); }
  if (d.filter) { ui.filter = d.filter; haptic(); return render(); }
  if (d.pmode) { ui.pmode = d.pmode; haptic(); return render(); }
  if (d.cmpview) { ui.cmpView = d.cmpview; ui.cmpA = ui.cmpB = null; haptic(); return render(); }
  if (d.cmpmode) { ui.cmpMode = d.cmpmode; haptic(); return render(); }
  if (d.rdv) return rdvSheet(state.rdv.find(r => r.id === d.rdv));
  if (d.q) { const q = state.questions.find(x => x.id === d.q); q.done = !q.done; save(); haptic(); return render(); }
  if (d.qedit) return questionSheet(state.questions.find(x => x.id === d.qedit));
  if (d.pay) return paySheet(state.payments.find(x => x.id === d.pay));
  if (d.paid) { const x = state.payments.find(y => y.id === d.paid); x.paid = !x.paid; save(); haptic(); return render(); }
  if (d.chk) { toggleDay(d.chk); haptic(); return render(); }
  if (d.night) { toggleDay('night', d.night); haptic(); return render(); }
  if (d.pain !== undefined) return setPain(Number(d.pain));
  if (d.art) return articleSheet(d.art);
  if (d.switch) return switchProfile(d.switch);
  if (d.swdel) {
    const [k, id] = d.swdel.split(':'), key = { q: 'questions', pay: 'payments', rdv: 'rdv' }[k];
    state[key] = state[key].filter(x => x.id !== id); save(); haptic(); return render();
  }
  ACTIONS[d.action]?.();
});
document.addEventListener('change', e => { const k = e.target.dataset?.cmp; if (k && e.target.closest('#view')) { ui[k] = e.target.value; render(); } });

// Rafraîchit le chrono et la date sans minuteur en arrière-plan : tout est recalculé depuis les horodatages.
let lastDay = iso();
setInterval(() => {
  if (document.hidden || layers.length || vw || cam || !me()) return;
  if (iso() !== lastDay) { lastDay = iso(); return render(); }
  if (ui.tab === 'home' && isAlign(me())) { const el = $('#wearCard'); if (el) el.outerHTML = wearCard(); }
}, 20000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && me() && !layers.length && !vw && !cam) { lastDay = iso(); render(); } });

// ---------- Démarrage ----------
$('#tabs').innerHTML = '<span class="pill"></span>' + TABS.map(([id, label, icon]) => `<button class="tab" data-tab="${id}">${ic(icon, 25)}<span>${label}</span></button>`).join('');
(async () => {
  try { db = await openDB(); await loadBlobs(); } catch (e) { console.error(e); hud('Stockage des photos indisponible (navigation privée ?)', 'info', 4000); }
  navigator.storage?.persist?.();
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
