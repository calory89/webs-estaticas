# Research brief: 20 new off-plan projects for Kolaboro

Kolaboro (kolaboro.com) tracks off-plan (pre-construction) property projects sold to foreign buyers and scores what each developer makes PUBLIC on its own website and listings. You research 20 NEW projects in your region and write them as JSON.

## Rules
- Only real, currently marketed off-plan or under-construction projects aimed at international buyers (not resales, not finished stock only).
- Not already tracked: skip anything listed in /home/claude/kagent/existing.txt (format: market | name | developer).
- Open the pages yourself (WebFetch or WebSearch). A search snippet is not a source. Every fact needs a URL you opened, listed in `sources`.
- Report what is published, never guess. If you could not find something, the value is null (or false where noted). Never invent permit numbers, prices or percentages.
- Prefer the developer's own project page as `docs_url`; `url` can be the developer page or a major portal listing of the project.
- Spread across markets in your region (no more than 4 projects per market) and mix big and small developers.
- Flags only from news, courts or regulators (never from forums or reviews), each with its source URL. Write them neutrally ("X reported...", "company disputes...").
- Plain English, no em dashes.
- Use today's date 2026-10-31 for `added` and in the note ("checked 31 Oct 2026").

## The 6 disclosure checks (these decide the score, so research each one)
1. permit: a permit, licence, registration or approval NUMBER published (e.g. Dubai RERA/Trakheesi, Spain licencia de obra number, Portugal alvara, Thailand EIA/building permit number, Mexico licencia, Philippines DHSUD LTS number, Indonesia PBG). Put it in `permit_number` (top level and seed). If they only say "fully licensed" with no number, `permit_claim: true`, `permit_number: null`.
2. escrow: deposit protection published (escrow account named, bank guarantee/aval bancario, trust/fideicomiso, insurance of deposits). `seed.escrow`: short text of what is stated, or null if nothing is published.
3. progress: construction progress published with a figure or dated photos/updates. `seed.progress_pct`: number 0-100 if a % is published; if only dated progress photos/updates exist and no %, put the best published figure or 0 for "not started"; null if nothing is published.
4. plans: floor plans or unit plans published. `seed.plans_published`: true/false.
5. record: the developer's delivered track record is verifiable (named completed projects, units delivered). `seed.developer_delivered`: short text with what was delivered and where it is stated, or null.
6. returns: `seed.guaranteed_language`: true if the project advertises "guaranteed" rental income/returns/ROI or buy-back, false if it does not. Put any advertised yield % in `seed.yield_pct`.

A project is "100%" when all 6 pass: permit number, escrow stated, progress published, plans, record, and guaranteed_language false.

## Output
Write a JSON array of 20 objects to the output file named in your task, exactly in this shape (see /home/claude/kagent/example-entry.json for a real one):

{
 "slug": "lowercase-hyphen-name-developer",
 "name": "Project name",
 "developer": "Developer legal or brand name",
 "area": "District or town",
 "country": "Country",
 "market": "Market (city or region, reuse existing market names from existing.txt when they fit, e.g. Dubai, Costa del Sol, Riviera Maya, Phuket)",
 "url": "https://...",
 "docs_url": "https://...",
 "permit_number": "string or null",
 "docs_listed": ["short items of what the page publishes, e.g. 'payment plan 30/70', 'floor plans 1-3BR', 'construction update Sep 2026'"],
 "note": "One or two sentences of the key facts, ending with (checked 31 Oct 2026)",
 "added": "2026-10-31",
 "seed": {
  "price": number or null (starting price, number only), "currency": "EUR|USD|AED|THB|MXN|IDR|...",
  "title": "freehold|leasehold|... or null", "lease_base": years or null, "extension": "text or null",
  "guaranteed_language": true/false, "yield_pct": number or null,
  "completion": "YYYY or YYYY-Qn or null",
  "permit_claim": true/false, "permit_number": "string or null",
  "plans_published": true/false,
  "escrow": "text or null",
  "progress_pct": number or null,
  "developer_delivered": "text or null",
  "units": number or null,
  "payment_plan": "text or null",
  "price_per_m2": number or null (same currency, only if published or computable from a published price and size)
 },
 "disclosure": {"permit": true/false, "escrow": true/false, "progress": true/false, "plans": true/false, "record": true/false, "no_guaranteed_returns": true/false, "score": 0-6, "all_six": true/false},
 "evidence": {"permit": "where/what or null", "escrow": "...", "progress": "...", "plans": "...", "record": "...", "returns": "..."},
 "positives": ["short facts in the buyer's favour"],
 "flags": [{"text": "...", "source": "https://..."}],
 "sources": ["every URL you opened and used"]
}

Validate the file is a valid JSON array before finishing (python3 -c "import json;print(len(json.load(open(PATH))))"). Your final reply: one line per project with name, market and score/6, then the count of 6/6 projects. Nothing else.
