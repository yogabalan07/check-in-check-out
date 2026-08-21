// Functional smoke test — verifies every feature still works after optimization.
// Run against LOCAL backend only.
const BASE_URL = process.env.LOADTEST_URL || 'http://localhost:5001/api';
let token = null;
let pass = 0;
let fail = 0;

function check(name, cond, extra = '') {
  if (cond) {
    pass++;
    console.log(`PASS ${name}`);
  } else {
    fail++;
    console.log(`FAIL ${name} ${extra}`);
  }
}

async function api(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return { status: res.status, data: await res.arrayBuffer() };
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  // 1. Health
  const h = await api('/health', { auth: false });
  check('health', h.status === 200 && h.data?.database?.status === 'ok');

  // 2. Admin login
  const login = await api('/auth/login', {
    auth: false,
    method: 'POST',
    body: { email: process.env.ADMIN_EMAIL || 'admin@hackathon.com', password: process.env.ADMIN_PASSWORD || 'Admin@123' },
  });
  check('admin login', login.status === 200 && !!login.data?.data?.token);
  token = login.data?.data?.token;

  const badLogin = await api('/auth/login', { auth: false, method: 'POST', body: { email: 'admin@hackathon.com', password: 'wrong' } });
  check('admin login rejects bad password (401)', badLogin.status === 401);

  const noAuth = await api('/participants', { auth: false });
  check('protected route without token (401)', noAuth.status === 401);

  // 3. Participant CRUD
  const reg = `SMOKE${Date.now()}`;
  const created = await api('/participants', { method: 'POST', body: { registerNumber: reg, name: 'Smoke Test', department: 'CSE' } });
  check('participant create (201)', created.status === 201);
  const dupCreate = await api('/participants', { method: 'POST', body: { registerNumber: reg.toLowerCase(), name: 'Dup' } });
  check('duplicate participant rejected (409)', dupCreate.status === 409);
  const list = await api(`/participants?page=1&limit=5&search=${reg}`);
  check('participant list paginated', list.status === 200 && list.data?.data?.length === 1 && list.data.pagination.total === 1);
  const pid = list.data.data[0].id;
  const updated = await api(`/participants/${pid}`, { method: 'PUT', body: { name: 'Smoke Test Updated' } });
  check('participant update', updated.status === 200 && updated.data?.data?.name === 'Smoke Test Updated');
  const detail = await api(`/participants/${pid}`);
  check('participant detail w/ attendances', detail.status === 200 && Array.isArray(detail.data?.data?.attendances));

  // 4. Validation error shape
  const invalid = await api('/attendance/check-in', { auth: false, method: 'POST', body: {} });
  check('check-in validation error (422)', invalid.status === 422);

  // 5. Check-in / duplicate / not-found
  const ci = await api('/attendance/check-in', { auth: false, method: 'POST', body: { registerNumber: reg, hall: 'Hall A' } });
  check('check-in (201)', ci.status === 201);
  check('check-in response contract', typeof ci.data?.data?.participant?.name === 'string' && !!ci.data?.data?.attendance?.checkInTime && typeof ci.data?.data?.attendance?.isLate === 'boolean');
  const ci2 = await api('/attendance/check-in', { auth: false, method: 'POST', body: { registerNumber: reg } });
  check('duplicate check-in (409 ALREADY_CHECKED_IN)', ci2.status === 409 && ci2.data?.errorCode === 'ALREADY_CHECKED_IN');
  const nf = await api('/attendance/check-in', { auth: false, method: 'POST', body: { registerNumber: 'NOSUCH999' } });
  check('unknown participant (404)', nf.status === 404 && nf.data?.errorCode === 'PARTICIPANT_NOT_FOUND');

  // 6. Check-out / duplicate
  const co = await api('/attendance/check-out', { auth: false, method: 'POST', body: { registerNumber: reg, hall: 'Hall B' } });
  check('check-out (200)', co.status === 200 && !!co.data?.data?.attendance?.checkOutTime);
  const co2 = await api('/attendance/check-out', { auth: false, method: 'POST', body: { registerNumber: reg } });
  check('duplicate check-out (409 NOT_CHECKED_IN)', co2.status === 409 && co2.data?.errorCode === 'NOT_CHECKED_IN');

  // 7. Attendance listing + filters
  const att = await api('/attendance?page=1&limit=10');
  check('attendance list', att.status === 200 && Array.isArray(att.data?.data));
  const row = att.data?.data?.find((a) => a.participant?.registerNumber === reg);
  check('attendance row has trimmed participant fields', !!row && row.participant.name === 'Smoke Test Updated' && !('email' in row.participant));
  const attFiltered = await api('/attendance?page=1&limit=10&status=CHECKED_OUT');
  check('attendance filter by status', attFiltered.status === 200);

  // 8. Dashboard
  const stats = await api('/dashboard/stats');
  check('dashboard stats', stats.status === 200 && typeof stats.data?.data?.totalParticipants === 'number');
  const recent = await api('/dashboard/recent?limit=5');
  check('dashboard recent', recent.status === 200 && Array.isArray(recent.data?.data));

  // 9. QR codes (no DB dependency, admin-authenticated)
  const qr = await api('/qr/generate?type=check-in&hall=Hall%20A');
  check('QR generation', qr.status === 200 && typeof qr.data?.data?.qr === 'string' && qr.data.data.qr.startsWith('data:image/png'));

  // 10. Halls CRUD
  const hallName = `SMOKEHALL${Date.now()}`;
  const hc = await api('/halls', { method: 'POST', body: { name: hallName, location: 'L1' } });
  check('hall create', hc.status === 201);
  const hl = await api('/halls');
  check('hall list', hl.status === 200 && hl.data.data.some((x) => x.name === hallName));
  const hid = hl.data.data.find((x) => x.name === hallName).id;
  const hu = await api(`/halls/${hid}`, { method: 'PUT', body: { name: hallName, location: 'L2' } });
  check('hall update', hu.status === 200);
  const hd = await api(`/halls/${hid}`, { method: 'DELETE' });
  check('hall delete', hd.status === 200);

  // 11. Settings
  const gs = await api('/settings');
  check('settings get', gs.status === 200 && !!gs.data?.data?.timezone);
  const us = await api('/settings', { method: 'PUT', body: { hackathonName: 'Hackathon 2026' } });
  check('settings update', us.status === 200);

  // 12. Reports
  const rep = await api('/reports/attendance?type=checked-out');
  check('report attendance', rep.status === 200 && Array.isArray(rep.data?.data));
  const csv = await api('/reports/attendance?format=csv&type=all', { raw: true });
  check('report CSV export', csv.status === 200);
  const absent = await api('/reports/attendance?type=absent');
  check('absent report', absent.status === 200 && Array.isArray(absent.data?.data));
  const inside = await api('/reports/currently-inside');
  check('currently-inside report', inside.status === 200 && Array.isArray(inside.data?.data));

  // 13. Participant CSV export + import
  const exp = await api('/participants/export', { raw: true });
  check('participant CSV export', exp.status === 200);
  const csvContent = `Register Number,Name\n${reg}X,CSV Import Test\n`;
  const form = new FormData();
  form.append('file', new Blob([csvContent], { type: 'text/csv' }), 'test.csv');
  const impRes = await fetch(`${BASE_URL}/participants/import`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  const impJson = await impRes.json();
  check('participant CSV import', impRes.status === 200 && impJson?.data?.imported >= 1, JSON.stringify(impJson));

  // 14. Cleanup smoke artifacts
  await api(`/participants/${pid}`, { method: 'DELETE' });
  const cl = await api(`/participants?search=${reg}X`);
  if (cl.data?.data?.[0]) await api(`/participants/${cl.data.data[0].id}`, { method: 'DELETE' });

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
