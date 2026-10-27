# R19 text review

Output: `/home/claude/sn/qa/r19_text.json`. Template not touched. Values are decoded text; escape `'` (bm `b'a`, tr `SupportNear'ı`, etc.) when inserting into single-quoted JS keys.

## Task 1: faq.a8 (funding)

New `faq.a8` written for all 20 languages from the EN/ES targets. Kept the true parts of the old answer (cheap to run, no servers full of personal data, no ads, no sales team, never paid for by selling user data). Removed "public grants, foundations and private donations" and also "run as a non-profit project" (the EN target drops it). Reused each language's existing wording for the parts that were kept. "Carlos de Ory" stays in Latin script in every language, the same as "SupportNear".

### Other keys checked for funding claims (`other_keys` is empty)
I grepped all 20 tables for grant/donation/foundation/funding/non-profit terms in each language (subvenc, fondation, dons, пожертв, грант, منح, تبرع, عطیات, bolomafara, ወፈያ, بسپن, deeq, ልገሳ, bağış/hibe, অনুদান, 捐/拨款/基金, etc.). Apart from faq.a8, no key says the project is funded by grants, donations or foundations.
- `foot.tag` ("A non-profit project…", 20 langs): left unchanged. /about itself says "SupportNear is a non-profit project" / "proyecto sin ánimo de lucro", so the two agree. **Owner decision:** if "non-profit" could be read as "registered non-profit organisation", reword it.
- `orgs.kicker` ("For councils, NGOs and funders"), `orgs.cta2` ("Fund or partner with us"; bn "অনুদান দাও…"): these ask for funding but don't claim it exists. Left unchanged.
- `faq.a4`, `what.p`, `ui.note`, `note.p`, `lang.p`: "volunteers/charities" there means who maintains OpenStreetMap data. That is not about funding. Left unchanged.

## Task 2: privacy copy review (wo, bm, ti, ps, so, am)

Back-translations are literal. "OK" means no meaning error, missing part or grammar problem worth changing.

### Wolof (wo): 2 keys changed
- **wel.locp**: "Only to look for help near you is it used. We will never store it; public map servers receive it to show the places, the weather and walking routes." OK.
- **hero.m1**: "We will never store where you are." OK.
- **faq.a3** (CHANGED): "We never store where you are, and we don't link it with any name or account. To show you places, weather and walking routes, the app must ask public servers *where you are*: OpenStreetMap's Overpass servers, Open-Meteo and, if you ask for the way, *the server of roads of OpenStreetMap*. They receive where you are like any map app's request. If you don't want to show it, write a street or station name and don't use your location."
  - Reasons: (1) "laaj serwëer … fi nga nekk" reads as asking the servers *where you are*, not asking *about* your area. Changed to "lan moo nekk fi nga nekk" (what is where you are). (2) "serwëer bu yoon yu OpenStreetMap" mixes bu/yu and is garbled. Changed to "serwëer bu OpenStreetMap biy wone yoon wi" (OSM server that shows the route). (3) Added "mukk" (never) to "never linked".
- **priv.2** (CHANGED): items 1, 3 and 4 are OK. Item 2 ends "…te dara benn su sa navigateur laajee ñu bañ la topp" = "and nothing one if your browser asks we not follow you". The phrase "dara benn" is ungrammatical and has no verb. Changed to "te su sa navigateur laajee ñu bañ la topp, dunu waññ dara" (= and if your browser asks not to be tracked, we count nothing). HTML unchanged.
- **note.priv**: "It will be sent and we won't add your name. Only the place on the map and what you wrote. What is written on OpenStreetMap, everyone can see it." OK.

### Bambara (bm): 2 keys changed
- **wel.locp**: "Only to get help near you. We never keep it; public map servers get it to show places, weather and travel (walking) routes." OK. "taama sira" is the app's existing term for walking route (plan.route).
- **hero.m1**: "We never keep your place." OK.
- **faq.a3** (CHANGED): "We never keep your place, and we don't tie it to any name or account. To show you places, weather and routes, the app must ask public servers *the place where you are*: … OpenStreetMap's route server. They get your place like any map app's request. If you don't want to give it, use a street or station name instead of your place."
  - Reason: same ambiguity as wo ("ask servers where you are"). Changed to "ka i ka yɔrɔ ci foroba sɛrivɛriw ma k'u ɲininka fɛn minnu bɛ yen" (send your place to public servers to ask them what is there).
- **priv.2** (CHANGED): (1) Item 3's bold "I ka yɔrɔ bɛ baara dɔrɔn walasa ka dɛmɛ ɲini" = "your place *works* only to look for help", which is unnatural. Changed to "An bɛ baara kɛ ni i ka yɔrɔ ye dɛmɛ ɲinini dɔrɔn de kama" (we use your place only for finding help), the same "baara kɛ ni … ye" as wel.loc. (2) Item 2 ends "wa foyi tɛ, n'i ka navigatɛri b'a ɲini ko a kana tugu i kɔ" = "and there is nothing, if your browser asks that *it* not follow you". The subject is ambiguous and nothing says we count nothing. Changed to "wa n'i ka navigatɛri b'a ɲini ko mɔgɔ kana tugu i kɔ, an tɛ foyi jate". HTML unchanged.
- **note.priv**: "It is sent, your name is not in it. Only this place on the map and what you wrote. Notes on OpenStreetMap, everyone can see them." OK.

