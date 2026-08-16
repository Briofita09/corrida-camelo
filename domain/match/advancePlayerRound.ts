import { err, ok } from "./result";
import type { DomainResult, MatchState } from "./types";

export function advancePlayerRound(
  state: MatchState,
): DomainResult<MatchState> {
  if (state.phase === "Finished") {
    return err(
      "MATCH_FINISHED",
      "Não é permitido modificar uma partida encerrada.",
    );
  }

  return ok({
    ...state,
    players: state.players.map((p) => ({ ...p })),
    camels: state.camels.map((c) => ({ ...c })),
    playerRoundIndex: state.playerRoundIndex + 1,
  });
}
