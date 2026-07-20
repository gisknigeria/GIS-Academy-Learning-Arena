-- These fields were added to the Prisma schema after the curriculum hierarchy
-- migration. Without them, Prisma selects a column that does not exist whenever
-- lessons or modules are loaded in production.
ALTER TABLE "CourseModule" ADD COLUMN IF NOT EXISTS "code" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "code" TEXT;
