import { commissionConfig } from "../../data/commissions";
import type {
  CommissionEstimate,
  CommissionSubmission,
} from "../../lib/commission/types";

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}

export interface EmailProvider {
  send(message: OutgoingEmail): Promise<void>;
}

export interface EmailBrand {
  name: string;
  siteUrl: string;
  from: string;
  replyTo?: string;
}

export interface ResendProviderOptions {
  apiKey: string;
  from: string;
  replyTo?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export class EmailDeliveryError extends Error {
  constructor(readonly status: number | null = null) {
    super("The email provider could not accept the message.");
    this.name = "EmailDeliveryError";
  }
}

export class ResendEmailProvider implements EmailProvider {
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: ResendProviderOptions) {
    if (!options.apiKey || !options.from) {
      throw new EmailDeliveryError();
    }
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async send(message: OutgoingEmail): Promise<void> {
    let response: Response;
    const controller = new AbortController();
    const timeoutMs = Math.min(
      30_000,
      Math.max(1_000, this.options.timeoutMs ?? 10_000),
    );
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      response = await this.fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": message.idempotencyKey,
          "User-Agent": "sheepex-commissions/1.0",
        },
        body: JSON.stringify({
          from: this.options.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(this.options.replyTo
            ? { reply_to: this.options.replyTo }
            : {}),
        }),
        signal: controller.signal,
      });
    } catch (error) {
      const errorName = error instanceof Error ? error.name : typeof error;
      const errorMessage =
        error instanceof Error
          ? error.message.replace(/[\r\n]+/g, " ").slice(0, 500)
          : "Unknown email transport error";
      console.error("Resend email transport failed", {
        errorName,
        errorMessage,
      });
      throw new EmailDeliveryError();
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) throw new EmailDeliveryError(response.status);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function optionLabel<T extends string | number>(
  options: readonly { id: T; label: string }[],
  id: T,
): string {
  return options.find((option) => option.id === id)?.label ?? String(id);
}

function formatMoney(amountInCents: number, currency: string): string {
  return new Intl.NumberFormat(commissionConfig.locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

function formatEstimateRange(estimate: CommissionEstimate): string {
  const minimum = formatMoney(estimate.min, estimate.currency);
  const maximum = formatMoney(estimate.max, estimate.currency);
  return minimum === maximum ? minimum : `${minimum}–${maximum}`;
}

function describeSubmission(
  submission: CommissionSubmission,
): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    [
      "Commission type",
      optionLabel(commissionConfig.commissionTypes, submission.commissionType),
    ],
    [
      "Intended use",
      optionLabel(commissionConfig.intendedUses, submission.intendedUse),
    ],
    [
      "Complexity",
      optionLabel(commissionConfig.complexities, submission.complexity),
    ],
    ["Concepts", String(submission.concepts)],
    ["Revisions", String(submission.revisions)],
    [
      "Delivery format",
      optionLabel(commissionConfig.outputFormats, submission.outputFormat),
    ],
    ["Dimensions", submission.dimensions],
    ["Preferred delivery", submission.deliveryDate || "Flexible"],
    ["Commercial usage", submission.commercialUse ? "Yes" : "No"],
    ["Project details", submission.projectDescription],
  ];

  if (submission.additionalNotes) {
    rows.push(["Additional notes", submission.additionalNotes]);
  }
  if (submission.referenceLinks.length > 0) {
    rows.push(["References", submission.referenceLinks.join("\n")]);
  }

  return rows;
}

function describeContact(
  submission: CommissionSubmission,
): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ["Email", submission.email],
    ["Preferred contact", submission.preferredContact],
  ];

  if (submission.discord) rows.push(["Discord", submission.discord]);
  if (submission.otherPlatform || submission.otherContact) {
    rows.push([
      "Other contact",
      [submission.otherPlatform, submission.otherContact]
        .filter(Boolean)
        .join(": "),
    ]);
  }
  return rows;
}

