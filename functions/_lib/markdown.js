// Markdown til agenter (runde 10). Cloudflares egen »Markdown for Agents« kræver Pro-plan; tinget er på Free,
// så middlewaren forhandler selv: `Accept: text/markdown` eller /<sti>/index.md giver sidens <main> som Markdown
// med YAML-frontmatter (titel, beskrivelse, kanonisk URL, sprog, sprogversioner, licens).
// Ren JavaScript uden afhængigheder, så den kan testes i Node (worker/test/runde10-trin3.test.js).

/** Vælg medietype efter Accept-headeren (q-værdier, specificitet, rækkefølge). Første kandidat er standard. */
export function naegl(accept, kandidater = ['text/html', 'text/markdown']) {
  const dele = String(accept || '').split(',').map((s, i) => {
    const [type, ...p] = s.trim().toLowerCase().split(';').map(x => x.trim());
    const qp = p.find(x => x.startsWith('q='));
    const q = qp ? Math.max(0, Math.min(1, Number(qp.slice(2)) || 0)) : 1;
    return { type, q, i };
  }).filter(d => d.type && d.type.includes('/'));
  if (!dele.length) return kandidater[0];
  let bedst = null;
  kandidater.forEach((k, ki) => {
    const [h] = k.split('/');
    let m = null;
    for (const d of dele) {
      const spec = d.type === k ? 2 : d.type === h + '/*' ? 1 : d.type === '*/*' ? 0 : -1;
      if (spec < 0) continue;
      if (!m || spec > m.spec) m = { q: d.q, spec, i: d.i };
    }
    if (!m || m.q <= 0) return;
    const s = { k, q: m.q, spec: m.spec, i: m.i, ki };
    if (!bedst || s.q > bedst.q || (s.q === bedst.q && (s.spec > bedst.spec || (s.spec === bedst.spec && (s.i < bedst.i || (s.i === bedst.i && s.ki < bedst.ki)))))) bedst = s;
  });
  return bedst ? bedst.k : kandidater[0];
}

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAA = new Set(['script', 'style', 'textarea', 'title']);
const SPRING = new Set(['script', 'style', 'noscript', 'svg', 'template', 'button', 'select', 'textarea', 'input', 'form', 'canvas', 'audio', 'video', 'iframe', 'picture>source', 'dialog']);
const BLOK = new Set(['p', 'div', 'section', 'article', 'main', 'header', 'footer', 'aside', 'figure', 'details', 'dl', 'dd', 'dt', 'address', 'fieldset', 'nav', 'hgroup', 'body', 'html']);

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', copy: '©', aelig: 'æ', oslash: 'ø', aring: 'å', AElig: 'Æ', Oslash: 'Ø', Aring: 'Å' };
export const afkod = s => String(s).replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); try { return String.fromCodePoint(n); } catch { return m; } }
  return e in ENT ? ENT[e] : (e.toLowerCase() in ENT ? ENT[e.toLowerCase()] : m);
});

function attrs(s) {
  const o = {};
  const re = /([^\s=\/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(s || ''))) o[m[1].toLowerCase()] = afkod(m[2] ?? m[3] ?? m[4] ?? '');
  return o;
}

/** Et lille, tilgivende træ af sidens egen HTML (ingen fremmed HTML kommer hertil). */
export function parse(html) {
  const rod = { tag: '#rod', a: {}, c: [] }, stak = [rod];
  const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>|<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=\/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</gi;
  let m;
  while ((m = re.exec(html))) {
    const top = stak[stak.length - 1];
    if (m[1]) { // sluttag: luk op til det matchende
      const t = m[1].toLowerCase();
      for (let i = stak.length - 1; i > 0; i--) if (stak[i].tag === t) { stak.length = i; break; }
    } else if (m[2]) {
      const t = m[2].toLowerCase(), n = { tag: t, a: attrs(m[3]), c: [] };
      top.c.push(n);
      if (RAA.has(t)) { // indhold til næste </t>
        const slut = html.toLowerCase().indexOf('</' + t, re.lastIndex);
        const tekst = html.slice(re.lastIndex, slut < 0 ? html.length : slut);
        n.c.push({ tag: '#t', v: tekst });
        re.lastIndex = slut < 0 ? html.length : html.indexOf('>', slut) + 1;
      } else if (!VOID.has(t) && !m[4]) stak.push(n);
    } else if (m[0][0] !== '<' || m[0] === '<') {
      top.c.push({ tag: '#t', v: m[0] });
    }
  }
  return rod;
}

