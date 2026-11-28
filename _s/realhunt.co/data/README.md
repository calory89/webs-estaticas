# RealHunt open data

Updated 2026-11-28. Licence: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Photos belong to the original listings and are not part of these files.
Suggested credit: "Source: RealHunt (realhunt.co), CC BY 4.0", with a link to the page or file you used.
Rules, taxes and costs are general information, not legal or tax advice. Description of every file for programs: https://realhunt.co/openapi.json

## Files

| File | Size | What it is |
|---|---|---|
| https://realhunt.co/data/homes.jsonl | 802 KB | Every home, one JSON object per line (the first line describes the file) |
| https://realhunt.co/data/homes.csv | 274 KB | Every home, one row each, for spreadsheets |
| https://realhunt.co/data/countries.json | 30 KB | Every country: homes, median, cheapest, buying costs, rule for foreigners |
| https://realhunt.co/data/countries/index.json | 9 KB | Countries and the address of each country file |
| https://realhunt.co/data/costs.json | 44 KB | Buying costs and yearly taxes by country, with sources |
| https://realhunt.co/data/can-i-buy.json | 13 KB | Who can buy where, by nationality group |
| https://realhunt.co/data/glossary.json | 37 KB | Words of a home purchase by country (schema.org DefinedTermSet) |
| https://realhunt.co/data/realhunt-homes.geojson | 309 KB | Every home with coordinates, as GeoJSON points |
| https://realhunt.co/data/realhunt-best-homes.kml | 58 KB | The ten best-scored homes of each country (KML) |
| https://realhunt.co/data/changed-today.txt | 164 KB | Pages added or changed in today's build, one address per line |
| https://realhunt.co/research/homes.csv | 114 KB | Every home with airport distance and flood indicator |
| https://realhunt.co/research/removed-homes.json | 41 KB | Homes taken off the site and price changes, with dates |
| https://realhunt.co/research/removed-by-month.json | 1 KB | How many homes left the site or changed price, month by month |
| https://realhunt.co/research/monthly-series.json | 1 KB | One reading per month: homes, countries, median price |
| https://realhunt.co/research/property-portals.csv | 12 KB | Property portals by country |
| https://realhunt.co/feeds/price-drops.json | 4 KB | Price drops, newest first (JSON Feed) |
| https://realhunt.co/feeds/removed.json | 44 KB | Homes taken off the site, newest first (JSON Feed) |
| https://realhunt.co/press/realhunt-in-figures.pdf | 4 KB | RealHunt in figures: one page for the press, this month (the same file is kept as realhunt-in-figures-YYYY-MM.pdf) |
| https://realhunt.co/llms.txt | 22 KB | Short index for AI assistants |
| https://realhunt.co/llms-full.txt | 1.8 MB | The reference text of the site in one file |

## Fields of a home (homes.jsonl, homes.csv)

| Field | Meaning |
|---|---|
| url, slug | The page of the home on RealHunt |
| title, title_es | Short title in English and in Spanish |
| country, region, place | Where it is, as the listing gives it |
| lat, lng | Rounded to 3 decimals (about 100 m): an area, not the door |
| price_eur | Asking price in euros, from the original listing |
| size_sqm, eur_per_sqm, bedrooms | As the listing gives them; empty when it does not |
| score, score_summary | RealHunt's own grade against every other home on the site (not a valuation) |
| added | Day the home was added |
| state | listed, unconfirmed (our nightly check could not confirm the advert for 30 days) or advert_offline |
| last_confirmed | Last day our nightly check read the advert as still for sale |
| listed_on | Domain of the original listing |
| monthly_fee, yearly_tax, costs_currency | Community fee (HOA) per month and property tax per year as the listing states them, in costs_currency; empty when not stated |
| fee_unknown | true for a flat whose listing does not state its community fee |
| flood_indicator, noise_indicator | low, medium or high: our rough indicators (height, distance to sea and rivers, motorways and railways), not official maps |
| airport_km | Straight-line distance to the nearest airport |

Sources of the indicators: OpenStreetMap and OurAirports (open data). The full method: https://realhunt.co/method and https://realhunt.co/how-we-check-homes
