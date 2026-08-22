-- Business rule: ONE ACTIVE CHECK-IN PER PARTICIPANT.
-- A participant may hold unlimited COMPLETED sessions (status = 'CHECKED_OUT',
-- checkOutTime set). Only an ACTIVE row may be unique:
--   ACTIVE = checkOutTime IS NULL (and status = 'CHECKED_IN')
--
-- Failure mode observed in production ("cannot check in again after
-- checkout"): a stale FULL-TABLE unique index / constraint on
-- "Attendance"("participantId") rejects the second INSERT for a participant
-- even though no active session exists. Prisma surfaces that violation as
-- P2002, which the API maps to 409 ALREADY_CHECKED_IN — so a completed
-- session appears to block new check-ins.
--
-- This migration is idempotent and data-preserving:
--   1. It drops every full-table unique single-column index or constraint on
--      "participantId" (partial unique indexes are untouched).
--   2. It (re-)installs the canonical partial unique guards so concurrent
--      check-in requests can never create two active sessions.

-- 1a. Drop UNIQUE CONSTRAINTS covering exactly ["participantId"].
DO $$
DECLARE cn RECORD;
BEGIN
  FOR cn IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class tbl ON tbl.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = tbl.relnamespace
    WHERE tbl.relname = 'Attendance'
      AND nsp.nspname = current_schema()
      AND con.contype IN ('u', 'p')
      AND con.conkey = (
        SELECT ARRAY[att.attnum]
        FROM pg_attribute att
        WHERE att.attrelid = tbl.oid AND att.attname = 'participantId'
      )
      AND con.conname <> 'Attendance_pkey'
  LOOP
    EXECUTE format('ALTER TABLE "Attendance" DROP CONSTRAINT IF EXISTS %I', cn.conname);
  END LOOP;
END $$;

-- 1b. Drop full-table UNIQUE INDEXES on exactly ("participantId") — including
--     indexes backing constraints already dropped above and any manually
--     created ones. Partial unique indexes (indpred IS NOT NULL) are kept.
DO $$
DECLARE idx RECORD;
BEGIN
  FOR idx IN
    SELECT cls.relname AS index_name
    FROM pg_index ix
    JOIN pg_class cls ON cls.oid = ix.indexrelid
    JOIN pg_class tbl ON tbl.oid = ix.indrelid
    JOIN pg_namespace nsp ON nsp.oid = tbl.relnamespace
    WHERE tbl.relname = 'Attendance'
      AND nsp.nspname = current_schema()
      AND ix.indisunique
      AND ix.indpred IS NULL
      AND ix.indnkeyatts = 1
      AND ix.indkey[0] = (
        SELECT att.attnum
        FROM pg_attribute att
        WHERE att.attrelid = tbl.oid AND att.attname = 'participantId'
      )
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I', idx.index_name);
  END LOOP;
END $$;

-- 2. Canonical database-level guards (idempotent):
--    a. At most one CHECKED_IN row per participant...
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_participantId_checkedIn_key"
  ON "Attendance"("participantId")
  WHERE "status" = 'CHECKED_IN';

--    b. ...and at most one row with an open session by timestamps alone,
--       so status/timestamp desync can never admit a second active session.
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_participantId_activeCheckout_key"
  ON "Attendance"("participantId")
  WHERE "checkInTime" IS NOT NULL AND "checkOutTime" IS NULL;

-- 3. Composite index for the hot lookup used by check-in, check-out,
--    dashboard and reports (WHERE participantId = ? AND status = ?).
CREATE INDEX IF NOT EXISTS "Attendance_participantId_status_idx"
  ON "Attendance"("participantId", "status");
