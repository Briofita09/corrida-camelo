import { describe, expect, it } from "vitest";
import { advancePlayerRound } from "./advancePlayerRound";
import { createMatch } from "./createMatch";
import { identityOrdering } from "./playerOrdering";
import { startMatch } from "./startMatch";
import { buildValidFinishedMatch } from "./testHelpers";

describe("startMatch e advancePlayerRound — ordem estável", () => {
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

  it("advancePlayerRound incrementa o índice sem alterar a ordem base", () => {
    const created = createMatch(
      {
        id: "m1",
        players: [
          { id: "A", name: "A", type: "Human" },
          { id: "B", name: "B", type: "Bot", difficulty: "Easy" },
        ],
      },
      { ordering: identityOrdering },
    );
    if (!created.ok) throw new Error("create failed");

    const advanced = advancePlayerRound(created.value);
    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;
    expect(advanced.value.playerRoundIndex).toBe(1);
    expect(advanced.value.players.map((p) => p.id)).toEqual(["A", "B"]);
    expect(created.value.playerRoundIndex).toBe(0);
  });

  it("advancePlayerRound rejeita partida Finished", () => {
    const finished = buildValidFinishedMatch();
    const result = advancePlayerRound(finished);
    expect(result.ok).toBe(false);
  });
});
