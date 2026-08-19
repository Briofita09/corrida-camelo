import { err, ok } from "./result";
import type { DomainResult, MatchState } from "./types";
import { validateMatchState } from "./validateMatchState";

const PHASES_THAT_ADMIT_TURN_ACTIONS = new Set(["RaceSetup", "LegInProgress"]);

/**
 * Autoriza o ator a executar uma ação de turno.
 * Não avança o turno. Não exportar no barrel público.
 */
export function assertPlayerMayPerformTurnAction(
  state: MatchState,
  actorPlayerId: string,
): DomainResult<MatchState> {
  if (state.phase === "Finished") {
    return err(
      "MATCH_FINISHED",
      "Não é permitido modificar uma partida encerrada.",
    );
  }

  const valid = validateMatchState(state);
  if (!valid.ok) return valid;

  if (!PHASES_THAT_ADMIT_TURN_ACTIONS.has(valid.value.phase)) {
    return err(
      "INVALID_PHASE",
      "Esta fase da partida não admite ação de turno.",
    );
  }

  if (actorPlayerId !== valid.value.currentTurnPlayerId) {
    return err(
      "NOT_CURRENT_PLAYER",
      "Somente o jogador ativo pode executar a ação de turno.",
    );
  }

  return ok(valid.value);
}
