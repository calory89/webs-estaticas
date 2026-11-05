// Refreshes the live numbers on kolaboro.com/accessibility/ from the latest nightly axe run (data/a11y.json, written by
// .github/workflows/kolaboro-a11y.yml). Only the part between <!--kb-a11y-live--> and <!--/kb-a11y-live--> is replaced, so the
// rest of the page (header, footer, statement text) stays exactly as it is on the site.
// Usage: node a11y-page.js <page.html> <a11y.json> <out.html>
const fs = require('fs');
const [, , PAGE, DATA, OUTF] = process.argv;
const html = fs.readFileSync(PAGE, 'utf8');
const d = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = iso => { const t = new Date(iso); return isNaN(t) ? '' : t.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; };
const S = d.summary || {}, by = S.nodes_by_impact || {};
const rules = d.rules || [];
const hist = (d.history || []).slice(0, 14);
const ok = by.critical === 0 && by.serious === 0 && !S.errors;

let out = '<!--kb-a11y-live-->\n';
out += `<p class="a11y-when">Latest automated run: <b>${e(fmt(S.at || d.updated))}</b>, ${e(d.tool)}, viewport ${e(d.viewport)}, ${e(d.seconds)} s. Source: <a href="/data/a11y.json">/data/a11y.json</a>. This block was refreshed by the daily quality job on ${e(fmt(new Date().toISOString()))}.</p>\n`;
out += '<div class="eg-k a11y-k">'
  + `<div><b>${e(S.pages)}</b><span>pages tested (every page in the sitemap)</span></div>`
  + `<div><b>${e(S.pages_clean)}</b><span>pages with no violations</span></div>`
  + `<div><b class="${by.critical ? 'no' : 'ok'}">${e(by.critical || 0)}</b><span>critical findings (elements)</span></div>`
  + `<div><b class="${by.serious ? 'no' : 'ok'}">${e(by.serious || 0)}</b><span>serious findings (elements)</span></div>`
  + `<div><b>${e(by.moderate || 0)}</b><span>moderate findings (elements)</span></div>`
  + `<div><b>${e(by.minor || 0)}</b><span>minor findings (elements)</span></div>`
  + `<div><b>${e(S.pages_with_serious_or_critical)}</b><span>pages with a serious or critical finding</span></div>`
  + `<div><b>${e(S.errors || 0)}</b><span>pages the test could not load</span></div>`
  + '</div>\n';
out += `<p>${ok ? '<span class="ok">Goal met</span>: no serious or critical findings in the latest run.' : '<span class="no">Goal not met yet</span>: our goal is zero serious or critical findings on every page. The open issues are listed below and in the table.'}</p>\n`;
out += '<h3 id="known">Known issues from the latest run</h3>\n';
if (!rules.length) out += '<p>None found by the automated test.</p>\n';
else {
  out += '<div class="a11y-scroll" tabindex="0" role="region" aria-label="Known issues table"><table class="eg-t"><thead><tr><th scope="col">Rule</th><th scope="col">Impact</th><th scope="col">Pages</th><th scope="col">Elements</th><th scope="col">Example pages</th></tr></thead><tbody>';
  for (const r of rules) out += `<tr><td><a href="${e(r.helpUrl)}" rel="noopener">${e(r.id)}</a><br><small>${e(r.help)}</small></td><td>${e(r.impact)}</td><td>${e(r.pages)}</td><td>${e(r.nodes)}</td><td>${(r.examples || []).map(p => `<a href="${e(p)}">${e(p)}</a>`).join('<br>')}</td></tr>`;
  out += '</tbody></table></div>\n';
}
if (hist.length > 1) {
  out += '<h3>Recent runs</h3>\n<div class="a11y-scroll" tabindex="0" role="region" aria-label="Recent runs table"><table class="eg-t"><thead><tr><th scope="col">Run</th><th scope="col">Pages</th><th scope="col">Clean pages</th><th scope="col">Critical</th><th scope="col">Serious</th><th scope="col">Moderate</th><th scope="col">Minor</th></tr></thead><tbody>';
  for (const h of hist) { const n = h.nodes_by_impact || {}; out += `<tr><td>${e(fmt(h.at))}</td><td>${e(h.pages)}</td><td>${e(h.pages_clean)}</td><td>${e(n.critical || 0)}</td><td>${e(n.serious || 0)}</td><td>${e(n.moderate || 0)}</td><td>${e(n.minor || 0)}</td></tr>`; }
  out += '</tbody></table></div>\n';
}
out += '<!--/kb-a11y-live-->';
const a = html.indexOf('<!--kb-a11y-live-->'), b = html.indexOf('<!--/kb-a11y-live-->');
if (a < 0 || b < a) { console.error('markers not found in ' + PAGE); process.exit(1); }
fs.writeFileSync(OUTF, html.slice(0, a) + out + html.slice(b + '<!--/kb-a11y-live-->'.length));
console.log(JSON.stringify({ pages: S.pages, critical: by.critical, serious: by.serious, rules: rules.length }));
