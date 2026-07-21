-- Add overview fields to Course
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "thumbnailUrl"    TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "bannerUrl"       TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "whatYoullLearn"  TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "prerequisites"   TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "targetAudience"  TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "language"        TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "estimatedHours"  DOUBLE PRECISION;

-- Add overview fields to LearningPathway (programme)
ALTER TABLE "LearningPathway" ADD COLUMN IF NOT EXISTS "thumbnailUrl"   TEXT;
ALTER TABLE "LearningPathway" ADD COLUMN IF NOT EXISTS "whatYoullLearn" TEXT;
ALTER TABLE "LearningPathway" ADD COLUMN IF NOT EXISTS "prerequisites"  TEXT;
ALTER TABLE "LearningPathway" ADD COLUMN IF NOT EXISTS "targetAudience" TEXT;
