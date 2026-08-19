import { describe, expect, it } from "vitest";
import {
  createMatch,
  identityOrdering,
  startMatch,
} from "@/domain/match";
import { createInMemoryStorage } from "./inMemoryStorage";
import { matchStorageKey } from "./keys";
import { createMatchPersistence } from "./matchPersistence";
import { persistCreatedMatch } from "./persistCreatedMatch";
import { performTurnActionAndPersist } from "./performTurnActionAndPersist";
import { startAndPersistMatch } from "./startAndPersistMatch";

function createOrderedMatch(id = "match-turn-1") {
  const result = createMatch(
    {
      id,
      players: [
        { id: "A", name: "A", type: "Human" },
        { id: "B", name: "B", type: "Bot", difficulty: "Easy" },
        { id: "C", name: "C", type: "Bot", difficulty: "Medium" },
      ],
    },
    { ordering: identityOrdering },
  );
  if (!result.ok) throw new Error("create failed");
  return result.value;
}

describe("performTurnActionAndPersist", () => {
  it("persiste o novo ativo e restaura sem reexecutar a ação", () => {
    const storage = createInMemoryStorage();
    const persistence = createMatchPersistence(storage);
    const created = createOrderedMatch();
    const started = startAndPersistMatch(created, persistence);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const acted = performTurnActionAndPersist(started.value, "A", persistence);
    expect(acted.ok).toBe(true);
    if (!acted.ok) return;
    expect(acted.value.currentTurnPlayerId).toBe("B");
    expect(acted.value.playerRoundIndex).toBe(0);

    const loaded = persistence.getActiveMatch();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.currentTurnPlayerId).toBe("B");
    expect(loaded.value.playerRoundIndex).toBe(0);
    expect(loaded.value).toEqual(acted.value);
  });

  it("não grava avanço quando o ator não é o ativo", () => {
    const storage = createInMemoryStorage();
    const persistence = createMatchPersistence(storage);
    const created = createOrderedMatch("keep-turn");
    const started = startAndPersistMatch(created, persistence);
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const result = performTurnActionAndPersist(started.value, "B", persistence);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_CURRENT_PLAYER");

    const loaded = persistence.getActiveMatch();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.currentTurnPlayerId).toBe("A");
    expect(loaded.value).toEqual(started.value);
  });

  it("não grava avanço em partida Finished", () => {
    const storage = createInMemoryStorage();
    const persistence = createMatchPersistence(storage);
    const created = createOrderedMatch("finished-turn");
    persistCreatedMatch(created, persistence);

    const started = startMatch(created);
    if (!started.ok) throw new Error("start failed");
    const finished = {
      ...started.value,
      phase: "Finished" as const,
      currentLeg: 1,
    };

    const result = performTurnActionAndPersist(finished, "A", persistence);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("MATCH_FINISHED");
    }

    const stored = persistence.loadMatch(created.id);
    expect(stored.ok).toBe(true);
    if (!stored.ok) return;
    expect(stored.value.phase).toBe("Created");
    expect(storage.getItem(matchStorageKey(created.id))).toBeTruthy();
  });
});
