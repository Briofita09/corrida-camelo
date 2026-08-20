import { applyRacingCardMove } from "./applyRacingCardMove";
import type { CamelState, RacingCard } from "./types";

/**
 * Aplica as cinco cartas de preparação em sequência.
 * Não exportar no barrel público.
 */
export function determineInitialCamelPositions(
  camels: CamelState[],
  revealed: RacingCard[],
): CamelState[] {
  let current = camels.map((camel) => ({ ...camel }));
  for (const card of revealed) {
    current = applyRacingCardMove(current, card);
  }
  return current;
}
