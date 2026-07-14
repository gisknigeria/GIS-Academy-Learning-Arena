import { describe, expect, it, vi } from "vitest";
import { AssessmentsService } from "./assessments.service";

describe("AssessmentsService.importQuestions", () => {
  it("clones reusable questions and their metadata into an assessment", async () => {
    const create = vi.fn((args) => Promise.resolve({ id: `copy-${args.data.order}`, ...args.data }));
    const prisma = {
      assessment: { findUnique: vi.fn().mockResolvedValue({ id: "assessment-1" }) },
      question: {
        findMany: vi.fn().mockResolvedValue([{ id: "template-1", text: "GIS question", type: "MCQ", options: ["A", "B"], correctAnswer: "A", explanation: "Because A", points: 2, tags: ["GIS"], difficulty: "HARD", subject: "Mapping", courseId: "course-1", lessonId: "lesson-1" }]),
        findFirst: vi.fn().mockResolvedValue({ order: 3 }),
        create,
      },
      $transaction: vi.fn((operations) => Promise.all(operations)),
    };
    const service = new AssessmentsService(prisma as never);

    const result = await service.importQuestions("assessment-1", ["template-1"]);

    expect(result).toHaveLength(1);
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ assessmentId: "assessment-1", order: 4, tags: ["GIS"], difficulty: "HARD", courseId: "course-1", lessonId: "lesson-1" }) });
  });
});
