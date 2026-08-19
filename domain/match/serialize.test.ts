import { describe, expect, it } from "vitest";
import { createMatch } from "./createMatch";
import {
  deserializeMatchState,
  serializeMatchState,
} from "./serialize";
import { startMatch } from "./startMatch";
import {
  buildValidCreatedMatch,
  buildValidFinishedMatch,
} from "./testHelpers";

describe("serialize / deserialize", () => {
  it("faz round-trip de partida Created", () => {
    const state = buildValidCreatedMatch();
    const serialized = serializeMatchState(state);
    expect(serialized.ok).toBe(true);
    if (!serialized.ok) return;

    const deserialized = deserializeMatchState(serialized.value);
    expect(deserialized.ok).toBe(true);
    if (!deserialized.ok) return;
    expect(deserialized.value).toEqual(state);
  });

  it("faz round-trip após startMatch", () => {
    const created = createMatch({
      id: "m2",
      players: [
        { id: "h1", name: "H", type: "Human" },
        { id: "b1", name: "B", type: "Bot", difficulty: "Hard" },
      ],
    });
    if (!created.ok) throw new Error("create failed");
    const started = startMatch(created.value);
    if (!started.ok) throw new Error("start failed");

    const serialized = serializeMatchState(started.value);
    if (!serialized.ok) throw new Error("serialize failed");
    const deserialized = deserializeMatchState(serialized.value);
    expect(deserialized.ok).toBe(true);
    if (!deserialized.ok) return;
    expect(deserialized.value).toEqual(started.value);
    expect(deserialized.value.phase).toBe("RaceSetup");
    expect(deserialized.value.currentTurnPlayerId).toBe(
      started.value.currentTurnPlayerId,
    );
  });

  it("rejeita desserializar RaceSetup sem turno", () => {
    const created = buildValidCreatedMatch();
    const payload = JSON.stringify({
      ...created,
      phase: "RaceSetup",
      currentTurnPlayerId: null,
    });
    expect(deserializeMatchState(payload).ok).toBe(false);
  });

  it("faz round-trip de Finished", () => {
    const finished = buildValidFinishedMatch();
    const serialized = serializeMatchState(finished);
    if (!serialized.ok) throw new Error("serialize failed");
    const deserialized = deserializeMatchState(serialized.value);
    expect(deserialized.ok).toBe(true);
    if (!deserialized.ok) return;
    expect(deserialized.value).toEqual(finished);
  });

  it("rejeita JSON inconsistente na desserialização", () => {
    const result = deserializeMatchState(
      JSON.stringify({ id: "x", phase: "Created" }),
    );
    expect(result.ok).toBe(false);
  });
});
