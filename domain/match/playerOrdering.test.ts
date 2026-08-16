import { describe, expect, it } from "vitest";
import { createMatch } from "./createMatch";
import {
  createRandomOrdering,
  identityOrdering,
  type CreateMatchPlayerInput,
} from "./index";

function human(id: string): CreateMatchPlayerInput {
  return { id, name: id, type: "Human" };
}

function bot(id: string): CreateMatchPlayerInput {
  return { id, name: id, type: "Bot", difficulty: "Easy" };
}

function playersForCount(n: number): CreateMatchPlayerInput[] {
  const list: CreateMatchPlayerInput[] = [human("h1")];
  for (let i = 2; i <= n; i += 1) {
    list.push(bot(`b${i}`));
  }
  return list;
}

describe("createMatch — ordenação inicial", () => {
  it("com estratégia identidade preserva a ordem de entrada", () => {
    const inputs = [human("A"), bot("B"), bot("C"), bot("D")];
    const result = createMatch(
      { id: "m1", players: inputs },
      { ordering: identityOrdering },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players.map((p) => p.id)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
  });

  it("com RNG controlado produz permutação completa sem duplicata (N=2..6)", () => {
    let call = 0;
    const random = () => {
      const sequence = [0.9, 0.1, 0.5, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6];
      const value = sequence[call % sequence.length] ?? 0;
      call += 1;
      return value;
    };

    for (let n = 2; n <= 6; n += 1) {
      const inputs = playersForCount(n);
      const inputIds = inputs.map((p) => p.id);
      const result = createMatch(
        { id: `m-${n}`, players: inputs },
        { ordering: createRandomOrdering(), random },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const orderedIds = result.value.players.map((p) => p.id);
      expect(orderedIds).toHaveLength(n);
      expect(new Set(orderedIds).size).toBe(n);
      expect([...orderedIds].sort()).toEqual([...inputIds].sort());
    }
  });

  it("não muta o array de players da config de entrada", () => {
    const inputs = [human("A"), bot("B"), bot("C")];
    const snapshot = inputs.map((p) => p.id);
    createMatch(
      { id: "m1", players: inputs },
      {
        ordering: createRandomOrdering(),
        random: () => 0.99,
      },
    );
    expect(inputs.map((p) => p.id)).toEqual(snapshot);
  });

  it("estratégia isolada: default aleatório pode reordenar com RNG forçado", () => {
    const inputs = [human("A"), bot("B"), bot("C"), bot("D")];
    const result = createMatch(
      { id: "m1", players: inputs },
      { random: () => 0 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.value.players.map((p) => p.id);
    expect(new Set(ids).size).toBe(4);
    expect([...ids].sort()).toEqual(["A", "B", "C", "D"].sort());
    // random() === 0 no Fisher–Yates altera a ordem de forma determinística
    expect(ids).not.toEqual(["A", "B", "C", "D"]);
  });
});
