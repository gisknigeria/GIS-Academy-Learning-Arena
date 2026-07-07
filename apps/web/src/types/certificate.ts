export type Certificate = {
  id: string;
  certificateNo: string;
  userId: string;
  title: string;
  verificationId: string;
  issuedAt: string;
  courseId?: string | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

export type VerifiedCertificate = {
  certificateNo: string;
  title: string;
  verificationId: string;
  issuedAt: string;
  learner: {
    fullName: string;
    email: string;
  } | null;
  courseTitle?: string | null;
  qrCodeDataUrl?: string;
};

export type IssueCertificatePayload = {
  userId: string;
  title: string;
};
