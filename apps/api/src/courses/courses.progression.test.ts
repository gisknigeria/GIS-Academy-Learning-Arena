import { describe, expect, it, vi } from "vitest";
import { CoursesService } from "./courses.service";

describe("CoursesService sequential lesson progression", () => {
  it("locks the next lesson until the previous lesson is completed", async () => {
    const prisma = {
      course: {
        findUnique: vi.fn().mockResolvedValue({
          id: "course-1",
          _count: { lessons: 2, enrollments: 1, classes: 0 },
        }),
      },
      enrollment: { findUnique: vi.fn().mockResolvedValue(null) },
      lesson: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "lesson-1",
            courseId: "course-1",
            moduleId: "module-1",
            title: "First lesson",
            order: 1,
            content: "First",
            attachments: [],
            progress: [],
          },
          {
            id: "lesson-2",
            courseId: "course-1",
            moduleId: "module-1",
            title: "Second lesson",
            order: 2,
            content: "Second",
            attachments: [],
            progress: [],
          },
        ]),
      },
    };
    const service = new CoursesService(
      prisma as never,
      { issueAutoCompletion: vi.fn() } as never,
      { assertCanEnroll: vi.fn() } as never,
    );

    const lessons = await service.listLessonsWithProgress("course-1", "student-1");

    expect(lessons[0]).toMatchObject({ id: "lesson-1", locked: false });
    expect(lessons[1]).toMatchObject({
      id: "lesson-2",
      locked: true,
      lockReason: "previous_lesson",
      content: null,
    });
  });
});
