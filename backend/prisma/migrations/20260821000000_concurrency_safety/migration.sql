-- Concurrency safety migration for hackathon traffic spikes.
--
-- 1. Close any pre-existing duplicate ACTIVE check-ins so the unique index
--    below can be created safely. The earliest record per participant is kept
--    as CHECKED_IN; later duplicates are closed as CHECKED_OUT at their own
--    check-in time (they were artifacts of the old read-then-write race).
UPDATE "Attendance" AS a
SET "status" = 'CHECKED_OUT',
    "checkOutDate" = COALESCE("checkOutDate", a."checkInTime"),
    "checkOutTime" = COALESCE("checkOutTime", a."checkInTime"),
    "updatedAt" = NOW()
WHERE "status" = 'CHECKED_IN'
  AND "id" NOT IN (
    SELECT MIN("id")
    FROM "Attendance"
    WHERE "status" = 'CHECKED_IN'
    GROUP BY "participantId"
  );

-- 2. DATABASE-LEVEL duplicate protection: a participant may have at most ONE
--    active (CHECKED_IN) attendance record. Concurrent check-in requests for
--    the same participant now fail here with a unique violation instead of
--    creating two records, no matter how the requests interleave.
CREATE UNIQUE INDEX "Attendance_participantId_checkedIn_key"
  ON "Attendance"("participantId")
  WHERE "status" = 'CHECKED_IN';

-- 3. Composite index for the hot lookup pattern
--    WHERE "participantId" = ? AND "status" = ? (check-in, check-out,
--    dashboard counts, reports). Replaces the single-column
--    Attendance_participantId_idx.
CREATE INDEX "Attendance_participantId_status_idx"
  ON "Attendance"("participantId", "status");

-- 4. Supports the default createdAt DESC ordering used by attendance listing
--    and recent-activity queries.
CREATE INDEX "Attendance_createdAt_idx" ON "Attendance"("createdAt");

-- 5. Drop redundant indexes:
--    - Participant_registerNumber_idx duplicates the UNIQUE index
--      Participant_registerNumber_key.
--    - Attendance_participantId_idx is covered by the new composite index.
--    - Attendance_status_idx has cardinality of 2 and is covered by the
--      partial unique index for CHECKED_IN rows; CHECKED_OUT scans are rare
--      admin/report operations on a small table.
DROP INDEX IF EXISTS "Participant_registerNumber_idx";
DROP INDEX IF EXISTS "Attendance_participantId_idx";
DROP INDEX IF EXISTS "Attendance_status_idx";
