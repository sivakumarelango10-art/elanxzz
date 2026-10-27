/**
 * GET /api/projects — the portfolio's public GitHub repositories, curated and described.
 *
 * Runs on Vercel (Node.js runtime). Responses are cached on Vercel's CDN for an hour and served
 * stale for up to a day while a fresh copy is fetched, so visitors never hit GitHub's rate limit
 * directly. A GITHUB_TOKEN environment variable is used if one is set (server-side only); without
 * it the public, unauthenticated API is used.
 *
 * ?view=audit also lists the repositories that were left out, and why.
 */
import { getProjects, GitHubError, type ProjectsPayload } from '../lib/github';

const GITHUB_USER = 'sivakumarelango10-art';

let warm: { at: number; data: ProjectsPayload } | null = null;
const WARM_MS = 10 * 60 * 1000;

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cache,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    },
  });

export async function GET(request: Request): Promise<Response> {
  const audit = new URL(request.url).searchParams.get('view') === 'audit';
  const shape = (d: ProjectsPayload) => (audit ? d : { ...d, excluded: undefined });
  try {
    if (!warm || Date.now() - warm.at > WARM_MS) {
      warm = { at: Date.now(), data: await getProjects(GITHUB_USER, { token: process.env.GITHUB_TOKEN || undefined }) };
    }
    return json(shape(warm.data), 200, 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
  } catch (e) {
    const err = e instanceof GitHubError ? e : new GitHubError('Unexpected error', 500);
    if (warm) {
      // GitHub is down or rate-limited: keep serving the last good list, marked as stale
      return json({ ...shape(warm.data), stale: true }, 200, 'public, max-age=60, s-maxage=300');
    }
    return json(
      { error: err.rateLimited ? 'rate_limited' : 'github_unavailable', message: err.message, resetAt: err.resetAt },
      err.rateLimited ? 429 : 502,
      'no-store',
    );
  }
}
