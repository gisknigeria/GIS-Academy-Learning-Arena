CREATE TABLE "LiveSession" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "meetingUrl" TEXT,
  "presentationUrl" TEXT,
  "bookUrl" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LiveSession_classId_startsAt_idx" ON "LiveSession"("classId", "startsAt");

ALTER TABLE "LiveSession"
ADD CONSTRAINT "LiveSession_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiveSession"
ADD CONSTRAINT "LiveSession_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
