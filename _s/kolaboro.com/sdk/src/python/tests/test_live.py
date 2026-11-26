"""Tests against production: python -m unittest discover -s tests (set KOLABORO_BASE to test another host)."""
import json, os, unittest, urllib.request

import kolaboro
from kolaboro import Kolaboro, KolaboroError, KolaboroSignatureError

BASE = os.environ.get('KOLABORO_BASE', 'https://kolaboro.com')


class Live(unittest.TestCase):
    k = Kolaboro(BASE)

    def test_version(self):
        self.assertEqual(kolaboro.__version__, '0.1.0')

    def test_stats_signed(self):
        s = self.k.stats()
        self.assertGreater(s['projects'], 0)
        self.assertEqual(self.k.last['signature'], {'checked': True, 'ok': True, 'kid': self.k.last['signature']['kid']})
        self.assertTrue(self.k.last['signature']['ok'])

    def test_project_shape(self):
        p = self.k.project('BALI-014')['project']
        for f in ('id', 'market', 'country', 'score', 'max', 'checks', 'verification', 'claims', 'url'):
            self.assertIn(f, p)

    def test_filter(self):
        l = self.k.projects(market='Bali', limit=50)
        self.assertTrue(l['projects'] and all(p['market'] == 'Bali' for p in l['projects']))

    def test_all_projects(self):
        self.assertEqual(sum(1 for _ in self.k.all_projects()), self.k.stats()['projects'])

    def test_404(self):
        with self.assertRaises(KolaboroError) as c:
            self.k.project('NOPE-000')
        self.assertEqual(c.exception.status, 404)

    def test_tampered_refused(self):
        bad = Kolaboro(BASE)
        real = bad._get
        bad._get = lambda url, h: (lambda s, b, hd: (s, b.replace(b'"projects": ', b'"projects": 1'), hd))(*real(url, h))
        with self.assertRaises(KolaboroSignatureError):
            bad.stats()

    def test_unsigned_refused(self):
        bad = Kolaboro(BASE)
        real = bad._get
        bad._get = lambda url, h: (lambda s, b, hd: (s, b, {k: v for k, v in hd.items() if k != 'x-kolaboro-signature'}))(*real(url, h))
        with self.assertRaises(KolaboroSignatureError):
            bad.stats()

    def test_merkle_proof(self):
        self.assertTrue(self.k.verify_project('BALI-014')['ok'])

    def test_checkpoint(self):
        c = self.k.checkpoint()
        self.assertTrue(c['ok'])
        self.assertEqual(c['origin'], 'kolaboro.com/log')

    def test_audit_log(self):
        a = self.k.audit_log()
        self.assertTrue(a['ok'], a)

    def test_vectors(self):
        V = json.load(urllib.request.urlopen(urllib.request.Request(BASE + '/open/test-vectors.json', headers={'user-agent': 'kolaboro-python-tests'}), timeout=30))
        s = V['signature']
        self.assertTrue(kolaboro.verify.verify_signature(s['body'], s['signature']))
        self.assertFalse(kolaboro.verify.verify_signature(s['body'] + ' ', s['signature']))


if __name__ == '__main__':
    unittest.main()
