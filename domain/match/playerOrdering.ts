import type { CreateMatchPlayerInput } from "./types";

export type RandomFn = () => number;

export type PlayerOrderingStrategy = {
  order(
    players: CreateMatchPlayerInput[],
    random: RandomFn,
  ): CreateMatchPlayerInput[];
};

/** Preserva a ordem de entrada (útil em testes). */
export const identityOrdering: PlayerOrderingStrategy = {
  order(players) {
    return players.map((p) => ({ ...p }));
  },
};

/**
 * Permutação uniforme (Fisher–Yates) com RNG injetável.
 */
export function createRandomOrdering(): PlayerOrderingStrategy {
  return {
    order(players, random) {
      const copy = players.map((p) => ({ ...p }));
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        const tmp = copy[i]!;
        copy[i] = copy[j]!;
        copy[j] = tmp;
      }
      return copy;
    },
  };
}

export type CreateMatchOptions = {
  ordering?: PlayerOrderingStrategy;
  random?: RandomFn;
};
