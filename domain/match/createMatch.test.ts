import { describe, expect, it } from "vitest";
import { createMatch } from "./createMatch";
import type { CreateMatchConfig, CreateMatchPlayerInput } from "./types";

function human(id: string, name = id): CreateMatchPlayerInput {
  return { id, name, type: "Human" };
}

function bot(
  id: string,
  difficulty: "Easy" | "Medium" | "Hard",
  name = id,
): CreateMatchPlayerInput {
  return { id, name, type: "Bot", difficulty };
}

describe("createMatch — rejeições", () => {
  it("rejeita partida sem jogadores", () => {
    const config: CreateMatchConfig = { id: "m1", players: [] };
    const result = createMatch(config);
    expect(result.ok).toBe(false);
  });

  it("rejeita partida abaixo do mínimo (1 humano)", () => {
    const result = createMatch({ id: "m1", players: [human("p1")] });
    expect(result.ok).toBe(false);
  });

  it("rejeita partida acima do máximo (7 jogadores)", () => {
    const result = createMatch({
      id: "m1",
      players: [
        human("p1"),
        bot("b1", "Easy"),
        bot("b2", "Medium"),
        bot("b3", "Hard"),
        bot("b4", "Easy"),
        bot("b5", "Medium"),
        bot("b6", "Hard"),
      ],
    });
    expect(result.ok).toBe(false);
  });

  it("rejeita partida só com bots", () => {
    const result = createMatch({
      id: "m1",
      players: [bot("b1", "Easy"), bot("b2", "Medium"), bot("b3", "Hard")],
    });
    expect(result.ok).toBe(false);
  });

  it("rejeita partida com bot sem dificuldade", () => {
    const players = [
      human("p1"),
      { id: "b1", name: "Bot", type: "Bot" },
    ] as CreateMatchPlayerInput[];
    const result = createMatch({ id: "m1", players });
    expect(result.ok).toBe(false);
  });

  it("rejeita partida com identificadores duplicados", () => {
    const result = createMatch({
      id: "m1",
      players: [human("same"), bot("same", "Easy")],
    });
    expect(result.ok).toBe(false);
  });
});

describe("createMatch — caminho feliz", () => {
  it("cria partida válida com humano e bots", () => {
    const result = createMatch({
      id: "match-1",
      players: [
        human("h1", "Felipe"),
        bot("b1", "Easy", "Bot Easy"),
        bot("b2", "Medium", "Bot Medium"),
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const state = result.value;
    expect(state.id).toBe("match-1");
    expect(state.phase).toBe("Created");
    expect(state.players).toHaveLength(3);
    expect(state.players.every((p) => p.money === 3)).toBe(true);
    expect(state.camels).toHaveLength(6);
    expect(state.setupRevealedRacingCards).toBeNull();
    expect(state.remainingRacingCards).toBeNull();
    expect(state.camels.map((c) => c.id).sort()).toEqual(
      ["Blue", "Crazy", "Green", "Purple", "Red", "Yellow"].sort(),
    );
    expect(state.camels.every((c) => c.space === 0)).toBe(true);

    const stackOrders = state.camels.map((c) => c.stackOrder);
    expect(new Set(stackOrders).size).toBe(6);

    const crazy = state.camels.find((c) => c.id === "Crazy");
    expect(crazy?.direction).toBe("TowardStart");
    expect(
      state.camels
        .filter((c) => c.id !== "Crazy")
        .every((c) => c.direction === "TowardFinish"),
    ).toBe(true);

    const easyBot = state.players.find((p) => p.id === "b1");
    const mediumBot = state.players.find((p) => p.id === "b2");
    expect(easyBot?.type).toBe("Bot");
    expect(mediumBot?.type).toBe("Bot");
    if (easyBot?.type === "Bot") expect(easyBot.difficulty).toBe("Easy");
    if (mediumBot?.type === "Bot") expect(mediumBot.difficulty).toBe("Medium");

    expect(state.currentTurnPlayerId).toBeNull();
    expect(state.currentLeg).toBe(0);
    expect(state.playerRoundIndex).toBe(0);
  });

  it("na Created o camelo doido permanece na largada no sentido contrário", () => {
    const result = createMatch({
      id: "match-crazy-created",
      players: [human("h1", "Felipe"), bot("b1", "Easy")],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const crazy = result.value.camels.find((c) => c.id === "Crazy");
    expect(crazy).toBeDefined();
    expect(crazy?.space).toBe(0);
    expect(crazy?.direction).toBe("TowardStart");
  });
});
