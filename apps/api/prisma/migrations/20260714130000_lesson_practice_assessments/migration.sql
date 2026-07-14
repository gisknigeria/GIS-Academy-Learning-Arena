ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'MULTIPLE_CHOICE';
ALTER TYPE "QuestionType" ADD VALUE IF NOT EXISTS 'NOTE';

ALTER TABLE "Assessment" ADD COLUMN "lessonId" TEXT;

CREATE INDEX "Assessment_lessonId_idx" ON "Assessment"("lessonId");

ALTER TABLE "Assessment"
ADD CONSTRAINT "Assessment_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
