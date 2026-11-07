# The Sumba Times (thesumbatimes.com)

Static site generator. `python3 build.py` writes `out/` (EN/ES/ID).

Hosting: Cloudflare Worker `thesumbatimes` (account d275d2609c10aa655477fd7a47e9b443), custom domains thesumbatimes.com and www (www 301 to apex).
The Worker embeds every file of `out/` as a JS map (see deploy step in the project doc claude/thesumbatimes-v1-2026-11-07.md).
It is NOT served by the Pages project web-lovable (that project is over the 20,000-file limit and failing deploys).

To add an article: append a dict to ARTICLES in content.py (section, slug, date, en/es/id title+dek+body, sources), set "top": True on the new lead story (remove it from the old one), rebuild, redeploy the Worker.
