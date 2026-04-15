/**
 * GET /healthz — liveness + readiness probe
 *
 * Used by Vercel health checks, Fly.io, and any upstream load balancer.
 * Returns structured JSON so automated systems can parse status fields.
 *
 * Extend the `checks` object as new dependencies (DB, Redis, etc.) are added.
 */
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  const startMs = Date.now();

  const checks: Record<string, string> = {
    server: 'ok',
  };

  // ── Future: add DB ping here ──────────────────────────────────────────────
  // try {
  //   await db.query('SELECT 1');
  //   checks.database = 'ok';
  // } catch {
  //   checks.database = 'unreachable';
  //   allOk = false;
  // }
  // ─────────────────────────────────────────────────────────────────────────

  const allOk = Object.values(checks).every((v) => v === 'ok');

  const body = {
    status: allOk ? 'ok' : 'degraded',
    uptime: process.uptime(),
    responseTimeMs: Date.now() - startMs,
    checks,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, { status: allOk ? 200 : 503 });
}
