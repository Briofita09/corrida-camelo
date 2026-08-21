import { describe, expect, it } from "vitest";
import { CRAZY_INITIAL_SPACE, START_SPACE } from "./constants";
import { placeCrazyCamel } from "./placeCrazyCamel";
import { CAMEL_IDS, type CamelState } from "./types";

function camelsAfterRacingSetup(): CamelState[] {
  return CAMEL_IDS.map((id, index) => ({
    id,
    space: id === "Yellow" ? 2 : START_SPACE,
    stackOrder: index,
    direction: id === "Crazy" ? "TowardStart" : "TowardFinish",
  }));
}

function camel(camels: CamelState[], id: CamelState["id"]): CamelState {
  const found = camels.find((c) => c.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

describe("placeCrazyCamel", () => {
  it("coloca Crazy sozinho no espaço 7 sem inverter o sentido nem mover os de corrida", () => {
    const origin = camelsAfterRacingSetup();
    const snapshot = structuredClone(origin);

    expect(camel(origin, "Crazy").space).toBe(START_SPACE);
    expect(camel(origin, "Crazy").direction).toBe("TowardStart");
    expect(camel(origin, "Yellow").space).toBe(2);

    const after = placeCrazyCamel(origin);

    const crazy = camel(after, "Crazy");
    expect(crazy.space).toBe(CRAZY_INITIAL_SPACE);
    expect(CRAZY_INITIAL_SPACE).toBe(7);
    expect(crazy.direction).toBe("TowardStart");
    expect(crazy.stackOrder).toBeGreaterThanOrEqual(0);

    const onSeven = after.filter((c) => c.space === CRAZY_INITIAL_SPACE);
    expect(onSeven).toHaveLength(1);
    expect(onSeven[0]!.id).toBe("Crazy");
    expect(onSeven.map((c) => c.stackOrder)).toEqual([crazy.stackOrder]);

    for (const id of CAMEL_IDS) {
      if (id === "Crazy") continue;
      expect(camel(after, id)).toEqual(camel(origin, id));
    }

    expect(origin).toEqual(snapshot);
  });
});
