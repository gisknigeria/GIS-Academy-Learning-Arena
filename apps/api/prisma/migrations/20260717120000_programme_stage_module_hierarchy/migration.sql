CREATE TYPE "AssignmentKind" AS ENUM ('COURSEWORK', 'MODULE_PRACTICAL', 'CAPSTONE_PROJECT');
CREATE TYPE "AssessmentScope" AS ENUM ('LESSON', 'MODULE', 'COURSE_FINAL');

CREATE TABLE "TrainingCategory" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainingCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningPathway" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningPathway_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningStage" (
  "id" TEXT NOT NULL,
  "pathwayId" TEXT NOT NULL,
  "stageNumber" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LearningStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningStageCourse" (
  "id" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "required" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "LearningStageCourse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CourseModule" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL,
  "importedFromId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseModule_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Lesson" ADD COLUMN "moduleId" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "importedFromId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "moduleId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "kind" "AssignmentKind" NOT NULL DEFAULT 'COURSEWORK';
ALTER TABLE "Assignment" ADD COLUMN "acceptedEvidence" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Submission" ADD COLUMN "evidence" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Assessment" ADD COLUMN "scope" "AssessmentScope" NOT NULL DEFAULT 'COURSE_FINAL';
UPDATE "Assessment" SET "scope" = 'LESSON' WHERE "lessonId" IS NOT NULL;
ALTER TABLE "Certificate" ADD COLUMN "stageId" TEXT;

CREATE UNIQUE INDEX "TrainingCategory_slug_key" ON "TrainingCategory"("slug");
CREATE UNIQUE INDEX "LearningPathway_categoryId_name_key" ON "LearningPathway"("categoryId", "name");
CREATE INDEX "LearningPathway_categoryId_order_idx" ON "LearningPathway"("categoryId", "order");
CREATE UNIQUE INDEX "LearningStage_pathwayId_stageNumber_key" ON "LearningStage"("pathwayId", "stageNumber");
CREATE INDEX "LearningStage_pathwayId_stageNumber_idx" ON "LearningStage"("pathwayId", "stageNumber");
CREATE UNIQUE INDEX "LearningStageCourse_stageId_courseId_key" ON "LearningStageCourse"("stageId", "courseId");
CREATE INDEX "LearningStageCourse_courseId_idx" ON "LearningStageCourse"("courseId");
CREATE UNIQUE INDEX "CourseModule_courseId_order_key" ON "CourseModule"("courseId", "order");
CREATE INDEX "CourseModule_courseId_idx" ON "CourseModule"("courseId");
CREATE INDEX "CourseModule_importedFromId_idx" ON "CourseModule"("importedFromId");
CREATE INDEX "Lesson_moduleId_order_idx" ON "Lesson"("moduleId", "order");
CREATE INDEX "Lesson_importedFromId_idx" ON "Lesson"("importedFromId");
CREATE UNIQUE INDEX "Certificate_userId_stageId_key" ON "Certificate"("userId", "stageId");

ALTER TABLE "LearningPathway" ADD CONSTRAINT "LearningPathway_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "TrainingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningStage" ADD CONSTRAINT "LearningStage_pathwayId_fkey"
  FOREIGN KEY ("pathwayId") REFERENCES "LearningPathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningStageCourse" ADD CONSTRAINT "LearningStageCourse_stageId_fkey"
  FOREIGN KEY ("stageId") REFERENCES "LearningStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningStageCourse" ADD CONSTRAINT "LearningStageCourse_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseModule" ADD CONSTRAINT "CourseModule_importedFromId_fkey"
  FOREIGN KEY ("importedFromId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_importedFromId_fkey"
  FOREIGN KEY ("importedFromId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_moduleId_fkey"
  FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_stageId_fkey"
  FOREIGN KEY ("stageId") REFERENCES "LearningStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "TrainingCategory" ("id", "slug", "name", "description", "order", "updatedAt") VALUES
  ('category_bootcamp', 'bootcamp', 'Bootcamp', 'Short, intensive and outcome-focused practical programmes.', 1, CURRENT_TIMESTAMP),
  ('category_green', 'green', 'Green', 'Age-appropriate technology, sustainability and geospatial learning pathways.', 2, CURRENT_TIMESTAMP),
  ('category_academy', 'academy', 'Academy', 'Structured professional and technical certification programmes.', 3, CURRENT_TIMESTAMP),
  ('category_industry', 'industry-training', 'Industry Training', 'Sector-specific professional development and workforce training.', 4, CURRENT_TIMESTAMP),
  ('category_premium', 'premium-executive-service', 'Premium Executive Service', 'Custom executive learning, coaching and advisory programmes.', 5, CURRENT_TIMESTAMP);

INSERT INTO "LearningPathway" ("id", "categoryId", "name", "description", "order", "updatedAt") VALUES
  ('path_bootcamp_ngo', 'category_bootcamp', 'NGO and Development Sector', 'Digital tools, data, monitoring, evaluation and organisational impact.', 1, CURRENT_TIMESTAMP),
  ('path_bootcamp_org', 'category_bootcamp', 'Organisation-Wide', 'Custom workforce adoption and digital transformation training.', 2, CURRENT_TIMESTAMP),
  ('path_bootcamp_school', 'category_bootcamp', 'School Enrichment', 'Practical technology and geospatial enrichment for schools.', 3, CURRENT_TIMESTAMP),
  ('path_green', 'category_green', 'Green Learning Pathway', 'School-level green technology and geospatial progression.', 1, CURRENT_TIMESTAMP),
  ('path_academy', 'category_academy', 'Academy Programme', 'Professional technical learning and certification.', 1, CURRENT_TIMESTAMP),
  ('path_industry', 'category_industry', 'Industry Training Pathway', 'Professional pathways configurable for each industry.', 1, CURRENT_TIMESTAMP),
  ('path_premium', 'category_premium', 'Executive Service Pathway', 'Private and institutional executive programmes.', 1, CURRENT_TIMESTAMP);

INSERT INTO "LearningStage" ("id", "pathwayId", "stageNumber", "name", "description", "updatedAt")
SELECT CONCAT("id", '_stage_1'), "id", 1, 'Foundation', 'Essential concepts, terminology, tools and guided practical skills.', CURRENT_TIMESTAMP FROM "LearningPathway";
INSERT INTO "LearningStage" ("id", "pathwayId", "stageNumber", "name", "description", "updatedAt")
SELECT CONCAT("id", '_stage_2'), "id", 2, 'Intermediate', 'Applied competence through practical exercises and real scenarios.', CURRENT_TIMESTAMP FROM "LearningPathway";
INSERT INTO "LearningStage" ("id", "pathwayId", "stageNumber", "name", "description", "updatedAt")
SELECT CONCAT("id", '_stage_3'), "id", 3, 'Advanced', 'Independent projects, specialised proficiency and certification.', CURRENT_TIMESTAMP FROM "LearningPathway";

UPDATE "LearningStage" SET "name" = 'SSS 1 - Foundation' WHERE "pathwayId" = 'path_green' AND "stageNumber" = 1;
UPDATE "LearningStage" SET "name" = 'SSS 2 - Applied' WHERE "pathwayId" = 'path_green' AND "stageNumber" = 2;
UPDATE "LearningStage" SET "name" = 'SSS 3 - Innovation and Competition' WHERE "pathwayId" = 'path_green' AND "stageNumber" = 3;
