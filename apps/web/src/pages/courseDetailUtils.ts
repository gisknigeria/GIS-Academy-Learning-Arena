import type { CourseProgress, Lesson } from "../types/course";

export function getCourseCtaLessonId(lessons: Lesson[], progress: CourseProgress | null) {
  if (!lessons.length) return null;

  const allComplete = Boolean(progress?.courseCompleted);
  const firstIncompleteLesson = lessons.find((lesson) => !lesson.completed) ?? null;

  if (allComplete) {
    return lessons[0]?.id ?? null;
  }

  return firstIncompleteLesson?.id ?? null;
}