### Tigrinya (ti): 2 keys changed
- **wel.locp**: "Only to find help near you. We never keep it; public map servers receive it to show places, weather and routes on foot." OK.
- **hero.m1**: "We never keep your location." OK.
- **faq.a3** (CHANGED): "We never keep your location, nor do we link it with name or account. To show places, weather and walking routes, the app has to ask public servers about the place you are in: OpenStreetMap's Overpass servers, Open-Meteo, and if you asked for directions, *OpenStreetMap's server road*. Like a request from any map app, they receive your location. If you don't want to share it, write a street or station name instead of using your location."
  - Reason: "ናይ OpenStreetMap ሰርቨር መንገዲ" reads "OSM server road", which garbles the routing server. Changed to "ሰርቨር መምርሒ መንገዲ" (route-guidance server).
- **priv.2** (CHANGED): (1) Item 1 "መንነት የለን" = "no identity" where EN means an ID document. Changed to "መንነት ወረቐት የለን" (no ID card). (2) Item 2 ends "ብራውዘርካ ከይክታተልዎ እንተ ሓቲቱ ድማ ፈጺሙ ዋላ ሓንቲ የለን" = "if your browser asks that they not track *it (him)*, there is nothing at all". The object is wrong and the clause has no verb for counting. Changed to "ብራውዘርካ ምክትታል ከይግበር እንተ ሓቲቱ ድማ ዋላ ሓንቲ ኣይንቖጽርን" (if your browser asks that no tracking be done, we count nothing at all). Items 3 and 4 are OK. HTML unchanged.
- **note.priv**: "It is sent without your name. Only the point on the map and what you wrote. Notes written on OpenStreetMap are visible to everyone." OK.

### Pashto (ps): 1 key changed
- **wel.locp**: "Only for finding help around you. We never keep it; public map servers receive it so they show places, weather and walking routes." OK.
- **hero.m1**: "We never keep your location." OK.
- **faq.a3** (CHANGED): "We never keep your location and don't tie it to any name or account. To show places, weather and walking routes, the app must ask public servers about the place you are in: OSM's Overpass servers, Open-Meteo and, if you want a route, OSM's routes server. They receive your location just like *any map-app request*. If you don't want to share it, write a street or station name instead of using your location."
  - Reason: "د هر نقشه اپ" is missing the genitive inflection (نقشې). Changed to "لکه د نقشې د هر بل اپ غوښتنه" (like a request from any other map app). This is a small grammar fix; the meaning was already right.
- **priv.2**: "Never an account. No name, no email, no phone number, no ID card. / No cookies, no tracking. We only count anonymously: a visit, the language, the city and what was searched and not found. No IP address, no device identifier, nothing that says who you are; and if your browser asks not to be tracked, then nothing at all. / Your location is used only to find help. We never keep it. … your browser sends it to public servers — OSM (Overpass and routes) and Open-Meteo — like any map, without name and account. / Nothing is kept on our side. Your latest results are kept in your own browser so the app works if your signal goes. Clearing browser data removes them." OK.
- **note.priv**: "Sent without your name. Only that point on the map and what you wrote. Notes in OpenStreetMap are public." OK.

### Somali (so): no changes
- **wel.locp**: "Only so that help near you is found for you. We never store [it]; the public servers of maps receive [it] so they show places, weather and walking roads." OK (Somali drops the object pronoun; "waddooyinka lugta" is the app's existing term).
- **hero.m1**: "We never store your location." OK.
- **faq.a3**: "We never store your location, and we don't link it to a name or account. To show you places, weather and walking routes, the app must ask public servers something about the place you are: OSM's Overpass servers, Open-Meteo and, if you ask for directions, OSM's roads server. They receive your location the way they receive any map app's request. If you don't want to share, write a street or station instead of using your location." OK.
- **priv.2**: "Account doesn't exist, ever. No name, no email, no phone number, no ID. / No cookies, no tracking. We only count without a name: a visit, the language, the city and what was searched and not found. No IP address, no device ID, nothing saying who you are; nothing at all if your browser asks not to be tracked. / Your location is used only so help is found. We never store it. … your browser sends it to public servers — OSM (Overpass and roads) and Open-Meteo — like any map, without name and account. / Nothing is stored on our side. Your recent results are kept in your browser so the app works even if the network drops. Deleting your browser data deletes [them]." OK; HTML intact.
- **note.priv**: "It is sent without your name. Only the map point and what you wrote. OpenStreetMap notes are public." OK.

### Amharic (am): no changes
- **wel.locp**: "It is only to get help near you. We never store it; public map servers receive it to show places, weather and walking routes." OK.
- **hero.m1**: "We never store the place where you are." OK.
- **faq.a3**: "We never store the place you are; we also don't link it with a name or account. To show places, weather and walking routes, the app must ask public servers about where you are: OSM's Overpass servers, Open-Meteo and, if you ask for directions, OSM's road server. They receive your location like any map app's request. If you don't want to share, write a street or station name instead of using your location." OK.
- **priv.2**: "No account, ever. No name, no email, no phone number, no ID. / No cookie, no tracking. We count only anonymously: one visit, the language, the city and what was searched and not found. No IP address, no device identifier, nothing that says who you are; and if your browser asks not to be tracked, we count nothing. / Your location serves only to look for help. We never store it. … your browser sends it to public servers — OSM (Overpass and roads) and Open-Meteo — like any map, without name and account. / Nothing is stored on our side. Your recent results are stored in your own browser so the app works even if the network is lost. Clearing your browser data erases them." OK; HTML intact.
- **note.priv**: "It is sent without your name. Only the point on the map and what you wrote. Notes on OpenStreetMap are visible to everyone." OK.

## Uncertain / for a native check
- The weakest spots are the corrections in bm and wo (fewer reference texts). The ti verb form "ከይግበር" and the bm phrasing "an tɛ foyi jate" are the ones most worth a native read.
- In the new faq.a8: the so word for sponsors ("kafaala-qaadayaal") and the fa word for grants ("کمک بلاعوض") are reasonable, but a native speaker may prefer other terms.
