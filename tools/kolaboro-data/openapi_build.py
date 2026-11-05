#!/usr/bin/env python3
"""Build the OpenAPI 3.1 description of Kolaboro's public API from the hand-written list of operations below (paths and
parameters read from the worker modules) and response schemas inferred from LIVE responses (kd_infer.py).

Usage: openapi_build.py <out openapi.json> [<samples dir>]
Every operation is called once with its example values; the response schema is derived from what came back, and the example
response stored in the spec is a trimmed copy of it. An operation whose example call fails is reported and the build stops,
so the spec never documents a response nobody has seen. Rebuild by hand when endpoints change; the daily job
(build.py) only checks the live API against this file, it does not rewrite it."""
import json, os, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kd_infer import schema_for

BASE = 'https://kolaboro.com'
SANDBOX = 'kb_sandbox_public'

def P(name, where='query', desc='', example=None, required=False, typ='string', enum=None, pattern=None):
    s = {'type': typ}
    if enum: s['enum'] = enum
    if pattern: s['pattern'] = pattern
    p = {'name': name, 'in': where, 'required': required or where == 'path', 'description': desc, 'schema': s}
    if example is not None: p['example'] = example
    return p

ID = lambda ex='BALI-014', d='Anonymous project id as in /data/bali-cases.json, e.g. BALI-014.': P('id', 'path', d, ex, pattern='^[A-Za-z0-9 -]{3,20}$')
SHA = lambda ex: P('sha256', 'path', 'SHA-256 of the file, 64 hex characters.', ex, pattern='^[0-9a-fA-F]{64}$')
Z64 = '0' * 64
FILTERS = [P('market', desc='Market name, exact (case-insensitive), e.g. Bali.', example='Bali'), P('country', desc='Country name, exact (case-insensitive).'),
           P('stage', desc='Public stage.', enum=['off-plan', 'under construction', 'completed']), P('min_public', desc='Minimum number of the six checks that are public (0-6).', typ='integer'),
           P('min_confirmed', desc='Minimum number of checks confirmed by a register or independent source (0-6).', typ='integer'), P('all_six', desc='1 = only projects with all six checks public and no flags.', enum=['1']),
           P('flags', desc='1 = only projects with public problems, 0 = only without.', enum=['0', '1']), P('limit', desc='Page size, 1 to 1000 (default 1000).', example='5', typ='integer'), P('offset', desc='Rows to skip.', typ='integer')]
LATLNG = [P('lat', desc='Latitude in degrees (rounded to about 10 m by the server).', example='-8.638', required=True, typ='number'), P('lng', desc='Longitude in degrees.', example='115.115', required=True, typ='number')]

T_OPEN, T_LOG, T_FEED, T_PART, T_MKT, T_PROJ, T_LAND, T_TRUST, T_DATA = 'Open data', 'Public log and proofs', 'Feeds', 'Partner risk feed', 'Market statistics', 'Per project', 'Land and climate', 'Trust and provenance', 'Data catalog'

