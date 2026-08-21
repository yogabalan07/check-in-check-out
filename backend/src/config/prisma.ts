import { PrismaClient } from '@prisma/client';

// Supabase direct hosts (db.<ref>.supabase.co) are IPv6-only and unreachable
// from IPv4-only egress networks such as Render, producing Prisma P1001 /
// HTTP 500 on every query. The IPv4-compatible Supavisor pooler for this
// project's tenant lives at aws-0-ap-southeast-1.pooler.supabase.com:6543.
// Rewrite such URLs to the pooler, preserving the password from the env var.
// Non-Supabase DATABASE_URLs are left untouched.
function toSupabasePoolerUrl(raw: string): string {
  const m = raw.match(
    /^postgres(?:ql)?:\/\/([^:@]+):([^@]*)@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?\/([^?]+)(\?.*)?$/i
  );
  if (!m) return raw;
  const [, user, password, ref, dbName, query] = m;
  const host = process.env.SUPABASE_POOLER_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com';
  const base = `postgresql://${user}.${ref}:${password}@${host}:6543/${dbName}`;
  // pgbouncer=true disables prepared statements (required for Supavisor
  // transaction mode). connection_limit keeps the client pool bounded so a
  // burst of concurrent check-ins queues instead of exhausting Supavisor;
  // override with PRISMA_CONNECTION_LIMIT / PRISMA_POOL_TIMEOUT if needed.
  const extra = [
    'pgbouncer=true',
    `connection_limit=${process.env.PRISMA_CONNECTION_LIMIT || '10'}`,
    `pool_timeout=${process.env.PRISMA_POOL_TIMEOUT || '10'}`,
  ];
  const existing = new URLSearchParams(query ? query.slice(1) : '');
  for (const kv of extra) {
    const [k, v] = kv.split('=');
    if (!existing.has(k)) existing.set(k, v);
  }
  return `${base}?${existing.toString()}`;
}

const rawUrl = process.env.DATABASE_URL;
const resolvedUrl = rawUrl ? toSupabasePoolerUrl(rawUrl) : undefined;

export const prismaDatabaseUrl = resolvedUrl;
export const prismaDatabaseHost = (() => {
  try {
    return new URL(resolvedUrl || 'postgresql://localhost').hostname;
  } catch {
    return 'unknown';
  }
})();

const prisma = resolvedUrl
  ? new PrismaClient({ datasources: { db: { url: resolvedUrl } } })
  : new PrismaClient();

export default prisma;