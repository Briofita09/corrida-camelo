import {
  performTurnAction,
  type DomainResult,
  type MatchState,
} from "@/domain/match";
import type { MatchPersistence } from "./matchPersistence";
import { persistCreatedMatch } from "./persistCreatedMatch";

/**
 * Executa a ação de turno no domínio e persiste só se for aceita.
 * Load posterior não reexecuta performTurnAction.
 */
export function performTurnActionAndPersist(
  state: MatchState,
  actorPlayerId: string,
  persistence: MatchPersistence,
): DomainResult<MatchState> {
  const acted = performTurnAction(state, actorPlayerId);
  if (!acted.ok) return acted;
  return persistCreatedMatch(acted.value, persistence);
}
