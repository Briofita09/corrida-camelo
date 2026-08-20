import { err, ok } from "./result";
import { getRoundPlayerSequence } from "./getRoundPlayerSequence";
import { copyRacingCards } from "./racingCards";
import type { DomainResult, MatchState } from "./types";

/**
 * Aplica o próximo turno/rodada a um estado já autorizado.
 * Não exportar no barrel público.
 */
export function applyNextTurn(state: MatchState): DomainResult<MatchState> {
  const sequence = getRoundPlayerSequence(state.players, state.playerRoundIndex);
  const k = sequence.findIndex((p) => p.id === state.currentTurnPlayerId);
  if (k < 0) {
    return err(
      "INVALID_TURN",
      "O jogador ativo não está na sequência da rodada corrente.",
    );
  }

  const n = sequence.length;
  let nextTurnPlayerId: string;
  let playerRoundIndex = state.playerRoundIndex;
  if (k < n - 1) {
    nextTurnPlayerId = sequence[k + 1]!.id;
  } else {
    playerRoundIndex = state.playerRoundIndex + 1;
    const nextSequence = getRoundPlayerSequence(state.players, playerRoundIndex);
    nextTurnPlayerId = nextSequence[0]!.id;
  }

  return ok({
    ...state,
    players: state.players.map((p) => ({ ...p })),
    camels: state.camels.map((c) => ({ ...c })),
    currentTurnPlayerId: nextTurnPlayerId,
    playerRoundIndex,
    setupRevealedRacingCards: copyRacingCards(state.setupRevealedRacingCards),
    remainingRacingCards: copyRacingCards(state.remainingRacingCards),
  });
}
