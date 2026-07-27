import {
  commissionConfig,
  type CommissionTypeId,
  type ComplexityId,
  type ConceptCount,
  type IntendedUseId,
  type OutputFormatId,
  type RevisionCount,
} from "../../data/commissions";
import { getDaysUntil } from "./pricing";
import type {
  CommissionSubmission,
  PreferredContact,
  ValidationIssue,
  ValidationResult,
} from "./types";

type UnknownRecord = Record<string, unknown>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const controlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanText(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  const normalized = value
    .normalize("NFKC")
    .replace(controlCharacters, "")
    .replace(/\r\n?/g, "\n")
    .trim();

  return multiline
    ? normalized.replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n")
    : normalized.replace(/\s+/g, " ");
}

function isOption<T extends string | number>(
  value: unknown,
  options: readonly { id: T }[],
): value is T {
  return options.some((option) => option.id === value);
}

function parseReferenceLinks(value: unknown): string[] {
  const raw =
    typeof value === "string"
      ? value.split(/\r?\n/)
      : Array.isArray(value)
        ? value
        : [];

  return raw
    .map((entry) => cleanText(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function isSafeWebUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

export function validateEmail(value: unknown): string | null {
  const email = cleanText(value).toLowerCase();
  if (!email) return "Enter your email address.";
  if (email.length > 254 || !emailPattern.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validateCommissionSubmission(
  input: unknown,
  now = new Date(),
): ValidationResult {
  if (!isRecord(input)) {
    return {
      success: false,
      issues: [{ field: "form", message: "The request data is invalid." }],
    };
  }

  const issues: ValidationIssue[] = [];
  const limits = commissionConfig.limits;

  const commissionType = input.commissionType;
  if (
    !isOption(
      commissionType,
      commissionConfig.commissionTypes as readonly {
        id: CommissionTypeId;
      }[],
    )
  ) {
    issues.push({
      field: "commissionType",
      message: "Choose a commission type.",
    });
  }

  const intendedUse = input.intendedUse;
  if (
    !isOption(
      intendedUse,
      commissionConfig.intendedUses as readonly { id: IntendedUseId }[],
    )
  ) {
    issues.push({ field: "intendedUse", message: "Choose how this will be used." });
  }

  const complexity = input.complexity;
  if (
    !isOption(
      complexity,
      commissionConfig.complexities as readonly { id: ComplexityId }[],
    )
  ) {
    issues.push({
      field: "complexity",
      message: "Choose a visual complexity.",
    });
  }

  const concepts = input.concepts;
  if (
    !isOption(
      concepts,
      commissionConfig.conceptOptions as readonly { id: ConceptCount }[],
    )
  ) {
    issues.push({ field: "concepts", message: "Choose a concept count." });
  }

  const revisions = input.revisions;
  if (
    !isOption(
      revisions,
      commissionConfig.revisionOptions as readonly { id: RevisionCount }[],
    )
  ) {
    issues.push({ field: "revisions", message: "Choose a revision count." });
  }

  const outputFormat = input.outputFormat;
  if (
    !isOption(
      outputFormat,
      commissionConfig.outputFormats as readonly { id: OutputFormatId }[],
    )
  ) {
    issues.push({ field: "outputFormat", message: "Choose a delivery format." });
  }

  const dimensions = cleanText(input.dimensions);
  if (
    dimensions.length < limits.dimensions.min ||
    dimensions.length > limits.dimensions.max
  ) {
    issues.push({
      field: "dimensions",
      message: `Describe the required size in ${limits.dimensions.min}–${limits.dimensions.max} characters.`,
    });
  }

  const deliveryDate = cleanText(input.deliveryDate);
  const daysUntil = getDaysUntil(deliveryDate, now);
  if (deliveryDate && daysUntil === null) {
    issues.push({
      field: "deliveryDate",
      message: "Enter a valid delivery date.",
    });
  } else if (
    daysUntil !== null &&
    daysUntil < commissionConfig.rushPricing.at(-1)!.minDays
  ) {
    issues.push({
      field: "deliveryDate",
      message: `Choose a date at least ${commissionConfig.rushPricing.at(-1)!.minDays} days away.`,
    });
  }

  if (typeof input.commercialUse !== "boolean") {
    issues.push({
      field: "commercialUse",
      message: "Choose whether commercial usage is required.",
    });
  }

  const projectDescription = cleanText(input.projectDescription, true);
  if (
    projectDescription.length < limits.projectDescription.min ||
    projectDescription.length > limits.projectDescription.max
  ) {
    issues.push({
      field: "projectDescription",
      message: `Describe the project in ${limits.projectDescription.min}–${limits.projectDescription.max} characters.`,
    });
  }

  const additionalNotes = cleanText(input.additionalNotes, true);
  if (additionalNotes.length > limits.additionalNotes) {
    issues.push({
      field: "additionalNotes",
      message: `Keep additional notes under ${limits.additionalNotes} characters.`,
    });
  }

  const referenceLinks = parseReferenceLinks(input.referenceLinks);
  if (referenceLinks.length > limits.referenceLinks) {
    issues.push({
      field: "referenceLinks",
      message: `Add no more than ${limits.referenceLinks} reference links.`,
    });
  } else if (
    referenceLinks.some(
      (link) =>
        link.length > limits.referenceLinkLength || !isSafeWebUrl(link),
    )
  ) {
    issues.push({
      field: "referenceLinks",
      message: "Each reference must be a valid http or https link.",
    });
  }

  const email = cleanText(input.email).toLowerCase();
  const emailError = validateEmail(email);
  if (emailError) issues.push({ field: "email", message: emailError });

  const discord = cleanText(input.discord);
  if (discord.length > limits.discord) {
    issues.push({
      field: "discord",
      message: `Keep the Discord username under ${limits.discord} characters.`,
    });
  }

  const preferredContact =
    typeof input.preferredContact === "string"
      ? input.preferredContact
      : "";
  if (!["email", "discord", "other"].includes(preferredContact)) {
    issues.push({
      field: "preferredContact",
      message: "Choose a preferred contact method.",
    });
  }

  if (preferredContact === "discord" && !discord) {
    issues.push({
      field: "discord",
      message: "Enter a Discord username or choose email.",
    });
  }

  const otherPlatform = cleanText(input.otherPlatform);
  const otherContact = cleanText(input.otherContact);
  if (otherPlatform.length > limits.otherPlatform) {
    issues.push({
      field: "otherPlatform",
      message: `Keep the platform name under ${limits.otherPlatform} characters.`,
    });
  }
  if (otherContact.length > limits.otherContact) {
    issues.push({
      field: "otherContact",
      message: `Keep the username or link under ${limits.otherContact} characters.`,
    });
  }
  if (preferredContact === "other") {
    if (!otherPlatform) {
      issues.push({
        field: "otherPlatform",
        message: "Enter the platform name.",
      });
    }
    if (!otherContact) {
      issues.push({
        field: "otherContact",
        message: "Enter your username or profile link.",
      });
    }
  }

  if (issues.length > 0) return { success: false, issues };

  return {
    success: true,
    data: {
      commissionType: commissionType as CommissionTypeId,
      intendedUse: intendedUse as IntendedUseId,
      complexity: complexity as ComplexityId,
      concepts: concepts as ConceptCount,
      revisions: revisions as RevisionCount,
      outputFormat: outputFormat as OutputFormatId,
      dimensions,
      deliveryDate,
      commercialUse: input.commercialUse === true,
      projectDescription,
      additionalNotes,
      referenceLinks,
      email,
      discord,
      preferredContact: preferredContact as PreferredContact,
      otherPlatform,
      otherContact,
    } satisfies CommissionSubmission,
  };
}
