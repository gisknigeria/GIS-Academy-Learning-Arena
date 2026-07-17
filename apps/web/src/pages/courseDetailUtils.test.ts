import { describe, expect, it } from "vitest";
import { getCourseCtaLessonId } from "./courseDetailUtils";
import type { CourseProgress, Lesson } from "../types/course";

describe("getCourseCtaLessonId", () => {
  it("returns null when a completed course has no lessons to review", () => {
    const lessons: Lesson[] = [];
    const progress: CourseProgress = {
      courseId: "course-1",
      totalLessons: 0,
      completedLessons: 0,
      totalModules: 0,
      completedPracticalModules: 0,
      totalFinalAssessments: 0,
      passedFinalAssessments: 0,
      courseCompleted: true,
      progress: 100,
    };

    expect(getCourseCtaLessonId(lessons, progress)).toBeNull();
  });

  it("returns the first incomplete lesson for an incomplete course", () => {
    const lessons: Lesson[] = [
      { id: "lesson-1", courseId: "course-1", title: "Welcome", order: 1 },
      { id: "lesson-2", courseId: "course-1", title: "Next", order: 2, completed: true },
    ];
    const progress: CourseProgress = {
      courseId: "course-1",
      totalLessons: 2,
      completedLessons: 1,
      totalModules: 0,
      completedPracticalModules: 0,
      totalFinalAssessments: 0,
      passedFinalAssessments: 0,
      courseCompleted: false,
      progress: 50,
    };

    expect(getCourseCtaLessonId(lessons, progress)).toBe("lesson-1");
  });
});
