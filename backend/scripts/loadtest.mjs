// Local concurrency load test for the check-in / check-out flow.
//
// Usage:
//   node scripts/loadtest.mjs --seed [count]   # create LOADTEST participants
//   node scripts/loadtest.mjs                  # run the full suite
//   node scripts/loadtest.mjs --cleanup        # delete LOADTEST data
//
// Requires the backend to run locally against a LOCAL database, e.g.:
//   DATABASE_URL=postgresql://postgres:loadtest@localhost:5433/attendance \
//   PORT=5001 npm start
//
// Never point this at production.

import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.LOADTEST_URL || 'http://localhost:5001/api';
const PREFIX = 'LOADTEST';
const prisma = new PrismaClient();

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, body };
}

async function seedParticipants(count = 150) {
  const data = Array.from({ length: count }, (_, i) => ({
    registerNumber: `${PREFIX}${String(i + 1).padStart(4, '0')}`,
    name: `Load Test ${i + 1}`,
    department: 'CSE',
    year: 'III',
    teamName: `Team ${Math.floor(i / 4) + 1}`,
  }));
  const res = await prisma.participant.createMany({ data, skipDuplicates: true });
  console.log(`seeded ${res.count} participants`);
}

async function cleanup() {
  const att = await prisma.attendance.deleteMany({
    where: { participant: { registerNumber: { startsWith: PREFIX } } },
  });
  const parts = await prisma.participant.deleteMany({
    where: { registerNumber: { startsWith: PREFIX } },
  });
  await prisma.auditLog.deleteMany({ where: { registerNumber: { startsWith: PREFIX } } });
  console.log(`cleanup: ${att.count} attendance, ${parts.count} participants removed`);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

async function fireConcurrent(regNumbers, action) {
  const start = performance.now();
  const results = await Promise.all(
    regNumbers.map(async (reg) => {
      const t0 = performance.now();
      try {
        const r = await api(`/attendance/${action}`, {
          method: 'POST',
          body: JSON.stringify({ registerNumber: reg, hall: 'Hall A' }),
        });
        return { status: r.status, code: r.body?.errorCode, ms: performance.now() - t0 };
      } catch {
        return { status: 0, code: 'NETWORK', ms: performance.now() - t0 };
      }
    })
  );
  return { wallMs: performance.now() - start, results };
}

function summarize(label, { wallMs, results }) {
  const ok = results.filter((r) => r.status === 200 || r.status === 201);
  const latencies = ok.map((r) => r.ms).sort((a, b) => a - b);
  const byStatus = {};
  for (const r of results) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  console.log(
    [
      `${label}:`,
      `requests=${results.length}`,
      `success=${ok.length}`,
      `statuses=${JSON.stringify(byStatus)}`,
      `avg=${latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : '-'}ms`,
      `p95=${Math.round(percentile(latencies, 95))}ms`,
      `wall=${Math.round(wallMs)}ms`,
    ].join(' ')
  );
  return { okCount: ok.length, byStatus };
}

async function checkIn(reg) {
  return api('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ registerNumber: reg, hall: 'Hall A' }),
  });
}

async function checkOut(reg) {
  return api('/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify({ registerNumber: reg, hall: 'Hall A' }),
  });
}

async function main() {
  console.log(`Load test target: ${BASE_URL}`);

  const health = await api('/health');
  if (health.status !== 200) {
    console.error('Backend not healthy, aborting.');
    process.exit(1);
  }

  // ---- S1: sequential baseline --------------------------------------------
  const seqResults = [];
  for (let i = 1; i <= 20; i++) {
    const t0 = performance.now();
    const r = await checkIn(`${PREFIX}${String(i).padStart(4, '0')}`);
    seqResults.push({ status: r.status, ms: performance.now() - t0 });
  }
  summarize('S1 sequential check-in x20 (distinct)', { wallMs: 0, results: seqResults });

  // ---- S2: concurrent distinct check-ins ----------------------------------
  let nextReg = 100;
  for (const n of [10, 25, 50, 100]) {
    const regs = [];
    for (let i = 0; i < n; i++) regs.push(`${PREFIX}${String(nextReg++).padStart(4, '0')}`);
    const wave = await fireConcurrent(regs, 'check-in');
    const s = summarize(`S2 concurrent check-in x${n} (distinct)`, wave);
    if (s.okCount !== n) console.log(`  !! expected ${n} successes, got ${s.okCount}`);
  }

  // ---- S3: duplicate race — same participant, many simultaneous requests --
  for (const n of [10, 50]) {
    const reg = `${PREFIX}${String(nextReg++).padStart(4, '0')}`;
    const wave = await fireConcurrent(Array(n).fill(reg), 'check-in');
    const s = summarize(`S3 duplicate race check-in x${n} (same participant)`, wave);
    const created = s.byStatus['201'] || 0;
    const conflicts = s.byStatus['409'] || 0;
    console.log(
      created === 1 && conflicts === n - 1
        ? `  OK exactly 1 created, ${conflicts} x ALREADY_CHECKED_IN`
        : `  !! RACE DETECTED: created=${created}, conflicts=${conflicts}`
    );
  }

  // ---- S4: concurrent check-outs after one check-in ------------------------
  {
    const reg = `${PREFIX}${String(nextReg++).padStart(4, '0')}`;
    await checkIn(reg);
    const wave = await fireConcurrent(Array(25).fill(reg), 'check-out');
    const s = summarize('S4 duplicate race check-out x25 (same participant)', wave);
    const success = s.byStatus['200'] || 0;
    const conflicts = s.byStatus['409'] || 0;
    console.log(
      success === 1 && conflicts === 24
        ? '  OK exactly 1 checkout applied'
        : `  !! RACE DETECTED: success=${success}, conflicts=${conflicts}`
    );
  }

  // ---- S5: mixed reads while writing ---------------------------------------
  {
    const regs = [];
    for (let i = 0; i < 25; i++) regs.push(`${PREFIX}${String(nextReg++).padStart(4, '0')}`);
    const reads = Array.from({ length: 25 }, () => api('/health'));
    const [readResults, writeWave] = await Promise.all([Promise.all(reads), fireConcurrent(regs, 'check-in')]);
    const readOk = readResults.filter((r) => r.status === 200).length;
    console.log(`S5 mixed load: health reads ok=${readOk}/25 while 25 check-ins fired`);
    summarize('S5 concurrent check-in x25 (mixed with reads)', writeWave);
  }

  // ---- Integrity check ------------------------------------------------------
  const activeDupes = await prisma.$queryRawUnsafe(
    `SELECT "participantId", COUNT(*)::int AS c FROM "Attendance"
     WHERE "status" = 'CHECKED_IN' GROUP BY "participantId" HAVING COUNT(*) > 1`
  );
  console.log(
    activeDupes.length === 0
      ? 'INTEGRITY OK: no participant has more than one active check-in'
      : `!! INTEGRITY FAILURE: ${activeDupes.length} participants with duplicate active check-ins`
  );
}

const arg = process.argv[2];
if (arg === '--cleanup') {
  cleanup().finally(() => prisma.$disconnect());
} else if (arg === '--seed') {
  seedParticipants(parseInt(process.argv[3] || '150', 10)).finally(() => prisma.$disconnect());
} else {
  main()
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
