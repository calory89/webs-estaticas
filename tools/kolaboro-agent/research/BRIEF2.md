# Research brief, round 2: the Kolaboro project database (deep profiles with verification status)

Kolaboro (kolaboro.com) builds the largest public-evidence database of off-plan (pre-construction) property sold to foreign buyers. For each project we record what the developer PUBLISHES and, separately, whether each important fact is CONFIRMED by an independent or official source. Investors will look at the depth and honesty of this data, so precision matters more than volume.

First read /home/claude/kagent/BRIEF.md (round 1 rules, the 6 disclosure checks and the base JSON shape). Everything there still applies: open pages yourself (WebFetch, WebSearch, or the Exa tools if WebFetch is blocked), every fact needs a URL you opened, never guess, null when not found, flags only from news/courts/regulators with source, no em dashes, plain English, date 2026-10-31.

## Verification levels (new, the heart of round 2)
For each of the 6 checks give a level in `verification`:
- "registry": confirmed on an official or government source you opened (examples: Dubai Land Department / Dubai REST / DLD project status and escrow data, often mirrored with DLD numbers on portals such as Alnair or Prop971 when the page states the DLD source; Abu Dhabi ADREC/Madhmoun; RAK RERA; Spain Catastro or the town hall licence register; Portugal municipal permit portals; Philippines DHSUD License to Sell lists; Thailand Department of Lands or EIA approvals in ONEP lists; Turkey e-Devlet/TKGM; UK planning portals; Australia state planning portals; US county permit portals; Mexico state RPP or municipal licence; company registries for the developer record)
- "independent": confirmed by a credible independent source that is not the developer or a sales agent (major newspaper, regulator press release, court record, stock-exchange filing, audited report)
- "developer": only the developer, its sales agents or listing portals state it
- "contradicted": sources disagree or an official source contradicts the developer (explain in evidence)
- "none": not published anywhere you could find

Then list the key claims with status in `claims` (aim for 6 to 12 per project): each {"claim": "short claim as stated", "status": "verified" | "unverified" | "contradicted", "by": "registry | independent | none", "source": "URL that supports or contradicts it"}. Good claims to test: permit number valid, escrow account exists, completion date, construction stage, units delivered by the developer, developer company is registered, price, title type for foreigners, rental return figures, land ownership.

## Extra profile fields (new) in `facts`
"facts": {
 "developer_founded": year or null, "developer_hq": "city, country" or null,
 "developer_company": "legal entity name and registration number if published" or null,
 "developer_projects_delivered": number or null, "developer_units_delivered": number or null,
 "listed_or_audited": "stock exchange / audited accounts info" or null,
 "construction_start": "YYYY-MM" or null, "handover_promised": "YYYY-Qn" or null,
 "original_handover": "first promised date if it changed" or null, "delay_months": number or null,
 "unit_types": ["studio", "1BR", ...], "size_min_m2": number or null, "size_max_m2": number or null,
 "price_min": number or null, "price_max": number or null, "currency": "...",
 "deposit_pct": number or null, "payment_plan": "text" or null,
 "foreign_ownership": "how a foreigner holds it (freehold, leasehold years, nominee, company, fideicomiso...)" or null,
 "rental_programme": "managed rental / hotel brand / none, with any figures stated" or null,
 "service_charge": "text" or null,
 "brand": "hotel or residence brand if any" or null,
 "amenities": ["up to 8"],
 "lat": number or null, "lng": number or null (project location to 3 decimals, from a map or address you saw),
 "permit_authority": "who issues the permit in this market" or null,
 "brochure_url": "URL" or null
}

## Output object
The round-1 object (slug, name, developer, area, country, market, url, docs_url, permit_number, docs_listed, note, added, seed, disclosure, evidence, positives, flags, sources) PLUS `verification`, `claims`, `facts`, and `verified_score` = number of the 6 checks at level "registry" or "independent".

Keep `seed` consistent with BRIEF.md (seed.progress_pct a real published % or null; if only dated updates are published set seed.progress_updates true and progress_pct null; never use 0 as a placeholder).

Write a valid JSON array to your output file and validate it with python3 before finishing. Final reply: one line per project with name, market, disclosure score/6 and verified_score/6, then totals (how many 6/6 disclosed, how many with verified_score >= 4). Nothing else.
