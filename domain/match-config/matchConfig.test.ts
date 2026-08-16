import { describe, expect, it } from "vitest";
import {
  addParticipant,
  createMatchConfig,
  createMatchFromConfig,
  discardMatchConfig,
  removeParticipant,
  setMatchMode,
  updateParticipant,
  validateMatchConfig,
} from "./index";
import type { MatchConfig } from "./types";

function withMode(
  mode: "SinglePlayerVsBots" | "PassAndPlay",
): MatchConfig {
  const created = createMatchConfig("c1");
  if (!created.ok) throw new Error("create failed");
  const withModeResult = setMatchMode(created.value, mode);
  if (!withModeResult.ok) throw new Error("setMode failed");
  return withModeResult.value;
}

describe("createMatchConfig e setMatchMode", () => {
  it("cria configuração sem modo e sem participantes", () => {
    const result = createMatchConfig("cfg-a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mode).toBeNull();
    expect(result.value.participants).toEqual([]);
  });

  it("define o modo da partida", () => {
    const created = createMatchConfig();
    if (!created.ok) throw new Error("fail");
    const result = setMatchMode(created.value, "SinglePlayerVsBots");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mode).toBe("SinglePlayerVsBots");
  });

  it("rejeita adicionar jogador sem modo", () => {
    const created = createMatchConfig();
    if (!created.ok) throw new Error("fail");
    const result = addParticipant(created.value, {
      name: "Felipe",
      type: "Human",
    });
    expect(result.ok).toBe(false);
  });

  it("ao redefinir o modo, descarta participantes", () => {
    let config = withMode("SinglePlayerVsBots");
    const added = addParticipant(config, { name: "Felipe", type: "Human" });
    if (!added.ok) throw new Error("add failed");
    config = added.value;
    expect(config.participants).toHaveLength(1);

    const reset = setMatchMode(config, "PassAndPlay");
    expect(reset.ok).toBe(true);
    if (!reset.ok) return;
    expect(reset.value.mode).toBe("PassAndPlay");
    expect(reset.value.participants).toEqual([]);
  });
});

describe("participantes e nomes", () => {
  it("adiciona humano e bot com dificuldade", () => {
    let config = withMode("SinglePlayerVsBots");
    const human = addParticipant(config, { name: "Felipe", type: "Human" });
    expect(human.ok).toBe(true);
    if (!human.ok) return;
    config = human.value;
    const bot = addParticipant(config, {
      name: "Bot Easy",
      type: "Bot",
      difficulty: "Easy",
    });
    expect(bot.ok).toBe(true);
    if (!bot.ok) return;
    expect(bot.value.participants).toHaveLength(2);
  });

  it("rejeita nome vazio ou só espaços", () => {
    const config = withMode("PassAndPlay");
    expect(addParticipant(config, { name: "", type: "Human" }).ok).toBe(false);
    expect(addParticipant(config, { name: "   ", type: "Human" }).ok).toBe(
      false,
    );
  });

  it("rejeita nomes duplicados case-insensitive", () => {
    let config = withMode("PassAndPlay");
    const first = addParticipant(config, { name: "Ana", type: "Human" });
    if (!first.ok) throw new Error("fail");
    config = first.value;
    const dup = addParticipant(config, { name: "ana", type: "Human" });
    expect(dup.ok).toBe(false);
  });

  it("remove participante", () => {
    let config = withMode("PassAndPlay");
    const first = addParticipant(config, { name: "A", type: "Human" });
    if (!first.ok) throw new Error("fail");
    config = first.value;
    const id = config.participants[0].id;
    const removed = removeParticipant(config, id);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.value.participants).toHaveLength(0);
  });

  it("rejeita update que cause nome duplicado", () => {
    let config = withMode("PassAndPlay");
    const a = addParticipant(config, { name: "Ana", type: "Human" });
    if (!a.ok) throw new Error("fail");
    config = a.value;
    const b = addParticipant(config, { name: "Bia", type: "Human" });
    if (!b.ok) throw new Error("fail");
    config = b.value;
    const biaId = config.participants.find((p) => p.name === "Bia")!.id;
    const updated = updateParticipant(config, biaId, {
      name: "ana",
      type: "Human",
    });
    expect(updated.ok).toBe(false);
  });
});

