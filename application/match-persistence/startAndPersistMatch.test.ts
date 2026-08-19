import { describe, expect, it } from "vitest";
import { createMatch, identityOrdering } from "@/domain/match";
import { createInMemoryStorage } from "./inMemoryStorage";
import { matchStorageKey } from "./keys";
import { createMatchPersistence } from "./matchPersistence";
import { persistCreatedMatch } from "./persistCreatedMatch";
import { startAndPersistMatch } from "./startAndPersistMatch";

function createOrderedMatch(id = "match-start-1") {
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

describe("startAndPersistMatch", () => {
  it("persiste RaceSetup com turno e restaura sem novo início", () => {
    const storage = createInMemoryStorage();
    const persistence = createMatchPersistence(storage);
    const created = createOrderedMatch();

    const started = startAndPersistMatch(created, persistence);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    expect(started.value.phase).toBe("RaceSetup");
    expect(started.value.currentTurnPlayerId).toBe("A");
    expect(started.value.players.map((p) => p.id)).toEqual(["A", "B", "C"]);

    const loaded = persistence.getActiveMatch();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.phase).toBe("RaceSetup");
    expect(loaded.value.currentTurnPlayerId).toBe("A");
    expect(loaded.value.players.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(loaded.value).toEqual(started.value);
  });

  it("não grava iniciado quando startMatch falha", () => {
    const storage = createInMemoryStorage();
    const persistence = createMatchPersistence(storage);
    const created = createOrderedMatch("keep-created");
    persistCreatedMatch(created, persistence);

    const invalid = { ...created, camels: created.camels.slice(0, 5) };
    const result = startAndPersistMatch(invalid, persistence);
    expect(result.ok).toBe(false);

    const active = persistence.getActiveMatch();
    expect(active.ok).toBe(true);
    if (!active.ok) return;
    expect(active.value.phase).toBe("Created");
    expect(storage.getItem(matchStorageKey(created.id))).toBeTruthy();
  });

  it("segunda tentativa sobre RaceSetup rejeita e não corrompe o storage", () => {
    const persistence = createMatchPersistence(createInMemoryStorage());
    const created = createOrderedMatch("once");
    const first = startAndPersistMatch(created, persistence);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = startAndPersistMatch(first.value, persistence);
    expect(second.ok).toBe(false);

    const loaded = persistence.getActiveMatch();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value).toEqual(first.value);
  });

  it("sem partida ativa, getActiveMatch rejeita", () => {
    const persistence = createMatchPersistence(createInMemoryStorage());
    const active = persistence.getActiveMatch();
    expect(active.ok).toBe(false);
    if (active.ok) return;
    expect(active.error.code).toBe("NO_ACTIVE_MATCH");
  });
});
