# WhatsApp Channel and Telegram channel for The Sumba Times

Prepared on 10 November 2026. Nothing has been created or posted: Carlos creates the channels and posts from his own phone. Menu names change between app versions; if a label is slightly different, look for the nearest equivalent. No phone number is shown to followers on either platform if you follow the steps below.

## 1. WhatsApp Channel (about 10 minutes)

A Channel is a one-way broadcast: followers cannot reply, they do not see each other, and they do not see the admin's number.

1. Update WhatsApp (or WhatsApp Business) on the phone that will manage the channel.
2. Open the **Updates** tab (where Status is).
3. Next to "Channels", tap **+** and then **Create channel**. Accept the channel guidelines.
4. **Name:** `The Sumba Times`.
5. **Icon:** the square icon from the site (https://thesumbatimes.com/apple-touch-icon.png). Download it to the phone first.
6. **Description:** paste one of the texts in section 3 (the language you will post in most; English if in doubt).
7. Tap **Create channel**.
8. Open the channel, tap its name, then **Copy link** (it looks like `https://whatsapp.com/channel/...`). Keep that link: it is what goes on the site, in the newsletter and on the QR posters.
9. In the channel settings, check **Reactions** (allow emoji only) and add a second admin if someone else will post (Channel info, **Invite admins**). Admins need the channel followed first.
10. Post the first message (section 4) before sharing the link, so new followers do not arrive at an empty channel.

One channel or three? Start with **one channel in English**. If Indonesian readers are a clear share of followers after a month, open a second channel "The Sumba Times (Bahasa Indonesia)". A channel that mixes three languages loses followers in all three.

## 2. Telegram channel (about 10 minutes)

1. Open Telegram, tap the pencil (new message) and choose **New Channel**.
2. **Name:** `The Sumba Times`. **Description:** from section 3. Add the same icon.
3. Channel type: **Public**. Public link: try `thesumbatimes` (the link will be `t.me/thesumbatimes`). If it is taken, try `sumbatimes` or `thesumbatimes_news`. Write down which one you got.
4. Skip "add subscribers" (do not add people who did not ask).
5. Open the channel, tap its name, **Edit**:
   - **Discussion:** leave off for now (no comments to moderate).
   - **Sign messages:** off, so posts show the channel name only.
   - **Reactions:** on, a few emoji only.
6. Privacy check on your own account: Settings, Privacy and Security, **Phone number**: "Who can see my phone number: Nobody". The channel itself never shows the owner's number.
7. Post the first message (section 4) and pin it.
8. For three languages on Telegram, separate channels work better than one (`thesumbatimes`, `thesumbatimes_es`, `thesumbatimes_id`), but start with English only.

## 3. Channel descriptions

**English**
> The Sumba Times: news from the island of Sumba, Indonesia, every morning. Flights, ferries, weather, roads, culture and travel notes, each with its sources. One or two messages a day. Published by Eco Beach City. thesumbatimes.com

**Español**
> The Sumba Times: las noticias de la isla de Sumba (Indonesia), cada mañana. Vuelos, ferris, tiempo, carreteras, cultura y notas de viaje, siempre con sus fuentes. Uno o dos mensajes al día. Publicado por Eco Beach City. thesumbatimes.com

**Bahasa Indonesia**
> The Sumba Times: berita dari Pulau Sumba setiap pagi. Penerbangan, feri, cuaca, jalan, budaya, dan catatan perjalanan, semuanya bersumber jelas. Satu atau dua pesan sehari. Diterbitkan oleh Eco Beach City. thesumbatimes.com

Short version for places with a tight character limit:
- EN: `Sumba news every morning: flights, weather, culture, travel. thesumbatimes.com`
- ES: `Noticias de Sumba cada mañana: vuelos, tiempo, cultura y viajes. thesumbatimes.com`
- ID: `Berita Sumba setiap pagi: penerbangan, cuaca, budaya, wisata. thesumbatimes.com`

## 4. Daily message format

One message per story, after the morning edition is live (06:00 WITA, so any time from 06:15). Three parts, nothing else:

```
*Headline of the story*
One line with the single most useful fact (a number, a date or what changes for travellers).
https://thesumbatimes.com/en/SECTION/SLUG/?utm_source=whatsapp&utm_medium=channel
```

Rules:
- The headline is the site's headline, in bold (`*text*` in WhatsApp, `**text**` in Telegram).
- The one line is the first sentence of the story's "Quick answer" box, shortened if needed. Do not write a new claim that is not in the story.
- The link is the last line, alone, so the preview card appears. Use `utm_source=whatsapp` on WhatsApp and `utm_source=telegram` on Telegram, always with `utm_medium=channel`.
- No hashtags, no emoji in the headline, no "good morning". Maximum two messages a day. On a day with a correction, post the correction too.
- Copy the URL from the browser on the live story: never type a slug by hand.

Example (real story and real URL, 10 November 2026):

```
*Waingapu fuel queues persist as Sumba police return 202 bikes*
Queues continued at Waingapu petrol stations on Monday 9 November; officials say quotas are safe and there is no scarcity.
https://thesumbatimes.com/en/living/waingapu-fuel-queues-continue-202-motorbikes-seized/?utm_source=whatsapp&utm_medium=channel
```

The one line here is shortened from that story's quick answer.

First message for a new channel:

- EN: `Welcome to The Sumba Times channel. Every morning: the news from Sumba that matters if you live here, love the island or are planning a trip. Start here: https://thesumbatimes.com/en/plan/?utm_source=whatsapp&utm_medium=channel`
- ES: `Te damos la bienvenida al canal de The Sumba Times. Cada mañana, las noticias de Sumba que importan si vives aquí, te gusta la isla o preparas un viaje. Empieza por aquí: https://thesumbatimes.com/es/plan/?utm_source=whatsapp&utm_medium=channel`
- ID: `Selamat datang di saluran The Sumba Times. Setiap pagi: berita dari Sumba yang penting bagi Anda yang tinggal di sini, mencintai pulau ini, atau sedang merencanakan perjalanan. Mulai dari sini: https://thesumbatimes.com/id/plan/?utm_source=whatsapp&utm_medium=channel`

(Replace `whatsapp` with `telegram` in the Telegram version.)

## 5. What can be automated later, and what cannot

**Telegram: yes, fully.** The Telegram Bot API allows a bot to post to a channel.
1. In Telegram, talk to `@BotFather`, send `/newbot`, choose a name and a username ending in `bot`. BotFather returns a token. Treat it like a password: it goes in a secret, never in the repository.
2. Add the bot to the channel as an **administrator** with only the "Post messages" permission.
3. A script then calls `https://api.telegram.org/bot<TOKEN>/sendMessage` with `chat_id=@thesumbatimes`, the text and `parse_mode=HTML`.
4. The natural place for it is the deploy job: after a successful deploy, read `/en/feed.xml`, and post any item whose link has not been posted yet (keep the list of posted links in a small file or KV key). That is a small follow-up task; it has not been built.

**WhatsApp Channels: no.** WhatsApp offers no public API to post to a Channel for this use. The WhatsApp Business Platform (Cloud API) sends messages to individual users who opted in, with approved templates and per-conversation fees; it does not post to Channels. Channel updates have to be posted by an admin from the app (phone, WhatsApp Web or desktop). Third-party tools that claim to automate Channel posting do it by driving a logged-in session, which breaks WhatsApp's terms and can get the number banned: do not use them. This reflects how the products worked up to this writing and was not re-checked on Meta's site on 10 November 2026; look at the WhatsApp Channels help page before deciding to build anything.

**The practical routine for WhatsApp:** once Telegram is automated, the Telegram post is the ready-made text. Each morning, forward or copy it into the WhatsApp Channel and change `telegram` to `whatsapp` in the link. It takes under a minute from WhatsApp Web.

## 6. Where to put the links once the channels exist

- The site footer and the newsletter welcome page (needs a small change in build.py and newsletter.py: a job for a later session).
- The QR poster: a second poster could point straight to the WhatsApp Channel link.
- The Instagram bio link list and the Facebook page "About" section.
- Tell the main session the two links so they are stored with the project notes.
