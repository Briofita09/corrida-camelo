import { err, ok } from "./result";
import type { DomainResult, MatchState } from "./types";
import { validateMatchState } from "./validateMatchState";

export function startMatch(state: MatchState): DomainResult<MatchState> {
  if (state.phase === "Finished") {
    return err(
      "MATCH_FINISHED",
      "Não é permitido modificar uma partida encerrada.",
    );
  }

  if (state.phase !== "Created") {
    return err(
      "INVALID_PHASE",
      "Somente partidas na fase Created podem ser iniciadas.",
    );
  }

  const valid = validateMatchState(state);
  if (!valid.ok) return valid;

  return ok({
    ...valid.value,
    players: valid.value.players.map((p) => ({ ...p })),
    camels: valid.value.camels.map((c) => ({ ...c })),
    phase: "RaceSetup",
    currentTurnPlayerId: valid.value.players[0]!.id,
  });
}
