#!/usr/bin/env python3
"""Kolaboro restore drill: proves the newest daily backup can be restored into an EMPTY Postgres.
Loads every table of the newest backups/YYYY-MM-DD.json.gz into its own table (one jsonb row per record, in order),
reads it all back and checks: row count per table, SHA-256 of the canonical JSON of the rows read back equals the
SHA-256 computed from the backup file, and every evidence file the snapshot references exists in backups/files with
bytes that hash to its name. Writes counts and hashes only (never row contents) to OUT.
Usage: restore_drill.py BACKUPDIR OUT.json   Env: PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE (psql must be on PATH)"""
import csv, datetime, gzip, hashlib, io, json, os, re, subprocess, sys, time

t0 = time.time()
bdir, out = sys.argv[1], sys.argv[2]
snaps = sorted(x for x in os.listdir(bdir) if re.fullmatch(r'\d{4}-\d{2}-\d{2}\.json\.gz', x))
if not snaps: raise SystemExit('no backups found')
bfile = snaps[-1]
raw = open(os.path.join(bdir, bfile), 'rb').read()
snap = json.loads(gzip.decompress(raw))

def canon(rows):
    return hashlib.sha256(json.dumps(rows, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()).hexdigest()

def psql(sql, stdin=None):
    r = subprocess.run(['psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-At', '-c', sql], input=stdin,
                       capture_output=True, text=True)
    if r.returncode: raise SystemExit('psql failed: ' + r.stderr[-500:].replace('\n', ' '))
    return r.stdout

# 1. Postgres must start empty: no user tables at all
existing = psql("select count(*) from information_schema.tables where table_schema not in ('pg_catalog','information_schema')").strip()
if existing != '0': raise SystemExit('target database is not empty')

tables, rows_total, data_ok = [], 0, True
for name, rows in snap.items():
    if not (rows is None or isinstance(rows, list)): continue  # scalar metadata such as "at"
    rows = rows or []  # null in the backup means an empty table
    tbl = 'kb_' + re.sub(r'[^a-z0-9_]', '_', name.lower())
    psql(f'create table {tbl} (ord integer primary key, row jsonb not null)')
    buf = io.StringIO(); w = csv.writer(buf, lineterminator='\n')
    for i, r in enumerate(rows): w.writerow([i, json.dumps(r, ensure_ascii=False)])
    if rows: psql(f'\\copy {tbl} (ord, row) from stdin with (format csv)', buf.getvalue())
    n = int(psql(f'select count(*) from {tbl}').strip())
    back = [json.loads(line) for line in psql(f'select row::text from {tbl} order by ord').splitlines() if line]
    ok = n == len(rows) == len(back) and canon(back) == canon(rows)
    data_ok &= ok; rows_total += n
    tables.append({'name': name, 'rows': n, 'ok': ok})

# 2. Evidence files: every file the snapshot references by sha256 (files_index, and evidence rows that carry a file)
refs = {}
for r in snap.get('files_index') or []: refs[r['sha256']] = r.get('bytes')
for r in snap.get('evidence') or []:
    if r.get('file_id') is not None and r.get('sha256'): refs.setdefault(r['sha256'], None)
fdir = os.path.join(bdir, 'files')
byname = {f.split('.')[0]: f for f in os.listdir(fdir)} if os.path.isdir(fdir) else {}
missing = bad = 0
for h, size in sorted(refs.items()):
    f = byname.get(h)
    if not f: missing += 1; continue
    b = open(os.path.join(fdir, f), 'rb').read()
    if hashlib.sha256(b).hexdigest() != h or (size is not None and size != len(b)): bad += 1
evidence_ok = missing == 0 and bad == 0

date = bfile[:10]
res = {
    'date': date,
    'drill_at': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'backup_file': bfile,
    'backup_sha256': hashlib.sha256(raw).hexdigest(),
    'backup_age_days': (datetime.date.today() - datetime.date.fromisoformat(date)).days,
    'postgres': psql('show server_version').strip(),
    'tables': tables,
    'rows_total': rows_total,
    'evidence_files_checked': len(refs),
    'evidence_missing': missing,
    'evidence_bad_hash': bad,
    'evidence_ok': evidence_ok,
    'ok': data_ok and evidence_ok and bool(tables),
    'duration_s': round(time.time() - t0, 2),
}
json.dump(res, open(out, 'w'), indent=1)
print(json.dumps(res))
if not res['ok']: raise SystemExit(1)
