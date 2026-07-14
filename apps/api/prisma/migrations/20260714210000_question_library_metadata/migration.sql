ALTER TABLE "Question"
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "subject" TEXT,
ADD COLUMN "courseId" TEXT,
ADD COLUMN "lessonId" TEXT;

CREATE INDEX "Question_courseId_idx" ON "Question"("courseId");
CREATE INDEX "Question_lessonId_idx" ON "Question"("lessonId");
CREATE INDEX "Question_difficulty_idx" ON "Question"("difficulty");
CREATE INDEX "Question_subject_idx" ON "Question"("subject");

ALTER TABLE "Question" ADD CONSTRAINT "Question_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Question" ADD CONSTRAINT "Question_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