function textRows(rows: Array<[string, string]>): string {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function htmlRows(rows: Array<[string, string]>): string {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px 8px 0;color:#6e675e;font-size:13px;line-height:1.5;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td>
          <td style="padding:8px 0;color:#1b1917;font-size:14px;line-height:1.5;vertical-align:top;white-space:pre-wrap;word-break:break-word">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");
}

function estimateText(estimate: CommissionEstimate): string {
  return estimate.lines
    .map(
      (line) =>
        `${line.label}: ${formatEstimateRange({
          currency: estimate.currency,
          min: line.min,
          max: line.max,
          lines: [],
        })}`,
    )
    .join("\n");
}

function estimateHtml(estimate: CommissionEstimate): string {
  return estimate.lines
    .map(
      (line) => `
        <tr>
          <td style="padding:7px 12px 7px 0;color:#6e675e;font-size:13px">${escapeHtml(line.label)}</td>
          <td style="padding:7px 0;color:#1b1917;font-size:13px;text-align:right;white-space:nowrap">${escapeHtml(
            formatEstimateRange({
              currency: estimate.currency,
              min: line.min,
              max: line.max,
              lines: [],
            }),
          )}</td>
        </tr>`,
    )
    .join("");
}

function emailShell(
  brand: EmailBrand,
  preview: string,
  title: string,
  body: string,
): string {
  const safeBrand = escapeHtml(brand.name);
  const safeUrl = escapeHtml(brand.siteUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#faf8f5;color:#1b1917;font-family:Arial,Helvetica,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f5">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#faf8f5;border:1px solid #e8e3db;border-radius:18px;overflow:hidden">
            <tr>
              <td style="padding:26px 30px;border-bottom:1px solid #e8e3db">
                <a href="${safeUrl}" style="color:#a55233;text-decoration:none;font-size:17px;font-weight:700;letter-spacing:.08em">${safeBrand}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:30px">${body}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildVerificationEmail(
  email: string,
  code: string,
  expiresInMinutes: number,
  challengeId: string,
  brand: EmailBrand,
): OutgoingEmail {
  const subject = `Your ${brand.name} verification code`;
  const html = emailShell(
    brand,
    `Use this code to verify your email for a ${brand.name} commission request.`,
    subject,
    `
      <h1 style="margin:0 0 14px;font-size:25px;line-height:1.25">Verify your email</h1>
      <p style="margin:0 0 24px;color:#6e675e;font-size:15px;line-height:1.65">Enter this four-digit code to continue your commission request.</p>
      <div style="margin:0 0 24px;padding:18px;text-align:center;background:#faf8f5;border:1px solid #e8e3db;border-radius:12px;color:#a55233;font-family:Consolas,Monaco,monospace;font-size:34px;font-weight:700;letter-spacing:.35em">${escapeHtml(code)}</div>
      <p style="margin:0;color:#6e675e;font-size:13px;line-height:1.6">The code expires in ${expiresInMinutes} minutes. If you did not request it, you can safely ignore this email.</p>
    `,
  );
  const text = [
    `Verify your email for ${brand.name}`,
    "",
    `Your verification code is: ${code}`,
    "",
    `It expires in ${expiresInMinutes} minutes.`,
    "If you did not request it, you can safely ignore this email.",
  ].join("\n");

  return {
    to: email,
    subject,
    html,
    text,
    idempotencyKey: `verification-${challengeId}`,
  };
}

export function buildCustomerConfirmationEmail(
  requestId: string,
  submission: CommissionSubmission,
  estimate: CommissionEstimate,
  brand: EmailBrand,
): OutgoingEmail {
  const details = describeSubmission(submission);
  const estimateLabel = formatEstimateRange(estimate);
  const subject = `Commission request ${requestId} received`;
  const html = emailShell(
    brand,
    `Your commission request ${requestId} has been received.`,
    subject,
    `
      <h1 style="margin:0 0 12px;font-size:25px;line-height:1.25">Thanks for your request.</h1>
      <p style="margin:0 0 24px;color:#6e675e;font-size:15px;line-height:1.65">I received your commission request and will review the details before sending a final quote. I’ll contact you by email or your preferred social platform.</p>
      <div style="margin:0 0 24px;padding:16px 18px;background:#faf8f5;border:1px solid #e8e3db;border-radius:12px">
        <div style="color:#6e675e;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Request ID</div>
        <div style="margin-top:5px;color:#a55233;font-family:Consolas,Monaco,monospace;font-size:18px;font-weight:700">${escapeHtml(requestId)}</div>
      </div>
      <h2 style="margin:26px 0 10px;font-size:17px">Project summary</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${htmlRows(details)}</table>
      <h2 style="margin:26px 0 10px;font-size:17px">Estimate</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${estimateHtml(estimate)}
        <tr>
          <td style="padding:12px 12px 0 0;border-top:1px solid #e8e3db;color:#1b1917;font-size:15px;font-weight:700">Estimated total</td>
          <td style="padding:12px 0 0;border-top:1px solid #e8e3db;color:#a55233;font-size:15px;font-weight:700;text-align:right">${escapeHtml(estimateLabel)}</td>
        </tr>
      </table>
      <p style="margin:24px 0 0;color:#6e675e;font-size:13px;line-height:1.6">${escapeHtml(commissionConfig.estimateDisclaimer)}</p>
      <p style="margin:24px 0 0;color:#6e675e;font-size:14px;line-height:1.6">— ${escapeHtml(brand.name)}</p>
    `,
  );
  const text = [
    `Thanks for your commission request.`,
    "",
    `Request ID: ${requestId}`,
    "",
    "Project summary",
    textRows(details),
    "",
    "Estimate",
    estimateText(estimate),
    `Estimated total: ${estimateLabel}`,
    "",
    commissionConfig.estimateDisclaimer,
    "",
    "I’ll contact you by email or your preferred social platform.",
    `— ${brand.name}`,
  ].join("\n");

  return {
    to: submission.email,
    subject,
    html,
    text,
    idempotencyKey: `commission-${requestId}-customer`,
  };
}

export function buildOwnerNotificationEmail(
  ownerEmail: string,
  requestId: string,
  submission: CommissionSubmission,
  estimate: CommissionEstimate,
  brand: EmailBrand,
): OutgoingEmail {
  const details = describeSubmission(submission);
  const contact = describeContact(submission);
  const estimateLabel = formatEstimateRange(estimate);
  const subject = `New commission request — ${requestId}`;
  const html = emailShell(
    brand,
    `New commission request ${requestId} from ${submission.email}.`,
    subject,
    `
      <h1 style="margin:0 0 12px;font-size:25px;line-height:1.25">New commission request</h1>
      <p style="margin:0 0 24px;color:#6e675e;font-size:15px;line-height:1.65">A verified customer submitted request <strong style="color:#a55233">${escapeHtml(requestId)}</strong>.</p>
      <h2 style="margin:26px 0 10px;font-size:17px">Contact</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${htmlRows(contact)}</table>
      <h2 style="margin:26px 0 10px;font-size:17px">Project details</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${htmlRows(details)}</table>
      <h2 style="margin:26px 0 10px;font-size:17px">Estimate breakdown</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        ${estimateHtml(estimate)}
        <tr>
          <td style="padding:12px 12px 0 0;border-top:1px solid #e8e3db;color:#1b1917;font-size:15px;font-weight:700">Estimated total</td>
          <td style="padding:12px 0 0;border-top:1px solid #e8e3db;color:#a55233;font-size:15px;font-weight:700;text-align:right">${escapeHtml(estimateLabel)}</td>
        </tr>
      </table>
    `,
  );
  const text = [
    `New commission request: ${requestId}`,
    "",
    "Contact",
    textRows(contact),
    "",
    "Project details",
    textRows(details),
    "",
    "Estimate breakdown",
    estimateText(estimate),
    `Estimated total: ${estimateLabel}`,
  ].join("\n");

  return {
    to: ownerEmail,
    subject,
    html,
    text,
    idempotencyKey: `commission-${requestId}-owner`,
  };
}
