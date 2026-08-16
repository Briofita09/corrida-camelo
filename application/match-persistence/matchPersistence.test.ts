import { describe, expect, it } from "vitest";
import {
  createMatch,
  identityOrdering,
} from "@/domain/match";
import { createInMemoryStorage } from "./inMemoryStorage";
import {
  ACTIVE_MATCH_ID_KEY,
  matchStorageKey,
} from "./keys";
import { createLocalStorageAdapter } from "./localStorageAdapter";
import { createMatchPersistence } from "./matchPersistence";
import { persistCreatedMatch } from "./persistCreatedMatch";

function createOrderedMatch(id = "match-persist-1") {
  const result = createMatch(
    {
      id,
      players: [
        { id: "A", name: "A", type: "Human" },
        { id: "B", name: "B", type: "Bot", difficulty: "Easy" },
        { id: "C", name: "C", type: "Bot", difficulty: "Medium" },
        { id: "D", name: "D", type: "Bot", difficulty: "Hard" },
      ],
    },
    { ordering: identityOrdering },
  );
  if (!result.ok) throw new Error("create failed");
  return result.value;
}

function createMockWebStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) as string) : null;
    },
    key() {
      return null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  } as Storage;
}

describe("match persistence — in-memory", () => {
  it("save → load preserva ordem e playerRoundIndex", () => {
    const persistence = createMatchPersistence(createInMemoryStorage());
    const state = { ...createOrderedMatch(), playerRoundIndex: 2 };

    const saved = persistence.saveMatch(state);
    expect(saved.ok).toBe(true);

    const loaded = persistence.loadMatch(state.id);
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value.players.map((p) => p.id)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(loaded.value.playerRoundIndex).toBe(2);
  });

  it("partida ativa pode ser recarregada sem novo sorteio", () => {
    const persistence = createMatchPersistence(createInMemoryStorage());
    const state = createOrderedMatch();
    persistence.saveMatch(state);
    persistence.setActiveMatchId(state.id);

    const active = persistence.getActiveMatch();
    expect(active.ok).toBe(true);
    if (!active.ok) return;
    expect(active.value.players.map((p) => p.id)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(active.value.playerRoundIndex).toBe(0);
  });

  it("rejeita load de partida inexistente", () => {
    const persistence = createMatchPersistence(createInMemoryStorage());
    const loaded = persistence.loadMatch("missing");
    expect(loaded.ok).toBe(false);
  });
});

describe("match persistence — localStorage adapter", () => {
  it("grava JSON nas chaves esperadas e restaura o estado", () => {
    const webStorage = createMockWebStorage();
    const persistence = createMatchPersistence(
      createLocalStorageAdapter(webStorage),
    );
    const state = { ...createOrderedMatch("ls-1"), playerRoundIndex: 1 };

    expect(persistence.saveMatch(state).ok).toBe(true);
    persistence.setActiveMatchId(state.id);

    const raw = webStorage.getItem(matchStorageKey("ls-1"));
    expect(raw).toBeTruthy();
    expect(webStorage.getItem(ACTIVE_MATCH_ID_KEY)).toBe("ls-1");

    const loaded = persistence.loadMatch("ls-1");
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.value).toEqual(state);
  });

  it("rejeita JSON inválido sem resortear", () => {
    const webStorage = createMockWebStorage();
    webStorage.setItem(matchStorageKey("bad"), "{not-json");
    const persistence = createMatchPersistence(
      createLocalStorageAdapter(webStorage),
    );
    const loaded = persistence.loadMatch("bad");
    expect(loaded.ok).toBe(false);
  });
});

describe("persistCreatedMatch", () => {
  it("salva e marca partida ativa; reentrada preserva ordem", () => {
    const persistence = createMatchPersistence(createInMemoryStorage());
    const state = createOrderedMatch("created-1");

    const persisted = persistCreatedMatch(state, persistence);
    expect(persisted.ok).toBe(true);
    if (!persisted.ok) return;
    expect(persisted.value.players.map((p) => p.id)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);

    const again = persistence.getActiveMatch();
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.value.players.map((p) => p.id)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(again.value.playerRoundIndex).toBe(0);
  });
});
