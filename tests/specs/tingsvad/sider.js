// Alle offentlige sider på begge sprog. motiv: om toppen har et billede (fritlagt motiv eller maleri i fuld bredde), der skal ses på alle bredder;
// sider med et maleri i toppen (Historien, Oplevelser, Arkivet) og maskinrummet har ikke.
// nav: det link i sidenavigationen, der skal være markeret (aria-current="page" eller "true" for en overside).
module.exports = [
  { da: '/', en: '/en/', motiv: false, forside: true },
  { da: '/historien/', en: '/en/history/', motiv: false },
  { da: '/oplevelser/', en: '/en/experiences/', motiv: false },
  { da: '/oplevelser/undersoegelsen/', en: '/en/experiences/investigation/', motiv: true },
  { da: '/oplevelser/maskinparken/', en: '/en/experiences/machine-park/', motiv: true },
  { da: '/oplevelser/gaestebog/', en: '/en/experiences/guestbook/', motiv: true },
  { da: '/oplevelser/runevaerkstedet/', en: '/en/experiences/rune-workshop/', motiv: true },
  { da: '/oplevelser/sagsmappen/', en: '/en/experiences/case-file/', motiv: true },
  { da: '/oplevelser/stolen/', en: '/en/experiences/the-stool/', motiv: true },
  { da: '/oplevelser/hittegods/', en: '/en/experiences/lost-property/', motiv: true },
  { da: '/oplevelser/kodegryden/', en: '/en/experiences/the-cauldron/', motiv: true },
  { da: '/arkivet/', en: '/en/archive/', motiv: false },
  { da: '/arkivet/sagsregister/', en: '/en/archive/case-register/', motiv: true },
  { da: '/maskinrummet/', en: '/en/machine-room/', motiv: false },
  { da: '/maskinrummet/noedoevelser/', en: '/en/machine-room/emergency-drills/', motiv: false },
  { da: '/maskinrummet/revisionen/', en: '/en/machine-room/audit/', motiv: false },
  { da: '/maskinrummet/vaernet/', en: '/en/machine-room/defences/', motiv: false },
  { da: '/maskinrummet/crawlerne/', en: '/en/machine-room/crawlers/', motiv: false },
  { da: '/maskinrummet/hastigheden/', en: '/en/machine-room/speed/', motiv: false },
  { da: '/maskinrummet/danmark/', en: '/en/machine-room/denmark/', motiv: false },
  { da: '/maskinrummet/arkivskabet/', en: '/en/machine-room/archive-cabinet/', motiv: false },
  { da: '/maskinrummet/doeren/', en: '/en/machine-room/the-door/', motiv: false },
];
