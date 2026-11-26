/**
 * kolaboro 0.1.0: official client for the Kolaboro open data API (https://kolaboro.com/api/open).
 * MIT licence. Works in browsers, Node 20+, Deno, Bun and Cloudflare Workers. No dependency.
 *
 * Every JSON answer of /api/open/* is signed with Ed25519 (header x-kolaboro-signature). By default this client
 * checks that signature before it gives you the data, and throws KolaboroSignatureError if it is missing or wrong.
 * The verification code is kolaboro-verify.js (https://kolaboro.com/open/kolaboro-verify.js), bundled unchanged.
 */
export declare const VERSION = "0.1.0";
export interface PublicKey {
    kid: string;
    alg?: string;
    public_key_raw_b64: string;
    status?: string;
    valid_from?: string;
    valid_until?: string | null;
}
export interface VerifyLib {
    version: string;
    sha256Hex(x: string | Uint8Array): Promise<string>;
    verifySignature(body: string, signatureB64: string, publicKeyRawB64: string): Promise<boolean>;
    verifyProof(p: Proof): Promise<boolean>;
    headHash(h: LogHead): Promise<string>;
    verifyLog(heads: LogHead[]): Promise<{
        ok: boolean;
        checked: number;
        errors: string[];
    }>;
    verifyCheckpoint(note: string, publicKeyRawB64: string): Promise<{
        ok: boolean;
        origin?: string;
        size?: number;
        root?: string;
    }>;
    verifyInclusion(leafLine: string, index: number, size: number, path: PathStep[], rootHex: string): Promise<boolean>;
    verifyConsistency(first: number, second: number, firstRootHex: string, secondRootHex: string, proofHex: string[]): Promise<boolean>;
    verifyEvidenceLines(lines: string[], rootHex: string): Promise<boolean>;
}
export type Stage = 'off-plan' | 'under construction' | 'completed';
export type Level = 'registry' | 'independent' | 'developer' | 'contradicted' | 'none';
export interface Meta {
    updated: string;
    license: string;
    note: string;
}
export interface Claims {
    verified: number;
    unverified: number;
    contradicted: number;
}
export interface ProjectChecks {
    permit_public: boolean | null;
    permit_claimed: boolean | null;
    deposit_protection: boolean | null;
    progress: boolean | null;
    plans: boolean | null;
    track_record: boolean | null;
    no_guaranteed_returns: boolean | null;
}
export interface Project {
    id: string;
    market: string;
    country: string;
    region: string | null;
    stage: Stage | null;
    band: string | null;
    done: number | string | null;
    title: string | null;
    lease: number | null;
    units: number | null;
    score: number;
    max: number;
    vscore: number | null;
    tier: string | null;
    delay: number | null;
    checks: ProjectChecks;
    verification: Partial<Record<'permit' | 'escrow' | 'progress' | 'plans' | 'record' | 'returns_ok', Level>>;
    claims: Claims;
    flags: number;
    all_six_public: boolean;
    url: string;
    [k: string]: unknown;
}
export interface ProjectFilters {
    market?: string;
    country?: string;
    stage?: Stage;
    min_public?: number;
    min_confirmed?: number;
    all_six?: boolean;
    flags?: boolean;
    limit?: number;
    offset?: number;
}
export interface ProjectList extends Meta {
    total: number;
    offset: number;
    limit: number;
    projects: Project[];
}
export interface ProjectDetail extends Meta {
    project: Project;
    questions?: unknown[];
    flags?: unknown[];
    notes?: unknown[];
}
export interface Stats extends Meta {
    projects: number;
    markets: number;
    countries: number;
    sources?: number;
    data_points?: number;
    claims?: Claims;
    claims_total?: number;
    checks_by_level?: Record<Level, number>;
    stages?: Record<Stage, number>;
    all_six_public?: number;
    with_flags?: number;
    overdue?: number;
    overdue_avg_months?: number;
    delayed?: number;
    [k: string]: unknown;
}
export interface Market {
    market: string;
    country: string;
    projects: number;
    avg_checks: number;
    avg_confirmed: number;
    permit_public_pct: number;
    deposit_protection_pct: number;
    all_six_public: number;
    with_flags: number;
    transparency_index: number;
}
export interface Markets extends Meta {
    method: string;
    markets: Market[];
}
export interface Change {
    date: string;
    project: string;
    market: string;
    field: string;
    from: unknown;
    to: unknown;
}
export interface Changes extends Meta {
    since: string;
    count: number;
    changes: Change[];
}
export interface Freshness extends Meta {
    objective: string;
    projects: number;
    within_7d: number;
    within_30d: number;
    unknown: number;
    pct_7d: number;
    meets_objective: boolean;
    markets_below_objective: number;
    markets: {
        market: string;
        projects: number;
        within_7d: number;
        within_30d: number;
        oldest_days: number;
        pct_7d: number;
    }[];
}
export interface LogHead {
    day: string;
    head: string;
    prev: string | null;
    dataset_sha256: string;
    projects_root: string;
    projects_count: number;
    evidence_root?: string | null;
    evidence_items?: number;
    audit_head?: string | null;
    audit_count?: number;
    rekor_uuid?: string | null;
    rekor_index?: number | null;
    rekor_time?: number | null;
    cosign?: unknown;
    [k: string]: unknown;
}
export interface Log {
    heads: LogHead[];
    format?: unknown;
}
export interface LogInput {
    date: string;
    updated: string;
    dataset_sha256: string;
    dataset_bytes: number;
    projects_root: string;
    projects_count: number;
}
export interface PathStep {
    side: 'L' | 'R';
    hash: string;
}
export interface Proof {
    project: string;
    page_fingerprint_date: string;
    line: string;
    leaf: string;
    index: number;
    leaves: number;
    path: PathStep[];
    projects_root: string;
    dataset_sha256: string;
    updated: string;
    method: string;
}
export interface LogProof {
    tree_size: number;
    root_hash: string;
    leaf_index: number;
    leaf: string;
    path: PathStep[];
}
export interface LogConsistency {
    first: number;
    second: number;
    first_root: string;
    second_root: string;
    proof: string[];
    algorithm: string;
}
export interface Checkpoint {
    note: string;
    ok: boolean;
    origin: string;
    size: number;
    root: string;
}
export interface Build {
    commit: string | null;
    branch: string | null;
    source: string;
}
export interface SignatureInfo {
    checked: boolean;
    ok: boolean | null;
    kid: string | null;
}
export interface ResponseMeta {
    url: string;
    status: number;
    signature: SignatureInfo;
    datasetSha256: string | null;
    build: string | null;
    etag: string | null;
}
export interface AuditReport {
    ok: boolean;
    heads: number;
    chain: {
        ok: boolean;
        errors: string[];
    };
    checkpoint: {
        ok: boolean;
        size: number;
        root: string;
    };
    sizeMatches: boolean;
    included: {
        day: string;
        ok: boolean;
    }[];
    consistent: {
        first: number;
        ok: boolean;
    }[];
}
export interface KolaboroOptions {
    /** Default https://kolaboro.com */
    baseUrl?: string;
    /** Check the Ed25519 signature of every JSON answer (default true). */
    verify?: boolean;
    /** Extra or replacement public keys. By default the keys pinned in this file are used and unknown key ids are looked up at /.well-known/kolaboro-keys.json. */
    publicKeys?: PublicKey[];
    /** Optional key from https://kolaboro.com/api-keys/. With a key, calls go through the metered endpoint /api/x/k/m/* and count against your daily quota. */
    apiKey?: string;
    fetch?: typeof fetch;
    timeoutMs?: number;
    retries?: number;
}
export declare class KolaboroError extends Error {
    status: number;
    body: unknown;
    constructor(message: string, status: number, body?: unknown);
}
export declare class KolaboroSignatureError extends KolaboroError {
    constructor(message: string, status: number);
}
export declare const verify: VerifyLib;
export declare const PINNED_KEYS: PublicKey[];
export declare class Kolaboro {
    readonly baseUrl: string;
    readonly verifySignatures: boolean;
    /** Metadata of the last answer: signature check, dataset fingerprint, build, ETag. */
    last: ResponseMeta | null;
    private keys;
    private looked;
    private f;
    private apiKey?;
    private timeoutMs;
    private retries;
    constructor(opts?: KolaboroOptions);
    stats(): Promise<Stats>;
    summary(): Promise<Record<string, unknown>>;
    projects(filters?: ProjectFilters): Promise<ProjectList>;
    /** Every project matching the filters, page by page (1000 per request). */
    allProjects(filters?: Omit<ProjectFilters, 'limit' | 'offset'>): AsyncGenerator<Project>;
    projectsCsv(filters?: ProjectFilters): Promise<string>;
    project(id: string): Promise<ProjectDetail>;
    /** The project as published on a past day (daily snapshots). */
    projectAt(id: string, day: string): Promise<ProjectDetail>;
    markets(): Promise<Markets>;
    marketsCsv(): Promise<string>;
    changes(since: string): Promise<Changes>;
    freshness(): Promise<Freshness>;
    evals(): Promise<Record<string, unknown>>;
    uptime(): Promise<Record<string, unknown>>;
    aiSpend(): Promise<{
        days: {
            day: string;
            calls: number;
            usd_estimated: number;
        }[];
        cap_usd_per_day: number;
    }>;
    build(): Promise<Build>;
    /** Is this case-file PDF exactly as Kolaboro created it? */
    pdf(sha256: string): Promise<Record<string, unknown>>;
    receipt(evidenceId: string): Promise<Record<string, unknown>>;
    log(): Promise<Log>;
    logInput(): Promise<LogInput>;
    proof(id: string): Promise<Proof>;
    logProof(day: string): Promise<LogProof>;
    logConsistency(first: number, second: number): Promise<LogConsistency>;
    /** The signed checkpoint (C2SP note), with its Ed25519 note signature checked. Throws if the note signature is wrong. */
    checkpoint(): Promise<Checkpoint>;
    /** Is this project's page fingerprint inside the daily Merkle root? Fetches the proof and recomputes it locally. */
    verifyProject(id: string): Promise<{
        ok: boolean;
        proof: Proof;
    }>;
    /**
     * Full audit of the public log, done on your machine: every head recomputes and links to the previous one,
     * the checkpoint is signed, every day is included in the checkpoint tree, and the tree only ever appended.
     */
    auditLog(): Promise<AuditReport>;
    /** The dataset file the API answers from, with its SHA-256 compared to the x-kolaboro-dataset-sha256 header of a signed answer. */
    dataset(): Promise<{
        data: unknown;
        sha256: string;
        matchesSignedHeader: boolean | null;
    }>;
    /** GET any /api/open path (e.g. '/stats') and return the parsed, signature-checked JSON. */
    json<T = unknown>(path: string): Promise<T>;
    text(path: string, skipSignature?: boolean): Promise<string>;
    private checkSig;
    private lookupKeys;
    private tryKeys;
    private fetchRetry;
}
export default Kolaboro;
