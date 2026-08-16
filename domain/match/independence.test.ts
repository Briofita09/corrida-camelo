import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = path.dirname(fileURLToPath(import.meta.url));

describe("domínio independente de UI", () => {
  it("não importa react nem next nos fontes de domain/match", () => {
    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
    );

    for (const file of files) {
      if (file === "testHelpers.ts") continue;
      const content = readFileSync(path.join(dir, file), "utf8");
      expect(content).not.toMatch(/from\s+["']react["']/);
      expect(content).not.toMatch(/from\s+["']react\//);
      expect(content).not.toMatch(/from\s+["']next["']/);
      expect(content).not.toMatch(/from\s+["']next\//);
    }
  });
});
