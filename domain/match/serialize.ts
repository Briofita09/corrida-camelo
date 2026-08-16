import { err, ok } from "./result";
import type { DomainResult, MatchState } from "./types";
import { validateMatchState } from "./validateMatchState";

export function serializeMatchState(state: MatchState): DomainResult<string> {
  const validation = validateMatchState(state);
  if (!validation.ok) return validation;

  try {
    return ok(JSON.stringify(validation.value));
  } catch {
    return err("SERIALIZE_FAILED", "Falha ao serializar o estado.");
  }
}

export function deserializeMatchState(
  payload: string,
): DomainResult<MatchState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return err("DESERIALIZE_FAILED", "JSON inválido.");
  }

  return validateMatchState(parsed);
}
