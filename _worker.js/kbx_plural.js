// comments: _notes/kolaboro-worker-comments.txt
const PR = {};
export const cat = (lang, n) => { try { return (PR[lang] = PR[lang] || new Intl.PluralRules(lang)).select(n); } catch (e) { return 'other'; } };
let F = null, FP = null, RX = {};
export async function ready(env) {
if (F) return F; if (FP) return FP;
FP = (async () => { const r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/i18n/kbx_plural.json')); if (!r.ok) throw new Error('plural ' + r.status); F = await r.json(); return F; })();
FP.catch(() => { FP = null; }); return FP;
}
export function word(lang, n, noun, gen) {
const f = F && F[lang] && F[lang][noun]; if (!f) return null; const c = cat(lang, n);
if (lang === 'ru' && gen) return c === 'one' ? f.gen[0] : f.gen[1];
return f[c] || (lang === 'ru' ? f.many : f.other);
}
const AD = '٠١٢٣٤٥٦٧٨٩';
const toN = s => +String(s).replace(/[٠-٩]/g, d => AD.indexOf(d)).replace(/[^0-9]/g, '');
function rx(lang) {
if (RX[lang]) return RX[lang];
const T = F[lang], idx = new Map();
for (const [k, f] of Object.entries(T)) for (const w of f.seen) idx.set(w, k);
const words = [...idx.keys()].sort((a, b) => b.length - a.length).join('|');
const num = lang === 'ar' ? '[0-9٠-٩]{1,3}(?:[,٬][0-9٠-٩]{3})+|[0-9٠-٩]+' : '[0-9]{1,3}(?:[\\u00a0\\u202f ][0-9]{3})+|[0-9]+';
const gap = '(?:\\s|&nbsp;|&#160;|</?(?:b|strong|span|bdi|em|small)\\b[^<>]*>)*';
const pre = lang === 'ru' ? '(?:(^|[\\s>(«"])([а-яёА-ЯЁ-]+)[\\s\\u00a0]+)?' : '()()';
const tail = lang === 'ar' ? '(?![\\u0600-\\u06FF])' : '(?![а-яёА-ЯЁ])';
return (RX[lang] = { re: new RegExp(pre + '(?<![0-9٠-٩.,:/\\-#$])(' + num + ')(?![0-9٠-٩]|[.,][0-9])(' + gap + ')(' + words + ')' + tail, 'g'), idx });
}
export function fix(lang, html) {
if (!F || !F[lang]) return html; const { re, idx } = rx(lang), G = new Set(F.ru_gen || []);
return html.replace(re, (m, lead, pw, ns, gp, w) => {
const n = toN(ns); if (!(n >= 0) || (n >= 1990 && n <= 2099 && !/[,٬   ]/.test(ns))) return m;
const k = idx.get(w), f = F[lang][k], c = cat(lang, n); let nw;
if (lang === 'ar') { if (c === 'one' || c === 'zero') return m; nw = c === 'two' && /(?:ان|ين)$/.test(w) ? w : f[c] || f.other; }
else { const g = pw && G.has(pw.toLowerCase()); nw = g ? (c === 'one' ? f.gen[0] : f.gen[1]) : (f[c] || f.many); if (g && w === f.many && c !== 'one') nw = w; }
if (nw === w || (lang === 'ar' && nw.replace(/ً/g, '') === w.replace(/ً/g, '') && c !== 'many')) return m;
return (lead != null ? m.slice(0, m.length - (ns.length + gp.length + w.length)) : '') + ns + gp + nw;
});
}
