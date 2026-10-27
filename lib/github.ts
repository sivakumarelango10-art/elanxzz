/**
 * GitHub repository service for the Projects section.
 *
 * Fetches a user's public repositories from the GitHub REST API (unauthenticated by default),
 * drops forks, empty and configuration-only repositories, and gives every remaining repository a
 * short description taken from verified sources only, in this order:
 *   1. the repository's own GitHub description, when it says enough
 *   2. a description written from the repository's README and files (lib/descriptions.ts)
 *   3. the first real paragraph of the README, fetched at request time
 *   4. a neutral line that says no description has been published yet
 * Nothing is invented: a repository the service cannot describe is labelled as such.
 */
import { CURATED, INCLUDE_FORKS, EXCLUDE } from './descriptions';

/** Subset of the GitHub "list repositories for a user" response that this service reads. */
export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  private: boolean;
  archived: boolean;
  disabled?: boolean;
  is_template?: boolean;
  size: number; // KB; 0 means the repository has no content
  topics?: string[];
  language: string | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: { login: string };
}

export type DescriptionSource = 'github' | 'curated' | 'readme' | 'none';

/** What the Projects section renders: the repository name, a description and the repository link. */
export interface Project {
  name: string;
  description: string;
  url: string;
  updatedAt: string;
  source: DescriptionSource;
}

export interface Excluded {
  name: string;
  url: string;
  reason: 'fork' | 'empty' | 'profile-readme' | 'config-only' | 'archived-template' | 'private' | 'curated-exclude';
}

export interface ProjectsPayload {
  user: string;
  fetchedAt: string;
  count: number;
  projects: Project[];
  excluded: Excluded[];
}

export class GitHubError extends Error {
  constructor(message: string, public status: number, public rateLimited = false, public resetAt: string | null = null) {
    super(message);
    this.name = 'GitHubError';
  }
}

