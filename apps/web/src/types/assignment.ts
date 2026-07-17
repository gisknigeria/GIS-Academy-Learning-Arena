export type SubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED" | "RETURNED";

export type Assignment = {
  id: string;
  courseId: string;
  moduleId?: string | null;
  kind: "COURSEWORK" | "MODULE_PRACTICAL" | "CAPSTONE_PROJECT";
  title: string;
  description?: string | null;
  dueDate?: string | null;
  maxScore: number;
  isPublished: boolean;
  acceptedEvidence?: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number };
  /** Present for learner-facing responses — the caller's own submission */
  mySubmission?: MySubmission | null;
};

export type MySubmission = {
  id: string;
  status: SubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  submittedAt: string;
  gradedAt?: string | null;
};

export type Submission = {
  id: string;
  assignmentId: string;
  studentId: string;
  answer?: string | null;
  fileUrl?: string | null;
  evidence?: EvidenceFile[];
  status: SubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  submittedAt: string;
  gradedAt?: string | null;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type CreateAssignmentPayload = {
  moduleId?: string;
  kind?: "COURSEWORK" | "MODULE_PRACTICAL" | "CAPSTONE_PROJECT";
  title: string;
  description?: string;
  dueDate?: string;
  maxScore?: number;
  isPublished?: boolean;
  acceptedEvidence?: string[];
};

export type UpdateAssignmentPayload = Partial<CreateAssignmentPayload>;

export type SubmitAssignmentPayload = {
  answer?: string;
  fileUrl?: string;
  evidence?: EvidenceFile[];
};

export type EvidenceFile = {
  name: string;
  url: string;
  type?: string;
};

export type GradeSubmissionPayload = {
  score?: number;
  feedback?: string;
  status: SubmissionStatus;
};

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  PENDING: "Not submitted",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
  RETURNED: "Returned",
};

export const STATUS_COLOURS: Record<SubmissionStatus, string> = {
  PENDING: "status-pending",
  SUBMITTED: "status-submitted",
  GRADED: "status-graded",
  RETURNED: "status-returned",
};
