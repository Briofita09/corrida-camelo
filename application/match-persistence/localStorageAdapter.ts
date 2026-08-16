import type { KeyValueStorage } from "./keys";

/**
 * Adaptador sobre a Web Storage API (`localStorage` ou mock injetável).
 */
export function createLocalStorageAdapter(
  storage: Storage = globalThis.localStorage,
): KeyValueStorage {
  return {
    getItem(key) {
      return storage.getItem(key);
    },
    setItem(key, value) {
      storage.setItem(key, value);
    },
    removeItem(key) {
      storage.removeItem(key);
    },
  };
}
