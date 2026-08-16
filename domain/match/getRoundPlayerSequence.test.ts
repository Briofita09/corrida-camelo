import { describe, expect, it } from "vitest";
import { getRoundPlayerSequence } from "./getRoundPlayerSequence";

describe("getRoundPlayerSequence", () => {
  const base = ["A", "B", "C", "D"];

  it("retorna a sequência das rodadas 0–3 com 4 jogadores", () => {
    expect(getRoundPlayerSequence(base, 0)).toEqual(["A", "B", "C", "D"]);
    expect(getRoundPlayerSequence(base, 1)).toEqual(["B", "C", "D", "A"]);
    expect(getRoundPlayerSequence(base, 2)).toEqual(["C", "D", "A", "B"]);
    expect(getRoundPlayerSequence(base, 3)).toEqual(["D", "A", "B", "C"]);
  });

  it("repete o padrão na rodada 4", () => {
    expect(getRoundPlayerSequence(base, 4)).toEqual(["A", "B", "C", "D"]);
  });

  it("funciona com 2 jogadores e não muta a ordem base", () => {
    const two = ["X", "Y"];
    expect(getRoundPlayerSequence(two, 0)).toEqual(["X", "Y"]);
    expect(getRoundPlayerSequence(two, 1)).toEqual(["Y", "X"]);
    expect(two).toEqual(["X", "Y"]);
  });
});
