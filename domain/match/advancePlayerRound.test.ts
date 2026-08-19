import { describe, expect, it } from "vitest";
import { createMatch } from "./createMatch";
import { identityOrdering } from "./playerOrdering";
import { startMatch } from "./startMatch";

describe("startMatch — ordem estável", () => {
  it("startMatch não reordena players nem altera playerRoundIndex", () => {
    const created = createMatch(
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
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const started = startMatch(created.value);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    expect(started.value.players.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(started.value.playerRoundIndex).toBe(0);
  });
});
