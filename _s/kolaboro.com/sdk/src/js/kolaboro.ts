/**
 * kolaboro 0.1.0: official client for the Kolaboro open data API (https://kolaboro.com/api/open).
 * MIT licence. Works in browsers, Node 20+, Deno, Bun and Cloudflare Workers. No dependency.
 *
 * Every JSON answer of /api/open/* is signed with Ed25519 (header x-kolaboro-signature). By default this client
 * checks that signature before it gives you the data, and throws KolaboroSignatureError if it is missing or wrong.
 * The verification code is kolaboro-verify.js (https://kolaboro.com/open/kolaboro-verify.js), bundled unchanged.
 */

// Injected by build.sh: the verifier library (kolaboro-verify.js, unchanged) and the public keys pinned at build time.
declare const __KV__: VerifyLib;
declare const __KEYS__: PublicKey[];

export const VERSION = '0.1.0';

// ---------- types ----------
export interface PublicKey { kid: string; alg?: string; public_key_raw_b64: string; status?: string; valid_from?: string; valid_until?: string | null }
export interface VerifyLib {
  version: string;
  sha256Hex(x: string | Uint8Array): Promise<string>;
  verifySignature(body: string, signatureB64: string, publicKeyRawB64: string): Promise<boolean>;
  verifyProof(p: Proof): Promise<boolean>;
  headHash(h: LogHead): Promise<string>;
  verifyLog(heads: LogHead[]): Promise<{ ok: boolean; checked: number; errors: string[] }>;
  verifyCheckpoint(note: string, publicKeyRawB64: string): Promise<{ ok: boolean; origin?: string; size?: number; root?: string }>;
  verifyInclusion(leafLine: string, index: number, size: number, path: PathStep[], rootHex: string): Promise<boolean>;
  verifyConsistency(first: number, second: number, firstRootHex: string, secondRootHex: string, proofHex: string[]): Promise<boolean>;
  verifyEvidenceLines(lines: string[], rootHex: string): Promise<boolean>;
}
export type Stage = 'off-plan' | 'under construction' | 'completed';
export type Level = 'registry' | 'independent' | 'developer' | 'contradicted' | 'none';
export interface Meta { updated: string; license: string; note: string }
export interface Claims { verified: number; unverified: number; contradicted: number }
export interface ProjectChecks {
  permit_public: boolean | null; permit_claimed: boolean | null; deposit_protection: boolean | null; progress: boolean | null;
  plans: boolean | null; track_record: boolean | null; no_guaranteed_returns: boolean | null;
}
export interface Project {
  id: string; market: string; country: string; region: string | null; stage: Stage | null; band: string | null; done: number | string | null;
  title: string | null; lease: number | null; units: number | null; score: number; max: number; vscore: number | null; tier: string | null;
  delay: number | null; checks: ProjectChecks; verification: Partial<Record<'permit' | 'escrow' | 'progress' | 'plans' | 'record' | 'returns_ok', Level>>;
  claims: Claims; flags: number; all_six_public: boolean; url: string; [k: string]: unknown;
}
export interface ProjectFilters {
  market?: string; country?: string; stage?: Stage; min_public?: number; min_confirmed?: number; all_six?: boolean; flags?: boolean;
  limit?: number; offset?: number;
}
export interface ProjectList extends Meta { total: number; offset: number; limit: number; projects: Project[] }
export interface ProjectDetail extends Meta { project: Project; questions?: unknown[]; flags?: unknown[]; notes?: unknown[] }
export interface Stats extends Meta {
  projects: number; markets: number; countries: number; sources?: number; data_points?: number; claims?: Claims; claims_total?: number;
  checks_by_level?: Record<Level, number>; stages?: Record<Stage, number>; all_six_public?: number; with_flags?: number; overdue?: number;
  overdue_avg_months?: number; delayed?: number; [k: string]: unknown;
}
export interface Market {
  market: string; country: string; projects: number; avg_checks: number; avg_confirmed: number; permit_public_pct: number;
  deposit_protection_pct: number; all_six_public: number; with_flags: number; transparency_index: number;
}
export interface Markets extends Meta { method: string; markets: Market[] }
export interface Change { date: string; project: string; market: string; field: string; from: unknown; to: unknown }
export interface Changes extends Meta { since: string; count: number; changes: Change[] }
export interface Freshness extends Meta {
  objective: string; projects: number; within_7d: number; within_30d: number; unknown: number; pct_7d: number; meets_objective: boolean;
  markets_below_objective: number; markets: { market: string; projects: number; within_7d: number; within_30d: number; oldest_days: number; pct_7d: number }[];
}
export interface LogHead {
  day: string; head: string; prev: string | null; dataset_sha256: string; projects_root: string; projects_count: number;
  evidence_root?: string | null; evidence_items?: number; audit_head?: string | null; audit_count?: number;
  rekor_uuid?: string | null; rekor_index?: number | null; rekor_time?: number | null; cosign?: unknown; [k: string]: unknown;
}
export interface Log { heads: LogHead[]; format?: unknown }
export interface LogInput { date: string; updated: string; dataset_sha256: string; dataset_bytes: number; projects_root: string; projects_count: number }
export interface PathStep { side: 'L' | 'R'; hash: string }
export interface Proof {
  project: string; page_fingerprint_date: string; line: string; leaf: string; index: number; leaves: number; path: PathStep[];
  projects_root: string; dataset_sha256: string; updated: string; method: string;
}
export interface LogProof { tree_size: number; root_hash: string; leaf_index: number; leaf: string; path: PathStep[] }
export interface LogConsistency { first: number; second: number; first_root: string; second_root: string; proof: string[]; algorithm: string }
export interface Checkpoint { note: string; ok: boolean; origin: string; size: number; root: string }
export interface Build { commit: string | null; branch: string | null; source: string }
export interface SignatureInfo { checked: boolean; ok: boolean | null; kid: string | null }
export interface ResponseMeta { url: string; status: number; signature: SignatureInfo; datasetSha256: string | null; build: string | null; etag: string | null }
export interface AuditReport {
  ok: boolean; heads: number; chain: { ok: boolean; errors: string[] }; checkpoint: { ok: boolean; size: number; root: string };
  sizeMatches: boolean; included: { day: string; ok: boolean }[]; consistent: { first: number; ok: boolean }[];
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

export class KolaboroError extends Error {
  status: number; body: unknown;
  constructor(message: string, status: number, body?: unknown) { super(message); this.name = 'KolaboroError'; this.status = status; this.body = body; }
}
export class KolaboroSignatureError extends KolaboroError {
  constructor(message: string, status: number) { super(message, status); this.name = 'KolaboroSignatureError'; }
}

export const verify: VerifyLib = __KV__;
export const PINNED_KEYS: PublicKey[] = __KEYS__;

function qs(f: Record<string, unknown> = {}): string {
  const p: string[] = [];
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null || v === '') continue;
    p.push(encodeURIComponent(k) + '=' + encodeURIComponent(typeof v === 'boolean' ? (v ? '1' : '0') : String(v)));
  }
  return p.length ? '?' + p.join('&') : '';
}
const seg = (s: string) => encodeURIComponent(String(s));
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class Kolaboro {
  readonly baseUrl: string;
  readonly verifySignatures: boolean;
  /** Metadata of the last answer: signature check, dataset fingerprint, build, ETag. */
  last: ResponseMeta | null = null;
  private keys: Map<string, PublicKey>;
  private looked = false;
  private f: typeof fetch;
  private apiKey?: string;
  private timeoutMs: number;
  private retries: number;

  constructor(opts: KolaboroOptions = {}) {
    this.baseUrl = (opts.baseUrl || 'https://kolaboro.com').replace(/\/+$/, '');
    this.verifySignatures = opts.verify !== false;
    this.keys = new Map((opts.publicKeys || PINNED_KEYS).map(k => [k.kid, k]));
    // fetch must be called unbound from the instance (browsers throw "Illegal invocation" otherwise)
    const g = typeof fetch === 'function' ? ((u: RequestInfo | URL, i?: RequestInit) => fetch(u, i)) as typeof fetch : undefined;
    const f = opts.fetch ? (((u: RequestInfo | URL, i?: RequestInit) => (opts.fetch as typeof fetch)(u, i)) as typeof fetch) : g;
    if (!f) throw new Error('kolaboro: no fetch available; pass opts.fetch');
    this.f = f;
    this.apiKey = opts.apiKey;
    this.timeoutMs = opts.timeoutMs ?? 30000;
    this.retries = opts.retries ?? 2;
  }

  // ---------- data ----------
  stats(): Promise<Stats> { return this.json('/stats'); }
  summary(): Promise<Record<string, unknown>> { return this.json('/summary'); }
  projects(filters: ProjectFilters = {}): Promise<ProjectList> { return this.json('/projects' + qs(filters as Record<string, unknown>)); }
  /** Every project matching the filters, page by page (1000 per request). */
  async *allProjects(filters: Omit<ProjectFilters, 'limit' | 'offset'> = {}): AsyncGenerator<Project> {
    let offset = 0;
    for (;;) {
      const page = await this.projects({ ...filters, limit: 1000, offset });
      for (const p of page.projects) yield p;
      offset += page.projects.length;
      if (!page.projects.length || offset >= page.total) return;
    }
  }
  projectsCsv(filters: ProjectFilters = {}): Promise<string> { return this.text('/projects.csv' + qs(filters as Record<string, unknown>)); }
  project(id: string): Promise<ProjectDetail> { return this.json('/projects/' + seg(id)); }
  /** The project as published on a past day (daily snapshots). */
  projectAt(id: string, day: string): Promise<ProjectDetail> { return this.json('/projects/' + seg(id) + '/at/' + seg(day)); }
  markets(): Promise<Markets> { return this.json('/markets'); }
  marketsCsv(): Promise<string> { return this.text('/markets.csv'); }
  changes(since: string): Promise<Changes> { return this.json('/changes' + qs({ since })); }
  freshness(): Promise<Freshness> { return this.json('/freshness'); }
  evals(): Promise<Record<string, unknown>> { return this.json('/evals'); }
  uptime(): Promise<Record<string, unknown>> { return this.json('/uptime'); }
  aiSpend(): Promise<{ days: { day: string; calls: number; usd_estimated: number }[]; cap_usd_per_day: number }> { return this.json('/ai-spend'); }
  build(): Promise<Build> { return this.json('/build'); }
  /** Is this case-file PDF exactly as Kolaboro created it? */
  pdf(sha256: string): Promise<Record<string, unknown>> { return this.json('/pdf/' + seg(sha256)); }
  receipt(evidenceId: string): Promise<Record<string, unknown>> { return this.json('/receipt/' + seg(evidenceId)); }

  // ---------- public log and proofs ----------
  log(): Promise<Log> { return this.json('/log'); }
  logInput(): Promise<LogInput> { return this.json('/log-input'); }
  proof(id: string): Promise<Proof> { return this.json('/proof/' + seg(id)); }
  logProof(day: string): Promise<LogProof> { return this.json('/log-proof' + qs({ day })); }
  logConsistency(first: number, second: number): Promise<LogConsistency> { return this.json('/log-consistency' + qs({ first, second })); }
  /** The signed checkpoint (C2SP note), with its Ed25519 note signature checked. Throws if the note signature is wrong. */
  async checkpoint(): Promise<Checkpoint> {
    const note = await this.text('/checkpoint', true);
    const r = await this.tryKeys(k => __KV__.verifyCheckpoint(note, k.public_key_raw_b64));
    if (!r || !r.ok) { if (this.verifySignatures) throw new KolaboroSignatureError('checkpoint signature does not verify', 200); }
    const lines = note.split('\n');
    return { note, ok: !!(r && r.ok), origin: lines[0], size: +lines[1], root: (r && r.root) || '' };
  }
  /** Is this project's page fingerprint inside the daily Merkle root? Fetches the proof and recomputes it locally. */
  async verifyProject(id: string): Promise<{ ok: boolean; proof: Proof }> {
    const proof = await this.proof(id);
    return { ok: await __KV__.verifyProof(proof), proof };
  }
  /**
   * Full audit of the public log, done on your machine: every head recomputes and links to the previous one,
   * the checkpoint is signed, every day is included in the checkpoint tree, and the tree only ever appended.
   */
  async auditLog(): Promise<AuditReport> {
    const { heads } = await this.log();
    const chain = await __KV__.verifyLog(heads);
    const cp = await this.checkpoint();
    const included: { day: string; ok: boolean }[] = [];
    for (const h of heads) {
      const p = await this.logProof(h.day);
      included.push({ day: h.day, ok: p.root_hash === cp.root && await __KV__.verifyInclusion(p.leaf, p.leaf_index, p.tree_size, p.path, cp.root) });
    }
    const consistent: { first: number; ok: boolean }[] = [];
    for (let m = 1; m <= cp.size; m++) {
      const c = await this.logConsistency(m, cp.size);
      consistent.push({ first: m, ok: c.second_root === cp.root && await __KV__.verifyConsistency(m, cp.size, c.first_root, c.second_root, c.proof) });
    }
    const sizeMatches = cp.size === heads.length;
    return {
      ok: chain.ok && cp.ok && sizeMatches && included.every(x => x.ok) && consistent.every(x => x.ok),
      heads: heads.length, chain: { ok: chain.ok, errors: chain.errors }, checkpoint: { ok: cp.ok, size: cp.size, root: cp.root }, sizeMatches, included, consistent
    };
  }
  /** The dataset file the API answers from, with its SHA-256 compared to the x-kolaboro-dataset-sha256 header of a signed answer. */
  async dataset(): Promise<{ data: unknown; sha256: string; matchesSignedHeader: boolean | null }> {
    await this.stats(); const want = this.last && this.last.datasetSha256;
    const r = await this.fetchRetry(this.baseUrl + '/data/bali-cases.json', {});
    const text = await r.text(); const sha256 = await __KV__.sha256Hex(text);
    return { data: JSON.parse(text), sha256, matchesSignedHeader: want ? want === sha256 : null };
  }

  // ---------- transport ----------
  /** GET any /api/open path (e.g. '/stats') and return the parsed, signature-checked JSON. */
  async json<T = unknown>(path: string): Promise<T> {
    const text = await this.text(path);
    let body: unknown;
    try { body = JSON.parse(text); } catch (e) { throw new KolaboroError('not JSON', this.last ? this.last.status : 0, text.slice(0, 200)); }
    return body as T;
  }
  async text(path: string, skipSignature = false): Promise<string> {
    const base = this.apiKey ? '/api/x/k/m' : '/api/open';
    const url = this.baseUrl + base + path;
    const headers: Record<string, string> = { accept: 'application/json, text/csv, text/plain' };
    if (this.apiKey) headers['x-api-key'] = this.apiKey;
    const r = await this.fetchRetry(url, { headers });
    const text = await r.text();
    const sig = r.headers.get('x-kolaboro-signature'), kid = r.headers.get('x-kolaboro-key-id');
    const meta: ResponseMeta = { url, status: r.status, signature: { checked: false, ok: null, kid }, datasetSha256: r.headers.get('x-kolaboro-dataset-sha256'), build: r.headers.get('x-kolaboro-build'), etag: r.headers.get('etag') };
    this.last = meta;
    if (!r.ok) {
      let b: unknown = text; try { b = JSON.parse(text); } catch (e) { /* not JSON */ }
      const msg = b && typeof b === 'object' && 'error' in (b as object) ? String((b as { error: unknown }).error) : 'HTTP ' + r.status;
      throw new KolaboroError(msg, r.status, b);
    }
    if (this.verifySignatures && !skipSignature) {
      if (!sig) throw new KolaboroSignatureError('answer is not signed: ' + url, r.status);
      const ok = await this.checkSig(text, sig, kid);
      meta.signature = { checked: true, ok, kid };
      if (!ok) throw new KolaboroSignatureError('signature does not verify: ' + url, r.status);
    }
    return text;
  }
  private async checkSig(text: string, sig: string, kid: string | null): Promise<boolean> {
    let k = kid ? this.keys.get(kid) : undefined;
    if (!k && kid && !this.looked) { await this.lookupKeys(); k = this.keys.get(kid); }
    if (k) return k.status !== 'revoked' && __KV__.verifySignature(text, sig, k.public_key_raw_b64);
    return false;
  }
  private async lookupKeys(): Promise<void> {
    this.looked = true;
    try {
      const r = await this.fetchRetry(this.baseUrl + '/.well-known/kolaboro-keys.json', {});
      const d = await r.json() as { keys?: PublicKey[] };
      for (const k of d.keys || []) if (k && k.kid && k.public_key_raw_b64 && !this.keys.has(k.kid)) this.keys.set(k.kid, k);
    } catch (e) { /* keep pinned keys only */ }
  }
  private async tryKeys<R extends { ok: boolean }>(fn: (k: PublicKey) => Promise<R>): Promise<R | null> {
    let last: R | null = null;
    for (const k of this.keys.values()) { if (k.status === 'revoked') continue; last = await fn(k); if (last.ok) return last; }
    if (!this.looked) { await this.lookupKeys(); for (const k of this.keys.values()) { if (k.status === 'revoked') continue; last = await fn(k); if (last.ok) return last; } }
    return last;
  }
  private async fetchRetry(url: string, init: RequestInit): Promise<Response> {
    let err: unknown = null;
    for (let i = 0; i <= this.retries; i++) {
      const ac = typeof AbortController === 'function' ? new AbortController() : null;
      const t = ac ? setTimeout(() => ac.abort(), this.timeoutMs) : null;
      try {
        const r = await this.f(url, { ...init, signal: ac ? ac.signal : undefined });
        if ((r.status === 429 || r.status >= 500) && i < this.retries) { await sleep(400 * Math.pow(3, i)); continue; }
        return r;
      } catch (e) { err = e; if (i < this.retries) await sleep(400 * Math.pow(3, i)); }
      finally { if (t) clearTimeout(t); }
    }
    throw new KolaboroError('network: ' + String((err as Error)?.message || err), 0);
  }
}

export default Kolaboro;
