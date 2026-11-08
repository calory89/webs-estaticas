# -*- coding: utf-8 -*-
"""Pre-publish checker for The Sumba Times (EDITORIAL.md checklist, machine-checkable part).
Run after `python3 build.py`:  python3 check.py            (all news briefs)
                               python3 check.py --recent   (only briefs from the last 3 days: use this in the daily task)
Exit code 1 on ERRORS (do not publish); WARNINGS should be fixed when possible."""
import glob, json, os, re, sys, importlib.util, datetime

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "out")
spec = importlib.util.spec_from_file_location("b", os.path.join(HERE, "build.py"))
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
LANGS = ("en", "es", "id")
recent = "--recent" in sys.argv
E, W = [], []
def err(m): E.append(m)
def warn(m): W.append(m)
def text(h): return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h or "")).strip()

# --- site-wide: JSON-LD and internal links (items 44, 66) ---
if not os.path.isdir(OUT): sys.exit("run build.py first")
redir = json.load(open(os.path.join(OUT, "_redirects.json")))
pages = glob.glob(OUT + "/*/**/index.html", recursive=True) + [OUT + "/index.html"]
for f in pages:
    s = open(f, encoding="utf-8").read(); rel = f.replace(OUT, "")
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try: json.loads(m)
        except Exception as e: err(f"{rel}: invalid JSON-LD ({e})")
    for h in set(re.findall(r'href="(/(?:en|es|id)/[^"#?]*)"', s)):
        p = OUT + h + ("index.html" if h.endswith("/") else "")
        if not os.path.exists(p) and h not in redir: err(f"{rel}: broken link {h}")
    if "noindex" not in s and len(re.findall(r"<h1", s)) != 1: err(f"{rel}: must have exactly one <h1>")

# --- per news brief, per language ---
items = b.all_items()
briefs = [a for a in items if b.kind_of(a) == "brief"]
if recent: briefs = [a for a in briefs if (b.NOW - b.dt(a)).days <= 3]
leads = [a for a in items if a.get("top")]
REL = {"en": r"\b(yesterday|today|tomorrow|last week|this week)\b", "es": r"\b(ayer|hoy|mañana|la semana pasada|esta semana)\b", "id": r"\b(kemarin|hari ini|besok|minggu lalu|minggu ini)\b"}
VAGUE = {"en": r"\b(soon|recently|in the near future)\b", "es": r"\b(pronto|recientemente|próximamente)\b", "id": r"\b(segera|baru-baru ini|dalam waktu dekat)\b"}
ENDH = {"en": "what it means", "es": "qué significa", "id": "apa artinya"}
ENGLISHY = re.compile(r"\b(the|and|with|which|would)\b", re.I)
titles = {}
for a in briefs:
    sl = a["slug"]
    for l in LANGS:
        c = a.get(l)
        if not c or not c.get("title") or not c.get("body"): err(f"{sl}: missing {l} title/body (item 46)"); continue
        t, d, body = c["title"], c.get("dek", ""), c["body"]
        alltext = " ".join([t, d, c.get("answer", ""), " ".join(c.get("keys", [])), c.get("visitors", ""), text(body)])
        if "—" in alltext or "–" in alltext: err(f"{sl} [{l}]: em/en dash found (rule)")
        if len(t) > 75: warn(f"{sl} [{l}]: title {len(t)} chars, aim under 70 (item 11)")
        if not (90 <= len(d) <= 170): warn(f"{sl} [{l}]: dek {len(d)} chars, aim 120-155 (item 15)")
        if not c.get("answer"): warn(f"{sl} [{l}]: no 'answer' quick answer (item 23)")
        k = c.get("keys") or []
        if not (3 <= len(k) <= 5): warn(f"{sl} [{l}]: 'keys' should have 3-5 points, has {len(k)} (item 24)")
        h2 = re.findall(r"<h2[^>]*>(.*?)</h2>", body, re.S)
        if len(h2) < 2: warn(f"{sl} [{l}]: fewer than 2 <h2> subheads (item 27)")
        if h2 and ENDH[l] not in text(h2[-1]).lower(): warn(f"{sl} [{l}]: last <h2> should be '{ENDH[l]}' (item 28)")
        n = len(text(body).split())
        if l == "en" and not (250 <= n <= 1600): warn(f"{sl} [en]: {n} words, news 300-700 / explainer 800-1,500 (item 25)")
        if re.search(REL[l], text(body), re.I): warn(f"{sl} [{l}]: relative date word, write the date (item 17)")
        if re.search(VAGUE[l], text(body), re.I): warn(f"{sl} [{l}]: vague time word, give a date (item 88)")
        if l != "en" and len(ENGLISHY.findall(text(body))) > 6: warn(f"{sl} [{l}]: looks like it contains English text (item 46)")
        key = (l, t.strip().lower())
        if key in titles: err(f"{sl} [{l}]: same headline as {titles[key]} (item 3)")
        titles[key] = sl
    if not (a.get("slugs") or {}).get("es") or not (a.get("slugs") or {}).get("id"): warn(f"{sl}: no localized 'slugs' (auto-generated from the title; item 47)")
    if not a.get("keywords"): warn(f"{sl}: no 'keywords' per language (item 53)")
    src = a.get("sources") or []
    if len(src) < 2: warn(f"{sl}: only {len(src)} source(s), aim for 2-6 (item 39)")
    if any(not u.startswith("http") for _, u in src): err(f"{sl}: source without URL (item 40)")
    if not b.img_of(a): warn(f"{sl}: no image (item 56)")
    if not a.get("dateline"): warn(f"{sl}: no dateline (item 21)")
    links = re.findall(r'href="(/(?:en|es|id)/[^"]+)"', b.place_links(b.fix_links(b.body_raw(a, "en")), a, "en"))
    if len(links) < 1: warn(f"{sl}: no internal links in the body (item 36)")
# lead image should change (item 62)
if len(leads) >= 2 and b.img_key(leads[0]) == b.img_key(leads[1]):
    warn(f"lead {leads[0]['slug']} uses the same photo as the previous lead (item 62)")
# at least one story today (WITA) (editorial line)
today = b.NOW.date().isoformat()
if not any(a["date"] == today for a in items if b.kind_of(a) == "brief"):
    warn(f"no news brief dated today {today} (WITA): the daily rule is at least one")

for m in E: print("ERROR  ", m)
for m in W: print("warning", m)
print(f"\n{len(E)} errors, {len(W)} warnings, {len(briefs)} briefs checked, {len(pages)} pages scanned")
sys.exit(1 if E else 0)
