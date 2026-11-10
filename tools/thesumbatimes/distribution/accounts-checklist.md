# Accounts checklist: the things only Carlos can do

Prepared on 10 November 2026. Each item needs a login, a phone confirmation or a DNS change that cannot be done from a build session. Order matters: do 1 to 4 first. The DNS for thesumbatimes.com is in Cloudflare (Websites, thesumbatimes.com, DNS, Records), so every "add a TXT/CNAME record" step happens there. Menu names on these services change; where a label differs, look for the nearest equivalent. Steps marked (not re-checked) were written from how the service worked up to this year and were not opened on 10 November 2026.

When each one is done, tell the main session the handle or link you got, so it is saved with the project.

## 1. Google Search Console (15 minutes)

- [ ] Go to https://search.google.com/search-console and sign in with the Google account that should own the site.
- [ ] **Add property**, choose **Domain** (left box), type `thesumbatimes.com` (no https, no www). A Domain property covers www, non-www and all three language folders.
- [ ] Google shows a TXT record starting with `google-site-verification=`. Copy it.
- [ ] In Cloudflare DNS: **Add record**, Type `TXT`, Name `@`, Content = the copied text, TTL Auto, Save.
- [ ] Back in Search Console, **Verify**. If it fails, wait five minutes and retry.
- [ ] Left menu, **Sitemaps**. Add, one at a time: `https://thesumbatimes.com/sitemap.xml`, then `https://thesumbatimes.com/news-sitemap.xml`, then `https://thesumbatimes.com/image-sitemap.xml`. Each should show "Success" within a day.
- [ ] **Settings, Users and permissions**: add a second owner address as a backup.
- [ ] After a week, look at **Pages** (indexing problems) and **Performance, Search results** with the filter Page containing `/es/` or `/id/` to see each language.

## 2. Bing Webmaster Tools (5 minutes)

- [ ] Go to https://www.bing.com/webmasters and sign in (a Microsoft or Google account works).
- [ ] Choose **Import from Google Search Console**, allow access, tick `thesumbatimes.com`, Import. This copies the verification and the sitemaps.
- [ ] Open **Sitemaps** and confirm the three sitemaps are listed; add any that are missing.
- [ ] Nothing to do for IndexNow: the site already pings it on every deploy.
- [ ] Bing data also feeds Copilot and other assistants' search, so this step is worth more than its size suggests.

## 3. Google News: Publisher Center (10 minutes, not re-checked)

- [ ] Go to https://publishercenter.google.com with the same Google account as Search Console.
- [ ] If **Add publication** is offered: name `The Sumba Times`, URL `https://thesumbatimes.com`, country Indonesia, primary language English. Then add the sections with their RSS feeds: `https://thesumbatimes.com/en/feed.xml`, and create separate publications or language editions for `/es/feed.xml` and `/id/feed.xml` if the tool asks for one language per publication. Upload the square icon and submit for review.
- [ ] If the option is not there: Google has been moving to automatically generated publication pages and, as far as we know, stopped accepting manually added publications. In that case there is nothing to submit. What counts is already in place: the news sitemap (step 1), visible dates and bylines, an About page with the publisher and standards, and original reporting. Confirm on Google's "Publisher Center help" page which of the two cases applies now.
- [ ] Either way, read Google News content policies once (transparency about ownership is the one that matters for us; the site already states the publisher on every page).

## 4. Brevo: authenticate thesumbatimes.com as sender domain (20 minutes)

Needed so the Sunday newsletter and the welcome emails reach inboxes; Gmail and Yahoo reject or junk bulk mail from domains without DKIM and DMARC.

- [ ] In Brevo: click the account name (top right), **Senders, Domains & Dedicated IPs**, tab **Domains**, **Add a domain**, type `thesumbatimes.com`, choose to authenticate it yourself (manual DNS).
- [ ] Brevo shows the records to create. Copy the exact values from that screen; the shapes are:
  - **Brevo code:** TXT, Name `@`, Content `brevo-code:...`
  - **DKIM:** either two CNAME records (`brevo1._domainkey` and `brevo2._domainkey`, pointing to hosts ending in `dkim.brevo.com`) or one TXT at `mail._domainkey` with a long `k=rsa;p=...` key, depending on what your account shows.
  - **DMARC:** TXT, Name `_dmarc`, Content starting `v=DMARC1; p=none; rua=mailto:...`
- [ ] Add each one in Cloudflare DNS. For the CNAME records set **Proxy status: DNS only** (grey cloud), otherwise DKIM fails.
- [ ] **SPF.** A domain may have only one SPF record. Look in Cloudflare for an existing TXT at `@` starting with `v=spf1`.
  - If there is none: add TXT, Name `@`, Content `v=spf1 include:spf.brevo.com ~all`.
  - If there is one: edit it and insert `include:spf.brevo.com` before the final `~all` or `-all`. Do not create a second SPF record.
  - Brevo may say SPF is optional on shared sending IPs; adding the include does no harm and helps alignment if you later get a dedicated IP.
