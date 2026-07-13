CREATE TABLE "ClassMessage" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ClassMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassMessage_classId_createdAt_idx" ON "ClassMessage"("classId", "createdAt");
CREATE INDEX "ClassMessage_senderId_idx" ON "ClassMessage"("senderId");

ALTER TABLE "ClassMessage"
ADD CONSTRAINT "ClassMessage_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClassMessage"
ADD CONSTRAINT "ClassMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
