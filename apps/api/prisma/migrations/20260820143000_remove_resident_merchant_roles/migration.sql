-- Remove two roles that were accidentally introduced outside the LMS role model.
-- Any accounts created during that window are downgraded to STUDENT so the
-- correction cannot accidentally grant elevated trainer or coordinator access.
UPDATE "User" SET "role" = 'STUDENT' WHERE "role"::text IN ('RESIDENT', 'MERCHANT');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
DROP TYPE "UserRole";
CREATE TYPE "UserRole" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'TRAINING_MANAGER',
  'TRAINER',
  'STUDENT',
  'CORPORATE_CLIENT',
  'SCHOOL_COORDINATOR',
  'OLYMPIAD_COORDINATOR',
  'EXAMINER',
  'JUDGE',
  'GUEST',
  'ALUMNI'
);
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'STUDENT';
