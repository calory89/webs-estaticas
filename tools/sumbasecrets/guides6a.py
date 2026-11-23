# 23-nov-2026 · Batch 6, part 2: culture, nature and local data guides.
# Rules: English source, machine-translated at build time; no hotel names, no invented prices or people, no em dashes.
# Cultural facts are kept general and hedged where practice differs between villages and regencies.
import json
from guides4 import PL, GD, MAP, _km, _drive
from places import TOWNS as _T

_SV = json.load(open("osm_services.json"))["d"]
_TW = {t["s"]: (t["n"], t["ll"]) for t in _T}
def _near_town(ll):
    n, d = min(((v[0], _km(ll, v[1])) for v in _TW.values()), key=lambda x: x[1])
    return f"in {n}" if d < 4 else f"about {round(d)} km from {n}"
def _svc_list(kinds):
    rows = [x for x in _SV if x[0] in kinds]
    rows.sort(key=lambda x: (_near_town([x[1], x[2]]), x[3] or ""))
    return "<ul>" + "".join(f"<li>{x[3] or 'Unnamed'} ({_near_town([x[1], x[2]])})</li>" for x in rows) + "</ul>", len(rows)

GUIDES6A = [
# ---------------- culture ----------------
{"s": "why-sumba-sandalwood-island", "img": "mamboro-savanna",
 "t": "Why is Sumba called Sandalwood Island?",
 "d": "Where Sumba's old nickname comes from, what sandalwood and horses had to do with it, and why you still hear the name today.",
 "b": """<p>Old maps and travel books often call Sumba "Sandalwood Island", and the island's famous horses are still known as sandalwood ponies. The name says a lot about how outsiders saw Sumba for centuries: as a source of valuable goods rather than a place to visit.</p>
<h2>Sandalwood and the spice-era trade</h2><p>Fragrant sandalwood was one of the most valuable products of eastern Indonesia, sold to traders from China, India and later Europe for incense, medicine and carving. Historians note that neighbouring Timor was the main source of the trade, but the whole region, Sumba included, became linked with the wood in the minds of foreign sailors, and the nickname stuck in European writing.</p>
<h2>From wood to horses</h2><p>By the colonial period Sumba was better known for horses than for trees. Small, tough horses were raised on the island's grasslands and shipped to other islands, and they took the island's nickname with them: the "sandalwood pony". Horses still matter enormously in Sumba, from everyday transport in the hills to bride exchange and the """ + GD("pasola-guide", "Pasola") + """ festival. See """ + GD("sumba-horses", "the horses of Sumba") + """.</p>
<h2>Is there still sandalwood in Sumba?</h2><p>Wild sandalwood became scarce across the region after centuries of cutting. Replanting projects exist in East Nusa Tenggara, the province Sumba belongs to, but you are unlikely to see old sandalwood forest on a visit. What you will see are the open savannahs that replaced much of the original forest; read """ + GD("sumba-savanna", "why Sumba has savannah") + """.</p>
<h2>Other names you will hear</h2><ul><li><b>Sumba</b> is the island and also the name used by its people (orang Sumba).</li><li><b>Humba</b> is the local pronunciation in East Sumba.</li><li>The four regencies are West, Southwest, Central and East Sumba; see """ + GD("sumba-regencies", "the regencies") + """.</li></ul>""",
 "faq": [["Why is Sumba called Sandalwood Island?", "Because the region was known to foreign traders for sandalwood. Historians note Timor was the bigger source, but the nickname became attached to Sumba in European writing."],
         ["What is a sandalwood pony?", "The traditional name for the small, hardy horses bred in Sumba and exported to other islands."]]},
{"s": "betel-nut-sumba", "img": "ratenggaro",
 "t": "Betel nut in Sumba: what sirih pinang means and how to respond",
 "d": "Why you will be offered betel nut in Sumba, what is in it, what it means socially, and how to accept or politely decline.",
 "b": """<p>Visit a village in Sumba and one of the first things you will notice are red-stained smiles. Chewing betel, called <i>sirih pinang</i> in Indonesian, is part of daily life and of almost every social occasion on the island.</p>
<h2>What is in it</h2><ul><li><b>Pinang</b>: the areca nut, from a palm.</li><li><b>Sirih</b>: the betel plant, chewed as leaf or as the long green fruit.</li><li><b>Kapur</b>: powdered lime, which reacts with the other two and turns the mix red.</li></ul><p>People carry the ingredients in a small woven or cloth bag, and spit the red juice as they chew.</p>
<h2>What it means</h2><p>Offering betel is the basic gesture of hospitality and respect in Sumba. It opens conversations, welcomes guests, seals agreements and is part of ceremonies from weddings to funerals. In Marapu belief it is also an offering to the ancestors. Bringing betel nut as a gift when you visit a village is always appropriate: see """ + GD("gifts-for-village-hosts", "gifts for village hosts") + """.</p>
<h2>If you are offered betel</h2><ul><li>Accepting it with your right hand is polite, even if you do not chew it. You can keep it or hand it on later.</li><li>A smile and "terima kasih" (thank you) is enough to decline; nobody expects foreigners to chew.</li><li>If you try it, use a very small amount of lime: it can burn the mouth, and the nut can make you dizzy or sweaty.</li></ul>
<h2>A health note</h2><p>The World Health Organization's cancer agency classifies areca nut as a cause of cancer in humans, and regular chewing is linked to mouth disease. A one-off taste is a cultural experience; it is not something to take up.</p>
<p>See also """ + GD("respect-etiquette", "etiquette in Sumba") + """ and """ + GD("indonesian-phrases-sumba", "useful phrases") + """.</p>""",
 "faq": [["Should I chew betel nut in Sumba?", "You do not have to. Accepting it with your right hand is polite; you can decline with a smile and thank you."],
         ["Is betel nut a good gift for a village?", "Yes. Betel nut and areca are among the most appreciated small gifts when visiting a Sumbanese village."]]},
{"s": "belis-marriage-sumba", "img": "praiyawang-rende",
 "t": "Belis: marriage exchange and bride wealth in Sumba",
 "d": "How marriage alliances work in traditional Sumba: belis, the exchange of animals, gold and cloth between families, and why it still matters.",
 "b": """<p>In Sumba a marriage is not only a union of two people; it is an alliance between two clans. The negotiations and gifts that seal it are known across East Nusa Tenggara as <i>belis</i>, often translated as bride wealth or bride price.</p>
<h2>How the exchange works</h2><p>Anthropologists who have worked in Sumba describe a two-way exchange. The groom's family gives goods seen as "male": buffalo, horses, metal objects and gold ornaments such as the """ + GD("mamuli-sumba", "mamuli") + """. The bride's family answers with "female" goods: hand-woven """ + GD("sumba-ikat-weaving", "ikat cloth") + """ and pigs. Spokesmen for each side negotiate in a formal, poetic language, sometimes over many meetings.</p>
<h2>Why it matters</h2><ul><li>It creates lasting obligations between clans (wife-givers and wife-takers) that shape ceremonies for generations.</li><li>It turns animals and textiles into social memory: who gave what is remembered.</li><li>It shows the standing of both families.</li></ul>
<h2>Debates today</h2><p>Belis is debated within Sumba itself. Many families value it as identity and respect; others point to the debts that large exchanges can create, and church and community leaders have encouraged more modest amounts. Practice varies a lot between regencies, villages and religious communities, so any figure you hear is specific to one family.</p>
<h2>Seeing a wedding as a visitor</h2><p>Weddings are private family events. If you are invited, dress modestly, bring a small gift, follow your host's lead and ask before taking photos. See """ + GD("photographing-people-sumba", "photographing people respectfully") + """.</p>""",
 "faq": [["What is belis in Sumba?", "The exchange of gifts between two clans that seals a marriage: typically animals and gold from the groom's side, and ikat cloth and pigs from the bride's side."],
         ["Is belis still practised?", "Yes, widely, though amounts and forms vary and some community leaders encourage smaller exchanges."]]},
{"s": "sumba-funerals", "img": "gallubakul-tomb",
 "t": "Funerals in Sumba: ceremonies, stone tombs and what visitors should know",
 "d": "Why funerals are the biggest events in Sumbanese life, how they connect to Marapu belief and the megalithic tombs, and how to behave if you come across one.",
 "b": """<p>The stone tombs in front of Sumbanese houses are the most visible sign of a simple truth: in Sumba, honouring the dead is central to life. Funerals can be the largest gatherings a family ever hosts.</p>
<h2>Why funerals are so important</h2><p>In """ + GD("marapu-religion-sumba", "Marapu") + """ belief, the dead join the ancestors, who continue to watch over and influence the living. A proper funeral helps the soul on its way and keeps the relationship with the ancestors in good order. Christians in Sumba also hold large funerals, and many families combine church rites with older customs.</p>
<h2>What a traditional funeral involves</h2><ul><li><b>Time to gather.</b> Relatives may come from far away, so a body can be kept for some time before burial while the family prepares.</li><li><b>Exchange and sacrifice.</b> Guests bring animals, cloth and other gifts, and buffalo, pigs or horses may be sacrificed to accompany the dead. The family remembers every gift.</li><li><b>Ikat.</b> The deceased may be wrapped in many hand-woven cloths.</li><li><b>Stone tombs.</b> Important people are buried in large stone graves, some of which were dragged into place by hundreds of people. See """ + GD("sumba-megalithic-tombs", "the megalithic tombs") + """.</li></ul>
<h2>Cost and change</h2><p>Large funerals can be a heavy burden, and local governments and churches have encouraged limits on sacrifices. As with weddings, practice varies widely.</p>
<h2>If you come across a funeral</h2><ul><li>Do not walk in uninvited or photograph mourners.</li><li>If your driver or guide is invited and you are welcome, dress modestly, stay at the edge and follow their lead.</li><li>Animal sacrifice can be confronting to see; it is fine to step away quietly.</li></ul>
<p>The tombs at """ + PL("gallubakul-tomb", "Gallubakul") + """ and """ + PL("pasunga-village", "Pasunga") + """ are good places to understand this heritage calmly.</p>""",
 "faq": [["Why are there stone tombs in front of houses in Sumba?", "Because the dead are honoured as ancestors who stay close to the family; important people are buried in stone graves in the village square."],
         ["Can tourists attend a funeral in Sumba?", "Only if invited. Funerals are family events; if welcome, dress modestly, stay discreet and ask before photographing."]]},
{"s": "wula-podu-festival", "img": "tarung-village",
 "t": "Wula Podu: the sacred month of West Sumba",
 "d": "What Wula Podu is, when and where it takes place, what happens during the sacred month and how visitors can respect it.",
 "b": """<p><i>Wula Podu</i> is one of the most important events of the Marapu calendar in West Sumba. The name is usually translated as the "bitter month": a period of restraint, rituals and ceremonies that ends in celebration.</p>
<h2>When and where</h2><p>Wula Podu is held in the area around Waikabubak (Loli and the villages around the town, such as """ + PL("tarung-village", "Tarung") + """ and """ + PL("waigalli-village", "Waigalli") + """), usually around October and November. The exact dates are set each year by the Marapu priests (rato) according to the traditional calendar, so they are only known shortly before. Ask locally or check our """ + GD("sumba-events-calendar", "events calendar") + """.</p>
<h2>What happens</h2><ul><li><b>A time of restraint.</b> During the month, communities avoid certain activities, such as loud celebrations and some kinds of work, out of respect for the ancestors.</li><li><b>Rituals and offerings.</b> Priests lead ceremonies with offerings and chanting, asking the ancestors for good harvests and well-being.</li><li><b>The closing celebration.</b> The month ends with dances, songs and gatherings that draw people from the surrounding villages.</li></ul>
<h2>Visiting during Wula Podu</h2><ul><li>Go with a local guide who can tell you what is open to visitors and when.</li><li>Ask before photographing ceremonies; some rites are not for outsiders.</li><li>Dress modestly and bring a small gift such as betel nut; see """ + GD("betel-nut-sumba", "betel nut") + """.</li><li>Respect the restrictions of the month even if they seem small: they are taken seriously.</li></ul>
<p>Read more about """ + GD("marapu-religion-sumba", "Marapu") + """ and the """ + GD("villages-west-sumba", "villages of West Sumba") + """.</p>""",
 "faq": [["When is Wula Podu?", "Usually around October and November. The exact dates are set each year by the Marapu priests."],
         ["Where does Wula Podu take place?", "In the Marapu villages of West Sumba around Waikabubak, including Tarung and Waigalli."]]},
{"s": "kabisu-clans-sumba", "img": "praiyawang-rende",
 "t": "Clans, houses and social structure in traditional Sumba",
 "d": "How Sumbanese society is organised: kabisu clans, ancestral houses and villages, and the traditional ranks of East Sumba.",
 "b": """<p>Understanding a little about how Sumbanese society is organised makes a village visit far more meaningful. The tall houses, the stone tombs in the square and the order of a ceremony all follow from it.</p>
<h2>The clan: kabisu</h2><p>Sumbanese belong to clans, often called <i>kabisu</i> (or <i>kabihu</i> in East Sumba), which trace descent through the father's line to a founding ancestor. Each clan has its own Marapu, its own ritual duties and its own links to other clans through marriage. See """ + GD("belis-marriage-sumba", "marriage exchange") + """.</p>
<h2>The house and the village</h2><ul><li><b>The ancestral house</b> (uma) is more than a home: it holds the clan's heirlooms in the high roof and is where rituals take place. See """ + GD("sumba-traditional-houses", "traditional houses") + """.</li><li><b>The ancestral village</b>, usually on a hill, groups the houses of related clans around a square of stone tombs. In East Sumba it is called <i>paraingu</i>.</li><li>Many families today live in garden hamlets or towns but return to the ancestral village for ceremonies.</li></ul>
<h2>Traditional ranks in East Sumba</h2><p>Ethnographers describe three traditional ranks in East Sumba: the nobility (<i>maramba</i>), free commoners (<i>kabihu</i>) and a hereditary serving class (<i>ata</i>). The old kingdoms of the east were led by noble families. Today Indonesia's law treats everyone equally, education and church life have changed a great deal, and the subject can be sensitive, so it is best not to ask people about their rank.</p>
<h2>What this means when you visit</h2><ul><li>Introduce yourself to the elders or the person who greets you before wandering around.</li><li>Do not climb on tombs or touch heirlooms.</li><li>A guide from the area can explain which house is which and whose ancestors lie in the tombs.</li></ul>
<p>Villages to start with: """ + PL("praiyawang-rende", "Praiyawang (Rende)") + """ in the east, """ + PL("ratenggaro", "Ratenggaro") + """ in the southwest and """ + PL("tarung-village", "Tarung") + """ in the west.</p>""",
 "faq": [["What is a kabisu?", "A Sumbanese clan that traces descent through the father's line to a founding ancestor, with its own ancestral house and ritual duties."],
         ["What does maramba mean?", "The traditional noble rank of East Sumba, described by ethnographers alongside commoners (kabihu) and a serving class (ata)."]]},
{"s": "mamuli-sumba", "img": "prailiu-village",
 "t": "Mamuli: the gold ornaments of Sumba",
 "d": "What mamuli are, what their shape means, how they are used in marriage and as heirlooms, and where you see them in Sumba today.",
 "b": """<p>Look closely at Sumbanese ikat and you will often see a curious shape like an omega or a stylised womb. It is the <i>mamuli</i>, the best-known ornament of the island and one of the treasures of every important clan.</p>
<h2>What a mamuli is</h2><p>A mamuli is a metal ornament, traditionally of gold, sometimes of silver or brass, with an open, rounded shape. It can be worn as an ear ornament or a pendant, but its main role is as a valuable: kept in the clan house and exchanged on important occasions.</p>
<h2>What it means</h2><ul><li>Its shape is widely interpreted as a symbol of female fertility and of life passed on through women.</li><li>Paradoxically for Western eyes, it counts as a "male" good in the exchange system, given by the groom's side in """ + GD("belis-marriage-sumba", "marriage negotiations") + """.</li><li>Old mamuli are heirlooms tied to the ancestors and are usually kept hidden in the roof of the house, brought out only for ceremonies.</li></ul>
<h2>Where you see mamuli</h2><ul><li><b>On ikat.</b> The motif appears on many East Sumba cloths; see """ + GD("ikat-motifs-meaning", "ikat motifs and their meaning") + """.</li><li><b>In ceremonies</b> such as weddings, when heirlooms are displayed.</li><li><b>As jewellery.</b> Modern mamuli in silver or plated metal are sold as souvenirs in Waingapu and weaving villages.</li></ul>
<h2>Buying and respect</h2><p>Old heirloom mamuli belong to clans and should not be bought from people who may not have the right to sell them. Newly made pieces and pieces of ikat with the motif are the respectful choice. See """ + GD("sumba-markets", "markets in Sumba") + """.</p>""",
 "faq": [["What is a mamuli?", "A traditional Sumbanese ornament, usually of gold, with an omega-like shape associated with female fertility, used as a valuable in marriage exchange."],
         ["Can I buy a mamuli?", "Newly made mamuli are sold as jewellery; old heirloom pieces belong to clans and should not be bought."]]},
{"s": "ikat-motifs-meaning", "img": "prailiu-village",
 "t": "Sumba ikat motifs and what they mean",
 "d": "A visual guide to the common motifs on Sumba ikat: horses, crocodiles, prawns, cockatoos, mamuli, the skull tree and more, and how to read a cloth.",
 "b": """<p>A Sumba ikat cloth, especially the large <i>hinggi</i> of East Sumba, is a story told in symbols. Once you know the main motifs, every cloth you see in a village or market becomes easier to read. For how the cloth is made, see """ + GD("sumba-ikat-weaving", "ikat weaving in Sumba") + """.</p>
<h2>Common motifs</h2><ul>
<li><b>Horse.</b> Wealth, status and courage; horses are central to Sumbanese life. See """ + GD("sumba-horses", "horses") + """.</li>
<li><b>Crocodile.</b> Often linked with royalty and power, and with ancestors.</li>
<li><b>Prawn or lobster.</b> Because it sheds its shell, it is widely read as a symbol of renewal and life after death.</li>
<li><b>Cockatoo and other birds.</b> Birds can stand for messengers, wisdom or the people of a region; the cockatoo is native to Sumba.</li>
<li><b>Mamuli.</b> The gold ornament, a symbol of fertility; see """ + GD("mamuli-sumba", "mamuli") + """.</li>
<li><b>Skull tree (andung).</b> A tree hung with skulls, recalling the warfare and headhunting of the past and the power of a victorious clan.</li>
<li><b>Deer, roosters, turtles and fish.</b> Animals of the island, with meanings that vary by family and village.</li>
<li><b>Lions and crowns.</b> Borrowed from Dutch coats of arms and coins during the colonial era and turned into Sumbanese designs.</li></ul>
<h2>Colours</h2><p>Traditional cloths use natural dyes: blue from indigo and red-brown from the roots of the morinda (mengkudu) tree, with undyed thread for white and cream. Deep, even colours take many dye baths over weeks or months. Bright cloths are usually made with chemical dyes, which is fine as long as the seller is honest about it.</p>
<h2>Reading a cloth</h2><ul><li>East Sumba hinggi are usually arranged in horizontal bands, with motifs mirrored around the centre.</li><li>West Sumba cloths tend to use more geometric patterns.</li><li>Ask the weaver: the meaning of a motif can be particular to their family.</li></ul>
<p>Where to see weaving: """ + GD("where-to-see-ikat-weaving", "ikat weaving villages") + """.</p>""",
 "faq": [["What does the horse mean on Sumba ikat?", "Wealth, status and courage. Horses are central to Sumbanese life and ceremonies."],
         ["What does the prawn motif mean?", "It is commonly read as renewal or life after death, because the prawn sheds its shell."]]},
{"s": "buffalo-in-sumba", "img": "mamboro-savanna",
 "t": "Buffalo, horses and livestock in Sumbanese life",
 "d": "Why buffalo and horses are measures of wealth in Sumba, how they are used in ceremonies and exchange, and what to expect on the roads.",
 "b": """<p>On any drive across Sumba you will share the road with buffalo, horses, cattle, goats and pigs. Livestock is not only a living for Sumbanese families: it is a form of savings, a measure of standing and an essential part of every ceremony.</p>
<h2>Wealth on four legs</h2><ul><li><b>Buffalo</b> are among the most valuable animals. Their horns are often displayed on the front of ancestral houses as a record of the sacrifices a family has made.</li><li><b>Horses</b> are used for riding, for the """ + GD("pasola-guide", "Pasola") + """ and as gifts in """ + GD("belis-marriage-sumba", "marriage exchange") + """.</li><li><b>Pigs</b> are raised by almost every family and given by the bride's side in exchange.</li><li><b>Cattle</b> graze the savannahs of the east and are an important source of cash income.</li></ul>
<h2>In ceremonies</h2><p>Animals are sacrificed at funerals, house-building rites and other ceremonies, especially in Marapu communities. The number and kind of animals reflect the importance of the event. See """ + GD("sumba-funerals", "funerals in Sumba") + """.</p>
<h2>On the road</h2><ul><li>Animals cross without warning, including at night; this is one of the main reasons to drive slowly and avoid driving after dark.</li><li>Hitting an animal is a serious matter for its owner; if it happens, stop and let your driver handle it.</li><li>Herds on the savannah are a highlight of East Sumba and the """ + PL("mamboro-savanna", "Mamboro savanna") + """.</li></ul>
<h2>Seeing horses and buffalo</h2><p>Early morning and late afternoon are best for photos of herds on the grasslands. Ask before photographing animals in a village; they belong to someone. Read """ + GD("sumba-horses", "the horses of Sumba") + """ and """ + GD("sumba-road-conditions", "road conditions") + """.</p>""",
 "faq": [["Why are there buffalo horns on houses in Sumba?", "They record the buffalo the family has sacrificed in ceremonies, a sign of the house's standing."],
         ["Are animals a hazard on Sumba's roads?", "Yes. Buffalo, horses, goats and pigs cross without warning, especially around villages and after dark."]]},
{"s": "where-to-see-ikat-weaving", "img": "praiyawang-rende",
 "t": "Where to see ikat weaving in Sumba",
 "d": "The best villages and towns to watch Sumba ikat being made and to buy directly from weavers, with tips on prices, quality and etiquette.",
 "b": """<p>Watching ikat being tied, dyed and woven is one of the best experiences in Sumba, and buying directly from weavers is one of the most useful ways to spend money on the island. East Sumba is the heartland of the large, figurative cloths; the west has its own styles.</p>
<h2>East Sumba</h2><ul><li>""" + PL("prailiu-village", "Prailiu") + """, on the edge of Waingapu: the easiest place to see weavers at work and a good range of cloths.</li><li>""" + PL("praiyawang-rende", "Praiyawang (Rende)") + """: a traditional village south-east of Waingapu, famous for fine cloths and its stone tombs.</li><li>The road between Waingapu and the south-east coast passes other weaving villages; your driver will know which families are working that day.</li></ul>
<h2>West and Southwest Sumba</h2><ul><li>Villages around Waikabubak and in the Kodi area weave and sell cloth, usually in simpler, more geometric designs.</li><li>Markets in Waikabubak and Waitabula often have cloth stalls; see """ + GD("sumba-markets", "markets") + """.</li></ul>
<h2>What to look for</h2><ul><li><b>Natural dyes</b> give deep blues and rusty reds with slightly uneven tones; ask the weaver.</li><li><b>Fine, tight weaving</b> and sharp motif edges mean more work.</li><li><b>Hand-spun thread</b> is rarer and more valuable than factory thread.</li></ul>
<h2>Prices and etiquette</h2><ul><li>A large naturally dyed cloth can represent months of work, and prices reflect that. Small pieces and scarves are more affordable.</li><li>Bargain gently and respectfully; see """ + GD("bargaining-in-sumba", "bargaining in Sumba") + """.</li><li>If you only watch, a small purchase or donation is appreciated. Ask before photographing the weavers.</li></ul>
<p>Learn the symbols first: """ + GD("ikat-motifs-meaning", "ikat motifs and their meaning") + """.</p>""",
 "faq": [["Where is the best place to see ikat weaving in Sumba?", "Prailiu, next to Waingapu, is the easiest; Praiyawang (Rende) in East Sumba is famous for fine cloths."],
         ["How can I tell natural dyes?", "Natural indigo and morinda dyes give deep, slightly uneven blues and rusty reds. Ask the weaver; most will tell you honestly."]]},
{"s": "sumba-traditional-clothing", "img": "ratenggaro",
 "t": "Traditional dress in Sumba: hinggi, lau and ceremonial wear",
 "d": "What Sumbanese men and women wear at ceremonies, the role of ikat cloth, and how visitors should dress when invited to an event.",
 "b": """<p>At a wedding, funeral, Pasola or church festival in Sumba you will see traditional dress worn with great pride. It is built around hand-woven """ + GD("sumba-ikat-weaving", "ikat") + """ cloth.</p>
<h2>Men</h2><ul><li><b>Hinggi.</b> A large rectangular ikat cloth. One is wrapped around the hips and another is often draped over the shoulder.</li><li><b>Headcloth.</b> A cloth tied around the head, with styles that differ between regions.</li><li><b>A long knife</b> in a decorated sheath, tucked into the waist for ceremonies, a symbol of manhood rather than a weapon at such events.</li></ul>
<h2>Women</h2><ul><li><b>Lau.</b> A tubular woven sarong worn from the chest or waist, sometimes decorated with beads or shells.</li><li><b>Jewellery</b> such as """ + GD("mamuli-sumba", "mamuli") + """ ornaments, necklaces and, in some areas, ivory or shell bracelets handed down in the family.</li></ul>
<h2>When people wear it</h2><p>Traditional dress is worn for ceremonies, official events, church festivals and celebrations such as Independence Day on 17 August. Everyday clothes are modern, although older people in the villages often wear sarongs.</p>
<h2>If you are invited to an event</h2><ul><li>Covered shoulders and knees are the safe choice; see """ + GD("what-to-wear-sumba", "what to wear in Sumba") + """.</li><li>Hosts sometimes lend a cloth to guests; wearing it is a compliment, and the hosts will show you how.</li><li>Ask before photographing people in ceremonial dress.</li></ul>""",
 "faq": [["What is a hinggi?", "A large ikat cloth worn by Sumbanese men around the hips and over the shoulder at ceremonies."],
         ["What is a lau?", "The tubular woven sarong worn by Sumbanese women."]]},
{"s": "sumba-kings-and-kingdoms", "img": "prailiu-village",
 "t": "The old kingdoms of Sumba",
 "d": "How Sumba was divided into small domains ruled by noble families, how the Dutch used them, and what remains of the kingdoms today.",
 "b": """<p>Before Indonesia, Sumba was not one state but a patchwork of small domains, each led by noble families and bound together by clan alliances, marriage and, at times, war. Their legacy is still visible in the villages, the tombs and the ikat.</p>
<h2>Domains and nobles</h2><p>In East Sumba, domains such as Rende, Umalulu and Kapunduk were led by families of the noble rank (maramba); see """ + GD("kabisu-clans-sumba", "clans and social structure") + """. In the west, power was more spread among clans and villages. Rivalries between domains, raids and headhunting are part of the history remembered in songs and in the skull-tree motif on ikat.</p>
<h2>The colonial period</h2><p>The Dutch extended control over Sumba in the early twentieth century and governed largely through local rulers, whom they recognised as "rajas" over the domains. Missions and schools followed, and the horse trade connected the island to the wider colony. See """ + GD("sumba-history", "the history of Sumba") + """.</p>
<h2>After independence</h2><p>With Indonesian independence the domains were absorbed into the new administrative system of regencies and districts; see """ + GD("sumba-regencies", "Sumba's regencies") + """. Noble families often kept their prestige and ritual role, and some became local leaders in the new state.</p>
<h2>Where to see the legacy</h2><ul><li>The great stone tombs of noble families in """ + PL("praiyawang-rende", "Praiyawang (Rende)") + """ and in the villages around Waingapu.</li><li>The ancestral village of the kings of Mamboro near the """ + PL("mamboro-savanna", "Mamboro savanna") + """.</li><li>Royal motifs (crocodiles, lions, crowns) on """ + GD("ikat-motifs-meaning", "ikat") + """.</li></ul>""",
 "faq": [["Did Sumba have kings?", "Yes. The island was divided into small domains led by noble families; the Dutch recognised local rulers as rajas."],
         ["What happened to the kingdoms?", "After independence they were absorbed into Indonesia's regencies, though noble families often kept their ritual role."]]},
# ---------------- nature ----------------
{"s": "sumba-geology", "img": "tanggedu-waterfall",
 "t": "Why Sumba looks different: the geology of the island",
 "d": "Sumba has no volcanoes, unlike its neighbours. How its limestone plateaus, coral terraces, canyons and savannahs were formed.",
 "b": """<p>Fly from Bali to Sumba and you leave a chain of volcanoes for an island without a single one. That is the first clue that Sumba is geologically different from its neighbours, and it explains much of what you see.</p>
<h2>An island without volcanoes</h2><p>Bali, Lombok, Sumbawa and Flores belong to the volcanic arc formed where the Indo-Australian plate dives under the Eurasian plate. Sumba lies south of that arc, in front of it, and is generally described by geologists as a block of older crust that was lifted up rather than built by eruptions. So there are no smoking peaks, no black volcanic sand and far fewer rich volcanic soils.</p>
<h2>Limestone and coral terraces</h2><p>Much of the island is covered by limestone that formed under the sea from coral reefs and marine sediments. As Sumba rose, these were lifted out of the water. In places the coast shows stepped terraces of old coral, each marking a former shoreline.</p>
<h2>What this means for visitors</h2><ul><li><b>White sand beaches</b> made of coral and shell fragments, rather than dark volcanic sand.</li><li><b>Clear lagoons and rock pools</b> such as """ + PL("weekuri-lagoon", "Weekuri") + """, where sea water filters through porous coral rock.</li><li><b>Canyons and caves.</b> Rivers dissolve and cut the limestone, creating gorges like """ + PL("tanggedu-waterfall", "Tanggedu") + """.</li><li><b>Dry plateaus.</b> Water sinks quickly through limestone, which, together with low rainfall in the east, helps explain the """ + GD("sumba-savanna", "savannah") + """.</li></ul>
<h2>Earthquakes</h2><p>Like all of eastern Indonesia, Sumba sits in an active tectonic region and can feel earthquakes. Follow local advice and move to higher ground if a strong quake strikes near the coast.</p>""",
 "faq": [["Does Sumba have volcanoes?", "No. Unlike Bali, Lombok, Sumbawa and Flores, Sumba is not part of the volcanic arc."],
         ["Why are Sumba's beaches white?", "Because the island is largely limestone and coral; the sand is made of coral and shell fragments."]]},
{"s": "sumba-savanna", "img": "wairinding-hill",
 "t": "The savannah of Sumba: why the island looks like Africa",
 "d": "Why East Sumba is covered by golden grasslands, how rain, limestone, fire and grazing shaped them, and where to see the best savannah views.",
 "b": """<p>Photos of East Sumba often surprise people: golden hills, lone trees, grazing horses. It looks more like East Africa than the Indonesia of rice terraces and jungle. Several things come together to make it so.</p>
<h2>Why there is savannah</h2><ul><li><b>Rain shadow.</b> The east of the island receives much less rain than the west; our data shows Waingapu getting a fraction of the rain of Waikabubak. See """ + GD("waingapu-weather", "Waingapu weather") + """.</li><li><b>Long dry season.</b> Months with almost no rain dry out the grass.</li><li><b>Limestone soils</b> that drain quickly; see """ + GD("sumba-geology", "Sumba's geology") + """.</li><li><b>People and animals.</b> Centuries of burning to renew pasture and grazing by horses, buffalo and cattle keep the land open.</li></ul>
<h2>Gold or green?</h2><p>In the dry season, roughly from June to November, the grass turns gold and brown. After the rains begin, the same hills turn bright green within weeks. Both are beautiful: gold for the classic Sumba look, green from about January to April.</p>
<h2>Where to see it</h2><ul><li>""" + PL("wairinding-hill", "Wairinding Hill") + """ and """ + PL("brotherhood-hill", "Brotherhood Hill") + """, the classic viewpoints near Waingapu.</li><li>""" + PL("napu-valley", "Napu Valley") + """ in the north-east.</li><li>The """ + PL("mamboro-savanna", "Mamboro savanna") + """ on the north coast of Central Sumba.</li><li>Many roads in the east: just stop where it looks good.</li></ul>
<h2>Tips</h2><ul><li>Late afternoon gives soft light and long shadows.</li><li>Grass fires happen in the dry season; keep clear of smoke and never start fires.</li><li>Carry water and sun protection: there is little shade. See """ + GD("heat-and-sun-sumba", "heat and sun") + """.</li></ul>
<p>More: """ + GD("viewpoints-east-sumba", "viewpoints of East Sumba") + """.</p>""",
 "faq": [["Why is East Sumba so dry?", "It lies in a rain shadow, has a long dry season and well-drained limestone soils, and centuries of burning and grazing keep it open."],
         ["When are the Sumba hills green?", "From soon after the rains start until a few months after they end, roughly January to April."]]},
{"s": "sumba-hornbill", "img": "wanggameti",
 "t": "The Sumba hornbill: where and how to see it",
 "d": "The Sumba hornbill is found nowhere else on Earth. What it looks like, where it lives, why it is threatened, and how to look for it responsibly.",
 "b": """<p>The Sumba hornbill (<i>Rhyticeros everetti</i>) is the island's most spectacular bird and one of its few endemic species: it lives only on Sumba. Seeing one flying over the forest canopy with its loud wingbeats is a highlight for any nature lover.</p>
<h2>What it looks like</h2><p>A large, dark bird with a big pale bill topped by a ridged casque. Males have a rufous head and neck; females are darker. In flight you often hear them before you see them, because their wings make a loud whooshing sound.</p>
<h2>Where it lives</h2><p>Hornbills need large, old trees for nesting and fruiting figs for food, so they survive mainly in the remaining forest patches of the island, especially inside the national parks of the west and the Wanggameti highlands of the east. See """ + GD("sumba-national-parks-birds", "national parks and birds") + """ and """ + PL("wanggameti", "Wanggameti") + """.</p>
<h2>Why it is threatened</h2><ul><li>Most of Sumba's original forest has been lost over the centuries.</li><li>Hornbills breed slowly and depend on large hollow trees.</li><li>The population is small and the species is listed as threatened internationally.</li></ul>
<h2>How to look for it</h2><ul><li>Go with a local guide who knows the forest and the fruiting trees.</li><li>Early morning is best, when birds are active and calling.</li><li>Stay quiet, keep your distance from nests and never use playback near a nest.</li><li>Binoculars are essential; a long lens helps for photos.</li></ul>
<p>Other endemic birds share the same forests, including the citron-crested cockatoo; see """ + GD("citron-crested-cockatoo", "the citron-crested cockatoo") + """.</p>""",
 "faq": [["Is the Sumba hornbill endemic?", "Yes. Rhyticeros everetti lives only on Sumba."],
         ["Where can I see the Sumba hornbill?", "In the remaining forests, especially in the national parks and the Wanggameti highlands, ideally with a local guide early in the morning."]]},
{"s": "citron-crested-cockatoo", "img": "lapopu-waterfall",
 "t": "The citron-crested cockatoo of Sumba",
 "d": "Sumba's own cockatoo, with an orange crest found nowhere else: why it became rare, where it survives and how travellers can help.",
 "b": """<p>Most yellow-crested cockatoos have, as the name says, yellow crests. On Sumba lives a subspecies with a crest of bright orange: the citron-crested cockatoo (<i>Cacatua sulphurea citrinocristata</i>).</p>
<h2>A bird of Sumba</h2><p>This subspecies is found only on Sumba. It is a white, medium-sized cockatoo with an orange crest and orange cheek patches, noisy and sociable, often seen in pairs or small groups around tall forest trees.</p>
<h2>Why it is rare</h2><ul><li><b>Trapping for the pet trade</b> removed large numbers of birds in the past.</li><li><b>Forest loss</b> reduced the big trees it needs for nesting.</li><li>The yellow-crested cockatoo species as a whole is listed as critically endangered.</li></ul><p>Protection in national parks and local conservation work have helped, but the population remains small.</p>
<h2>Where to look</h2><p>Forest patches and edges in the national park areas, with a local guide, early in the morning or late in the afternoon when birds move between roosts and feeding trees. See """ + GD("sumba-national-parks-birds", "national parks and birds") + """.</p>
<h2>How you can help</h2><ul><li>Never buy a cockatoo or any wild bird, and do not pay to photograph captive wild birds.</li><li>Hire local guides: income from birdwatching gives communities a reason to protect forests.</li><li>Report trapping or sales to park authorities through your guide.</li></ul>
<p>Also see """ + GD("sumba-hornbill", "the Sumba hornbill") + """ and """ + GD("responsible-travel-sumba", "responsible travel") + """.</p>""",
 "faq": [["What colour is the crest of the Sumba cockatoo?", "Orange. The citron-crested cockatoo is a subspecies found only on Sumba."],
         ["Why is the cockatoo rare in Sumba?", "Mainly because of past trapping for the pet trade and the loss of forest with large nesting trees."]]},
{"s": "sumba-stargazing", "img": "wairinding-hill",
 "t": "Stargazing in Sumba: dark skies, the Milky Way and the southern stars",
 "d": "Why Sumba is one of the best places in Indonesia to see the stars, when the Milky Way is brightest, where to go and how to photograph it.",
 "b": """<p>With few towns, little industry and long dry seasons, Sumba has some of the darkest skies you can easily reach in Indonesia. On a clear, moonless night away from the towns, the Milky Way is bright enough to cast shadows of the trees on the savannah.</p>
<h2>When to go</h2><ul><li><b>Dry season</b>, roughly May to October, gives the most clear nights. See """ + GD("sumba-weather-by-month", "weather by month") + """.</li><li><b>The bright core of the Milky Way</b> is best placed in the evening from around April to September.</li><li><b>Moon:</b> plan around the new moon; a full moon washes out all but the brightest stars.</li></ul>
<h2>What you will see</h2><ul><li>The Southern Cross and the two bright pointer stars of Centaurus.</li><li>The Magellanic Clouds, small galaxies visible only from the southern half of the sky.</li><li>Constellations of both hemispheres: Sumba is close enough to the equator to see much of the northern sky too.</li></ul>
<h2>Where to go</h2><ul><li>The savannah of East Sumba, away from Waingapu: """ + PL("wairinding-hill", "Wairinding") + """ or """ + PL("napu-valley", "Napu") + """ (go with a driver, never alone at night).</li><li>Beaches on the north coast such as those around """ + PL("kapulit-beach", "Mamboro") + """, with a dark sea horizon.</li><li>Anywhere away from town lights: a few kilometres is enough.</li></ul>
<h2>Photographing the night sky</h2><ul><li>A tripod, a wide lens at its widest aperture, and exposures of around 15 to 25 seconds.</li><li>Focus manually on a bright star.</li><li>Use a red torch to keep your night vision.</li></ul>
<h2>Safety</h2><p>Roads are dark and animals wander; arrange transport in advance and let your hosts know where you are going.</p>""",
 "faq": [["Is Sumba good for stargazing?", "Yes. Light pollution is very low outside the towns and the dry season brings many clear nights."],
         ["When is the Milky Way visible in Sumba?", "Its bright core is best in the evening from about April to September, on moonless nights."]]},
# ---------------- local data guides (from OpenStreetMap) ----------------
]
_fuel, _nf = _svc_list(("f",)); _atm, _na = _svc_list(("a",)); _hos, _nh = _svc_list(("hH",)); _cli, _nc = _svc_list(("h",)); _ph, _np = _svc_list(("p",))
GUIDES6A += [
{"s": "fuel-stations-sumba", "img": "mamboro-savanna",
 "t": "Petrol stations in Sumba: where to fill up",
 "d": f"The {_nf} fuel stations in Sumba mapped on OpenStreetMap, bottle petrol in villages, and how to plan fuel on long drives.",
 "b": f"""<p>Fuel is one of the things to plan in Sumba: stations are few and concentrated in the towns. This list comes from OpenStreetMap, which is incomplete for the island, so treat it as a minimum and ask your driver.</p>
<h2>Fuel stations on the map ({_nf})</h2>{_fuel}
<h2>Bottle petrol</h2><p>Outside the towns, small stalls sell petrol in glass or plastic bottles, often with a hand-written sign. It is how most villages get fuel. It costs a bit more than at the pump and quality varies, but it is fine for scooters and as a backup.</p>
<h2>Tips</h2><ul><li>Fill up in Tambolaka, Waikabubak, Waibakul or Waingapu before any long trip.</li><li>Queues and temporary shortages happen; do not leave it to the last litre.</li><li>On remote routes such as the south coast of East Sumba, carry a small reserve if you ride a scooter.</li><li>Stations take cash; card payment is not reliable. See {GD("atm-locations-sumba", "ATMs in Sumba")}.</li></ul>
<p>See the fuel layer on the {MAP} (🏥 services) and {GD("rent-scooter-car-sumba", "renting a scooter or car")}.</p>""",
 "faq": [["Are there petrol stations in Sumba?", f"Yes, mainly in the towns. OpenStreetMap shows {_nf}; villages sell bottled petrol from roadside stalls."],
         ["Can I pay for fuel by card in Sumba?", "Do not count on it. Carry cash."]]},
{"s": "atm-locations-sumba", "img": "prailiu-village",
 "t": "ATMs in Sumba: where to get cash",
 "d": "Where to find ATMs in Sumba, why you need cash almost everywhere, and tips to avoid running short outside the towns.",
 "b": f"""<p>Sumba runs on cash. Card payment is rare outside a few businesses in the towns, so knowing where the ATMs are matters. This list shows the ATMs and banks mapped on OpenStreetMap; there are more in the towns than the map shows, but almost none in the countryside.</p>
<h2>ATMs and banks on the map ({_na})</h2>{_atm}
<h2>Where you can count on cash machines</h2><p>All four main towns, Waingapu, Waikabubak, Tambolaka (Waitabula) and Waibakul, have bank ATMs from Indonesian banks. Outside them, assume there is none.</p>
<h2>Tips</h2><ul><li>Take out enough for several days before leaving town; machines sometimes run empty at weekends and holidays.</li><li>Carry small notes: villages, stalls and donations need them.</li><li>Tell your bank you are travelling and carry a second card.</li><li>Bring some cash from Bali as a backup.</li></ul>
<p>More in {GD("money-atms-sim-sumba", "money, ATMs and SIM cards")} and {GD("sumba-trip-cost", "trip costs")}.</p>""",
 "faq": [["Are there ATMs in Sumba?", "Yes, in the main towns: Waingapu, Waikabubak, Tambolaka and Waibakul. There are almost none in the countryside."],
         ["Do I need cash in Sumba?", "Yes, for almost everything outside a few town businesses."]]},
{"s": "hospitals-clinics-sumba", "img": "tarung-village",
 "t": "Hospitals, clinics and pharmacies in Sumba",
 "d": "Where to find hospitals, community health centres (puskesmas) and pharmacies in Sumba, from OpenStreetMap, plus what to prepare before you travel.",
 "b": f"""<p>Health care in Sumba is basic compared with Bali, and good preparation matters. This page lists the facilities mapped on OpenStreetMap, which is incomplete; ask your hosts which one they use. In an emergency, go to the nearest hospital and contact your travel insurer early. This is general information, not medical advice.</p>
<h2>Hospitals ({_nh})</h2>{_hos}
<h2>Clinics and community health centres ({_nc})</h2><p>A <i>puskesmas</i> is a government community health centre, found in most districts. It can treat minor problems and refer patients.</p>{_cli}
<h2>Pharmacies ({_np})</h2>{_ph}<p>Pharmacies (apotek) in the towns stock common medicines; bring your own prescription medicines in their original packaging, with enough for the whole trip.</p>
<h2>Before you go</h2><ul><li>Get travel insurance that covers medical evacuation; see {GD("travel-insurance-sumba", "travel insurance for Sumba")}.</li><li>Ask a travel doctor about vaccinations and malaria; see {GD("mosquitoes-in-sumba", "mosquitoes in Sumba")}.</li><li>Carry a basic first-aid kit, oral rehydration salts and plasters for coral cuts.</li><li>Save your hosts' and driver's numbers.</li></ul>
<p>See also {GD("health-safety", "health and safety in Sumba")} and the services layer on the {MAP}.</p>""",
 "faq": [["Are there hospitals in Sumba?", "Yes, in the main towns, with community health centres (puskesmas) in the districts. Care is basic compared with Bali."],
         ["What should I do in a medical emergency in Sumba?", "Go to the nearest hospital, contact your travel insurer early and follow their advice on evacuation if needed."]]},
]
