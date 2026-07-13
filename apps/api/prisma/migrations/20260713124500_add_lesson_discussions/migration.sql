CREATE TABLE "LessonDiscussion" (
  "id" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT,
  "answeredById" TEXT,
  "answeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LessonDiscussion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LessonDiscussion_lessonId_createdAt_idx" ON "LessonDiscussion"("lessonId", "createdAt");
CREATE INDEX "LessonDiscussion_authorId_idx" ON "LessonDiscussion"("authorId");

ALTER TABLE "LessonDiscussion"
ADD CONSTRAINT "LessonDiscussion_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonDiscussion"
ADD CONSTRAINT "LessonDiscussion_authorId_fkey"
FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LessonDiscussion"
ADD CONSTRAINT "LessonDiscussion_answeredById_fkey"
FOREIGN KEY ("answeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
