import { START_SPACE } from "./constants";
import { err, ok } from "./result";
import {
  copyRacingCards,
  racingCamelsAreAtStart,
  resolveSetupRacingCards,
} from "./racingCards";
import { determineInitialCamelPositions } from "./determineInitialCamelPositions";
import { placeCrazyCamel } from "./placeCrazyCamel";
import type {
  DomainResult,
  MatchState,
  StartMatchOptions,
} from "./types";
import { validateMatchState } from "./validateMatchState";

export function startMatch(
  state: MatchState,
  options?: StartMatchOptions,
): DomainResult<MatchState> {
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

  if (!racingCamelsAreAtStart(valid.value.camels)) {
    return err(
      "CAMELS_NOT_AT_START",
      "Os camelos de corrida devem estar atrás da linha de partida.",
    );
  }

  const crazy = valid.value.camels.find((camel) => camel.id === "Crazy");
  if (crazy && crazy.space !== START_SPACE) {
    return err(
      "CAMELS_NOT_AT_START",
      "Os camelos de corrida devem estar atrás da linha de partida.",
    );
  }

  const cards = resolveSetupRacingCards(options);
  if (!cards.ok) return cards;

  const racingCamels = determineInitialCamelPositions(
    valid.value.camels,
    cards.value.revealed,
  );
  const camels = placeCrazyCamel(racingCamels);

  return ok({
    ...valid.value,
    players: valid.value.players.map((p) => ({ ...p })),
    camels,
    phase: "RaceSetup",
    currentTurnPlayerId: valid.value.players[0]!.id,
    setupRevealedRacingCards: copyRacingCards(cards.value.revealed),
    remainingRacingCards: copyRacingCards(cards.value.remaining),
  });
}