# (tag, path, summary, description, parameters, example path values, options)
OPS = [
 (T_OPEN, '/api/open', 'API index', 'Every open endpoint with a one-line description, licence and the anonymity rule.', [], {}, {}),
 (T_OPEN, '/api/open/stats', 'Database totals', 'Projects, markets, countries, claims tested and verification levels, from /data/bali-cases.json.', [], {}, {}),
 (T_OPEN, '/api/open/summary', 'Site summary', 'Totals, latest Bitcoin seal and the latest shipping log entries.', [], {}, {}),
 (T_OPEN, '/api/open/projects', 'List projects', 'Anonymous projects with their six public checks, filtered. Scores describe what is public, not whether it is genuine.', FILTERS, {}, {}),
 (T_OPEN, '/api/open/projects.csv', 'List projects as CSV', 'Same filters as /api/open/projects, one row per project.', FILTERS, {}, {'text': 'text/csv'}),
 (T_OPEN, '/api/open/projects/{id}', 'One project', 'One anonymous project with the questions to ask, flags and notes.', [ID()], {'id': 'BALI-014'}, {'404': True}),
 (T_OPEN, '/api/open/projects/{id}/at/{day}', 'One project on a past day', 'The project as published on a past day, from the daily snapshot, with whether the snapshot matches that day\'s public log line.',
  [ID(), P('day', 'path', 'Day, YYYY-MM-DD. Snapshots start on 2026-11-03.', '2026-11-04', pattern='^\\d{4}-\\d{2}-\\d{2}$')], {'id': 'BALI-014', 'day': '2026-11-04'}, {}),
 (T_OPEN, '/api/open/markets', 'Markets and transparency index', 'Per-market statistics and the transparency index (0-100, markets with 3 or more projects).', [], {}, {}),
 (T_OPEN, '/api/open/markets.csv', 'Markets as CSV', 'Same as /api/open/markets, CSV.', [], {}, {'text': 'text/csv'}),
 (T_OPEN, '/api/open/changes', 'Recorded changes', 'Every recorded change to a project field since a date, newest first (at most 2000).', [P('since', desc='YYYY-MM-DD; default 7 days ago.', example='2026-11-01')], {}, {}),
 (T_OPEN, '/api/open/freshness', 'Project re-read freshness', 'Share of projects re-read from their source in the last 7 days, per market, against the 90% objective.', [], {}, {}),
 (T_OPEN, '/api/open/evals', 'AI desk review evaluation', 'Daily evaluation of the AI desk review on fixed fictional pages, case by case.', [], {}, {}),
 (T_OPEN, '/api/open/uptime', 'Uptime probes', 'Uptime probes every 5 minutes from outside Cloudflare.', [], {}, {}),
 (T_OPEN, '/api/open/build', 'Serving build', 'Which code commit is serving this API.', [], {}, {}),
 (T_OPEN, '/api/open/ai-spend', 'AI spend', 'Estimated daily spend of the website AI features and the daily cap that stops them.', [], {}, {}),
 (T_OPEN, '/api/open/security', 'Security summary', 'Latest weekly security scan summary and decoy credentials touched.', [], {}, {}),
 (T_OPEN, '/api/open/pdf/{sha256}', 'Case-file PDF registry', 'Is this case-file PDF exactly as Kolaboro created it? Looks up the registered SHA-256.', [SHA(Z64)], {'sha256': Z64}, {}),
 (T_OPEN, '/api/open/badge/{id}.svg', 'Project badge', 'Live SVG badge for a project (public and confirmed checks).', [ID()], {'id': 'BALI-014'}, {'text': 'image/svg+xml'}),
 (T_OPEN, '/api/open/openapi.json', 'Short OpenAPI description', 'The short OpenAPI description served by the open API itself. The complete one is /docs/api/openapi.json.', [], {}, {}),
 (T_LOG, '/api/open/log', 'Public log', 'The append-only public log: one hash-chained head per day, each timestamped in Bitcoin and recorded in Sigstore Rekor.', [], {}, {}),
 (T_LOG, '/api/open/log-input', 'Today\'s log input', 'What goes into today\'s log head: dataset SHA-256 and the Merkle root of page fingerprints.', [], {}, {}),
 (T_LOG, '/api/open/checkpoint', 'Signed checkpoint', 'Signed checkpoint of the public log (C2SP signed note): tree size and Merkle root of all daily heads.', [], {}, {'text': 'text/plain'}),
 (T_LOG, '/api/open/log-proof', 'Inclusion proof', 'Inclusion proof of one daily head in the checkpoint tree.', [P('day', desc='YYYY-MM-DD of a logged day.', example='2026-11-04', required=True), P('tree_size', desc='Tree size to prove against (default: current).', typ='integer')], {}, {}),
 (T_LOG, '/api/open/log-consistency', 'Consistency proof', 'RFC 9162 consistency proof: the tree of size second extends the tree of size first unchanged.', [P('first', desc='Older tree size (1 or more).', example='1', required=True, typ='integer'), P('second', desc='Newer tree size (default: current).', example='2', typ='integer')], {}, {}),
 (T_LOG, '/api/open/proof/{id}', 'Project fingerprint proof', 'Merkle inclusion proof that a project page fingerprint is in the daily root recorded in the public log.', [ID()], {'id': 'BALI-014'}, {'404': True}),
 (T_LOG, '/api/open/receipt/{evidence_id}', 'Evidence receipt', 'Signed receipt for one piece of site evidence: SHA-256, position in the case hash chain and times. 404 when the id does not exist.', [P('evidence_id', 'path', 'Numeric evidence id.', '1', pattern='^\\d{1,12}$')], {'evidence_id': '1'}, {'expect': 404}),
 (T_FEED, '/feed.json', 'Shipping log (JSON Feed)', 'Shipping log as JSON Feed 1.1. With ?market= it lists changes and alerts for one market or country instead.', [P('market', desc='Market or country name.')], {}, {}),
 (T_FEED, '/feed.xml', 'Shipping log (RSS)', 'Same as /feed.json, RSS 2.0.', [P('market', desc='Market or country name.', example='Bali')], {}, {'text': 'application/rss+xml'}),
 (T_FEED, '/feed/alerts.xml', 'Alerts (RSS)', 'Overdue, stalled and unapproved projects across all markets, RSS 2.0.', [], {}, {'text': 'application/rss+xml'}),
 (T_PART, '/api/x/z/feed', 'Partner feed index', 'Index of the partner risk feed. No key needed.', [], {}, {}),
 (T_PART, '/api/x/z/feed/projects', 'Risk fields per project', 'Risk fields per anonymous project id, cursor-paginated and signed. Needs x-api-key; the public sandbox key kb_sandbox_public returns small pages.',
  [P('limit', desc='Page size (1-500 with a live key; the sandbox key is capped lower).', example='2', typ='integer'), P('cursor', desc='next_cursor from the previous page.'), P('ids', desc='Comma separated project ids, up to 100.'), P('market', desc='Market or country name.')], {}, {'auth': True}),
 (T_PART, '/api/x/z/feed/changes', 'Changes, oldest first', 'Every recorded change to a project field, oldest first, cursor-paginated and signed. Needs x-api-key.',
  [P('since', desc='YYYY-MM-DD, inclusive.', example='2026-11-01'), P('limit', desc='Page size.', example='2', typ='integer'), P('cursor', desc='next_cursor from the previous page.')], {}, {'auth': True}),
 (T_PART, '/api/x/z/feed/status', 'Feed status', 'Which sources are present and which limits apply. No key needed.', [], {}, {}),
 (T_PART, '/api/x/z/feed/schema.json', 'Feed JSON Schema', 'JSON Schema (2020-12) of both feed answers. No key needed.', [], {}, {}),
 (T_MKT, '/api/x/v', 'Delay index module index', 'Endpoints of the market statistics module.', [], {}, {}),
 (T_MKT, '/api/x/v/delays', 'Delivery delay index', 'The delivery-delay index, all markets or one (from /data/delay-index.json).', [P('market', desc='Market name.', example='Bali')], {}, {}),
 (T_MKT, '/api/x/v/press', 'Monthly press release', 'The latest monthly press release as JSON.', [], {}, {}),
 (T_MKT, '/api/x/r/price-index', 'Asking-price index', 'The chained asking-price index, all markets or one market with its steps. Advertised prices, not transactions.', [P('market', desc='Market name.', example='Bali')], {}, {}),
 (T_MKT, '/api/x/h/prices', 'Advertised versus registered prices', 'Advertised prices versus officially registered sales (from /data/price-reality.json).', [P('market', desc='Market name, e.g. Dubai.')], {}, {}),
 (T_MKT, '/api/x/h/risk', 'Risk-pattern model card', 'Model card and summary of the risk-pattern model (from /data/risk.json). It ranks; it does not predict.', [], {}, {}),
 (T_MKT, '/api/x/h/registers', 'Checkable registers', 'Which official registers can be checked automatically (from /data/register-checks.json).', [], {}, {}),
 (T_MKT, '/api/x/w/graph-global', 'GLEIF company graph summary', 'Coverage, method and per-market shares of the GLEIF company graph. Counts only, no company names.', [], {}, {}),
 (T_MKT, '/api/x/w/insolvency/watch', 'Insolvency watch summary', 'Daily insolvency watch: anonymised counts per market and project.', [], {}, {}),
 (T_MKT, '/api/x/q/graph', 'Company graph summary', 'Company and director graph: coverage, method, per-project summaries (from /data/company-graph.json).', [], {}, {}),
 (T_MKT, '/api/x/q/mystery-shopper', 'Mystery shopper programme', 'Questionnaire, measurement and status of the mystery shopper programme.', [], {}, {}),
 (T_MKT, '/api/x/r/visual', 'Visual change watch summary', 'Summary of /data/visual-diff.json: method, limits, totals, recent changes. Geometry only, no images.', [], {}, {}),
 (T_MKT, '/api/x/x/fx', 'ECB exchange rates', 'European Central Bank euro reference rates for the requested currencies, relayed and trimmed (units per 1 EUR). AED is derived from the USD peg and flagged.',
  [P('c', desc='Comma separated ISO currency codes.', example='IDR,USD', required=True), P('from', desc='Start date YYYY-MM-DD.', example='2026-10-01')], {}, {}),
 (T_PROJ, '/api/x/d/project/{id}', 'Website age and promise drift', 'Website age (RDAP and Certificate Transparency, month precision) and day-by-day promise drift for one project.', [ID()], {'id': 'BALI-014'}, {}),
 (T_PROJ, '/api/x/h/project/{id}', 'Price position and risk pattern', 'One project\'s price position, risk-pattern explanation and register result.', [ID()], {'id': 'BALI-014'}, {}),
 (T_PROJ, '/api/x/q/graph/{id}', 'Anonymised company graph', 'One project\'s anonymised company graph (nodes, edges, summary).', [ID('BHX-001')], {'id': 'BHX-001'}, {}),
 (T_PROJ, '/api/x/w/graph-global/{id}', 'Anonymised LEI summary', 'One project\'s anonymised GLEIF summary.', [ID()], {'id': 'BALI-014'}, {}),
 (T_PROJ, '/api/x/w/insolvency/watch/{id}', 'Insolvency watch result', 'One project\'s insolvency watch result.', [ID('BHX-001')], {'id': 'BHX-001'}, {}),
 (T_PROJ, '/api/x/r/visual/{id}', 'Visual change history', 'One project\'s visual change history (geometry only, no images).', [ID('CDS-014')], {'id': 'CDS-014'}, {}),
 (T_PROJ, '/api/x/v/on-time', 'On-time odds', 'One project\'s on-time status and odds, or "not enough comparable projects".', [P('id', desc='Project id.', example='BALI-014', required=True)], {}, {}),
 (T_PROJ, '/api/x/y/promises', 'Dated developer promises', 'Dated developer promises for one anonymous project (from /data/promises.json).', [P('id', desc='Project id.', example='BALI-001', required=True)], {}, {}),
 (T_PROJ, '/api/x/t/reports', 'Approved buyer reports', 'Approved buyer reports for a project, anonymised.', [P('project', desc='Project id.', example='BALI-014', required=True)], {}, {}),
 (T_LAND, '/api/x/p/hazards', 'Natural hazards at a point', 'Elevation, flood depth, earthquakes, tsunamis, volcanoes and coastline distance at a point, read live from open sources with source, licence and limits.', LATLNG, {}, {'slow': True}),
 (T_LAND, '/api/x/u/climate', 'Flood depth under climate scenarios', '100-year river and coastal flood depth at a point: baseline, 2030 and 2050 under RCP4.5 and RCP8.5 (WRI Aqueduct Floods v2).', LATLNG, {}, {'slow': True}),
 (T_LAND, '/api/x/u/protected', 'Protected land and mangroves', 'Protected areas and mangroves at or within 1 km of a point (OpenStreetMap via Overpass, Global Mangrove Watch 2020).', LATLNG, {}, {'slow': True}),
 (T_LAND, '/api/x/g/status', 'Satellite status', 'What the on-demand satellite tools use and whether the optical series is published.', [], {}, {}),
 (T_TRUST, '/api/x/o/slo', 'Service level objectives', 'Service level objectives and remaining error budgets, computed at request time.', [], {}, {}),
 (T_TRUST, '/api/x/l/trust', 'Trust center controls', 'Controls mapped to SOC 2 criteria (not audited), each with live status and evidence links.', [], {}, {}),
 (T_TRUST, '/api/x/n', 'Provenance index', 'Site manifest, reproducible builds and number provenance registry endpoints.', [], {}, {}),
 (T_TRUST, '/api/x/e/parquet-manifest', 'Signed Parquet manifest', 'The Parquet export\'s manifest, re-hashed against the published files and signed.', [], {}, {}),
 (T_TRUST, '/api/x/z/bundle/{sha256}', 'Evidence bundle lookup', 'Is this evidence bundle PDF registered or timestamped (OpenTimestamps)?', [SHA(Z64)], {'sha256': Z64}, {}),
 (T_DATA, '/api/x/data', 'Data catalog module index', 'Endpoints of the data catalog module.', [], {}, {}),
 (T_DATA, '/api/x/data/freshness', 'Dataset freshness', 'For every public dataset: freshness target from its workflow schedule, age measured now from the file\'s own timestamp, and status (ok, late or no target).', [], {}, {}),
 (T_DATA, '/api/x/data/schema/{dataset}', 'Data contract of one dataset', 'The JSON Schema (2020-12) of one dataset, cut out of /data/schemas/kolaboro-data.schema.json.', [P('dataset', 'path', 'Dataset id from /data/catalog.json.', 'bali-cases')], {'dataset': 'bali-cases'}, {}),
 (T_DATA, '/api/x/data/openapi.json', 'This OpenAPI description', 'The complete OpenAPI 3.1 description (same bytes as /docs/api/openapi.json).', [], {}, {'skip_schema': True}),
]

