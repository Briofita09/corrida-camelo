import { describe, expect, it } from "vitest";
import { createMatch } from "./createMatch";
import {
  deserializeMatchState,
  serializeMatchState,
} from "./serialize";
import { buildValidCreatedMatch } from "./testHelpers";
import { identityOrdering } from "./playerOrdering";

describe("playerRoundIndex", () => {
  it("partida criada inicia com playerRoundIndex 0", () => {
    const result = createMatch(
      {
        id: "m1",
        players: [
          { id: "h1", name: "H", type: "Human" },
          { id: "b1", name: "B", type: "Bot", difficulty: "Easy" },
        ],
      },
      { ordering: identityOrdering },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.playerRoundIndex).toBe(0);
  });

  it("round-trip serialize/deserialize preserva playerRoundIndex", () => {
    const state = { ...buildValidCreatedMatch(), playerRoundIndex: 3 };
    const serialized = serializeMatchState(state);
    expect(serialized.ok).toBe(true);
    if (!serialized.ok) return;
    const deserialized = deserializeMatchState(serialized.value);
    expect(deserialized.ok).toBe(true);
    if (!deserialized.ok) return;
    expect(deserialized.value.playerRoundIndex).toBe(3);
  });

  it("rejeita playerRoundIndex negativo", () => {
    const state = { ...buildValidCreatedMatch(), playerRoundIndex: -1 };
    const serialized = serializeMatchState(state);
    expect(serialized.ok).toBe(false);
  });

  it("rejeita playerRoundIndex não inteiro", () => {
    const state = { ...buildValidCreatedMatch(), playerRoundIndex: 1.5 };
    const serialized = serializeMatchState(state);
    expect(serialized.ok).toBe(false);
  });

  it("hidrata playerRoundIndex ausente como 0", () => {
    const base = buildValidCreatedMatch();
    const legacy = {
      id: base.id,
      phase: base.phase,
      players: base.players,
      camels: base.camels,
      currentTurnPlayerId: base.currentTurnPlayerId,
      currentLeg: base.currentLeg,
    };
    const result = deserializeMatchState(JSON.stringify(legacy));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.playerRoundIndex).toBe(0);
  });
});
