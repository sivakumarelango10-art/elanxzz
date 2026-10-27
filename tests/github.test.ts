// Run: npx tsx --test tests/github.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchRepos, buildProjects, exclusionReason, isSufficient, clampWords, readmeSummary, nextLink,
  GitHubError, NO_DESCRIPTION, type GitHubRepo,
} from '../lib/github';

const repo = (o: Partial<GitHubRepo>): GitHubRepo => ({
  name: 'demo', full_name: 'u/demo', html_url: 'https://github.com/u/demo', description: null, fork: false,
  private: false, archived: false, size: 120, language: 'TypeScript', default_branch: 'main',
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', pushed_at: '2026-01-01T00:00:00Z',
  owner: { login: 'u' }, ...o,
});

type Route = (url: string) => Response | Promise<Response>;
const mockFetch = (route: Route) => {
  const calls: string[] = [];
  const f = async (url: string) => { calls.push(url); return route(url); };
  return { f, calls };
};
const ok = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json', ...headers } });

test('follows Link pagination and sorts by updated_at', async () => {
  const p2 = 'https://api.github.com/user/1/repos?page=2';
  const { f, calls } = mockFetch(url =>
    url.includes('page=2')
      ? ok([repo({ name: 'b', updated_at: '2026-05-01T00:00:00Z' })])
      : ok([repo({ name: 'a', updated_at: '2026-03-01T00:00:00Z' })], { link: `<${p2}>; rel="next", <${p2}>; rel="last"` }));
  const r = await fetchRepos('u', { fetchImpl: f });
  assert.deepEqual(r.map(x => x.name), ['b', 'a']);
  assert.equal(calls.length, 2);
  assert.match(calls[0], /per_page=100/);
  assert.match(calls[0], /sort=updated/);
});

test('rate limit becomes a GitHubError with rateLimited and resetAt', async () => {
  const { f } = mockFetch(() => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1800000000' } }));
  await assert.rejects(fetchRepos('u', { fetchImpl: f }), (e: unknown) =>
    e instanceof GitHubError && e.rateLimited && e.status === 403 && e.resetAt === new Date(1800000000 * 1000).toISOString());
});

test('network failure becomes a 503 GitHubError', async () => {
  const f = async () => { throw new TypeError('fetch failed'); };
  await assert.rejects(fetchRepos('u', { fetchImpl: f }), (e: unknown) => e instanceof GitHubError && e.status === 503 && !e.rateLimited);
});

test('404 user is an error, not an empty list', async () => {
  const { f } = mockFetch(() => new Response('{"message":"Not Found"}', { status: 404 }));
  await assert.rejects(fetchRepos('nobody', { fetchImpl: f }), (e: unknown) => e instanceof GitHubError && e.status === 404);
});

test('account with no repositories gives an empty project list', async () => {
  const { f } = mockFetch(() => ok([]));
  const p = await buildProjects('u', await fetchRepos('u', { fetchImpl: f }), { fetchImpl: f });
  assert.equal(p.count, 0);
  assert.deepEqual(p.projects, []);
});

test('filters forks, empty, profile README and config repos', () => {
  assert.equal(exclusionReason(repo({ fork: true }), 'u'), 'fork');
  assert.equal(exclusionReason(repo({ size: 0 }), 'u'), 'empty');
  assert.equal(exclusionReason(repo({ name: 'U' }), 'u'), 'profile-readme');
  assert.equal(exclusionReason(repo({ name: '.github' }), 'u'), 'config-only');
  assert.equal(exclusionReason(repo({ name: 'real-app' }), 'u'), null);
});

test('description rules: sufficient GitHub text, README fallback, neutral fallback', async () => {
  assert.equal(isSufficient('A todo app', 'todo'), false);
  assert.equal(isSufficient('A web app that tracks study streaks for students', 'x'), true);
  const readme = '# Title\n\n[![build](https://x/y.svg)](https://x)\n\n## About\n\nKalviLearn helps students practise programming problems in the browser and track their progress over time.\n';
  assert.equal(readmeSummary(readme), 'KalviLearn helps students practise programming problems in the browser and track their progress over time.');
  assert.equal(readmeSummary('# Only a heading\n\n- a list\n- item'), null);

  const { f } = mockFetch(url => {
    if (url.includes('raw.githubusercontent.com/u/with-readme/main/README.md')) return new Response(readme);
    if (url.includes('raw.githubusercontent.com')) return new Response('404', { status: 404 });
    return ok([]);
  });
  const p = await buildProjects('u', [
    repo({ name: 'described', description: 'A small CLI that renames photos by the date they were taken', updated_at: '2026-03-01T00:00:00Z' }),
    repo({ name: 'with-readme', full_name: 'u/with-readme', updated_at: '2026-02-01T00:00:00Z' }),
    repo({ name: 'bare', full_name: 'u/bare', updated_at: '2026-01-01T00:00:00Z' }),
  ], { fetchImpl: f });
  assert.deepEqual(p.projects.map(x => [x.name, x.source]), [['described', 'github'], ['with-readme', 'readme'], ['bare', 'none']]);
  assert.equal(p.projects[2].description, NO_DESCRIPTION);
  for (const x of p.projects) assert.match(x.url, /^https:\/\/github\.com\//);
});

test('clampWords keeps descriptions short', () => {
  const long = Array.from({ length: 50 }, (_, i) => `w${i}`).join(' ');
  assert.ok(clampWords(long).split(' ').length <= 30);
  assert.ok(clampWords(long).endsWith('…'));
});

test('nextLink parses only rel="next"', () => {
  assert.equal(nextLink('<https://a/2>; rel="next", <https://a/5>; rel="last"'), 'https://a/2');
  assert.equal(nextLink('<https://a/1>; rel="prev"'), null);
  assert.equal(nextLink(null), null);
});
