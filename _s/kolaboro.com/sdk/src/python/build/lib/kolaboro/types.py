"""Typed shapes of the Kolaboro open API answers (TypedDict, for editors and type checkers; not enforced at runtime)."""
from __future__ import annotations

from typing import Any, Dict, List, Optional, TypedDict


class Claims(TypedDict):
    verified: int
    unverified: int
    contradicted: int


class ProjectChecks(TypedDict, total=False):
    permit_public: Optional[bool]
    permit_claimed: Optional[bool]
    deposit_protection: Optional[bool]
    progress: Optional[bool]
    plans: Optional[bool]
    track_record: Optional[bool]
    no_guaranteed_returns: Optional[bool]


class Project(TypedDict, total=False):
    id: str
    market: str
    country: str
    region: Optional[str]
    stage: Optional[str]          # 'off-plan' | 'under construction' | 'completed'
    band: Optional[str]
    done: Any
    title: Optional[str]
    lease: Optional[int]
    units: Optional[int]
    score: int                    # public checks, 0 to 6
    max: int
    vscore: Optional[int]         # checks confirmed by a register or independent source
    tier: Optional[str]
    delay: Optional[int]
    checks: ProjectChecks
    verification: Dict[str, str]  # registry | independent | developer | contradicted | none
    claims: Claims
    flags: int
    all_six_public: bool
    url: str


class Meta(TypedDict, total=False):
    updated: str
    license: str
    note: str


class ProjectList(Meta, total=False):
    total: int
    offset: int
    limit: int
    projects: List[Project]


class ProjectDetail(Meta, total=False):
    project: Project
    questions: List[Any]
    flags: List[Any]
    notes: List[Any]


class Stats(Meta, total=False):
    projects: int
    markets: int
    countries: int
    sources: int
    data_points: int
    claims: Claims
    claims_total: int
    checks_by_level: Dict[str, int]
    stages: Dict[str, int]
    all_six_public: int
    with_flags: int
    overdue: int
    overdue_avg_months: float
    delayed: int


class Market(TypedDict):
    market: str
    country: str
    projects: int
    avg_checks: float
    avg_confirmed: float
    permit_public_pct: int
    deposit_protection_pct: int
    all_six_public: int
    with_flags: int
    transparency_index: int


class Markets(Meta, total=False):
    method: str
    markets: List[Market]


class Change(TypedDict):
    date: str
    project: str
    market: str
    field: str
    to: Any


class Changes(Meta, total=False):
    since: str
    count: int
    changes: List[Dict[str, Any]]


class Freshness(Meta, total=False):
    objective: str
    projects: int
    within_7d: int
    within_30d: int
    pct_7d: float
    meets_objective: bool
    markets: List[Dict[str, Any]]


class LogHead(TypedDict, total=False):
    day: str
    head: str
    prev: Optional[str]
    dataset_sha256: str
    projects_root: str
    projects_count: int
    evidence_root: Optional[str]
    evidence_items: int
    audit_head: Optional[str]
    audit_count: int
    rekor_uuid: Optional[str]


class Log(TypedDict, total=False):
    heads: List[LogHead]
    format: Any


class PathStep(TypedDict):
    side: str  # 'L' | 'R'
    hash: str


class Proof(TypedDict, total=False):
    project: str
    page_fingerprint_date: str
    line: str
    leaf: str
    index: int
    leaves: int
    path: List[PathStep]
    projects_root: str
    dataset_sha256: str
    updated: str
    method: str


class LogProof(TypedDict):
    tree_size: int
    root_hash: str
    leaf_index: int
    leaf: str
    path: List[PathStep]


class LogConsistency(TypedDict, total=False):
    first: int
    second: int
    first_root: str
    second_root: str
    proof: List[str]
    algorithm: str


class Checkpoint(TypedDict):
    note: str
    ok: bool
    origin: str
    size: int
    root: str


class ResponseMeta(TypedDict, total=False):
    url: str
    status: int
    signature: Dict[str, Any]
    dataset_sha256: Optional[str]
    build: Optional[str]
    etag: Optional[str]


class AuditReport(TypedDict, total=False):
    ok: bool
    heads: int
    chain: Dict[str, Any]
    checkpoint: Dict[str, Any]
    size_matches: bool
    included: List[Dict[str, Any]]
    consistent: List[Dict[str, Any]]
