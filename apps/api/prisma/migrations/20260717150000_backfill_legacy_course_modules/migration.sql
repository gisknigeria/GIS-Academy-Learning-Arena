-- Existing courses created before modules were introduced can have lessons with
-- no module. Give each affected course a visible compatibility module.
INSERT INTO "CourseModule" (
  "id",
  "courseId",
  "title",
  "description",
  "order",
  "createdAt",
  "updatedAt"
)
SELECT
  CONCAT('legacy_module_', course."id"),
  course."id",
  'Course lessons',
  'Lessons created before the module-based course structure was introduced.',
  COALESCE(MAX(existing."order"), 0) + 1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Course" course
JOIN "Lesson" lesson
  ON lesson."courseId" = course."id"
  AND lesson."moduleId" IS NULL
LEFT JOIN "CourseModule" existing
  ON existing."courseId" = course."id"
GROUP BY course."id"
ON CONFLICT ("id") DO NOTHING;

UPDATE "Lesson" lesson
SET "moduleId" = CONCAT('legacy_module_', lesson."courseId")
WHERE lesson."moduleId" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "CourseModule" module
    WHERE module."id" = CONCAT('legacy_module_', lesson."courseId")
  );