describe("validateMatchConfig", () => {
  it("rejeita sem jogadores", () => {
    const config = withMode("SinglePlayerVsBots");
    expect(validateMatchConfig(config).ok).toBe(false);
  });

  it("rejeita apenas um jogador", () => {
    const config = withMode("SinglePlayerVsBots");
    const human = addParticipant(config, { name: "Solo", type: "Human" });
    if (!human.ok) throw new Error("fail");
    expect(validateMatchConfig(human.value).ok).toBe(false);
  });

  it("rejeita acima do limite", () => {
    let config = withMode("PassAndPlay");
    for (const name of ["A", "B", "C", "D", "E", "F", "G"]) {
      const added = addParticipant(config, { name, type: "Human" });
      if (!added.ok) throw new Error(`add ${name}`);
      config = added.value;
    }
    expect(config.participants).toHaveLength(7);
    expect(validateMatchConfig(config).ok).toBe(false);
  });

  it("rejeita todos bots", () => {
    let config = withMode("SinglePlayerVsBots");
    const b1 = addParticipant(config, {
      name: "B1",
      type: "Bot",
      difficulty: "Easy",
    });
    if (!b1.ok) throw new Error("fail");
    config = b1.value;
    const b2 = addParticipant(config, {
      name: "B2",
      type: "Bot",
      difficulty: "Hard",
    });
    if (!b2.ok) throw new Error("fail");
    expect(validateMatchConfig(b2.value).ok).toBe(false);
  });

  it("rejeita Single-player sem bots", () => {
    const config = withMode("SinglePlayerVsBots");
    const human = addParticipant(config, { name: "Only", type: "Human" });
    if (!human.ok) throw new Error("fail");
    expect(validateMatchConfig(human.value).ok).toBe(false);
  });

  it("aceita Pass-and-play com 2 humanos e 0 bots", () => {
    let config = withMode("PassAndPlay");
    const a = addParticipant(config, { name: "A", type: "Human" });
    if (!a.ok) throw new Error("fail");
    config = a.value;
    const b = addParticipant(config, { name: "B", type: "Human" });
    if (!b.ok) throw new Error("fail");
    expect(validateMatchConfig(b.value).ok).toBe(true);
  });

  it("rejeita Pass-and-play com 1 humano e bots", () => {
    let config = withMode("PassAndPlay");
    const h = addParticipant(config, { name: "OnlyHuman", type: "Human" });
    if (!h.ok) throw new Error("fail");
    config = h.value;
    const b1 = addParticipant(config, {
      name: "Bot1",
      type: "Bot",
      difficulty: "Easy",
    });
    if (!b1.ok) throw new Error("fail");
    config = b1.value;
    const b2 = addParticipant(config, {
      name: "Bot2",
      type: "Bot",
      difficulty: "Medium",
    });
    if (!b2.ok) throw new Error("fail");
    expect(validateMatchConfig(b2.value).ok).toBe(false);
  });
});

