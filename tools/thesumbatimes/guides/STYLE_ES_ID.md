# Style guide for the Spanish and Indonesian editions of The Sumba Times (copy-edit pass, 8 Nov 2026)

The publisher complained, rightly, that the Spanish reads like a machine translation. Example of what is WRONG:
  "El Niño muy fuerte retrasa a diciembre las lluvias en casi todo NTT"  (calque of "A very strong El Niño delays...")
Good Spanish newspaper versions:
  "Un El Niño intenso retrasa hasta diciembre las lluvias en casi toda NTT"
  "El fenómeno de El Niño retrasa a diciembre la llegada de las lluvias a Nusa Tenggara Oriental"
The test: would El País, La Vanguardia, BBC Mundo or El Mundo publish this sentence exactly like this? For Indonesian: would Kompas or Tempo?

## Spanish rules (neutral international Spanish, newspaper register)
- Rewrite, do not translate word by word. Keep every fact, number, date, name, quote meaning, link and source; you may reorder clauses and change syntax freely.
- Headlines: present tense, concise, no articles where a Spanish headline would drop them only if natural; sentence case (only the first word and proper nouns capitalized: "La policía refuerza los controles", never "La Policía Refuerza Los Controles"). No calques like "muy fuerte", "en orden a", "basado en", "a ser", "es por eso que", "jugar un rol", "aplicar para", "en base a", "remover", "reportar" (use "informar"), "evento" for "acontecimiento", "eventualmente" meaning "finalmente", "agresivo" meaning "ambicioso", "masivo" meaning "enorme", "actualmente" overuse, gerundio de posterioridad ("llegó a Waingapu, siendo recibido..."), passive voice abuse ("fue anunciado por" → "anunció").
- Proper names and Indonesian terms: El Niño (always with article handled naturally: "el fenómeno de El Niño", "un El Niño intenso"); BMKG explained once as "la agencia meteorológica indonesia (BMKG)"; Nusa Tenggara Oriental (NTT) as province name in Spanish, Sumba Oriental / Sumba Occidental / Sumba Suroccidental / Sumba Central; "regencia" for kabupaten; Waingapu, Tambolaka, Waikabubak unchanged; Pertamina; ASDP; "rupias" for IDR in prose ("2,4 millones de rupias (unos 120 euros)").
- Numbers: Spanish format (2.500 kilolitros, 41.524 visitantes, 6,1 de magnitud; 24 horas; 06:00 WITA). Dates: "8 de noviembre de 2026", days lowercase ("viernes").
- Quotes: Spanish quotation marks are fine as «...» or "..."; be consistent within a text (use "..." to match the site).
- Avoid repetition of "Sumba" in every sentence; use "la isla", "la regencia".
- Accents and ñ always correct; ¿? and ¡! always paired.
- Section labels and UI words must be natural: "Noticia principal", "Última hora", "Breves", "Leer más", "Planifica tu viaje".

## Indonesian rules (bahasa baku, newspaper register like Kompas)
- Natural Indonesian word order and vocabulary, not translated English. Use "Kabupaten Sumba Timur", "Nusa Tenggara Timur (NTT)", "BMKG" (explain once as "Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)"), "El Nino" (Indonesian media write "El Nino" without tilde), "musim hujan", "kemarau".
- Headlines Kompas style: capitalize as Indonesian news does (Kompas uses title-like capitalization of main words; be consistent within the site: capitalize first word and proper nouns only is also acceptable, but be consistent in your file).
- Numbers: 2.500 kiloliter, Rp 2,4 juta, pukul 06.00 WITA, 8 November 2026.
- Avoid stiff calques ("melakukan" overuse, "di mana" as relative pronoun, "yang mana"), prefer active voice.

## Process for each text
1. Read the English and the target-language version side by side.
2. Rewrite every sentence that a professional editor would change. Fix grammar, accents, number formats, false friends, capitalization.
3. Keep HTML tags, links (href unchanged), the order of sections and the facts. Do not add facts. Do not remove facts.
4. Never use em dashes or en dashes (—, –). Use commas, colons or parentheses.
5. Keep valid Python: escape quotes correctly; run python3 -c "import ast;ast.parse(open(FILE).read())" after editing.
6. Do not change slugs or "slugs" (URLs), keys, images or sources.