CA = os.environ.get('SSL_CERT_FILE')

def call(url, auth=False, timeout=60):
    req = urllib.request.Request(url, headers={'user-agent': 'KolaboroOpenAPIBuild/1.0 (+https://kolaboro.com/docs/api/)', 'accept': '*/*', **({'x-api-key': SANDBOX} if auth else {})})
    t = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r: return r.status, r.headers.get('content-type', ''), r.read(), time.time() - t
    except urllib.error.HTTPError as e: return e.code, e.headers.get('content-type', ''), e.read(), time.time() - t


def trim(v, depth=0):
    """Small example: first 2 items of arrays, first 3 entries of large maps, long strings cut."""
    if isinstance(v, list): return [trim(x, depth + 1) for x in v[:2]]
    if isinstance(v, dict):
        ks = list(v.keys())
        if len(ks) > 25: ks = ks[:3]
        return {k: trim(v[k], depth + 1) for k in ks}
    if isinstance(v, str) and len(v) > 300: return v[:300] + '...'
    return v


def example_url(path, params, pvals):
    u = path
    for k, v in pvals.items(): u = u.replace('{' + k + '}', v)
    q = [(p['name'], p['example']) for p in params if p['in'] == 'query' and p.get('example') is not None]
    return BASE + u + ('?' + '&'.join(f'{k}={urllib.request.quote(str(v), safe=",")}' for k, v in q) if q else '')


