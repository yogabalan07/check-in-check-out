-- Business rule: ONE ACTIVE CHECK-IN PER PARTICIPANT.
-- A participant may hold unlimited historical sessions, but at most ONE
-- attendance row may be ACTIVE at any moment. "Active" is defined as:
--   checkInTime IS NOT NULL AND checkOutTime IS NULL
--
-- The existing index Attendance_participantId_checkedIn_key already enforces
-- this via the status column. This migration adds a second, definition-exact
-- guard on the timestamps themselves so no future code path can desync
-- status from checkOutTime and slip a second active session through.

-- 1. Defensive repair BEFORE creating the unique index (keeps deploy safe):
--    1a. CHECKED_OUT rows that never received a checkout timestamp are closed.
UPDATE "Attendance"
SET "checkOutDate" = COALESCE("checkOutDate", "checkInTime", "createdAt"),
    "checkOutTime" = COALESCE("checkOutTime", "checkInTime", "createdAt"),
    "updatedAt" = NOW()
WHERE "status" = 'CHECKED_OUT'
  AND "checkOutTime" IS NULL;

--    1b. CHECKED_IN rows that already carry a checkout timestamp are closed;
--        the timestamp wins because it represents a completed session.
UPDATE "Attendance"
SET "status" = 'CHECKED_OUT',
    "updatedAt" = NOW()
WHERE "status" = 'CHECKED_IN'
  AND "checkOutTime" IS NOT NULL;

-- 2. DATABASE-LEVEL duplicate protection matching the business rule exactly:
--    a participant may have at most ONE real active session. Concurrent
--    check-in requests for the same participant now fail here with a unique
--    violation (Prisma P2002 -> HTTP 409 ALREADY_CHECKED_IN) regardless of
--    how requests interleave. Historical CHECKED_OUT rows are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_participantId_activeCheckout_key"
  ON "Attendance"("participantId")
  WHERE "checkInTime" IS NOT NULL AND "checkOutTime" IS NULL;
