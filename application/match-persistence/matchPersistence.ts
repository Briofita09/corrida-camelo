import {
  deserializeMatchState,
  serializeMatchState,
  type DomainResult,
  type MatchState,
} from "@/domain/match";
import { err, ok } from "@/domain/match/result";
import {
  ACTIVE_MATCH_ID_KEY,
  matchStorageKey,
  type KeyValueStorage,
} from "./keys";

export type MatchPersistence = {
  saveMatch(state: MatchState): DomainResult<void>;
  loadMatch(matchId: string): DomainResult<MatchState>;
  setActiveMatchId(matchId: string): void;
  getActiveMatchId(): string | null;
  getActiveMatch(): DomainResult<MatchState>;
};

export function createMatchPersistence(
  storage: KeyValueStorage,
): MatchPersistence {
  const loadMatch = (matchId: string): DomainResult<MatchState> => {
    let raw: string | null;
    try {
      raw = storage.getItem(matchStorageKey(matchId));
    } catch {
      return err("STORAGE_READ_FAILED", "Falha ao ler a partida.");
    }
    if (raw === null) {
      return err(
        "MATCH_NOT_FOUND",
        "Partida não encontrada no armazenamento.",
      );
    }
    return deserializeMatchState(raw);
  };

  return {
    saveMatch(state) {
      const serialized = serializeMatchState(state);
      if (!serialized.ok) return serialized;
      try {
        storage.setItem(matchStorageKey(state.id), serialized.value);
        return ok(undefined);
      } catch {
        return err("STORAGE_WRITE_FAILED", "Falha ao gravar a partida.");
      }
    },

    loadMatch,

    setActiveMatchId(matchId) {
      storage.setItem(ACTIVE_MATCH_ID_KEY, matchId);
    },

    getActiveMatchId() {
      return storage.getItem(ACTIVE_MATCH_ID_KEY);
    },

    getActiveMatch() {
      const id = storage.getItem(ACTIVE_MATCH_ID_KEY);
      if (!id) {
        return err("NO_ACTIVE_MATCH", "Nenhuma partida ativa.");
      }
      return loadMatch(id);
    },
  };
}
