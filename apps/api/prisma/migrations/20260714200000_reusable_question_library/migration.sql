ALTER TABLE "Question" DROP CONSTRAINT IF EXISTS "Question_assessmentId_fkey";
ALTER TABLE "Question" ALTER COLUMN "assessmentId" DROP NOT NULL;
ALTER TABLE "Question"
ADD CONSTRAINT "Question_assessmentId_fkey"
FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
