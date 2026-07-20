CREATE TABLE "TutorRequest" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "tutorId" TEXT,
  "topic" TEXT NOT NULL,
  "challenge" TEXT NOT NULL,
  "attempted" TEXT NOT NULL,
  "desiredOutcome" TEXT NOT NULL,
  "botSummary" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "proposedSlots" JSONB NOT NULL DEFAULT '[]',
  "selectedStart" TIMESTAMP(3),
  "meetingUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TutorRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TutorRequest_classId_status_idx" ON "TutorRequest"("classId", "status");
CREATE INDEX "TutorRequest_studentId_createdAt_idx" ON "TutorRequest"("studentId", "createdAt");
CREATE INDEX "TutorRequest_tutorId_status_idx" ON "TutorRequest"("tutorId", "status");

ALTER TABLE "TutorRequest" ADD CONSTRAINT "TutorRequest_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorRequest" ADD CONSTRAINT "TutorRequest_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TutorRequest" ADD CONSTRAINT "TutorRequest_tutorId_fkey"
FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
