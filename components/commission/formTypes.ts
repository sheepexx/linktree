import type { CommissionSubmission } from "@/lib/commission/types";

export type Step = 0 | 1 | 2 | 3 | 4 | 5;
export type SubmissionField = keyof CommissionSubmission;
export type FieldErrors = Partial<
  Record<SubmissionField | "form" | "verificationCode", string>
>;

export type CommissionFormState = Omit<CommissionSubmission, "referenceLinks"> & {
  referenceLinks: string;
};

export type FormChangeHandler = <K extends keyof CommissionFormState>(
  field: K,
  value: CommissionFormState[K],
) => void;
