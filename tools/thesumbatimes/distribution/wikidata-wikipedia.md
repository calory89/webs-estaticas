# Wikidata item and Wikipedia citations for The Sumba Times

Prepared on 10 November 2026. Nothing has been created or edited on Wikidata or Wikipedia. Carlos (or someone he asks) does it from a personal account.

Important: the Wikidata API and site could not be reached from this session, so the Q and P numbers below come from memory and are **not verified**. Do not paste numbers blindly: in the Wikidata form, type the label (for example "online newspaper") and pick the entry from the suggestion list; the number shown should match, and if it does not, trust the label and description on screen.

## 1. Before creating the item

- Search Wikidata for "The Sumba Times" and "thesumbatimes.com" first, in case an item already exists.
- Wikidata accepts an item when it is "clearly identifiable" and can be described with serious public references. A news site with a public masthead, publisher and standards page normally qualifies, but an item whose only source is the site itself can be nominated for deletion. It is stronger once at least one independent outlet has mentioned The Sumba Times; add that article as a reference when it exists.
- Create a personal account (not a company account, not a shared one). On the user page write one line: "I am the publisher of The Sumba Times (thesumbatimes.com) and I edit its Wikidata item." Wikidata has no strict conflict-of-interest ban for factual statements, but disclosure is expected, and statements must be neutral and referenced.

## 2. The item

Create a new item (Special:NewItem) with:

| Field | English | Español | Bahasa Indonesia |
|---|---|---|---|
| Label | The Sumba Times | The Sumba Times | The Sumba Times |
| Description | online newspaper about the island of Sumba, Indonesia | periódico digital sobre la isla de Sumba, Indonesia | surat kabar daring tentang Pulau Sumba, Indonesia |
| Also known as | Sumba Times; thesumbatimes.com | Sumba Times; thesumbatimes.com | Sumba Times; thesumbatimes.com |

Descriptions on Wikidata start in lower case and have no full stop.

## 3. Statements

Add them in this order. "Reference" means: on each statement, add a reference with **reference URL (P854)** and **retrieved (P813)** = the day you add it.

| # | Property | Value | Reference URL |
|---|---|---|---|
| 1 | instance of (P31) | online newspaper (Q1153191, check label) | https://thesumbatimes.com/en/about/ |
| 2 | instance of (P31), second value | news website (Q17232649, check label) | https://thesumbatimes.com/en/about/ |
| 3 | language of work or name (P407) | English (Q1860) | https://thesumbatimes.com/en/about/ |
| 4 | language of work or name (P407) | Spanish (Q1321) | https://thesumbatimes.com/es/about/ |
| 5 | language of work or name (P407) | Indonesian (Q9240) | https://thesumbatimes.com/id/about/ |
| 6 | country (P17) | Indonesia (Q252) | https://thesumbatimes.com/en/about/ |
| 7 | country of origin (P495) | Indonesia (Q252) | https://thesumbatimes.com/en/about/ |
| 8 | official website (P856) | https://thesumbatimes.com/ with qualifier language of work or name (P407) = English, Spanish, Indonesian | none needed |
| 9 | inception (P571) | the date the site went public, to be confirmed by Carlos (precision: day or month, year 2026) | https://thesumbatimes.com/en/about/ or the first published story |
| 10 | publisher (P123) | Eco Beach City (see note below) | https://thesumbatimes.com/en/about/ |
| 11 | main subject (P921) | Sumba (pick the item described as an island in Indonesia) | https://thesumbatimes.com/en/about/ |
| 12 | web feed URL (P1019) | https://thesumbatimes.com/en/feed.xml (add /es/feed.xml and /id/feed.xml as further values, each with qualifier P407) | none needed |
| 13 | described at URL (P973) | https://thesumbatimes.com/en/press/ (once the press page is live) | none needed |

