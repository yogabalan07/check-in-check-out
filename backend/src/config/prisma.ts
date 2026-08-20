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
  const params = query ? `${query.slice(1)}&pgbouncer=true` : 'pgbouncer=true';
  return `${base}?${params}`;
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