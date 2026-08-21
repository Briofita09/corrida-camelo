import { describe, expect, it } from "vitest";
import { START_SPACE } from "./constants";
import { applyRacingCardMove } from "./applyRacingCardMove";
import { CAMEL_IDS, type CamelState } from "./types";

function initialCamels(): CamelState[] {
  return CAMEL_IDS.map((id, index) => ({
    id,
    space: START_SPACE,
    stackOrder: index,
    direction: id === "Crazy" ? "TowardStart" : "TowardFinish",
  }));
}

function camel(camels: CamelState[], id: CamelState["id"]): CamelState {
  const found = camels.find((c) => c.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

function stackOnSpace(camels: CamelState[], space: number): CamelState["id"][] {
  return camels
    .filter((c) => c.space === space)
    .sort((a, b) => a.stackOrder - b.stackOrder)
    .map((c) => c.id);
}

describe("applyRacingCardMove", () => {
  it("carta Yellow valor 1 avança uma casa a partir do 0 sem carregar os demais", () => {
    const after = applyRacingCardMove(initialCamels(), {
      camelId: "Yellow",
      value: 1,
    });

    expect(camel(after, "Yellow").space).toBe(1);
    expect(camel(after, "Green").space).toBe(0);
    expect(camel(after, "Crazy").space).toBe(0);

    const stackOrdersAtStart = after
      .filter((c) => c.space === 0)
      .map((c) => c.stackOrder);
    expect(new Set(stackOrdersAtStart).size).toBe(stackOrdersAtStart.length);
  });

  it("carta Green valor 2 avança duas casas", () => {
    const after = applyRacingCardMove(initialCamels(), {
      camelId: "Green",
      value: 2,
    });
    expect(camel(after, "Green").space).toBe(2);
  });

  it("o mesmo camelo acumula movimento a partir da posição atual", () => {
    const afterFirst = applyRacingCardMove(initialCamels(), {
      camelId: "Blue",
      value: 1,
    });
    expect(camel(afterFirst, "Blue").space).toBe(1);

    const afterSecond = applyRacingCardMove(afterFirst, {
      camelId: "Blue",
      value: 2,
    });
    expect(camel(afterSecond, "Blue").space).toBe(3);
  });

  it("dois camelos na mesma casa formam pilha e o que chega fica em cima", () => {
    const afterYellow = applyRacingCardMove(initialCamels(), {
      camelId: "Yellow",
      value: 1,
    });
    const afterGreen = applyRacingCardMove(afterYellow, {
      camelId: "Green",
      value: 1,
    });

    expect(camel(afterGreen, "Yellow").space).toBe(1);
    expect(camel(afterGreen, "Green").space).toBe(1);
    expect(stackOnSpace(afterGreen, 1)).toEqual(["Yellow", "Green"]);
    expect(camel(afterGreen, "Green").stackOrder).toBeGreaterThan(
      camel(afterGreen, "Yellow").stackOrder,
    );
  });

  it("três camelos na mesma casa formam uma pilha na ordem de chegada", () => {
    let state = initialCamels();
    for (const camelId of ["Yellow", "Green", "Blue"] as const) {
      state = applyRacingCardMove(state, { camelId, value: 1 });
    }
    expect(stackOnSpace(state, 1)).toEqual(["Yellow", "Green", "Blue"]);
  });

  it("camelo que se move em espaço >= 1 leva os que estão em cima", () => {
    let state = initialCamels();
    state = applyRacingCardMove(state, { camelId: "Yellow", value: 1 });
    state = applyRacingCardMove(state, { camelId: "Green", value: 1 });
    state = applyRacingCardMove(state, { camelId: "Yellow", value: 1 });

    expect(camel(state, "Yellow").space).toBe(2);
    expect(camel(state, "Green").space).toBe(2);
    expect(stackOnSpace(state, 2)).toEqual(["Yellow", "Green"]);
  });

  it("não muta o array de camelos de origem", () => {
    const origin = initialCamels();
    const snapshot = structuredClone(origin);
    applyRacingCardMove(origin, { camelId: "Yellow", value: 1 });
    expect(origin).toEqual(snapshot);
  });

  // Caracterização US-07 / RF-09: Crazy participa da mesma regra de pilha.
  // Isto NÃO é o movimento oficial do doido (cartas pretas / TowardStart / +1).
  describe("Crazy na mesma regra de pilha (caracterização; sem movimento do doido)", () => {
    function mounted(positions: Partial<Record<CamelState["id"], { space: number; stackOrder: number }>>): CamelState[] {
      return CAMEL_IDS.map((id, index) => ({
        id,
        space: positions[id]?.space ?? START_SPACE,
        stackOrder: positions[id]?.stackOrder ?? index,
        direction: id === "Crazy" ? "TowardStart" : "TowardFinish",
      }));
    }

    it("quem chega sobe: Crazy sozinho no destino fica por baixo", () => {
      const camels = mounted({
        Crazy: { space: 3, stackOrder: 0 },
        Yellow: { space: 2, stackOrder: 0 },
      });

      const after = applyRacingCardMove(camels, {
        camelId: "Yellow",
        value: 1,
      });

      expect(camel(after, "Yellow").space).toBe(3);
      expect(camel(after, "Crazy").space).toBe(3);
      expect(stackOnSpace(after, 3)).toEqual(["Crazy", "Yellow"]);
      expect(camel(after, "Crazy").direction).toBe("TowardStart");
    });

    it("Crazy por cima é levado rumo à chegada quando o de corrida de baixo se move", () => {
      const camels = mounted({
        Yellow: { space: 2, stackOrder: 0 },
        Crazy: { space: 2, stackOrder: 1 },
      });

      const after = applyRacingCardMove(camels, {
        camelId: "Yellow",
        value: 1,
      });

      expect(camel(after, "Yellow").space).toBe(3);
      expect(camel(after, "Crazy").space).toBe(3);
      expect(stackOnSpace(after, 3)).toEqual(["Yellow", "Crazy"]);
      expect(camel(after, "Crazy").direction).toBe("TowardStart");
    });

    it("Crazy no meio da pilha é levado junto com o de cima quando o de baixo se move", () => {
      const camels = mounted({
        Yellow: { space: 2, stackOrder: 0 },
        Crazy: { space: 2, stackOrder: 1 },
        Green: { space: 2, stackOrder: 2 },
      });

      const after = applyRacingCardMove(camels, {
        camelId: "Yellow",
        value: 1,
      });

      expect(camel(after, "Yellow").space).toBe(3);
      expect(camel(after, "Crazy").space).toBe(3);
      expect(camel(after, "Green").space).toBe(3);
      expect(stackOnSpace(after, 3)).toEqual(["Yellow", "Crazy", "Green"]);
      expect(camel(after, "Crazy").direction).toBe("TowardStart");
    });
  });
});