describe("createMatchFromConfig", () => {
  it("Single-player válido gera partida Created", () => {
    let config = withMode("SinglePlayerVsBots");
    const h = addParticipant(config, { name: "Felipe", type: "Human" });
    if (!h.ok) throw new Error("fail");
    config = h.value;
    const b1 = addParticipant(config, {
      name: "Bot Easy",
      type: "Bot",
      difficulty: "Easy",
    });
    if (!b1.ok) throw new Error("fail");
    config = b1.value;
    const b2 = addParticipant(config, {
      name: "Bot Medium",
      type: "Bot",
      difficulty: "Medium",
    });
    if (!b2.ok) throw new Error("fail");

    const match = createMatchFromConfig(b2.value, "m-sp");
    expect(match.ok).toBe(true);
    if (!match.ok) return;
    expect(match.value.phase).toBe("Created");
    expect(match.value.players).toHaveLength(3);
    expect(match.value.players.filter((p) => p.type === "Human")).toHaveLength(
      1,
    );
    const easy = match.value.players.find((p) => p.name === "Bot Easy");
    expect(easy?.type).toBe("Bot");
    if (easy?.type === "Bot") expect(easy.difficulty).toBe("Easy");
  });

  it("Pass-and-play só com humanos", () => {
    let config = withMode("PassAndPlay");
    for (const name of ["A", "B", "C"]) {
      const added = addParticipant(config, { name, type: "Human" });
      if (!added.ok) throw new Error(name);
      config = added.value;
    }
    const match = createMatchFromConfig(config);
    expect(match.ok).toBe(true);
    if (!match.ok) return;
    expect(match.value.players).toHaveLength(3);
    expect(match.value.players.every((p) => p.type === "Human")).toBe(true);
  });

  it("Pass-and-play com humanos e bot Hard", () => {
    let config = withMode("PassAndPlay");
    const a = addParticipant(config, { name: "A", type: "Human" });
    if (!a.ok) throw new Error("fail");
    config = a.value;
    const b = addParticipant(config, { name: "B", type: "Human" });
    if (!b.ok) throw new Error("fail");
    config = b.value;
    const bot = addParticipant(config, {
      name: "HardBot",
      type: "Bot",
      difficulty: "Hard",
    });
    if (!bot.ok) throw new Error("fail");
    const match = createMatchFromConfig(bot.value);
    expect(match.ok).toBe(true);
    if (!match.ok) return;
    const hard = match.value.players.find((p) => p.name === "HardBot");
    expect(hard?.type).toBe("Bot");
    if (hard?.type === "Bot") expect(hard.difficulty).toBe("Hard");
  });

  it("rejeita generate inválido sem criar partida parcial", () => {
    const config = withMode("SinglePlayerVsBots");
    const match = createMatchFromConfig(config);
    expect(match.ok).toBe(false);
  });

  it("preserva dificuldade Easy após generate", () => {
    let config = withMode("SinglePlayerVsBots");
    const h = addParticipant(config, { name: "H", type: "Human" });
    if (!h.ok) throw new Error("fail");
    config = h.value;
    const bot = addParticipant(config, {
      name: "E",
      type: "Bot",
      difficulty: "Easy",
    });
    if (!bot.ok) throw new Error("fail");
    const match = createMatchFromConfig(bot.value);
    if (!match.ok) throw new Error("fail");
    const easy = match.value.players.find((p) => p.name === "E");
    if (easy?.type !== "Bot") throw new Error("expected bot");
    expect(easy.difficulty).toBe("Easy");
  });

  it("generate produz permutação completa dos participantes sem duplicata", () => {
    let config = withMode("PassAndPlay");
    for (const name of ["Ana", "Bia", "Caio", "Duda"]) {
      const added = addParticipant(config, { name, type: "Human" });
      if (!added.ok) throw new Error(name);
      config = added.value;
    }
    const match = createMatchFromConfig(config, "m-order", {
      random: () => 0,
    });
    expect(match.ok).toBe(true);
    if (!match.ok) return;
    const names = match.value.players.map((p) => p.name);
    expect(names).toHaveLength(4);
    expect(new Set(names).size).toBe(4);
    expect([...names].sort()).toEqual(["Ana", "Bia", "Caio", "Duda"].sort());
  });
});

describe("discardMatchConfig", () => {
  it("descarta rascunho sem criar partida", () => {
    let config = withMode("PassAndPlay");
    const a = addParticipant(config, { name: "A", type: "Human" });
    if (!a.ok) throw new Error("fail");
    config = a.value;
    const discarded = discardMatchConfig(config);
    expect(discarded.ok).toBe(true);
    if (!discarded.ok) return;
    expect(discarded.value.mode).toBeNull();
    expect(discarded.value.participants).toEqual([]);
  });
});