Notes:
- **Inception.** The oldest story on the site is dated 24 May 2026 and the current edition was built in early November 2026, but the site does not state a launch date. Only Carlos knows the right one: do not enter a date that the site itself cannot support. If in doubt, enter "2026" with year precision.
- **Publisher.** If Eco Beach City has no Wikidata item, there are two options: (a) leave statement 10 out for now, or (b) create an item for it only if it can be referenced with independent sources. Do not create a thin item just to fill the field: the property only accepts an item, not plain text, so option (a) is the safe one.
- **Do not add** social media identifiers until the accounts exist and are linked from the site (then: Instagram username P2003, Facebook username P2013, TikTok username P7085, Telegram username P3789; check each label).
- **Do not add** claims of size, reach, awards or "leading" anything.

## 4. Wikipedia: citing The Sumba Times without self-promotion

Wikipedia's conflict-of-interest guideline applies to Carlos and to anyone paid by or working with Eco Beach City. In short: you should not add links to your own site to articles yourself, and you should not create or edit an article about The Sumba Times or Eco Beach City. Paid or business-connected editing must be disclosed. Adding your own links across several articles is treated as link spam and can get the domain blacklisted, which would be far worse than having no links.

What is allowed and useful:

1. **Disclose.** On your Wikipedia user page, write that you publish The Sumba Times. Use the same account everywhere.
2. **Suggest, do not insert.** On the article's Talk page, start a section with the edit request template (`{{edit COI}}` on English Wikipedia; Spanish Wikipedia: explain the relation and ask on the "Discusión" page; Indonesian Wikipedia: "Pembicaraan" page). Say what sentence you propose, quote the source and let an independent editor decide.
3. **Only where we are the best available source.** Wikipedia prefers the original source. For most figures on our facts page, the original is BPS, BMKG or a regency office, and Wikipedia should cite that, not us. Our pages are a fair candidate only when they add something no single other source has. Realistic cases:
   - The compiled Pasola calendar with dates for 2024, 2025 and 2026 by location (each date sourced to local media), for the "Pasola" article, which often lacks recent dates.
   - A dated news report of ours on a Sumba event where no other English or Spanish source exists and the Indonesian originals are already cited.
4. **Fix errors with primary sources.** If a Sumba article on Wikipedia has an outdated population or a wrong airport name, correct it citing BPS or the airport operator directly. That is ordinary editing, needs no link to us, and builds a clean history for the account.
5. **Reliability.** Wikipedia editors judge sources by editorial oversight and reputation. A new site published by a company with a hotel on the island will be looked at carefully. The About page, named sources, corrections policy and the press page help. Do not argue if an editor declines: accept it and move on.
6. **Never:** create an article about The Sumba Times (it has to be written by someone independent once there is independent coverage), add the site to "External links" sections, use a second account, or ask friends to add links.

Example of a Talk page request (English Wikipedia, article "Pasola"):

```
== Suggested addition: recent Pasola dates ==
{{edit COI}}
I publish The Sumba Times, so I am not editing the article myself. The article does not give dates after [year].
Suggested sentence: "In 2026 the Pasola was held on 9-11 February and 9-11 March in Kodi, on 10 February in Lamboya,
on 9 March in Wanokaka and on 14 March in Gaura."
Sources: the detikBali schedule of 23 January 2026 and the Southwest Sumba tourism office page (both linked from
https://thesumbatimes.com/en/culture/pasola-2027-dates/, which compiles 2024 to 2026). Please cite the original sources
if you prefer them. ~~~~
```

Note that the request offers the original sources first. That is deliberate: it is the honest order, and editors are far more likely to act on it.

## 5. Related, lower-risk places to be listed

- **OpenStreetMap:** if you add or correct places in Sumba, do it as a normal mapper; do not put the site URL on places you do not operate.
- **Wikimedia Commons:** upload your own photos of Sumba under CC BY-SA with accurate descriptions. Credit goes to the photographer; a link to the site in the author field is acceptable, promotional text is not.
- **Wikivoyage (Sumba page):** it has its own rules against touting; improve practical information without linking to us, and disclose if you do.
