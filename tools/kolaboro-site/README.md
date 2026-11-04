# kolaboro.com (static site generator)

`python3 build.py` writes the site to `out/`. Then `node og.js` (Playwright) renders one Open Graph image per page into `out/k/og/`.
Publish: copy `out/*` into `_s/kolaboro.com/` on branch `pub/_lovable` (keep `old/`, `apply/`, `es/` which hold the previous membership site and its redirects).
- Pages and content: build.py (round 1-2) and r3.py (round 3). Home markup: home_main.html.
- Styles: base.css + extra.css -> /k/site.css. Shared JS: site.js -> /k/site.js.
- Leads: Supabase RPC kolaboro_apply (p_plan yc-*). Analytics: GA G-FJKJE77K4V, Clarity wqn50nb6kp through Cloudflare Zaraz only (z4eqcmaic7 removed 4 Nov 2026).
