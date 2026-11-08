# Kolaboro X-ray: store listing (Chrome Web Store and Microsoft Edge Add-ons)

Version 2.1.0 (8 Nov 2026): adds the payment email check on Gmail web. Not submitted yet.

Everything below is ready to paste. Upload file: the zip from `./build.sh` (the same file served at https://kolaboro.com/extension/kolaboro-extension.zip).

## Item
- Name (from manifest, localised in 8 languages): Kolaboro X-ray: check off-plan projects
- Summary (132 max, from manifest): On property portals and developer sites, shows what Kolaboro's records say and runs a free X-ray of public sources.
- Category: Tools (Edge: Productivity)
- Language: English (the manifest also carries es, de, fr, nl, ru, zh_CN, ar; the store picks them up automatically)
- Homepage URL: https://kolaboro.com/extension/
- Support URL: https://kolaboro.com/corrections/
- Privacy policy URL: https://kolaboro.com/extension/#privacy
- Mature content: No

## Description (paste as is)
Buying off-plan property abroad? Kolaboro X-ray shows you what is on the public record about a project before you pay a deposit.

On Property Finder, Bayut, idealista, Fotocasa, Rightmove and Zillow, a small panel appears when the listing is a project or developer in Kolaboro's records: the project's name and developer, where it is, its stage at our last check, the handover date the developer promised, and when we last checked. Each one links to the project's full public page on kolaboro.com, where every fact carries its source. Projects we have not yet reviewed show facts only, never a score.

On any other website, such as a developer's or an agent's page, click the Kolaboro icon to get the same answer for the tab you are on.

In Gmail on the web, when an email you open mentions a payment or bank details, a small panel shows what you can check before you pay: whether the sender's address is the developer website we hold or a lookalike (one letter changed, another ending, extra words), a free email account, Reply-To, mailed-by and signed-by on another domain (when you open Gmail's details arrow), wording used in payment-diversion emails ("our bank details have changed", "do not use the old account"), and how old the sender's domain is. It always ends with the same advice: call the developer on a number from its official website before paying. A link opens the full check at kolaboro.com/tools/payment-email-check/ for all the headers.

Press "Run the X-ray" and Kolaboro checks the page's address against free public sources while you watch: official registers, domain registration and security certificate history, the Internet Archive, where the website is hosted, the address and satellite view, images reused from other projects, market base rates and buyer protection law. Each check says Found, Not found or Not published, with its source. The result is sealed with a SHA-256 fingerprint so it cannot be changed later.

Private by design:
- The page address and title never leave your browser for the lookup. They are hashed on your device and only the first 4 characters of each hash are sent, so our server answers with a bucket of records and the match is made on your device.
- The page address is sent to kolaboro.com only when you press "Run the X-ray".
- No analytics, no cookies, no identifiers, nothing stored. No access to your browsing history.
- In Gmail, the email's text is read in your browser and never sent. Only the sender's domain (for example example.com) is sent to kolaboro.com, to read its public DNS and registration date. Emails that do not mention a payment are ignored.
- It runs on the six portals above, on Gmail web (mail.google.com) and, only when you click the icon, on the tab you are on.

Free. No account. Interface in English, Español, Deutsch, Français, Nederlands, Русский, 中文 and العربية.

Kolaboro provides information from public sources, not legal or financial advice.

## Graphics (in this folder)
- Store icon 128x128: ../icons/icon128.png
- Screenshots 1280x800 (PNG, no transparency): screenshot-1-portal-panel.png, screenshot-2-xray.png, screenshot-3-any-site.png, screenshot-4-honest.png
- Small promo tile 440x280: promo-small-440x280.png
- Marquee 1400x560 (optional): promo-marquee-1400x560.png

## Privacy practices tab
- Single purpose: Show what Kolaboro's public records say about the off-plan property project or developer on the page the user is viewing, and on request run a check of that page against public sources.
- Permission justification, activeTab: Lets the toolbar popup read the address and title of the current tab only when the user clicks the icon, to look the project up in Kolaboro's records (hashed on the device) and, if the user asks, to run the X-ray of that address.
- Permission justification, host permissions (idealista.com, idealista.pt, idealista.it, fotocasa.es, propertyfinder.ae/.bh/.eg/.qa/.sa, bayut.com/.sa/.eg, rightmove.co.uk, zillow.com): A content script on these property portals hashes the listing's address, main heading and title on the device and shows the Kolaboro panel when the listing matches a project in Kolaboro's records. It changes nothing else on the page.
- Permission justification, host permission mail.google.com: A content script on Gmail web reads the sender address, the body text and, if the user opens them, the Reply-To, mailed-by and signed-by details of the open email, only to show the payment email panel when the email mentions a payment or bank details. The text is processed on the device. Only the sender's domain name is sent to kolaboro.com to read its public DNS records and registration date. It does not read other emails, the inbox list, contacts or attachments, and it never sends, deletes or changes email.
- Remote code: No. All code is in the package. The extension only fetches JSON and an event stream from https://kolaboro.com.
- Data usage: tick "Website content" with the note: "Only when the user presses Run the X-ray, the address of the current page is sent to kolaboro.com to run the check. For the automatic lookup only 4-character fragments of SHA-256 hashes are sent. In Gmail, the sender's email domain (not the address, not the text) is sent to kolaboro.com to read its public DNS and registration date." Also tick "Personal communications" with the note: "The open email's sender, text and visible headers are read on the device to show the payment check; they are not transmitted, stored or logged." Do not tick any other category.
- Certify: does not sell or transfer data to third parties outside the approved use cases; does not use or transfer data for purposes unrelated to the single purpose; does not use or transfer data to determine creditworthiness or for lending.

## Test instructions for the reviewer
No account is needed. Open https://www.propertyfinder.ae/en/new-projects/samana-developers/samana-ocean-crest : the panel appears in the bottom corner with the project's record. Press "Run the X-ray" to see the live checks. On any other site, for example https://www.teus-group.com/amani-melasti , click the toolbar icon. Gmail: send yourself an email whose text says "Our bank details have changed, please pay the deposit to the new account"; open it in Gmail on the web and the payment email panel appears in the bottom corner. Press the small arrow under the sender in Gmail to include Reply-To, mailed-by and signed-by.

## Microsoft Edge Add-ons
Same zip, same text and images. Edge asks for: name, description, category (Productivity), privacy policy URL, website URL, support contact, screenshots (1280x800), small promotional tile (440x280), and testing notes (use the reviewer text above).
