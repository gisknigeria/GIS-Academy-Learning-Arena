export type Certificate = {
  id: string;
  certificateNo: string;
  userId: string;
  title: string;
  verificationId: string;
  issuedAt: string;
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
};

export type IssueCertificatePayload = {
  userId: string;
  title: string;
};
