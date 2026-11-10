# The Sumba Times: daily desk rules + 100-point SEO/GEO checklist per story (8 Nov 2026)

Machine check: `python3 check.py --recent` after `python3 build.py` (errors block publishing; warnings point to the item numbers below).

Spanish and Indonesian: write natively following guides/STYLE_ES_ID.md (never translate word for word; e.g. "El Niño retrasa hasta diciembre las lluvias en Sumba", not "El Niño muy fuerte retrasa").

Read this before writing any story. The build already does the items marked [auto]; the writer must do the rest, in EVERY language (en, es, id).

## Editorial line (what to publish)
- At least ONE new story every day (WITA date). Two or three when there is real news. Never pad: no story is better than an invented one, but a slow day still has a story (explainers, data, profiles, seasonal service pieces).
- Audience: foreigners and travellers who love Sumba or are thinking of going, plus residents and investors. Every story must answer "why does this matter to someone who cares about Sumba from abroad?".
- It is a NEWSPAPER, not a travel blog. Mix across the week, roughly:
  - 40% news: transport (flights, ferries, roads, fuel), weather and seasons, safety and health, prices and money, visas and rules, government decisions, infrastructure, environment, economy and tourism figures.
  - 20% culture and people: Marapu, Pasola, ikat, horses, food, festivals, profiles of Sumbanese people (named, quoted from published sources).
  - 15% explainers and data: "What X means", numbers with charts or tables, "Explained" pieces.
  - 15% business and projects: hotels, investment, land, jobs, new businesses (neutral, sourced).
  - 10% travel service: "what to do/see" only about once a week, and always tied to a reason (season, new access, event).
- Never two "things to do" stories in a row. Never a story that is only a list of attractions.
- Neutral and sourced: every fact comes from a page you opened (local media such as waingapu.com, Pos Kupang, Victory News, Antara NTT, Kompas, BMKG, BPS, government sites). Link sources at the end. Never invent quotes, numbers, names or dates.
- Never mention Eco Beach City as news, never promote any hotel, never use the em dash.

## The 100-point checklist (per story, per language)

### A. Topic and angle (1-10)
1. The topic is real news or a useful explainer from the last 48 hours (or a seasonal service piece).
2. The angle says what it means for visitors, expats or people who love Sumba.
3. Check the site first: no duplicate of an existing story; if it updates one, link it and say so.
4. Pick ONE main search query per language (what a foreigner would type: "Sumba flights from Bali", "vuelos a Sumba", "penerbangan ke Sumba").
5. Add 2-4 secondary queries per language.
6. Prefer topics people search for: flights, weather, safety, prices, visas, events, ferries, fuel, health, new places opening.
7. Prefer topics AI assistants get asked: "Is it safe to travel to Sumba now?", "When is the Pasola?", "How do I get to Sumba?".
8. One story = one main idea. Split if there are two.
9. Rotate sections across the week (news, travel, culture, business, living, projects).
10. Prefer at least one story a week with original value (our own data table, timeline, comparison).

### B. Headline and dek (11-20)
11. Headline under 70 characters, main query near the start, written natively in each language (not translated word for word).
12. Says what happened, with a concrete noun and number when possible.
13. No clickbait, no question headlines unless the story answers it in the first line.
14. Spanish headline natural for Spain and Latin America; Indonesian natural for Indonesians (use local terms: "kabupaten", "Bandara Umbu Mehang Kunda").
15. Dek (one sentence, 120-155 characters) adds the second most important fact; it is used as meta description [auto].
16. Use place names searchers use: "Sumba", "East Sumba / Sumba Oriental / Sumba Timur", "Waingapu", "Tambolaka".
17. Dates written in full in the body ("Friday 7 November 2026"), not "yesterday".
18. Numbers as digits.
19. No ALL CAPS, no emojis.
20. Same facts in all three headlines.

### C. Body structure (21-35)
21. Dateline (WAINGAPU, TAMBOLAKA, WAIKABUBAK, KUPANG...) in the "dateline" field [auto display + schema].
22. First paragraph answers who, what, where, when in 2-3 sentences.
23. "answer" field per language: 2-3 sentence direct answer, shown as Quick answer and read by AI [auto box + Speakable schema].
24. "keys" field per language: 3-5 bullet key points [auto box].
25. 300-700 words for news, 800-1,500 for explainers.
26. Short paragraphs (2-4 sentences).
27. At least two <h2> subheads containing the main query or synonyms.
28. End with an <h2> "What it means / Qué significa / Apa artinya".
29. "visitors" field per language when relevant: one practical paragraph "If you are travelling to Sumba" [auto box].
30. A table when there are 3+ comparable numbers (flights, prices, dates) [auto mobile wrapper].
31. Quote officials only as published, with name, role and where they said it.
32. Explain local terms once (masyarakat hukum adat, kabupaten, Rato, Marapu).
33. Give context: one paragraph of background linking to an earlier story or guide.
34. No speculation presented as fact; say "according to..." for every claim.
35. Corrections: if a fact changes, add "updated": "YYYY-MM-DD" and a line at the end saying what changed.

