import type { Course } from "../types/course";

export const COURSE_PREFIX_OPTIONS = ["LIT", "GSA", "SMD", "WEB", "IDT"] as const;

export function normalizeCourseCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function getCourseCodePrefix(courseCode: string) {
  const normalized = normalizeCourseCode(courseCode);
  const letters = normalized.match(/^[A-Z]+/)?.[0] ?? normalized;
  return letters || "LIT";
}

export function getModuleCode(courseCode: string, moduleOrder: number, deliveryMode: Course["deliveryMode"]) {
  const prefix = getCourseCodePrefix(courseCode);
  const base = deliveryMode === "ONSITE" ? 101 : 111;
  const moduleNumber = Math.max(1, Number(moduleOrder) || 1);
  const block = Math.ceil(moduleNumber / 4);
  const slot = ((moduleNumber - 1) % 4) + 1;
  return `${prefix}${base + (block - 1) * 100 + slot - 1}`;
}

export function getLessonCode(courseCode: string, moduleOrder: number, lessonOrder: number, deliveryMode: Course["deliveryMode"]) {
  const moduleCode = getModuleCode(courseCode, moduleOrder, deliveryMode);
  return `${moduleCode}${getLessonLetter(lessonOrder)}`;
}

export function getLessonLetter(lessonOrder: number) {
  const safeOrder = Math.max(1, Number(lessonOrder) || 1);
  const alphabet = "abcde";
  const index = Math.min(safeOrder - 1, alphabet.length - 1);
  return alphabet[index];
}
