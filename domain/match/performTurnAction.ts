import type { DomainResult, MatchState } from "./types";
import { applyNextTurn } from "./applyNextTurn";
import { assertPlayerMayPerformTurnAction } from "./assertPlayerMayPerformTurnAction";

export function performTurnAction(
  state: MatchState,
  actorPlayerId: string,
): DomainResult<MatchState> {
  const authorized = assertPlayerMayPerformTurnAction(state, actorPlayerId);
  if (!authorized.ok) return authorized;
  return applyNextTurn(authorized.value);
}
