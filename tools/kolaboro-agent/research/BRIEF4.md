# Round 4: deep profiles for projects already tracked

Read /home/claude/kagent/BRIEF.md, BRIEF2.md and BRIEF3.md first; all their rules apply (open pages yourself, sources for every fact, never guess, null when not found, flags only from news/courts/regulators with source, no em dashes, save after every project, use only your own work folder).

Task: ENRICH every project in your input file. Keep slug, name and developer exactly as given. Re-check and correct the existing fields, then add `stage`, `verification` (6 levels), `claims` (8 to 14 tested claims), `facts`, `verified_score`, and refresh `seed`, `disclosure`, `evidence`, `positives`, `flags`, `sources`, `note`.
If a project's website is dead, it is sold out, or it is finished and handed over, still return it with `status` set to "website dead", "sold out" or "completed" and the evidence you found.

Official sources that worked for other researchers (use them):
- Dubai: sites that republish Dubai Land Department register data (dubairealestateiq.com, uaepropertychecker.com, zoneiq.ae, Prop971 registry block) for project number, escrow bank, % built, registered completion.
- Abu Dhabi: adxinteract.com project pages (ADREC data). Ajman: data.ajman.ae API. RAK: RERA project list PDF on mun.rak.ae.
- Thailand: ONEP EIA register (eia.onep.go.th, searchable through Exa) for EIA approval numbers; SET filings for listed developers.
- Malaysia: KPKT TEDUH API teduh.kpkt.gov.my/api/projek-swasta/{code}.
- Philippines: DHSUD License to Sell lists mirrored on lumingon.com and ren.ph.
- Dominican Republic: CONFOTUR rulings feed on the Ministry of Tourism site.
- Florida: DBPR condo filing CSV extracts; New York: NYC DOB open data.
- Turkey: KAP filings of listed developers. UK: council committee papers, Companies House.
- Mexico: PROFECO contract register rpca.profeco.gob.mx (consumer contracts, not permits); Quintana Roo SEDETUS warnings.
- Indonesia: news and company pages (no public PBG register found so far); check leasehold terms and "freehold for foreigners" claims (contradicted by law).

Output: a JSON array, one object per input project, written to the output file named in your task. Final reply: count by disclosure score, count by verified_score, number with status dead/sold out/completed, and the 3 most important findings.