export function find(n, f) { if (f(n)) return n; for (const k of n.c || []) { const r = find(k, f); if (r) return r; } return null; }
function alle(n, f, ud = []) { if (f(n)) ud.push(n); for (const k of n.c || []) alle(k, f, ud); return ud; }
const tekstAf = n => n.tag === '#t' ? afkod(n.v) : (n.c || []).map(tekstAf).join('');

function absolut(href, base) {
  if (!href || /^(javascript|data|blob):/i.test(href)) return '';
  try { return new URL(href, base).href; } catch { return ''; }
}

function render(n, x) {
  if (n.tag === '#t') return x.pre ? afkod(n.v) : afkod(n.v).replace(/\s+/g, ' ');
  const t = n.tag, a = n.a || {};
  if (SPRING.has(t) || a['aria-hidden'] === 'true' || a['data-md'] === 'skjul') return '';
  const born = (y = x) => (n.c || []).map(k => render(k, y)).join('');
  const inl = () => born().replace(/\s*\n+\s*/g, ' ').trim();
  switch (t) {
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': { const s = inl(); return s ? `\n\n${'#'.repeat(+t[1])} ${s}\n\n` : ''; }
    case 'br': return '  \n';
    case 'hr': return '\n\n---\n\n';
    case 'strong': case 'b': { const s = inl(); return s ? `**${s}**` : ''; }
    case 'em': case 'i': case 'cite': { const s = inl(); return s ? `_${s}_` : ''; }
    case 'code': case 'kbd': { if (x.pre) return born(); const s = tekstAf(n).replace(/\s+/g, ' ').trim(); return s ? '`' + s.replace(/`/g, 'ˋ') + '`' : ''; }
    case 'pre': { const s = born({ ...x, pre: true }).replace(/^\n+|\s+$/g, ''); if (!s) return ''; x.koder.push('```\n' + s + '\n```'); return `\n\n\u0000K${x.koder.length - 1}\u0000\n\n`; } // kodeblokke røres ikke af oprydningen
    case 'a': {
      const s = inl(); if (!s) return '';
      const h = absolut(a.href, x.base);
      return h ? `[${s.replace(/[\\[\]]/g, '\\$&')}](${h.replace(/\)/g, '%29')})` : s;
    }
    case 'img': { const alt = (a.alt || '').trim(); const src = absolut(a.src, x.base); return alt && src ? `![${alt.replace(/[\\[\]]/g, '')}](${src})` : ''; }
    case 'figcaption': { const s = inl(); return s ? `\n\n_${s}_\n\n` : ''; }
    case 'summary': { const s = inl(); return s ? `\n\n**${s}**\n\n` : ''; }
    case 'blockquote': { const s = born().replace(/\n{3,}/g, '\n\n').trim(); return s ? '\n\n' + s.split('\n').map(l => '> ' + l).join('\n') + '\n\n' : ''; }
    case 'ul': case 'ol': {
      let i = 0;
      const linjer = (n.c || []).filter(k => k.tag === 'li').map(li => {
        i += 1;
        const praefiks = t === 'ol' ? `${i}. ` : '- ';
        const s = (li.c || []).map(k => render(k, x)).join('').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
        if (!s) return '';
        return praefiks + s.split('\n').map((l, j) => (j ? ' '.repeat(praefiks.length) + l : l)).join('\n');
      }).filter(Boolean);
      return linjer.length ? '\n\n' + linjer.join('\n') + '\n\n' : '';
    }
    case 'table': {
      const raekker = alle(n, k => k.tag === 'tr').map(tr => (tr.c || []).filter(k => k.tag === 'th' || k.tag === 'td').map(c => (c.c || []).map(k => render(k, x)).join('').replace(/\s+/g, ' ').trim().replace(/[\\|]/g, '\\$&')));
      const bred = Math.max(0, ...raekker.map(r => r.length));
      if (!bred) return '';
      const fyld = r => '| ' + Array.from({ length: bred }, (_, j) => r[j] || '').join(' | ') + ' |';
      const cap = find(n, k => k.tag === 'caption');
      const ud = [fyld(raekker[0]), '|' + ' --- |'.repeat(bred), ...raekker.slice(1).map(fyld)];
      return '\n\n' + (cap ? `_${tekstAf(cap).replace(/\s+/g, ' ').trim()}_\n\n` : '') + ud.join('\n') + '\n\n';
    }
    case 'caption': return '';
    case 'li': return '\n' + born() + '\n';
    default: return BLOK.has(t) ? '\n\n' + born() + '\n\n' : born();
  }
}

/** Sidens metadata fra <head>. */
export function metadata(rod) {
  const head = find(rod, n => n.tag === 'head') || rod;
  const html = find(rod, n => n.tag === 'html');
  const meta = navn => { const m = find(head, n => n.tag === 'meta' && (n.a.name === navn || n.a.property === navn)); return m ? m.a.content || '' : ''; };
  const titel = find(head, n => n.tag === 'title');
  const can = find(head, n => n.tag === 'link' && n.a.rel === 'canonical');
  const alt = {};
  alle(head, n => n.tag === 'link' && n.a.rel === 'alternate' && n.a.hreflang && n.a.hreflang !== 'x-default').forEach(n => { alt[n.a.hreflang] = n.a.href; });
  return {
    title: titel ? tekstAf(titel).trim() : '', description: meta('description'),
    url: can ? can.a.href : '', lang: html ? html.a.lang || '' : '', alternates: alt, robots: meta('robots'),
  };
}

const yaml = v => JSON.stringify(String(v)); // JSON-strenge er gyldige YAML-strenge

/** HTML → { markdown, meta, tokens }. `base` er sidens egen URL (til relative links). */
export function htmlTilMarkdown(html, base, ekstra = {}) {
  const rod = parse(String(html || ''));
  const meta = metadata(rod);
  const krop = find(rod, n => n.tag === 'main') || find(rod, n => n.tag === 'body') || rod;
  const koder = [];
  let md = render(krop, { base: meta.url || base, pre: false, koder });
  md = md.replace(/[ \t]+\n/g, '\n').replace(/\n +(?=\S)(?!- |\d+\. )/g, '\n').replace(/\n{3,}/g, '\n\n').trim().replace(/\u0000K(\d+)\u0000/g, (m, i) => koder[+i]);
  if (!/^# /m.test(md)) { // sidens h1 og præmis står i toppen uden for <main>
    const h1 = find(rod, n => n.tag === 'h1'), praemis = find(rod, n => n.tag === 'p' && /\bpraemis\b/.test(n.a.class || ''));
    const hoved = (h1 ? tekstAf(h1).replace(/\s+/g, ' ').trim() : '') || meta.title;
    if (hoved) md = `# ${hoved}\n\n` + (praemis ? tekstAf(praemis).replace(/\s+/g, ' ').trim() + '\n\n' : '') + md;
  }
  const fm = ['---', `title: ${yaml(meta.title)}`];
  if (meta.description) fm.push(`description: ${yaml(meta.description)}`);
  if (meta.url || base) fm.push(`url: ${yaml(meta.url || base)}`);
  if (meta.lang) fm.push(`lang: ${yaml(meta.lang)}`);
  const alt = Object.entries(meta.alternates);
  if (alt.length) { fm.push('alternates:'); for (const [k, v] of alt) fm.push(`  ${k}: ${yaml(v)}`); }
  for (const [k, v] of Object.entries(ekstra)) fm.push(`${k}: ${yaml(v)}`);
  fm.push('---', '');
  const markdown = fm.join('\n') + '\n' + md + '\n';
  return { markdown, meta, tokens: Math.ceil(markdown.length / 4) };
}
