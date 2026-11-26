// reelrole.com: per-URL HTML at the edge.
// The site is a single-page app (source: calory89/reelrole-web), so every URL gets the same index.html.
// Here each page gets its own title, description, canonical, robots rule and Open Graph tags, and
// /v/<talent id> pages get the candidate's name, role and VideoObject JSON-LD, so link previews
// (WhatsApp, LinkedIn) and crawlers see the right page. Unknown URLs answer 404 instead of 200.
// Any error falls back to the untouched response.

const ORIGIN = 'https://reelrole.com';
const SB = 'https://mfyfqtlozspmiautbgef.supabase.co/rest/v1/';
const SB_URL = 'https://mfyfqtlozspmiautbgef.supabase.co';
// Public publishable key (new Supabase key format; safe in the browser). Row-level security applies.
const ANON = 'sb_publishable_m3p4bAQ2IufrhXsRR_-tpA_r-HbC4Vd';
const OG_IMAGE = ORIGIN + '/og-image.png';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PAGES = {
  '/': ['ReelRole: Get Hired Through Video', 'Record a 30 to 90 second video and let companies discover you. Free for talent. Companies browse video profiles and pay only to unlock the candidates they want to contact.'],
  '/for-talent': ['For Talent | ReelRole', 'Show who you are in a short video instead of a CV. Free for talent, always.'],
  '/for-companies': ['For Companies | ReelRole', 'Hear candidates before the first call. Browse video profiles for free and pay only to unlock the people you want to contact.'],
  '/companies': ['For Companies | ReelRole', 'Hear candidates before the first call. Browse video profiles for free and pay only to unlock the people you want to contact.'],
  '/pricing': ['Pricing | ReelRole', 'Free for talent. Companies pay 5 euros per unlock, buy a pack or choose Premium for 20 euros a month.'],
  '/how-it-works': ['How It Works | ReelRole', 'Record your video, add your details and get discovered by companies.'],
  '/trending': ['Trending Talent | ReelRole', 'The most viewed and saved video profiles this week, plus the newest talent on ReelRole.'],
  '/closers': ['Sales Closers | ReelRole', 'Find sales closers through short video introductions.'],
  '/stories': ['Stories | ReelRole', 'Stories from talent and companies using video to hire.'],
  '/contact': ['Contact Us | ReelRole', 'Questions about ReelRole? Write to us.'],
  '/help': ['Help Center | ReelRole', 'Answers to common questions about recording your video, unlocking candidates and your account.'],
  '/privacy': ['Privacy Policy | ReelRole', 'How ReelRole handles your personal data.'],
  '/terms': ['Terms of Service | ReelRole', 'The terms for using ReelRole.'],
  '/cookies': ['Cookie Policy | ReelRole', 'How ReelRole uses cookies.'],
  '/gdpr': ['GDPR | ReelRole', 'Your rights under the GDPR and how to exercise them on ReelRole.'],
  '/jobs': ['Jobs with video interviews | ReelRole', 'Open roles where you apply by answering short video questions. Free for candidates.'],
  '/guest-video-recording': ['Record Your Video | ReelRole', 'Record a short video profile in your browser. No account needed to start.'],
  '/hire': ['Hire Sales Talent Through Video | ReelRole', 'Hire sales closers, SDRs, account executives and remote sales people. Watch their video first and unlock contact details for 5 euros.'],
  '/hire/sales-closers': ['Hire Sales Closers | ReelRole', 'Watch sales closers pitch themselves on video before the first call. Unlock the ones you like for 5 euros each.'],
  '/hire/sdr': ['Hire SDRs | ReelRole', 'Hear how SDR candidates open a conversation before you interview them. Browse video profiles free, unlock for 5 euros.'],
  '/hire/account-executives': ['Hire Account Executives | ReelRole', 'See account executive candidates present themselves on video. Browse free and pay only to contact the ones you want.'],
  '/hire/remote-sales': ['Hire Remote Sales People | ReelRole', 'Remote sales talent with short video introductions. Judge communication before the first call.'],
  '/hire/spanish-speaking-sales': ['Hire Spanish-Speaking Sales People | ReelRole', 'Spanish-speaking sales candidates on video. Hear their Spanish before you call.'],
  '/hire/english-speaking-sales': ['Hire English-Speaking Sales People | ReelRole', 'English-speaking sales candidates on video. Hear their English before you call.'],
  '/hire/high-ticket-closers': ['Hire High-Ticket Closers | ReelRole', 'High-ticket closers pitching on video. See how they sell before you book a call.'],
  '/hire/customer-success': ['Hire Customer Success People | ReelRole', 'Customer success candidates with short video introductions. Browse free, unlock for 5 euros.'],
};
// App screens: served normally but never indexed.
const APP = /^\/(talent|company|admin|messages|auth|login|register|reset-password)(\/|$)/;
// Invite links (/r/<code>) and sample reels (/v/preview-<slug>) are real app pages, never indexed.
const NOINDEX_OK = /^\/(r\/[A-Za-z0-9_-]{2,32}|v\/preview-[a-z0-9-]{2,80})$/;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ld = (o) => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>';
const clean = (s) => String(s || '').replace(/\s*[—–]\s*/g, ', ').trim();

