import { err, ok } from "./result";
import type { DomainResult, MatchState } from "./types";

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

  return ok({
    ...state,
    players: state.players.map((p) => ({ ...p })),
    camels: state.camels.map((c) => ({ ...c })),
    phase: "RaceSetup",
  });
}
