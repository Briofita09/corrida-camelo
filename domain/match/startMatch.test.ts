import { describe, expect, it } from "vitest";
import { createMatch } from "./createMatch";
import { startMatch } from "./startMatch";
import type { MatchState } from "./types";

function validCreatedMatch() {
  const result = createMatch({
    id: "m1",
    players: [
      { id: "h1", name: "Human", type: "Human" },
      { id: "b1", name: "Bot", type: "Bot", difficulty: "Easy" },
    ],
  });
  if (!result.ok) throw new Error("setup failed");
  return result.value;
}

describe("startMatch", () => {
  it("inicia partida Created para RaceSetup", () => {
    const created = validCreatedMatch();
    const result = startMatch(created);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phase).toBe("RaceSetup");
    expect(created.phase).toBe("Created");
  });

  it("rejeita iniciar partida já iniciada", () => {
    const created = validCreatedMatch();
    const started = startMatch(created);
    if (!started.ok) throw new Error("start failed");
    const again = startMatch(started.value);
    expect(again.ok).toBe(false);
    expect(started.value.phase).toBe("RaceSetup");
  });

  it("rejeita mutação em partida Finished", () => {
    const finished: MatchState = {
      ...validCreatedMatch(),
      phase: "Finished",
    };
    const snapshot = structuredClone(finished);
    const result = startMatch(finished);
    expect(result.ok).toBe(false);
    expect(finished).toEqual(snapshot);
  });
});
