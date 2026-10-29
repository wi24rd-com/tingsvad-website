// Indlæser site.config.js (eller den fil, SITE_CONFIG peger på) og udfylder standardværdier.
const path = require('path');
const fil = path.resolve(__dirname, '../..', process.env.SITE_CONFIG || 'site.config.js');
const K = require(fil);
module.exports = {
  baseUrl: process.env.BASE_URL || K.baseUrl,
  produktion: K.produktion || null,
  sider: K.sider || [{ sti: '/' }],
  egneFiler: K.egneFiler || /./,
  ignorerFejl: K.ignorerFejl || [],
  bloker: K.bloker || [],
  tilgaengelighed: Object.assign({ tags: ['wcag2a', 'wcag2aa'], fejlVed: ['critical', 'serious'], projekter: /chromium/, udelad: [] }, K.tilgaengelighed || {}),
  tastaturSide: K.tastaturSide || '/',
  sideTjek: K.sideTjek || [],
  lighthouseSider: K.lighthouseSider || (K.sider || [{ sti: '/' }]).slice(0, 8).map(s => s.sti),
};
