import { START_SPACE } from "./constants";
import type { CamelState, RacingCard } from "./types";

function copyCamels(camels: CamelState[]): CamelState[] {
  return camels.map((camel) => ({ ...camel }));
}

/**
 * Aplica o movimento de uma carta de corrida (preparação inicial).
 * Não exportar no barrel público.
 */
export function applyRacingCardMove(
  camels: CamelState[],
  card: RacingCard,
): CamelState[] {
  const copies = copyCamels(camels);
  const target = copies.find((camel) => camel.id === card.camelId);
  if (!target) return copies;

  const fromSpace = target.space;
  const unit =
    fromSpace === START_SPACE
      ? [target]
      : copies
          .filter(
            (camel) =>
              camel.space === fromSpace && camel.stackOrder >= target.stackOrder,
          )
          .sort((a, b) => a.stackOrder - b.stackOrder);

  const destination = fromSpace + card.value;
  const occupying = copies.filter(
    (camel) => camel.space === destination && !unit.includes(camel),
  );
  const maxStack =
    occupying.length === 0
      ? -1
      : Math.max(...occupying.map((camel) => camel.stackOrder));

  unit.forEach((camel, index) => {
    camel.space = destination;
    camel.stackOrder = maxStack + 1 + index;
  });

  return copies;
}
