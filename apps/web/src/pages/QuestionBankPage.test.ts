import { describe, expect, it } from "vitest";
import { normalizeQuestionImport } from "./QuestionBankPage";

describe("question library file import", () => {
  it("parses metadata from a valid CSV template", () => {
    const csv = "text,type,options,correctAnswer,points,tags,difficulty,subject\nWhat is GIS?,MCQ,Spatial system|Internet service,Spatial system,2,GIS|Basics,EASY,Introduction";
    const result = normalizeQuestionImport(csv, "questions.csv");
    expect(result.issues).toEqual([]);
    expect(result.values[0]).toMatchObject({ text: "What is GIS?", tags: ["GIS", "Basics"], difficulty: "EASY", subject: "Introduction" });
  });

  it("reports every invalid row without discarding valid rows", () => {
    const csv = "text,type,options,correctAnswer,points\nNo?,UNKNOWN,,,1\nValid statement,TRUE_FALSE,,true,1\nBad choices,MCQ,Only one,Only one,1";
    const result = normalizeQuestionImport(csv, "questions.csv");
    expect(result.values).toHaveLength(1);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2 }),
      expect.objectContaining({ row: 4 }),
    ]));
  });

  it("returns a clear error for malformed JSON", () => {
    expect(normalizeQuestionImport("{broken", "questions.json").issues[0].message).toContain("not valid JSON");
  });
});
