import type { Assignment } from "./assignment";
import type { Course, Lesson } from "./course";

export type CourseModule = {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  order: number;
  importedFromId?: string | null;
  lessons: Lesson[];
  practicals: Assignment[];
  _count?: { lessons: number; practicals: number };
  course?: Pick<Course, "id" | "code" | "title">;
};

export type LearningStageCourse = {
  id: string;
  stageId: string;
  courseId: string;
  order: number;
  required: boolean;
  course: Course & {
    enrollment?: { progress: number } | null;
    _count?: { modules: number; lessons: number; enrollments: number };
  };
};

export type LearningStage = {
  id: string;
  pathwayId: string;
  stageNumber: number;
  name: string;
  description?: string | null;
  unlocked: boolean;
  lockedReason?: string | null;
  courses: LearningStageCourse[];
};

export type LearningPathway = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  whatYoullLearn?: string | null;
  prerequisites?: string | null;
  targetAudience?: string | null;
  order: number;
  stages: LearningStage[];
};

export type TrainingCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  order: number;
  pathways: LearningPathway[];
};

