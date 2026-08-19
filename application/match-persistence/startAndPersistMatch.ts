import { startMatch, type DomainResult, type MatchState } from "@/domain/match";
import type { MatchPersistence } from "./matchPersistence";
import { persistCreatedMatch } from "./persistCreatedMatch";

/**
 * Inicia a partida no domínio e persiste só se o início for aceito.
 * Load posterior não reexecuta startMatch.
 */
export function startAndPersistMatch(
  state: MatchState,
  persistence: MatchPersistence,
): DomainResult<MatchState> {
  const started = startMatch(state);
  if (!started.ok) return started;
  return persistCreatedMatch(started.value, persistence);
}
