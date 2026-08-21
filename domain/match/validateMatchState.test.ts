import { describe, expect, it } from "vitest";
import {
  buildValidCreatedMatch,
  buildValidFinishedMatch,
  buildValidStartedMatch,
} from "./testHelpers";
import { validateMatchState } from "./validateMatchState";

describe("validateMatchState", () => {
  it("aceita estado Created válido", () => {
    const result = validateMatchState(buildValidCreatedMatch());
    expect(result.ok).toBe(true);
  });

  it("rejeita lista de camelos incompleta", () => {
    const state = buildValidCreatedMatch();
    const incomplete = {
      ...state,
      camels: state.camels.slice(0, 5),
    };
    expect(validateMatchState(incomplete).ok).toBe(false);
  });

  it("rejeita dinheiro menor que 1", () => {
    const state = buildValidCreatedMatch();
    const invalid = {
      ...state,
      players: state.players.map((p, i) =>
        i === 0 ? { ...p, money: 0 } : p,
      ),
    };
    expect(validateMatchState(invalid).ok).toBe(false);
  });

  it("rejeita mesma posição e ordem de pilha", () => {
    const state = buildValidCreatedMatch();
    const camels = state.camels.map((c, i) =>
      i === 1 ? { ...c, space: 0, stackOrder: state.camels[0].stackOrder } : c,
    );
    expect(validateMatchState({ ...state, camels }).ok).toBe(false);
  });

  it("rejeita fase desconhecida", () => {
    const state = { ...buildValidCreatedMatch(), phase: "UnknownPhase" };
    expect(validateMatchState(state).ok).toBe(false);
  });

  it("rejeita Created com cartas de preparação preenchidas", () => {
    const state = {
      ...buildValidCreatedMatch(),
      setupRevealedRacingCards: [{ camelId: "Yellow", value: 1 }],
    };
    expect(validateMatchState(state).ok).toBe(false);
  });

  it("rejeita RaceSetup sem cartas de preparação", () => {
    const created = buildValidCreatedMatch();
    const state = {
      ...created,
      phase: "RaceSetup",
      currentTurnPlayerId: created.players[0]!.id,
      setupRevealedRacingCards: null,
      remainingRacingCards: null,
    };
    expect(validateMatchState(state).ok).toBe(false);
  });

  it("rejeita LegInProgress sem turno válido", () => {
    const started = buildValidStartedMatch();
    const state = {
      ...started,
      phase: "LegInProgress",
      currentLeg: 1,
      currentTurnPlayerId: null,
    };
    expect(validateMatchState(state).ok).toBe(false);
  });

  it("aceita Finished válido", () => {
    expect(validateMatchState(buildValidFinishedMatch()).ok).toBe(true);
  });

  it("rejeita Created com turno definido", () => {
    const state = {
      ...buildValidCreatedMatch(),
      currentTurnPlayerId: "h1",
    };
    expect(validateMatchState(state).ok).toBe(false);
  });

  it("rejeita RaceSetup sem turno", () => {
    const started = buildValidStartedMatch();
    const state = {
      ...started,
      currentTurnPlayerId: null,
    };
    expect(validateMatchState(state).ok).toBe(false);
  });

  it("aceita RaceSetup com turno de jogador existente", () => {
    const started = buildValidStartedMatch();
    const state = {
      ...started,
      currentTurnPlayerId: started.players[1]!.id,
    };
    expect(validateMatchState(state).ok).toBe(true);
  });

  it("não exige Crazy no espaço 0 em RaceSetup", () => {
    const started = buildValidStartedMatch();
    const camels = started.camels.map((c) =>
      c.id === "Crazy" ? { ...c, space: 7 } : c,
    );
    expect(validateMatchState({ ...started, camels }).ok).toBe(true);
  });

  it("aceita RaceSetup legado com Crazy ainda no espaço 0", () => {
    const started = buildValidStartedMatch();
    const usedAtStart = new Set(
      started.camels
        .filter((c) => c.space === 0)
        .map((c) => c.stackOrder),
    );
    const freeStack = [0, 1, 2, 3, 4, 5].find((n) => !usedAtStart.has(n)) ?? 6;
    const camels = started.camels.map((c) =>
      c.id === "Crazy" ? { ...c, space: 0, stackOrder: freeStack } : c,
    );
    expect(validateMatchState({ ...started, camels }).ok).toBe(true);
  });

  it("aceita RaceSetup com Crazy noutro espaço válido (não exige 7)", () => {
    const started = buildValidStartedMatch();
    const usedAtFive = new Set(
      started.camels
        .filter((c) => c.space === 5)
        .map((c) => c.stackOrder),
    );
    const freeStack = [0, 1, 2, 3, 4, 5].find((n) => !usedAtFive.has(n)) ?? 6;
    const camels = started.camels.map((c) =>
      c.id === "Crazy" ? { ...c, space: 5, stackOrder: freeStack } : c,
    );
    expect(validateMatchState({ ...started, camels }).ok).toBe(true);
  });

  it("rejeita Crazy com sentido TowardFinish", () => {
    const started = buildValidStartedMatch();
    const camels = started.camels.map((c) =>
      c.id === "Crazy" ? { ...c, direction: "TowardFinish" as const } : c,
    );
    const result = validateMatchState({ ...started, camels });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_DIRECTION");
  });

  it("rejeita Created com camelo fora do espaço 0", () => {
    const created = buildValidCreatedMatch();
    const camels = created.camels.map((c) =>
      c.id === "Yellow" ? { ...c, space: 1 } : c,
    );
    const result = validateMatchState({ ...created, camels });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CAMELS_NOT_AT_START");
  });

  it("rejeita camelo de corrida com sentido TowardStart", () => {
    const started = buildValidStartedMatch();
    const camels = started.camels.map((c) =>
      c.id === "Yellow" ? { ...c, direction: "TowardStart" as const } : c,
    );
    const result = validateMatchState({ ...started, camels });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_DIRECTION");
  });
});

