CREATE TABLE "ClassLessonUnlock" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClassLessonUnlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassLessonUnlock_classId_lessonId_key" ON "ClassLessonUnlock"("classId", "lessonId");
CREATE INDEX "ClassLessonUnlock_lessonId_idx" ON "ClassLessonUnlock"("lessonId");

ALTER TABLE "ClassLessonUnlock"
ADD CONSTRAINT "ClassLessonUnlock_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassLessonUnlock"
ADD CONSTRAINT "ClassLessonUnlock_lessonId_fkey"
FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
