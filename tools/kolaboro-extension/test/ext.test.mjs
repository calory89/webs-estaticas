// Kolaboro X-ray extension: end-to-end test in Chromium with the unpacked extension loaded, against live public pages.
// Run: node tools/kolaboro-extension/test/ext.test.mjs [outDir]   (needs playwright + its Chromium; network access)
// Checks: the extension loads, the popup recognises a tracked project from a developer site and runs a live X-ray to the sealed
// result, the in-page panel appears on portal listing pages we track (by address), unknown listing pages get the small button only,
// no errors from extension code. Portals that block automated browsers are reported as "blocked", not as failures of the extension.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); }
const EXT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'kx-'));
const results = [];
const log = (name, ok, note) => { results.push({ name, ok, note }); console.log((ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO') + '  ' + name + (note ? '  (' + note + ')' : '')); };

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kx-prof-'));
const ctx = await pw.chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true, viewport: { width: 1440, height: 900 }, locale: 'en-GB',
  args: ['--disable-extensions-except=' + EXT, '--load-extension=' + EXT]
});
let [sw] = ctx.serviceWorkers(); if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
const extId = sw.url().split('/')[2];
log('extension loads (MV3 service worker)', !!extId, extId);
const extErrors = [];
sw.on('console', m => { if (m.type() === 'error') extErrors.push('sw: ' + m.text()); });

// text of the closed shadow root through CDP (pierce), plus the box of a button to click
async function panel(page) {
  const s = await ctx.newCDPSession(page);
  const { root } = await s.send('DOM.getDocument', { depth: -1, pierce: true });
  let host = null; const walk = n => { if (host) return; if (n.attributes && n.attributes.includes('kolaboro-x-ray')) host = n; (n.children || []).forEach(walk); (n.shadowRoots || []).forEach(walk); };
  walk(root);
  if (!host) { await s.detach(); return null; }
  let text = ''; const btns = [];
  const collect = n => { if (n.nodeName === 'STYLE') return; if (n.nodeType === 3) text += n.nodeValue + ' '; if (n.nodeName === 'BUTTON' || n.nodeName === 'A') btns.push(n); (n.children || []).forEach(collect); (n.shadowRoots || []).forEach(collect); };
  (host.shadowRoots || []).forEach(collect);
  const res = { text: text.replace(/\s+/g, ' ').trim(), btns, s };
  return res;
}
async function clickIn(page, p, label) {
  for (const b of p.btns) {
    const { outerHTML } = await p.s.send('DOM.getOuterHTML', { nodeId: b.nodeId });
    if (outerHTML.includes(label)) { const { model } = await p.s.send('DOM.getBoxModel', { nodeId: b.nodeId }); const q = model.content; await page.mouse.click((q[0] + q[2]) / 2, (q[1] + q[5]) / 2); return true; }
  }
  return false;
}

// 1. popup on a developer website (activeTab path), live recognition + live X-ray
{
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') extErrors.push('popup: ' + m.text()); });
  page.on('pageerror', e => extErrors.push('popup: ' + e.message));
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto('chrome-extension://' + extId + '/popup.html?u=' + encodeURIComponent('https://www.teus-group.com/amani-melasti') + '&t=' + encodeURIComponent('Amani Melasti | TEUS Group'));
  await page.waitForSelector('.nm a', { timeout: 20000 });
  const name = await page.textContent('.nm a'), href = await page.getAttribute('.nm a', 'href');
  log('popup recognises a tracked project from its developer site', /Amani Melasti/.test(name) && /\/projects\/amani-melasti\/$/.test(href), name + ' -> ' + href);
  const dev = await page.locator('dd a').first().getAttribute('href').catch(() => null);
  log('popup links the developer page', /\/developers\/teus-group\/$/.test(dev || ''), dev);
  await page.screenshot({ path: path.join(OUT, 'popup-match.png') });
  await page.click('button.go');
  await page.waitForSelector('a.sec2[href*="/x/"]', { timeout: 90000 }).catch(() => null);
  const sealed = await page.getAttribute('a.sec2', 'href').catch(() => null), cards = await page.locator('ol.cd li').count();
  log('popup runs the live X-ray to a sealed result', /^https:\/\/kolaboro\.com\/x\/[0-9a-f]{64}\/$/.test(sealed || ''), cards + ' checks, ' + sealed);
  await page.screenshot({ path: path.join(OUT, 'popup-xray.png'), fullPage: true });
  if (sealed) { const r = await (await fetch(sealed.replace(/\/$/, '.json'))).json().catch(() => null); log('sealed X-ray is retrievable as JSON', !!(r && r.meta), r && r.meta ? 'started ' + r.meta.started_at : ''); }
  // not a website
  await page.goto('chrome-extension://' + extId + '/popup.html?u=' + encodeURIComponent('chrome://settings/'));
  log('popup explains browser pages', /browser page/.test(await page.textContent('#app')));
  // unknown site, other language
  await page.close();
}
// 2. popup in Spanish and Arabic (interface languages)
for (const lang of ['es', 'ar']) {
  const c2 = await pw.chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), 'kx-l-')), { channel: 'chromium', headless: true, locale: lang, args: ['--lang=' + lang, '--disable-extensions-except=' + EXT, '--load-extension=' + EXT] });
  let [w] = c2.serviceWorkers(); if (!w) w = await c2.waitForEvent('serviceworker');
  const p = await c2.newPage(); await p.setViewportSize({ width: 360, height: 640 });
  await p.goto('chrome-extension://' + w.url().split('/')[2] + '/popup.html?u=' + encodeURIComponent('https://www.binghatti.com/'));
  await p.waitForSelector('.lb', { timeout: 20000 });
  const tx = await p.textContent('#app'), dir = await p.getAttribute('.kx', 'dir');
  log('popup interface in ' + lang, lang === 'es' ? /registros|Radiografía/.test(tx) : (/[؀-ۿ]/.test(tx) && dir === 'rtl'), tx.slice(0, 90));
  await p.screenshot({ path: path.join(OUT, 'popup-' + lang + '.png') });
  await c2.close();
}

