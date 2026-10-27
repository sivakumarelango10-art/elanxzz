// Run: npx tsx --test tests/api.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

const realFetch = globalThis.fetch;
const repo = { name: 'smart-travel', full_name: 'sivakumarelango10-art/smart-travel', html_url: 'https://github.com/sivakumarelango10-art/smart-travel',
  description: 'A travel planner that builds day-by-day itineraries from a destination and dates', fork: false, private: false, archived: false,
  size: 900, language: 'Java', default_branch: 'main', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-04-01T00:00:00Z',
  pushed_at: '2026-04-01T00:00:00Z', owner: { login: 'sivakumarelango10-art' } };

test('GET: GitHub down with no cached copy → 502, no-store', async () => {
  globalThis.fetch = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
  const { GET } = await import('../api/projects.ts?a=' + Date.now());
  const res = await GET(new Request('https://x/api/projects'));
  assert.equal(res.status, 502);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal((await res.json()).error, 'github_unavailable');
});

test('GET: success → 200 with CDN caching; later failure → last good list marked stale', async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify([repo, { ...repo, name: 'forked', fork: true }]), { status: 200 })) as typeof fetch;
  const mod = await import('../api/projects.ts?b=' + Date.now());
  const res = await mod.GET(new Request('https://x/api/projects'));
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control')!, /s-maxage=3600/);
  const body = await res.json();
  assert.deepEqual(body.projects.map((p: { name: string }) => p.name), ['smart-travel']);
  assert.equal(body.excluded, undefined);
  assert.deepEqual(Object.keys(body.projects[0]).sort(), ['description', 'name', 'source', 'updatedAt', 'url']);

  const audit = await (await mod.GET(new Request('https://x/api/projects?view=audit'))).json();
  assert.deepEqual(audit.excluded, [{ name: 'forked', url: repo.html_url, reason: 'fork' }]);

  // force the warm copy to expire, then make GitHub fail
  const realNow = Date.now; Date.now = () => realNow() + 11 * 60 * 1000;
  globalThis.fetch = (async () => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } })) as typeof fetch;
  const stale = await mod.GET(new Request('https://x/api/projects'));
  Date.now = realNow;
  assert.equal(stale.status, 200);
  assert.equal((await stale.json()).stale, true);
  globalThis.fetch = realFetch;
});
