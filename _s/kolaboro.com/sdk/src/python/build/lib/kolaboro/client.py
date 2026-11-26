"""Client for the Kolaboro open data API (https://kolaboro.com/api/open). Standard library only.

Every JSON answer of /api/open/* is signed with Ed25519 (header x-kolaboro-signature). By default the client checks
the signature before returning data and raises KolaboroSignatureError when it is missing or wrong. The checks are
kolaboro_verify.py (https://kolaboro.com/open/kolaboro_verify.py), bundled unchanged as kolaboro._verify.
"""
from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Iterator, List, Optional

from . import _verify as V
from .types import (AuditReport, Changes, Checkpoint, Freshness, Log, LogConsistency, LogProof, Markets, Project, ProjectDetail,
                    ProjectList, Proof, ResponseMeta, Stats)

VERSION = '0.1.0'
# Keys pinned at release. Unknown key ids are looked up once at /.well-known/kolaboro-keys.json.
PINNED_KEYS: List[Dict[str, Any]] = [{'kid': 'kb-f2e04da5878f8c51', 'alg': 'Ed25519', 'public_key_raw_b64': V.PUBLIC_KEY, 'status': 'active'}]


class KolaboroError(Exception):
    def __init__(self, message: str, status: int = 0, body: Any = None):
        super().__init__(message)
        self.status = status
        self.body = body


class KolaboroSignatureError(KolaboroError):
    pass


def _qs(d: Dict[str, Any]) -> str:
    p = {}
    for k, v in d.items():
        if v is None or v == '':
            continue
        p[k] = ('1' if v else '0') if isinstance(v, bool) else str(v)
    return ('?' + urllib.parse.urlencode(p)) if p else ''


def _seg(s: str) -> str:
    return urllib.parse.quote(str(s), safe='')


