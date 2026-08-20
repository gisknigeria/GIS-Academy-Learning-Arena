ALTER TABLE "Course" ADD COLUMN "usesSoftware" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "softwareOptions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Lesson" ADD COLUMN "softwareTrackId" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN "softwareTrackId" TEXT;
