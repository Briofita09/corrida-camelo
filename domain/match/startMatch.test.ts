import { describe, expect, it } from "vitest";
import { createMatch } from "./createMatch";
import { identityOrdering } from "./playerOrdering";
import { startMatch } from "./startMatch";
import type { MatchState } from "./types";

function orderedCreatedMatch(): MatchState {
  const result = createMatch(
    {
      id: "m1",
      players: [
        { id: "A", name: "A", type: "Human" },
        { id: "B", name: "B", type: "Bot", difficulty: "Easy" },
        { id: "C", name: "C", type: "Bot", difficulty: "Medium" },
      ],
    },
    { ordering: identityOrdering },
  );
  if (!result.ok) throw new Error("setup failed");
  return result.value;
}

describe("startMatch", () => {
  it("inicia Created válida com turno, preservação e input intacto", () => {
    const created = orderedCreatedMatch();
    const snapshot = structuredClone(created);

    expect(created.currentTurnPlayerId).toBeNull();
    expect(created.phase).toBe("Created");

    const result = startMatch(created);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.phase).toBe("RaceSetup");
    expect(result.value.id).toBe("m1");
    expect(result.value.players.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(result.value.currentTurnPlayerId).toBe("A");
    expect(result.value.playerRoundIndex).toBe(0);
    expect(result.value.players.every((p) => p.money === 3)).toBe(true);
    expect(result.value.camels).toHaveLength(6);
    expect(result.value.camels.every((c) => c.space === 0)).toBe(true);
    expect(created).toEqual(snapshot);
    expect(created.phase).toBe("Created");
    expect(created.currentTurnPlayerId).toBeNull();
  });

  it("início é determinístico sobre cópias idênticas", () => {
    const created = orderedCreatedMatch();
    const copyA = structuredClone(created);
    const copyB = structuredClone(created);

    const first = startMatch(copyA);
    const second = startMatch(copyB);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.value).toEqual(second.value);
  });

  it("rejeita iniciar partida já iniciada e preserva o turno", () => {
    const created = orderedCreatedMatch();
    const started = startMatch(created);
    if (!started.ok) throw new Error("start failed");
    const snapshot = structuredClone(started.value);
    const again = startMatch(started.value);
    expect(again.ok).toBe(false);
    expect(started.value.phase).toBe("RaceSetup");
    expect(started.value.currentTurnPlayerId).toBe("A");
    expect(started.value).toEqual(snapshot);
  });

  it("rejeita iniciar partida já em andamento (LegInProgress)", () => {
    const inProgress: MatchState = {
      ...orderedCreatedMatch(),
      phase: "LegInProgress",
      currentLeg: 1,
      currentTurnPlayerId: "A",
    };
    const snapshot = structuredClone(inProgress);
    const result = startMatch(inProgress);
    expect(result.ok).toBe(false);
    expect(inProgress).toEqual(snapshot);
  });

  it("rejeita iniciar Created com invariantes quebrados", () => {
    const created = orderedCreatedMatch();
    const invalid: MatchState = {
      ...created,
      camels: created.camels.slice(0, 5),
    };
    const snapshot = structuredClone(invalid);
    const result = startMatch(invalid);
    expect(result.ok).toBe(false);
    expect(invalid).toEqual(snapshot);
  });

  it("rejeita mutação em partida Finished", () => {
    const finished: MatchState = {
      ...orderedCreatedMatch(),
      phase: "Finished",
      currentLeg: 1,
    };
    const snapshot = structuredClone(finished);
    const result = startMatch(finished);
    expect(result.ok).toBe(false);
    expect(finished).toEqual(snapshot);
  });
});