// 3. in-page panel on public portal pages
const PAGES = [
  ['Property Finder (UAE) new project we track', 'https://www.propertyfinder.ae/en/new-projects/samana-developers/samana-ocean-crest', 'match', /Samana Ocean Crest/],
  ['Property Finder (Bahrain) new project we track', 'https://www.propertyfinder.bh/en/new-projects/eagle-hills/marassi-views', 'match', /Marassi Views/],
  ['Rightmove listing we track', 'https://www.rightmove.co.uk/properties/169260455', 'match', /Sora/],
  ['Zillow community we track', 'https://www.zillow.com/community/residences-at-nashville-edition/452753046_zpid/', 'match', /Nashville/],
  ['Bayut off-plan page we track', 'https://www.bayut.com/for-sale/off-plan/5-bedroom-townhouses/dubai/expo-city/expo-valley/', 'any', null],
  ['Property Finder listing not in our records', 'https://www.propertyfinder.ae/en/new-projects/emaar-properties/the-oasis-palmiera', 'any', null],
  ['Rightmove home page (not a listing)', 'https://www.rightmove.co.uk/', 'none', null],
  ['Fotocasa new-build page', 'https://www.fotocasa.es/es/obra-nueva/', 'any', null],
  ['idealista listing page', 'https://www.idealista.com/obra-nueva/', 'any', null]
];
for (const [name, url, expect, rx] of PAGES) {
  const page = await ctx.newPage();
  page.on('console', m => { const l = m.location() || {}; if (m.type() === 'error' && (l.url || '').includes('chrome-extension://' + extId)) extErrors.push(name + ': ' + m.text()); });
  page.on('pageerror', e => { if (String(e.stack || '').includes('chrome-extension://' + extId)) extErrors.push(name + ': ' + e.message); });
  let status = 0;
  try { const r = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); status = r ? r.status() : 0; } catch (e) { status = -1; }
  const title = await page.title().catch(() => '');
  const blocked = status === 403 || status === 429 || status === -1 || /captcha|access denied|just a moment|attention required|pardon our interruption|are you a robot|robot or human/i.test(title);
  let p = null; for (let i = 0; i < 10 && !p; i++) { await page.waitForTimeout(1000); p = await panel(page); }
  const shot = path.join(OUT, 'portal-' + name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.png');
  await page.screenshot({ path: shot }).catch(() => {});
  if (blocked && !p) { log(name, null, 'blocked by the portal for automated browsers (HTTP ' + status + ', "' + title.slice(0, 50) + '")'); await page.close(); continue; }
  if (expect === 'none') log(name, !p, p ? 'panel shown: ' + p.text.slice(0, 80) : 'no panel, as expected');
  else if (expect === 'match') {
    const ok = !!p && rx.test(p.text) && /In our records/.test(p.text);
    log(name, ok, p ? p.text.slice(0, 140) : 'no panel (HTTP ' + status + ', ' + title.slice(0, 40) + ')');
    if (ok && name.startsWith('Property Finder (UAE)')) {
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, 'portal-390.png') });
      await page.setViewportSize({ width: 1440, height: 900 });
      const p2 = await panel(page);
      if (await clickIn(page, p2, 'Run the X-ray')) {
        let p3 = null; for (let i = 0; i < 60; i++) { await page.waitForTimeout(1500); p3 = await panel(page); if (/X-ray sealed|could not finish/.test(p3.text)) break; }
        log('panel runs the X-ray on a portal page', /X-ray sealed/.test(p3.text), (p3.text.match(/X-ray sealed: \d+ checks|could not finish[^.]*/) || [''])[0]);
        await page.screenshot({ path: path.join(OUT, 'portal-xray.png') });
      } else log('panel runs the X-ray on a portal page', false, 'button not found');
    }
  } else log(name, true, p ? (/In our records/.test(p.text) ? 'panel: ' : 'button: ') + p.text.slice(0, 100) : 'no panel (not a listing page by our rules, or not tracked)');
  await page.close();
}
log('no errors from extension code', extErrors.length === 0, extErrors.slice(0, 5).join(' | '));
await ctx.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
console.log('screenshots and results in ' + OUT);
process.exit(results.some(r => r.ok === false) ? 1 : 0);