type Fetch = (input: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<Response>;

export interface Options {
  token?: string;       // optional server-side token; never sent to the browser
  fetchImpl?: Fetch;
  maxPages?: number;    // 100 repositories per page
  timeoutMs?: number;
  readmeLookups?: boolean;
}

const API = 'https://api.github.com';
const RAW = 'https://raw.githubusercontent.com';

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'elanxzz.me-portfolio',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function timed(f: Fetch, url: string, init: { headers?: Record<string, string> }, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await f(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(t);
  }
}

/** Next-page URL from a GitHub Link header, or null. */
export function nextLink(link: string | null): string | null {
  if (!link) return null;
  for (const part of link.split(',')) {
    const m = part.match(/<([^>]+)>\s*;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

/** All public repositories of `user`, most recently updated first, following pagination. */
export async function fetchRepos(user: string, opt: Options = {}): Promise<GitHubRepo[]> {
  const f = opt.fetchImpl ?? (fetch as unknown as Fetch);
  const maxPages = opt.maxPages ?? 10;
  let url: string | null = `${API}/users/${encodeURIComponent(user)}/repos?type=owner&sort=updated&direction=desc&per_page=100`;
  const out: GitHubRepo[] = [];
  for (let page = 0; url && page < maxPages; page++) {
    let res: Response;
    try {
      res = await timed(f, url, { headers: headers(opt.token) }, opt.timeoutMs ?? 8000);
    } catch (e) {
      throw new GitHubError(`GitHub could not be reached (${(e as Error).name})`, 503);
    }
    if (!res.ok) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      const reset = res.headers.get('x-ratelimit-reset');
      const limited = res.status === 429 || (res.status === 403 && remaining === '0');
      throw new GitHubError(
        limited ? 'GitHub API rate limit reached' : `GitHub API responded ${res.status}`,
        res.status, limited, reset ? new Date(Number(reset) * 1000).toISOString() : null,
      );
    }
    const batch = (await res.json()) as GitHubRepo[];
    if (!Array.isArray(batch)) throw new GitHubError('Unexpected GitHub API response', 502);
    out.push(...batch);
    url = nextLink(res.headers.get('link'));
  }
  // sort=updated is already applied by the API; re-sort so merged pages stay in order
  return out.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

/** Why a repository is left out of the Projects section, or null to keep it. */
export function exclusionReason(r: GitHubRepo, user: string): Excluded['reason'] | null {
  if (r.private) return 'private';
  if (EXCLUDE.includes(r.name)) return 'curated-exclude';
  if (r.fork && !INCLUDE_FORKS.includes(r.name)) return 'fork';
  if (r.size === 0) return 'empty';
  if (r.name.toLowerCase() === user.toLowerCase()) return 'profile-readme';
  if (/^(\.github|dotfiles|\.dotfiles|config|configs|settings)$/i.test(r.name)) return 'config-only';
  if (r.archived && r.is_template) return 'archived-template';
  return null;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);

/** A GitHub description is used as-is only when it actually says something. */
export function isSufficient(desc: string | null, name: string): desc is string {
  if (!desc) return false;
  const w = words(desc);
  if (w.length < 6) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return norm(desc) !== norm(name);
}

/** Trim to at most `max` words, ending on a sentence where possible. */
export function clampWords(text: string, max = 30): string {
  const w = words(text.replace(/\s+/g, ' '));
  if (w.length <= max) return w.join(' ');
  const cut = w.slice(0, max).join(' ');
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (end > 40) return cut.slice(0, end + 1);
  return cut.replace(/[,;:\-–—]+$/, '') + '…';
}

/** First prose paragraph of a README in plain text (no badges, headings, code, HTML or link markup). */
export function readmeSummary(md: string): string | null {
  const text = md
    .replace(/\r/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[\s\S]*?```/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')          // images and badges
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')        // links → text
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1');
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines.every(l => /^(#|>?\s*[-*+|]|\d+\.|=+$|-+$|\|)/.test(l))) continue; // headings, lists, tables, rules
    const p = lines.filter(l => !/^#/.test(l)).join(' ')
      .replace(/^>\s*/, '').replace(/[*_`~]/g, '').replace(/\s+/g, ' ').trim();
    if (words(p).length >= 8 && /[a-z]/.test(p)) return clampWords(p);
  }
  return null;
}

async function fetchReadme(r: GitHubRepo, opt: Options): Promise<string | null> {
  const f = opt.fetchImpl ?? (fetch as unknown as Fetch);
  for (const file of ['README.md', 'readme.md', 'Readme.md', 'README']) {
    try {
      const res = await timed(f, `${RAW}/${r.full_name}/${r.default_branch}/${file}`, { headers: { 'User-Agent': 'elanxzz.me-portfolio' } }, 5000);
      if (res.ok) return await res.text();
    } catch { /* try the next name */ }
  }
  return null;
}

export const NO_DESCRIPTION = 'No description has been published for this repository yet. The source code is available on GitHub.';

export async function describe(r: GitHubRepo, opt: Options = {}): Promise<{ description: string; source: DescriptionSource }> {
  if (isSufficient(r.description, r.name)) return { description: clampWords(r.description), source: 'github' };
  const c = CURATED[r.name];
  if (c) return { description: c, source: 'curated' };
  if (opt.readmeLookups !== false) {
    const md = await fetchReadme(r, opt);
    const s = md && readmeSummary(md);
    if (s) return { description: s, source: 'readme' };
  }
  if (r.description && words(r.description).length >= 3) return { description: clampWords(r.description), source: 'github' };
  return { description: NO_DESCRIPTION, source: 'none' };
}

/** Repositories → the curated, described list the Projects section shows. */
export async function buildProjects(user: string, repos: GitHubRepo[], opt: Options = {}): Promise<ProjectsPayload> {
  const kept: GitHubRepo[] = [];
  const excluded: Excluded[] = [];
  for (const r of repos) {
    const why = exclusionReason(r, user);
    if (why) excluded.push({ name: r.name, url: r.html_url, reason: why });
    else kept.push(r);
  }
  const projects: Project[] = [];
  const queue = kept.slice();
  // describe a few at a time so README lookups don't open dozens of connections
  const worker = async () => {
    for (let r = queue.shift(); r; r = queue.shift()) {
      const d = await describe(r, opt);
      projects.push({ name: r.name, description: d.description, url: r.html_url, updatedAt: r.updated_at, source: d.source });
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  projects.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return { user, fetchedAt: new Date().toISOString(), count: projects.length, projects, excluded };
}

export async function getProjects(user: string, opt: Options = {}): Promise<ProjectsPayload> {
  return buildProjects(user, await fetchRepos(user, opt), opt);
}