function rewrite(res, { title, description, canonical, robots, ogType, extraHead, status }) {
  const h = new Headers(res.headers);
  h.delete('content-length'); h.delete('etag');
  if (robots && robots.startsWith('noindex')) h.set('x-robots-tag', 'noindex');
  let rw = new HTMLRewriter()
    .on('title', { element(e) { if (title) e.setInnerContent(title); } })
    .on('meta[name="description"]', { element(e) { if (description) e.setAttribute('content', description); } })
    .on('meta[name="robots"]', { element(e) { if (robots) e.setAttribute('content', robots); } })
    .on('link[rel="canonical"]', { element(e) { if (canonical) e.setAttribute('href', canonical); else e.remove(); } })
    .on('meta[property="og:title"], meta[name="twitter:title"]', { element(e) { if (title) e.setAttribute('content', title); } })
    .on('meta[property="og:description"], meta[name="twitter:description"]', { element(e) { if (description) e.setAttribute('content', description); } })
    .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', canonical || ORIGIN); } })
    .on('meta[property="og:type"]', { element(e) { if (ogType) e.setAttribute('content', ogType); } });
  if (extraHead) rw = rw.on('head', { element(e) { e.append(extraHead, { html: true }); } });
  return rw.transform(new Response(res.body, { status: status || res.status, headers: h }));
}

async function loadTalent(id, ctx) {
  const url = SB + 'talent_profiles?select=full_name,role_title,city,country,languages,created_at,video_approved,video_url&user_id=eq.' + id + '&limit=1';
  const cache = caches.default;
  const key = new Request('https://reelrole-edge-cache/' + id);
  const hit = await cache.match(key);
  if (hit) return hit.json();
  const r = await fetch(url, { headers: { apikey: ANON, authorization: 'Bearer ' + ANON } });
  if (!r.ok) return { error: true };
  const rows = await r.json();
  const t = Array.isArray(rows) && rows[0] ? rows[0] : null;
  const body = JSON.stringify(t ? { talent: t } : { missing: true });
  ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'cache-control': 'public, max-age=600' } })));
  return JSON.parse(body);
}

async function loadJob(id, ctx) {
  const url = SB + 'job_posts?select=id,title,company_name,city,country,remote,employment_type,description,status,published_at&id=eq.' + id + '&limit=1';
  const cache = caches.default;
  const key = new Request('https://reelrole-edge-cache/job/' + id);
  const hit = await cache.match(key);
  if (hit) return hit.json();
  const r = await fetch(url, { headers: { apikey: ANON, authorization: 'Bearer ' + ANON } });
  if (!r.ok) return { error: true };
  const rows = await r.json();
  const j = Array.isArray(rows) && rows[0] ? rows[0] : null;
  const body = JSON.stringify(j ? { job: j } : { missing: true });
  ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'cache-control': 'public, max-age=300' } })));
  return JSON.parse(body);
}

