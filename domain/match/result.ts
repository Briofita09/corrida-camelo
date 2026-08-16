import type { DomainError, DomainResult } from "./types";

export function ok<T>(value: T): DomainResult<T> {
  return { ok: true, value };
}

export function err(code: string, message: string): DomainResult<never> {
  return { ok: false, error: { code, message } satisfies DomainError };
}
