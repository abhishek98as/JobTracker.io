import nodemailer from "nodemailer";
import { MAX_EMAILS_PER_DAY, MAX_EMAILS_PER_HOUR } from "@/lib/constants";
import { buildSafeUnsubscribeLine, findSpamWords } from "@/lib/spam-filter";

export function renderTemplate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/\{\{\s*([^}|]+?)\s*(?:\|\s*"([^"]*)")?\s*\}\}/g, (_, key: string, fallback: string) => {
    const value = values[key.trim()];
    if (value && value.trim()) {
      return value;
    }
    return fallback ?? "";
  });
}

export function validateSpamSafety(subject: string, body: string) {
  const violations = [...findSpamWords(subject), ...findSpamWords(body)];
  return {
    safe: violations.length === 0,
    violations: [...new Set(violations)]
  };
}

export function randomDelayMs(minSeconds = 45, maxSeconds = 90) {
  const seconds = Math.floor(Math.random() * (maxSeconds - minSeconds + 1)) + minSeconds;
  return seconds * 1000;
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export type SendEmailParams = {
  to: string;
  subject: string;
  body: string;
  fromName: string;
  resumePath?: string;
};

export function createGmailTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Missing Gmail credentials in environment variables.");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user,
      pass
    }
  });
}

export async function sendSafeEmail(params: SendEmailParams) {
  const transporter = createGmailTransport();
  const safeBody = buildSafeUnsubscribeLine(params.body);
  const safety = validateSpamSafety(params.subject, safeBody);

  if (!safety.safe) {
    throw new Error(`Email blocked due to spam words: ${safety.violations.join(", ")}`);
  }

  const sendResult = await transporter.sendMail({
    from: `${params.fromName} <${process.env.GMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    text: safeBody,
    attachments: params.resumePath
      ? [
          {
            filename: "resume.pdf",
            path: params.resumePath
          }
        ]
      : undefined
  });

  return sendResult;
}

export function enforceEmailLimits(emailsInLastHour: number, emailsToday: number) {
  if (emailsInLastHour >= MAX_EMAILS_PER_HOUR) {
    throw new Error(`Hourly limit reached (${MAX_EMAILS_PER_HOUR}/hour). Pause campaign and retry later.`);
  }

  if (emailsToday >= MAX_EMAILS_PER_DAY) {
    throw new Error(`Daily safety limit reached (${MAX_EMAILS_PER_DAY}/day).`);
  }
}