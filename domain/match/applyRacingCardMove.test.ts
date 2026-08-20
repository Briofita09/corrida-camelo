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
});
