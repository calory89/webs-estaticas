"""kolaboro: official Python client for the Kolaboro open data API, with built-in Ed25519 signature checks.

    from kolaboro import Kolaboro
    k = Kolaboro()
    print(k.stats()['projects'], k.last['signature'])   # every answer is signature-checked before you get it
    print(k.audit_log()['ok'])                          # the whole public log, re-verified on your machine

Docs: https://kolaboro.com/docs/sdk/   Licence: MIT. Data licence: CC BY 4.0, credit Kolaboro.
"""
from .client import VERSION, PINNED_KEYS, Kolaboro, KolaboroError, KolaboroSignatureError
from . import _verify as verify

__version__ = VERSION
__all__ = ['Kolaboro', 'KolaboroError', 'KolaboroSignatureError', 'verify', 'PINNED_KEYS', '__version__']
