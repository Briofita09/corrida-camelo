export const STORAGE_PREFIX = "camel-up-card-game:";
export const ACTIVE_MATCH_ID_KEY = `${STORAGE_PREFIX}active-match-id`;

export function matchStorageKey(matchId: string): string {
  return `${STORAGE_PREFIX}match:${matchId}`;
}

/** Porta mínima de armazenamento chave/valor (in-memory ou Web Storage). */
export type KeyValueStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
