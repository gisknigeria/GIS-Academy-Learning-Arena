import { apiRequest } from "./api";
import type {
  Certificate,
  IssueCertificatePayload,
  VerifiedCertificate,
} from "../types/certificate";

export const certificatesApi = {
  mine(token: string): Promise<Certificate[]> {
    return apiRequest<Certificate[]>("/certificates/mine", { token });
  },

  list(token: string): Promise<Certificate[]> {
    return apiRequest<Certificate[]>("/certificates", { token });
  },

  issue(token: string, payload: IssueCertificatePayload): Promise<Certificate> {
    return apiRequest<Certificate>("/certificates/issue", {
      method: "POST",
      token,
      body: payload,
    });
  },

  verify(verificationId: string): Promise<VerifiedCertificate> {
    return apiRequest<VerifiedCertificate>(`/certificates/verify/${verificationId}`);
  },

  async downloadPdf(token: string, certificateId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}/pdf`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to download certificate PDF");
    }

    return response.blob();
  },
};