- [ ] Back in Brevo, **Authenticate this email domain**. All lines should turn green (DNS can take up to an hour).
- [ ] **Senders** tab: add the sender address at the domain that the newsletter function uses (for example `newsletter@thesumbatimes.com`) and confirm it. If that mailbox does not exist, set up Cloudflare Email Routing to forward it to your inbox first, because Brevo sends a confirmation email and readers will reply to it.
- [ ] Send a test to a Gmail address, open the message, three dots, **Show original**: SPF, DKIM and DMARC must all say PASS.
- [ ] After two clean weeks, change the DMARC policy from `p=none` to `p=quarantine`.

## 5. Pinterest business account and website claim (15 minutes)

- [ ] Create or convert an account at https://business.pinterest.com (free). Name `The Sumba Times`, username `thesumbatimes` if free, website `https://thesumbatimes.com`, category Travel or Media.
- [ ] **Settings, Claimed accounts, Websites, Claim.** Choose the **TXT record** option (no change to the site needed), copy the `pinterest-site-verification=...` value, add it in Cloudflare as TXT with Name `@`, then press Verify in Pinterest. It can take up to 72 hours.
- [ ] Create the boards used by the CSV, exactly with these names (or let the bulk upload create them): `Sumba travel guide`, `Sumba: guía de viaje`, `Panduan wisata Sumba`, each with a section for places (`Places in Sumba`, `Lugares de Sumba`, `Tempat wisata di Sumba`).
- [ ] Bulk upload: on the web, **Create, Create Pins in bulk** (wording varies), upload `distribution/pinterest-pins-en.csv` first (41 Pins on 10 November 2026; the script prints the current count). Before the first upload, download Pinterest's own template from that screen and compare its header row with ours; if a column name differs, tell the main session and the script will be adjusted. Then the Spanish and Indonesian files on later days. Limit: 200 Pins per upload.
- [ ] Check five of the created Pins: image shown, link opens the right page, language matches the board.

## 6. Handles on Instagram, TikTok and YouTube (20 minutes)

Reserve the same handle everywhere, even if you will not post yet: `thesumbatimes` (fallbacks: `sumbatimes`, `thesumbatimes.news`).

- [ ] **Instagram:** create the account, switch to a Professional account (category: News & media website), name `The Sumba Times`, bio from the lines below, link `https://thesumbatimes.com/en/plan/?utm_source=instagram&utm_medium=social&utm_campaign=bio`. Link it to a Facebook Page of the same name (create the Page if needed; the Facebook queue uses it).
- [ ] **TikTok:** create the account, switch to a Business account, same name and bio, link `https://thesumbatimes.com/en/plan/?utm_source=tiktok&utm_medium=social&utm_campaign=bio` (the link field may need the business account or a minimum number of followers).
- [ ] **YouTube:** create a channel named `The Sumba Times`, set the handle `@thesumbatimes`, add the site link and the description. No videos needed yet.
- [ ] Turn on two-step verification on all three and store the recovery codes.
- [ ] Bio lines:
  - EN: `News, culture and travel from the island of Sumba, Indonesia. New stories every morning.`
  - ES: `Noticias, cultura y viajes desde la isla de Sumba (Indonesia). Novedades cada mañana.`
  - ID: `Berita, budaya, dan perjalanan dari Pulau Sumba. Berita baru setiap pagi.`
- [ ] The 30 days of posts are in `distribution/social-queue.md`.

## 7. Flipboard magazine (10 minutes, not re-checked)

- [ ] Create a profile at https://flipboard.com named `The Sumba Times`, with the same icon and the English bio.
- [ ] **Create a magazine** called `Sumba: news and travel`, public, description from the bio.
- [ ] Add stories by pasting article URLs ("Flip" a link), starting with the evergreen guides: best time to visit, how to get there from Bali, the Pasola calendar, the facts page. Two or three a day for the first week, then each morning's story.
- [ ] Optional, later: Flipboard accepts publishers' RSS feeds through its publisher programme. Apply with `https://thesumbatimes.com/en/feed.xml` once the magazine has some content.

## 8. Feedly

- [ ] Nothing to do. Anyone can follow the site in Feedly or any reader with the RSS address: `https://thesumbatimes.com/en/feed.xml`, `/es/feed.xml` or `/id/feed.xml`. The pages already announce the feed, so readers find it by pasting the site address.

## 9. WhatsApp Channel and Telegram channel (20 minutes)

- [ ] Follow `distribution/whatsapp-telegram-channel.md`: create both, paste the description, post the first message, copy the two public links.
- [ ] Give the two links to the main session so they can be added to the footer, the newsletter and a second QR poster.

## 10. After everything

- [ ] One line per service in the project notes: account email used, handle or property, date. No passwords in the notes.
- [ ] Wire the press page (one line in build.py, see the press.py header) so `/en/press/`, `/es/press/` and `/id/press/` go live with the next deploy.
- [ ] Optional: Wikidata item (`distribution/wikidata-wikipedia.md`), Google Maps photos and QR posters (`distribution/google-maps-and-qr.md`), press releases (`distribution/press-release-template.md`), community answers (`distribution/community-answers.md`).
