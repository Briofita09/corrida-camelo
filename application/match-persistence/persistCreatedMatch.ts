import type { DomainResult, MatchState } from "@/domain/match";
import { ok } from "@/domain/match/result";
import type { MatchPersistence } from "./matchPersistence";

/**
 * Persiste uma partida já criada e a marca como ativa.
 * Não sorteia nem altera a ordem — apenas I/O.
 */
export function persistCreatedMatch(
  state: MatchState,
  persistence: MatchPersistence,
): DomainResult<MatchState> {
  const saved = persistence.saveMatch(state);
  if (!saved.ok) return saved;
  persistence.setActiveMatchId(state.id);
  return ok(state);
}