def op_id(path):
    s = path.strip('/').replace('api/open', 'open').replace('api/x/', 'x_').replace('{', '').replace('}', '').replace('.', '_')
    return ''.join(c if c.isalnum() else '_' for c in s).strip('_') or 'root'


def main(out, samples=None):
    stamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    paths, problems = {}, []
    sample_out = {}
    for tag, path, summary, desc, params, pvals, opt in OPS:
        if os.environ.get('KD_SKIP_TAG') == tag: continue
        url = example_url(path, params, pvals)
        if opt.get('skip_schema'):
            st, ct, body = 200, 'application/json', None
        else:
            st, ct, body, secs = call(url, opt.get('auth'), 120 if opt.get('slow') else 60)
            want = opt.get('expect', 200)
            if st != want: problems.append(f'{path}: example {url} answered {st}, expected {want}'); continue
            print(f'{st} {secs:5.2f}s {len(body):8d} {url}', file=sys.stderr)
        resp = {}
        if opt.get('skip_schema'):
            resp['200'] = {'description': 'The OpenAPI document.', 'content': {'application/json': {'schema': {'type': 'object'}}}}
        elif opt.get('text'):
            mt = opt['text']
            ex = body.decode('utf-8', 'replace')[:600]
            resp[str(st)] = {'description': 'OK', 'content': {mt: {'schema': {'type': 'string'}, 'example': ex}}}
        else:
            doc = json.loads(body)
            sch = schema_for(doc); sch.pop('$schema', None)
            resp[str(st)] = {'description': 'OK' if st == 200 else 'Not found', 'content': {'application/json': {'schema': sch, 'example': trim(doc)}}}
            if samples is not None: sample_out[path] = {'url': url, 'status': st}
        if opt.get('404') or any(p['in'] == 'path' for p in params) and '404' not in resp:
            resp.setdefault('404', {'description': 'Unknown id or path.', 'content': {'application/json': {'schema': {'$ref': '#/components/schemas/Error'}}}})
        if opt.get('auth'):
            resp['401'] = {'description': 'Missing or invalid x-api-key.', 'content': {'application/json': {'schema': {'$ref': '#/components/schemas/Error'}}}}
            resp['429'] = {'description': 'Rate limit or daily quota reached.', 'content': {'application/json': {'schema': {'$ref': '#/components/schemas/Error'}}}}
        o = {'tags': [tag], 'summary': summary, 'description': desc, 'operationId': op_id(path), 'parameters': params, 'responses': resp,
             'x-kolaboro-example-url': url, 'x-kolaboro-checked': stamp}
        if opt.get('auth'): o['security'] = [{'apiKey': []}]
        paths[path] = {'get': o}
    if problems:
        print('\n'.join(problems), file=sys.stderr); sys.exit(1)
    spec = {
        'openapi': '3.1.0',
        'jsonSchemaDialect': 'https://spec.openapis.org/oas/3.1/dialect/base',
        'info': {'title': 'Kolaboro public API', 'version': stamp[:10],
                 'summary': 'Open data on tracked off-plan property projects (anonymous), public log proofs, market statistics and the partner risk feed.',
                 'description': ('Read-only HTTP API of kolaboro.com. Projects are anonymous until verification is complete and the developer has had 10 working days to reply. '
                                 'Scores describe what is public about a project, not whether it is genuine. Open endpoints need no key and are cached at the edge (usually 10 minutes). '
                                 'Answers of /api/open/* and the partner feed are signed: x-kolaboro-signature is base64 Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of the body, '
                                 'key id in x-kolaboro-key-id, public keys at https://kolaboro.com/.well-known/kolaboro-keys.json. '
                                 'Response schemas in this file were inferred from live responses on the date in x-kolaboro-checked and are checked against the live API every day by the '
                                 'Kolaboro data catalog job (results: https://kolaboro.com/data/#contracts). They describe what the API returned, which can grow over time.'),
                 'license': {'name': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', 'identifier': 'CC-BY-4.0'},
                 'contact': {'name': 'Kolaboro', 'url': 'https://kolaboro.com/about'}},
        'externalDocs': {'description': 'Data catalog, contracts and freshness', 'url': 'https://kolaboro.com/data/'},
        'servers': [{'url': BASE}],
        'tags': [{'name': t} for t in [T_OPEN, T_LOG, T_FEED, T_PART, T_MKT, T_PROJ, T_LAND, T_TRUST, T_DATA]],
        'paths': paths,
        'components': {
            'securitySchemes': {'apiKey': {'type': 'apiKey', 'in': 'header', 'name': 'x-api-key', 'description': 'Free key from https://kolaboro.com/api-keys/ (kb_live_...), or the public sandbox key kb_sandbox_public (small pages, hourly limit per IP address).'}},
            'schemas': {'Error': {'type': 'object', 'properties': {'error': {'type': 'string'}}, 'required': ['error']}}},
    }
    with open(out, 'w') as f: json.dump(spec, f, indent=1, ensure_ascii=False); f.write('\n')
    print(f'{len(paths)} operations written to {out}', file=sys.stderr)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
