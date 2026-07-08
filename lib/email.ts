// Server-only email sender via SMTP (Nodemailer). If SMTP env vars are not
// configured, sending is skipped gracefully so the client can fall back to a
// mailto: link. Configure with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
// and optionally SMTP_FROM (defaults to SMTP_USER).
import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

export interface SendResult {
  sent: boolean;
  skipped?: boolean;
  error?: string;
  preview?: string; // Ethereal preview URL when testing
}

export async function sendMail(params: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) return { sent: false, skipped: true };

  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Strip CR/LF from single-line headers to prevent header injection.
    const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: oneLine(params.to),
      subject: oneLine(params.subject),
      text: params.text,
      replyTo: params.replyTo ? oneLine(params.replyTo) : undefined,
    });
    const preview = nodemailer.getTestMessageUrl(info) || undefined;
    if (preview) console.log("[email] test preview:", preview);
    return { sent: true, preview };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Failed to send email";
    console.error("[email] send failed:", error);
    return { sent: false, error };
  }
}