class Kolaboro:
    """Kolaboro(base_url='https://kolaboro.com', verify=True, api_key=None, timeout=30, retries=2)

    With api_key (from https://kolaboro.com/api-keys/) calls go through the metered endpoint /api/x/k/m/* and count
    against the key's daily quota. Without a key the open endpoints are used; they need no key.
    """

    def __init__(self, base_url: str = 'https://kolaboro.com', verify: bool = True, api_key: Optional[str] = None,
                 timeout: float = 30, retries: int = 2, public_keys: Optional[List[Dict[str, Any]]] = None):
        self.base_url = base_url.rstrip('/')
        self.verify = verify
        self.api_key = api_key
        self.timeout = timeout
        self.retries = retries
        self.keys = {k['kid']: k for k in (public_keys or PINNED_KEYS)}
        self._looked = False
        self.last: Optional[ResponseMeta] = None

    # ---------- data ----------
    def stats(self) -> Stats: return self.json('/stats')
    def summary(self) -> Dict[str, Any]: return self.json('/summary')

    def projects(self, market: Optional[str] = None, country: Optional[str] = None, stage: Optional[str] = None,
                 min_public: Optional[int] = None, min_confirmed: Optional[int] = None, all_six: Optional[bool] = None,
                 flags: Optional[bool] = None, limit: Optional[int] = None, offset: Optional[int] = None) -> ProjectList:
        return self.json('/projects' + _qs(dict(market=market, country=country, stage=stage, min_public=min_public, min_confirmed=min_confirmed,
                                                all_six=all_six, flags=flags, limit=limit, offset=offset)))

    def all_projects(self, **filters: Any) -> Iterator[Project]:
        """Every project matching the filters, 1000 per request."""
        offset = 0
        while True:
            page = self.projects(limit=1000, offset=offset, **filters)
            for p in page['projects']:
                yield p
            offset += len(page['projects'])
            if not page['projects'] or offset >= page['total']:
                return

    def projects_csv(self, **filters: Any) -> str: return self.text('/projects.csv' + _qs(filters))
    def project(self, id: str) -> ProjectDetail: return self.json('/projects/' + _seg(id))
    def project_at(self, id: str, day: str) -> ProjectDetail: return self.json('/projects/' + _seg(id) + '/at/' + _seg(day))
    def markets(self) -> Markets: return self.json('/markets')
    def markets_csv(self) -> str: return self.text('/markets.csv')
    def changes(self, since: str) -> Changes: return self.json('/changes' + _qs({'since': since}))
    def freshness(self) -> Freshness: return self.json('/freshness')
    def evals(self) -> Dict[str, Any]: return self.json('/evals')
    def uptime(self) -> Dict[str, Any]: return self.json('/uptime')
    def ai_spend(self) -> Dict[str, Any]: return self.json('/ai-spend')
    def build(self) -> Dict[str, Any]: return self.json('/build')
    def pdf(self, sha256: str) -> Dict[str, Any]: return self.json('/pdf/' + _seg(sha256))
    def receipt(self, evidence_id: str) -> Dict[str, Any]: return self.json('/receipt/' + _seg(evidence_id))

    # ---------- public log and proofs ----------
    def log(self) -> Log: return self.json('/log')
    def log_input(self) -> Dict[str, Any]: return self.json('/log-input')
    def proof(self, id: str) -> Proof: return self.json('/proof/' + _seg(id))
    def log_proof(self, day: str) -> LogProof: return self.json('/log-proof' + _qs({'day': day}))
    def log_consistency(self, first: int, second: int) -> LogConsistency: return self.json('/log-consistency' + _qs({'first': first, 'second': second}))

    def checkpoint(self) -> Checkpoint:
        """The signed checkpoint (C2SP note) with its note signature checked."""
        note = self.text('/checkpoint', skip_signature=True)
        res = self._try_keys(lambda k: V.verify_checkpoint(note, k['public_key_raw_b64']))
        ok, origin, size, root = res
        if not ok and self.verify:
            raise KolaboroSignatureError('checkpoint signature does not verify', 200)
        return {'note': note, 'ok': ok, 'origin': origin, 'size': size, 'root': root}

    def verify_project(self, id: str) -> Dict[str, Any]:
        """Fetch a project's Merkle proof and recompute it locally."""
        p = self.proof(id)
        return {'ok': V.verify_proof(p), 'proof': p}

    def audit_log(self) -> AuditReport:
        """Every head recomputes and links, the checkpoint is signed, every day is in the tree, the tree only appended."""
        heads = self.log()['heads']
        chain_ok, errors = V.verify_log(heads)
        cp = self.checkpoint()
        included = []
        for h in heads:
            p = self.log_proof(h['day'])
            included.append({'day': h['day'], 'ok': p['root_hash'] == cp['root'] and V.verify_path(p['leaf'], p['path'], cp['root'])})
        consistent = []
        for m in range(1, cp['size'] + 1):
            c = self.log_consistency(m, cp['size'])
            consistent.append({'first': m, 'ok': c['second_root'] == cp['root'] and V.verify_consistency(m, cp['size'], c['first_root'], c['second_root'], c['proof'])})
        size_ok = cp['size'] == len(heads)
        return {'ok': chain_ok and cp['ok'] and size_ok and all(x['ok'] for x in included) and all(x['ok'] for x in consistent),
                'heads': len(heads), 'chain': {'ok': chain_ok, 'errors': errors}, 'checkpoint': {'ok': cp['ok'], 'size': cp['size'], 'root': cp['root']},
                'size_matches': size_ok, 'included': included, 'consistent': consistent}

    # ---------- transport ----------
    def json(self, path: str) -> Any:
        t = self.text(path)
        try:
            return json.loads(t)
        except ValueError:
            raise KolaboroError('not JSON', self.last['status'] if self.last else 0, t[:200])

    def text(self, path: str, skip_signature: bool = False) -> str:
        base = '/api/x/k/m' if self.api_key else '/api/open'
        url = self.base_url + base + path
        headers = {'user-agent': 'kolaboro-python/' + VERSION, 'accept': 'application/json, text/csv, text/plain'}
        if self.api_key:
            headers['x-api-key'] = self.api_key
        status, body, hd = self._get(url, headers)
        text = body.decode('utf-8')
        sig, kid = hd.get('x-kolaboro-signature'), hd.get('x-kolaboro-key-id')
        self.last = {'url': url, 'status': status, 'signature': {'checked': False, 'ok': None, 'kid': kid},
                     'dataset_sha256': hd.get('x-kolaboro-dataset-sha256'), 'build': hd.get('x-kolaboro-build'), 'etag': hd.get('etag')}
        if status >= 400:
            try:
                b: Any = json.loads(text)
            except ValueError:
                b = text
            raise KolaboroError(str(b.get('error')) if isinstance(b, dict) and 'error' in b else 'HTTP %d' % status, status, b)
        if self.verify and not skip_signature:
            if not sig:
                raise KolaboroSignatureError('answer is not signed: ' + url, status)
            ok = self._check(body, sig, kid)
            self.last['signature'] = {'checked': True, 'ok': ok, 'kid': kid}
            if not ok:
                raise KolaboroSignatureError('signature does not verify: ' + url, status)
        return text

    def _check(self, body: bytes, sig: str, kid: Optional[str]) -> bool:
        k = self.keys.get(kid) if kid else None
        if not k and kid and not self._looked:
            self._lookup()
            k = self.keys.get(kid)
        return bool(k) and k.get('status') != 'revoked' and V.verify_signature(body, sig, k['public_key_raw_b64'])

    def _lookup(self) -> None:
        self._looked = True
        try:
            _, b, _ = self._get(self.base_url + '/.well-known/kolaboro-keys.json', {'user-agent': 'kolaboro-python/' + VERSION})
            for k in json.loads(b).get('keys', []):
                if k.get('kid') and k.get('public_key_raw_b64') and k['kid'] not in self.keys:
                    self.keys[k['kid']] = k
        except Exception:
            pass

    def _try_keys(self, fn):
        last = (False, '', 0, '')
        for attempt in (0, 1):
            for k in list(self.keys.values()):
                if k.get('status') == 'revoked':
                    continue
                last = fn(k)
                if last[0]:
                    return last
            if attempt == 0 and not self._looked:
                self._lookup()
            else:
                break
        return last

    def _get(self, url: str, headers: Dict[str, str]):
        err: Any = None
        for i in range(self.retries + 1):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=self.timeout) as r:
                    return r.status, r.read(), {k.lower(): v for k, v in r.headers.items()}
            except urllib.error.HTTPError as e:
                if (e.code == 429 or e.code >= 500) and i < self.retries:
                    time.sleep(0.4 * 3 ** i)
                    continue
                return e.code, e.read(), {k.lower(): v for k, v in e.headers.items()}
            except Exception as e:  # network
                err = e
                if i < self.retries:
                    time.sleep(0.4 * 3 ** i)
        raise KolaboroError('network: %s' % err, 0)
