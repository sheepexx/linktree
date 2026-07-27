export type D1Value =
  | null
  | number
  | string
  | ArrayBuffer
  | ArrayBufferView;

export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    changes?: number;
    rows_read?: number;
    rows_written?: number;
    duration?: number;
    [key: string]: unknown;
  };
}

export interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(columnName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface ScheduledController {
  cron: string;
  scheduledTime: number;
  noRetry(): void;
}

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  BRAND_NAME?: string;
  SITE_URL?: string;
  EMAIL_FROM: string;
  EMAIL_REPLY_TO?: string;
  COMMISSION_OWNER_EMAIL: string;
  RESEND_API_KEY: string;
  VERIFICATION_HMAC_SECRET: string;
  TOKEN_HMAC_SECRET: string;
  VERIFICATION_TOKEN_TTL_MINUTES?: string;
}