export async function render(req, res, u, env, ctx) {
  try {
    const ct = res.headers.get('content-type') || '';
    if (res.status !== 200 || !ct.includes('text/html')) return res;
    const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, '') : '/';

    const page = PAGES[path];
    if (page) return rewrite(res, { title: page[0], description: page[1], canonical: ORIGIN + (path === '/' ? '/' : path), robots: 'index, follow' });

    if (APP.test(path)) return rewrite(res, { robots: 'noindex, nofollow', canonical: null });
    if (NOINDEX_OK.test(path)) return rewrite(res, { robots: 'noindex, follow', canonical: null });

    const jm = path.match(/^\/jobs\/([^/]+)$/);
    if (jm && UUID.test(jm[1])) {
      const data = await loadJob(jm[1].toLowerCase(), ctx);
      if (data.error) return res;
      const j = data.job;
      if (!j || j.status !== 'open') {
        return rewrite(res, { title: 'Job not found | ReelRole', robots: 'noindex, follow', canonical: null, status: 404 });
      }
      const place = j.remote ? 'Remote' : [j.city, j.country].filter(Boolean).map(clean).join(', ');
      const title = `${clean(j.title)}${j.company_name ? ' at ' + clean(j.company_name) : ''}${place ? ', ' + place : ''} | ReelRole`;
      const description = clean(j.description || '').replace(/\s+/g, ' ').slice(0, 155) || `Apply to ${clean(j.title)} with a short video on ReelRole.`;
      // Google Jobs: JobPosting structured data with only the facts the post has.
      const canonicalJob = ORIGIN + '/jobs/' + jm[1].toLowerCase();
      const posting = {
        '@context': 'https://schema.org', '@type': 'JobPosting',
        title: clean(j.title), description: clean(j.description || j.title || ''),
        datePosted: (j.published_at || new Date().toISOString()).slice(0, 10),
        hiringOrganization: { '@type': 'Organization', name: clean(j.company_name) || 'Confidential company' },
        directApply: true, url: canonicalJob,
      };
      const ET = { full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACTOR', freelance: 'CONTRACTOR', internship: 'INTERN', temporary: 'TEMPORARY' };
      if (j.employment_type && ET[String(j.employment_type).toLowerCase()]) posting.employmentType = ET[String(j.employment_type).toLowerCase()];
      if (j.remote) {
        posting.jobLocationType = 'TELECOMMUTE';
        posting.applicantLocationRequirements = { '@type': 'Country', name: clean(j.country) || 'Worldwide' };
      }
      if (j.city || j.country) posting.jobLocation = { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: clean(j.city) || undefined, addressCountry: clean(j.country) || undefined } };
      return rewrite(res, { title, description, canonical: canonicalJob, robots: 'index, follow', extraHead: ld(posting) });
    }

    const m = path.match(/^\/v\/([^/]+)$/);
    if (m && UUID.test(m[1])) {
      const data = await loadTalent(m[1].toLowerCase(), ctx);
      if (data.error) return res; // database unreachable: let the app handle it
      const t = data.talent;
      if (!t || !t.video_url || t.video_approved === false) {
        return rewrite(res, { title: 'Profile not found | ReelRole', robots: 'noindex, follow', canonical: null, status: 404 });
      }
      const name = clean(t.full_name) || 'ReelRole talent';
      const role = clean(t.role_title) || 'Professional';
      const place = [t.city, t.country].filter(Boolean).map(clean).join(', ');
      const canonical = ORIGIN + '/v/' + m[1].toLowerCase();
      const title = `${name}, ${role}: Video Profile | ReelRole`;
      const description = `Watch ${name}'s short video introduction${place ? ' (' + place + ')' : ''} on ReelRole. See personality and communication before you interview.`;
      const person = { '@type': 'Person', name, jobTitle: role, url: canonical };
      if (Array.isArray(t.languages) && t.languages.length) person.knowsLanguage = t.languages;
      if (t.created_at) person.subjectOf = { '@type': 'VideoObject', name: `${name}, ${role}: video introduction`, description: `Short video introduction by ${name} on ReelRole.`, thumbnailUrl: [OG_IMAGE], uploadDate: t.created_at, embedUrl: canonical };
      const extraHead = ld({ '@context': 'https://schema.org', '@type': 'ProfilePage', url: canonical, mainEntity: person });
      return rewrite(res, { title, description, canonical, robots: 'index, follow', ogType: 'profile', extraHead });
    }

    // Anything else is not a page of this site.
    return rewrite(res, { title: 'Page Not Found | ReelRole', robots: 'noindex, follow', canonical: null, status: 404 });
  } catch (e) {
    return res;
  }
}

// /stream/talent_videos/<user id>/<file>: the public Supabase object, cached at the Cloudflare edge
// for a year (file names carry a timestamp, so they never change). Range requests are answered from
// the cache, so videos start fast in Europe and Supabase only serves each file once per edge.
const MEDIA_RE = /^\/stream\/talent_videos\/([0-9a-f-]{36})\/([A-Za-z0-9._-]{1,120}\.(mp4|webm|mov|m4v|jpg|vtt))$/;
const MEDIA_TYPES = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', jpg: 'image/jpeg', vtt: 'text/vtt' };
export async function media(req, u, ctx) {
  const m = u.pathname.match(MEDIA_RE);
  if (!m) return new Response('Not found', { status: 404 });
  const origin = SB_URL + '/storage/v1/object/public/talent_videos/' + m[1] + '/' + m[2];
  const h = new Headers();
  const range = req.headers.get('range');
  if (range) h.set('range', range);
  const r = await fetch(origin, { method: req.method, headers: h, cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 31536000, '404': 0, '500-599': 0 } } });
  const out = new Headers();
  for (const k of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) { const v = r.headers.get(k); if (v) out.set(k, v); }
  out.set('content-type', MEDIA_TYPES[m[3].toLowerCase()]);
  out.set('access-control-allow-origin', '*');
  out.set('x-robots-tag', 'noindex');
  out.set('cache-control', r.ok ? 'public, max-age=31536000, immutable' : 'no-store');
  if (!out.has('accept-ranges') && /^(mp4|webm|mov|m4v)$/i.test(m[3])) out.set('accept-ranges', 'bytes');
  return new Response(r.body, { status: r.status === 206 || r.ok || r.status === 416 ? r.status : 404, headers: out });
}
