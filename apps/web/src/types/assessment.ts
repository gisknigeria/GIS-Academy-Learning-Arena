export type QuestionType = "MCQ" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "FILE_UPLOAD" | "MAP_TASK" | "NOTE";
export type AttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "TIMED_OUT";
export type AssessmentAnswer = string | string[];

export type Question = {
  id: string;
  assessmentId: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer?: string | null;
  explanation?: string | null;
  points: number;
  order: number;
};

/** Question as returned to a student mid-attempt — no correct answer */
export type SafeQuestion = Omit<Question, "correctAnswer" | "explanation">;

export type Assessment = {
  id: string;
  courseId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string | null;
  durationMin: number;
  passMark: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; code: string; title: string } | null;
  lesson?: { id: string; title: string; order: number } | null;
  questions?: Question[];
  _count?: { questions: number; attempts: number };
};

export type AttemptSession = {
  attemptId: string;
  assessmentId: string;
  title: string;
  description?: string | null;
  durationMin: number;
  startedAt: string;
  savedAnswers: Record<string, AssessmentAnswer>;
  questions: SafeQuestion[];
};

export type AttemptBreakdownItem = {
  questionId: string;
  text: string;
  type: QuestionType;
  options: string[];
  studentAnswer: AssessmentAnswer | null;
  correctAnswer: AssessmentAnswer | null;
  explanation: string | null;
  points: number;
  earnedPoints: number;
  correct: boolean | null;
  gradingComment?: string | null;
};

export type AttemptResult = {
  attemptId: string;
  assessmentId: string;
  title: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passMark: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string;
  breakdown: AttemptBreakdownItem[];
};

export type AttemptSummary = {
  id: string;
  assessmentId: string;
  userId: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  passed: boolean | null;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  assessment: { id: string; title: string; passMark: number };
};

export type CreateAssessmentPayload = {
  title: string;
  description?: string;
  courseId?: string;
  lessonId?: string;
  durationMin?: number;
  passMark?: number;
  shuffleQuestions?: boolean;
  isPublished?: boolean;
};

export type UpdateAssessmentPayload = Partial<CreateAssessmentPayload>;

export type CreateQuestionPayload = {
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points?: number;
  order?: number;
};

export type UpdateQuestionPayload = Partial<CreateQuestionPayload>;

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ: "Single choice",
  MULTIPLE_CHOICE: "Multiple answers",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer",
  FILE_UPLOAD: "File upload",
  MAP_TASK: "Map task",
  NOTE: "Note / instruction",
};

export type AnswerCheckResult = {
  questionId: string;
  correct: boolean | null;
  correctAnswer: AssessmentAnswer | null;
  explanation?: string | null;
};
