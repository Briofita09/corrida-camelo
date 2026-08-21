import { CRAZY_INITIAL_SPACE } from "./constants";
import type { CamelState } from "./types";

/**
 * Posiciona Crazy sozinho no espaço da casa 7, copiando o sentido.
 * Não exportar no barrel público.
 */
export function placeCrazyCamel(camels: CamelState[]): CamelState[] {
  const occupying = camels.filter(
    (camel) => camel.space === CRAZY_INITIAL_SPACE && camel.id !== "Crazy",
  );
  const stackOrder =
    occupying.length === 0
      ? 0
      : Math.max(...occupying.map((camel) => camel.stackOrder)) + 1;

  return camels.map((camel) =>
    camel.id === "Crazy"
      ? { ...camel, space: CRAZY_INITIAL_SPACE, stackOrder }
      : { ...camel },
  );
}