### D. Links (36-45)
36. 2-4 internal links to relevant guides or place pages (/LANG/places/..., /LANG/plan/, Pasola calendar, facts page).
37. Place names that have a page are linked automatically on first mention [auto]; still add the most relevant one by hand.
38. Link the previous story on the same topic.
39. 2-6 sources in "sources", primary sources first (government, BMKG, BPS, airline, company), then media.
40. External links open the actual article, not a homepage.
41. Anchor text describes the target ("the flight schedule", not "here").
42. Never link to hotel booking pages or competitors' affiliate pages.
43. Each language links to the same-language pages (/es/ from Spanish) [auto rewrites English-slug links].
44. No broken links: the build check must report 0 broken.
45. Add the story to a hub when relevant (Pasola, weather, flights): link it from the guide's text in a later update.

### E. Localization (46-55)
46. Three full versions: en, es, id. Never mix languages inside a block.
47. "slugs": {"es": ..., "id": ...} with localized URL words (no accents) [auto URLs, hreflang, redirects].
48. Spanish written for an international Spanish reader (neutral, "tú" not "vos", euros AND dollars when prices).
49. Indonesian uses rupiah and local terminology; English and Spanish give IDR plus approximate EUR/USD.
50. Units: km, °C, with miles/°F in English only when useful.
51. Local time in WITA (UTC+8), mention it once.
52. Check that names of places are spelled the same in all languages.
53. Keywords per language in "keywords": {"en": [...], "es": [...], "id": [...]} [auto article:tag + schema keywords].
54. Captions translated per language [auto alt text].
55. Each language version reads as if written by a native journalist.

### F. Images (56-63)
56. One real photo of Sumba with a reuse licence (Commons CC/PD, Unsplash, Pexels), relevant to the story.
57. Never photos of hotels or identifiable private people without consent; no AI image presented as real.
58. AI illustration only when no real photo exists, marked "ai": True [auto label].
59. 640 and 1280 WebP + 1200x630 OG [process in README]; upload to KV and keep a copy in img/.
60. Caption per language says what, where and credit [auto display, schema ImageObject with credit and licence].
61. Landscape 3:2, at least 1280 px wide, sharp, no watermark.
62. Do not reuse the same photo as the previous lead story.
63. OG image readable at small size (no text in the photo besides our band).

### G. Technical, automatic on build (64-80)
64. [auto] Canonical URL per language.
65. [auto] hreflang en/es/id + x-default, reciprocal.
66. [auto] NewsArticle schema: headline, description, dates, author/publisher, image, section, word count, inLanguage, dateline, locationCreated, keywords, citations, translations, mentions of places, isAccessibleForFree.
67. [auto] BreadcrumbList schema.
68. [auto] Speakable schema on the quick answer.
69. [auto] Open Graph and Twitter cards with og:locale and alternates.
70. [auto] robots max-image-preview:large and max-snippet:-1 (Google Discover, AI snippets).
71. [auto] News sitemap with the last 48 hours in all three languages.
72. [auto] Main sitemap with lastmod, image sitemap.
73. [auto] RSS per language.
74. [auto] llms.txt and llms-full.txt list the story.
75. [auto] IndexNow ping to Bing/Yandex on every deploy (feeds ChatGPT and Copilot search).
76. [auto] Internal search index includes the story.
77. [auto] Lead story on the front page = newest item with "top": True.
78. [auto] Ticker and Briefing column list it.
79. [auto] Related stories under the article.
80. [auto] Offline cache, fast HTML, no layout shift (fixed image sizes).

### H. GEO / AI assistants (81-90)
81. The quick answer is a standalone sentence an AI can quote, with date and place.
82. Include the exact numbers and dates (AI cites concrete facts).
83. Name the source inside the sentence ("BMKG said on 7 November...").
84. Use the question people ask as a subhead when natural ("Is it safe to swim at Walakiri now?").
85. Add a small FAQ ("faq" field, 2-4 questions) on service stories [auto FAQPage schema].
86. Keep facts consistent with our facts page and guides; if a guide becomes outdated because of the news, update the guide too.
87. Write entity names fully once (Umbu Mehang Kunda Airport, Waingapu; East Nusa Tenggara (NTT)).
88. Avoid vague words ("soon", "recently"): give dates.
89. One clear claim per sentence.
90. Never hide key text in images or scripts.

### I. Publishing and distribution (91-100)
91. Publish between 05:00 and 08:00 WITA (morning edition); breaking news as soon as verified.
92. Set "top": True on the most important story of the day only.
93. Build, then run `python3 check.py --recent`: 0 errors is required to publish, fix the warnings for today's stories. Deploy via claude-ops (README), confirm upload 200 and exit 0.
94. Check the story live on /en/, /es/, /id/ and on mobile.
95. Confirm IndexNow returned 200/202 in out/tst_deploy.txt.
96. Add the story to the weekly newsletter queue (when the newsletter exists).
97. Post-worthy stories: note a one-line social post in the commit message for later use.
98. Log what was published in the coordination file (claude-ops coord).
99. If the deploy fails, retry once, then leave the story committed and report it.
100. Once a week, update one older story or guide with new facts ("updated" date) instead of only writing new ones.

## Newsletter and alerts (10 Nov 2026)
- The Sunday newsletter "Sumba this week" is built automatically from the week's briefs (newsletter.py -> /nl/<lang>/latest.json and the public archive /LANG/newsletter/<year>-w<week>/). The Sunday 06:41 WITA build must be deployed before 07:00 WITA: that is the edition that gets sent.
- To email an alert to subscribers of a topic, add `"alert": "pasola"` (or travel, culture, business, surf) to the story. Use it only for real news that subscribers asked for (Pasola dates confirmed, a new flight, a ferry suspended). The alert goes out once, within the hour, for 5 days after the story date.
- Dek = the email preview line. Write deks that make sense on their own.
