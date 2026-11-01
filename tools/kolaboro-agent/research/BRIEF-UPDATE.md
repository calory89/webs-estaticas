# Research brief: complete the 6 disclosure checks for projects Kolaboro already tracks

Kolaboro (kolaboro.com) scores what each off-plan developer makes PUBLIC. These projects were only checked on 3 of 6 points. Research each one in depth so we can say whether it publishes all 6 (100%) or not.

Read /home/claude/kagent/BRIEF.md for the definitions of the 6 checks, the honesty rules and the field formats. Same rules apply: open pages yourself, every fact needs a URL you opened, never guess, null when not published, flags only from news/courts/regulators with source, no em dashes, date 2026-10-31.

## Input
Your input file (named in your task) is a JSON array of existing project objects. Keep `slug` exactly as given.

## Output
Write a JSON array to the output file named in your task, one object per input project, in this shape:

{
 "slug": "same slug as input",
 "url": "keep, or a better current project URL if the old one is dead",
 "docs_url": "developer's own project page or null",
 "permit_number": "string or null",
 "docs_listed": ["what the pages publish"],
 "note": "One or two sentences of key facts, ending with (checked 31 Oct 2026)",
 "seed": { all the seed fields from BRIEF.md: price, currency, title, lease_base, extension, guaranteed_language, yield_pct, completion, permit_claim, permit_number, plans_published, escrow, progress_pct, developer_delivered, units, payment_plan, price_per_m2 },
 "disclosure": {"permit": .., "escrow": .., "progress": .., "plans": .., "record": .., "no_guaranteed_returns": .., "score": 0-6, "all_six": ..},
 "evidence": {"permit": "...", "escrow": "...", "progress": "...", "plans": "...", "record": "...", "returns": "..."},
 "positives": [...],
 "flags": [{"text": "...", "source": "https://..."}],
 "sources": ["every URL you opened and used, at least one"],
 "status": "active | sold out | website dead | not found"
}

If a project's website is dead or the project cannot be found, still return it with status set, null fields, and the URLs you tried in sources. Keep existing seed values when you cannot find newer published ones, but correct them if the current page says otherwise.

Validate the file is a valid JSON array with one object per input project before finishing. Final reply: count by score (0-6), count of 6/6, count of dead/not found. Nothing else.
