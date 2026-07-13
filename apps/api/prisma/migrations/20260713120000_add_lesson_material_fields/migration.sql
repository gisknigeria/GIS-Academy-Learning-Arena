ALTER TABLE "Lesson"
  ADD COLUMN "content" TEXT,
  ADD COLUMN "subtitleUrl" TEXT,
  ADD COLUMN "slideUrl" TEXT,
  ADD COLUMN "mapUrl" TEXT,
  ADD COLUMN "attachments" JSONB NOT NULL DEFAULT '[]';
