import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));

describe("match-persistence independence", () => {
  it("não importa react nem next", () => {
    const files = [
      "keys.ts",
      "inMemoryStorage.ts",
      "localStorageAdapter.ts",
      "matchPersistence.ts",
      "persistCreatedMatch.ts",
      "index.ts",
    ];
    for (const file of files) {
      const source = readFileSync(join(dir, file), "utf8");
      expect(source).not.toMatch(/from ["']react["']/);
      expect(source).not.toMatch(/from ["']next/);
    }
  });

  it("load path não importa createMatch", () => {
    const source = readFileSync(join(dir, "matchPersistence.ts"), "utf8");
    const importBlock = source.slice(0, source.indexOf("export type MatchPersistence"));
    expect(importBlock).not.toMatch(/\bcreateMatch\b/);
    expect(importBlock).toMatch(/deserializeMatchState/);
  });
});
