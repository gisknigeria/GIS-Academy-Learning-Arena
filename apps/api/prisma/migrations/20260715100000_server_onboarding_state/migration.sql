ALTER TABLE "UserProfile" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

UPDATE "UserProfile"
SET "onboardingCompletedAt" = CURRENT_TIMESTAMP
WHERE "ageBand" IS NOT NULL
  AND "trainingCategory" IS NOT NULL
  AND "preferredMode" IS NOT NULL
  AND "learningGoal" IS NOT NULL;
