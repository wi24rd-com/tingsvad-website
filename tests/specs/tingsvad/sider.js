// Alle offentlige sider på begge sprog – læst fra assets/kanon.json, som er den eneste sideliste (runde 13; sitemap, Revisionen og
// ankerkortet læser samme fil). motiv: om toppen har et billede (fritlagt motiv eller maleri i fuld bredde), der skal ses på alle
// bredder; sider med et maleri i toppen (Historien, Oplevelser, Arkivet) og maskinrummets sider har ikke.
const K = require('../../../assets/kanon.json');
const MOTIV = new Set(['undersoegelsen', 'maskinparken', 'gaestebog', 'runevaerkstedet', 'sagsmappen', 'stolen', 'hittegods', 'kodegryden', 'sagsregister',
  'retssalen', 'afstemningen', 'tidende', 'billedbevis', 'bevisvaerkstedet', 'sagskontoret', 'mimirs-guide', 'radio']);
module.exports = Object.entries(K.sider).map(([k, v]) => ({ noegle: k, da: v.da, en: v.en, motiv: MOTIV.has(k), ...(k === 'forside' ? { forside: true } : {}) }));
