import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type SendEmailOptions = {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendTransactionalEmail(options: SendEmailOptions) {
    const apiKey = this.configService.get<string>("BREVO_API_KEY");
    const senderEmail = this.configService.get<string>("BREVO_SENDER_EMAIL");
    const senderName = this.configService.get<string>("BREVO_SENDER_NAME") ?? "GIS Konsult Knowledge Hub";

    if (!apiKey || !senderEmail) {
      this.logger.warn("Brevo email is not configured. Skipping transactional email.");
      return { skipped: true };
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: options.to, name: options.toName ?? options.to }],
        subject: options.subject,
        htmlContent: options.htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Brevo send failed: ${response.status} ${errorText}`);
      throw new ServiceUnavailableException("Email provider could not send the message.");
    }

    return response.json();
  }

  sendWelcomeEmail(to: string, toName: string) {
    return this.sendTransactionalEmail({
      to,
      toName,
      subject: "Welcome to GIS Konsult Knowledge Hub",
      htmlContent: `
        <h2>Welcome to GIS Konsult Knowledge Hub</h2>
        <p>Hello ${toName}, your account has been created successfully.</p>
        <p>You can now learn GIS, join challenges, track progress, and build your skills.</p>
      `,
    });
  }

  sendGradeNotification(to: string, toName: string, assignmentTitle: string, score: number | null, feedback?: string) {
    return this.sendTransactionalEmail({
      to,
      toName,
      subject: `Your assignment has been graded: ${assignmentTitle}`,
      htmlContent: `
        <h2>Assignment graded</h2>
        <p>Hello ${toName},</p>
        <p>Your submission for <strong>${assignmentTitle}</strong> has been graded.</p>
        <p>Score: <strong>${score ?? "N/A"}</strong></p>
        ${feedback ? `<p>Instructor feedback: ${feedback}</p>` : ""}
      `,
    });
  }

  sendCertificateIssued(to: string, toName: string, certificateNo: string, title: string) {
    return this.sendTransactionalEmail({
      to,
      toName,
      subject: `Your certificate: ${title}`,
      htmlContent: `
        <h2>Certificate issued</h2>
        <p>Hello ${toName},</p>
        <p>Congratulations — your certificate titled <strong>${title}</strong> has been issued.</p>
        <p>Certificate number: <strong>${certificateNo}</strong></p>
      `,
    });
  }

  sendCompetitionLive(to: string, toName: string, competitionTitle: string, startsAt?: Date) {
    return this.sendTransactionalEmail({
      to,
      toName,
      subject: `Competition is live: ${competitionTitle}`,
      htmlContent: `
        <h2>Competition live</h2>
        <p>Hello ${toName},</p>
        <p>The competition <strong>${competitionTitle}</strong> is now live${startsAt ? ` (starts at ${new Date(startsAt).toLocaleString()})` : ""}.</p>
        <p>Good luck!</p>
      `,
    });
  }
}
