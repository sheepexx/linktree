import type {
  CommissionTypeId,
  ComplexityId,
  ConceptCount,
  IntendedUseId,
  OutputFormatId,
  RevisionCount,
} from "../../data/commissions";

export type PreferredContact = "email" | "discord" | "other";

export interface CommissionDetails {
  commissionType: CommissionTypeId;
  intendedUse: IntendedUseId;
  complexity: ComplexityId;
  concepts: ConceptCount;
  revisions: RevisionCount;
  outputFormat: OutputFormatId;
  dimensions: string;
  deliveryDate: string;
  commercialUse: boolean;
  projectDescription: string;
  additionalNotes: string;
  referenceLinks: string[];
}

export interface CommissionContact {
  email: string;
  discord: string;
  preferredContact: PreferredContact;
  otherPlatform: string;
  otherContact: string;
}

export type CommissionSubmission = CommissionDetails & CommissionContact;

export interface PriceAmount {
  min: number;
  max: number;
}

export interface PriceLine extends PriceAmount {
  id: string;
  label: string;
  detail?: string;
}

export interface CommissionEstimate extends PriceAmount {
  currency: string;
  lines: PriceLine[];
}

export interface ValidationIssue {
  field: keyof CommissionSubmission | "form";
  message: string;
}

export type ValidationResult =
  | { success: true; data: CommissionSubmission }
  | { success: false; issues: ValidationIssue[] };

export interface VerificationChallengeResponse {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}

export interface VerificationSuccessResponse {
  verificationToken: string;
  expiresAt: string;
}

export interface CommissionRequestResponse {
  requestId: string;
  submittedAt: string;
  estimate: CommissionEstimate;
  summary: CommissionSubmission;
  confirmationPending?: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    retryAfter?: number;
    issues?: ValidationIssue[];
  };
}
