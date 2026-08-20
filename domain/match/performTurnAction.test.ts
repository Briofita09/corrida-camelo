import { describe, expect, it } from "vitest";
import * as matchApi from "./index";
import { createMatch } from "./createMatch";
import { identityOrdering } from "./playerOrdering";
import { performTurnAction } from "./performTurnAction";
import { startMatch } from "./startMatch";
import { buildValidFinishedMatch } from "./testHelpers";
import type { MatchState } from "./types";

function orderedCreatedMatch(
  playerIds: string[] = ["A", "B", "C"],
): MatchState {
  const players = playerIds.map((id, index) =>
    index === 0
      ? ({ id, name: id, type: "Human" } as const)
      : ({ id, name: id, type: "Bot", difficulty: "Easy" } as const),
  );
  const result = createMatch({ id: "m1", players }, { ordering: identityOrdering });
  if (!result.ok) throw new Error("setup failed");
  return result.value;
}

function startedMatch(playerIds?: string[]): MatchState {
  const started = startMatch(orderedCreatedMatch(playerIds));
  if (!started.ok) throw new Error("start failed");
  return started.value;
}

describe("performTurnAction", () => {
  it("partida iniciada possui jogador ativo A na rodada 0", () => {
    const started = startedMatch(["A", "B", "C"]);
    expect(started.phase).toBe("RaceSetup");
    expect(started.playerRoundIndex).toBe(0);
    expect(started.currentTurnPlayerId).toBe("A");
  });

  it("ação válida do jogador ativo avança o turno e preserva o restante", () => {
    const started = startedMatch(["A", "B", "C"]);
    const snapshot = structuredClone(started);

    const result = performTurnAction(started, "A");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.currentTurnPlayerId).toBe("B");
    expect(result.value.playerRoundIndex).toBe(0);
    expect(result.value.phase).toBe("RaceSetup");
    expect(result.value.id).toBe("m1");
    expect(result.value.players.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(result.value.players.every((p) => p.money === 3)).toBe(true);
    expect(result.value.camels).toHaveLength(6);
    expect(result.value.camels).toEqual(started.camels);
    expect(result.value.setupRevealedRacingCards).toEqual(
      started.setupRevealedRacingCards,
    );
    expect(result.value.remainingRacingCards).toEqual(
      started.remainingRacingCards,
    );
    expect(started).toEqual(snapshot);
    expect(started.currentTurnPlayerId).toBe("A");
  });

  it("rejeita ação de quem não é o jogador ativo", () => {
    const started = startedMatch(["A", "B", "C"]);
    const snapshot = structuredClone(started);

    const result = performTurnAction(started, "B");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NOT_CURRENT_PLAYER");
    expect(started).toEqual(snapshot);
    expect(started.currentTurnPlayerId).toBe("A");
    expect(started.playerRoundIndex).toBe(0);
  });

  it("rejeita concluir o mesmo turno duas vezes", () => {
    const started = startedMatch(["A", "B", "C"]);
    const first = performTurnAction(started, "A");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.currentTurnPlayerId).toBe("B");

    const snapshot = structuredClone(first.value);
    const second = performTurnAction(first.value, "A");
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe("NOT_CURRENT_PLAYER");
    expect(first.value).toEqual(snapshot);
    expect(first.value.currentTurnPlayerId).toBe("B");
  });

  it("rejeita ação em partida Finished", () => {
    const finished = buildValidFinishedMatch();
    const snapshot = structuredClone(finished);
    const result = performTurnAction(finished, finished.players[0]!.id);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MATCH_FINISHED");
    expect(finished).toEqual(snapshot);
  });

  it("rejeita ação depois que a partida passa a Finished", () => {
    const started = startedMatch(["A", "B", "C"]);
    const finished: MatchState = {
      ...started,
      phase: "Finished",
      currentLeg: 1,
    };
    const snapshot = structuredClone(finished);
    const result = performTurnAction(finished, "A");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("MATCH_FINISHED");
    expect(finished).toEqual(snapshot);
  });

  it("rejeita ação em partida Created", () => {
    const created = orderedCreatedMatch(["A", "B", "C"]);
    const snapshot = structuredClone(created);
    const result = performTurnAction(created, "A");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(["INVALID_PHASE", "INVALID_TURN"]).toContain(result.error.code);
    expect(created).toEqual(snapshot);
    expect(created.currentTurnPlayerId).toBeNull();
  });

  it("rejeita ação em fase que não admite turno nesta US", () => {
    const started = startedMatch(["A", "B", "C"]);
    const legSetup: MatchState = { ...started, phase: "LegSetup", currentLeg: 1 };
    const snapshot = structuredClone(legSetup);
    const result = performTurnAction(legSetup, "A");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(["INVALID_PHASE", "INVALID_TURN"]).toContain(result.error.code);
    expect(legSetup).toEqual(snapshot);
    expect(legSetup.currentTurnPlayerId).toBe("A");
  });

  it("rejeita origem inválida sem avançar o turno", () => {
    const started = startedMatch(["A", "B", "C"]);
    const invalid: MatchState = {
      ...started,
      camels: started.camels.slice(0, 5),
    };
    const snapshot = structuredClone(invalid);
    const result = performTurnAction(invalid, "A");
    expect(result.ok).toBe(false);
    expect(invalid).toEqual(snapshot);
    expect(invalid.currentTurnPlayerId).toBe("A");
  });

  it("último da rodada 0 cede a vez ao primeiro da rodada 1 (D → B)", () => {
    let state = startedMatch(["A", "B", "C", "D"]);
    for (const actor of ["A", "B", "C"]) {
      const stepped = performTurnAction(state, actor);
      expect(stepped.ok).toBe(true);
      if (!stepped.ok) return;
      state = stepped.value;
    }
    expect(state.currentTurnPlayerId).toBe("D");
    expect(state.playerRoundIndex).toBe(0);

    const snapshotPlayers = state.players.map((p) => p.id);
    const result = performTurnAction(state, "D");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.playerRoundIndex).toBe(1);
    expect(result.value.currentTurnPlayerId).toBe("B");
    expect(result.value.players.map((p) => p.id)).toEqual(["A", "B", "C", "D"]);
    expect(result.value.players.map((p) => p.id)).toEqual(snapshotPlayers);
  });

  it("com dois jogadores, B fecha a rodada 0 e inicia a rodada 1", () => {
    const afterA = performTurnAction(startedMatch(["A", "B"]), "A");
    expect(afterA.ok).toBe(true);
    if (!afterA.ok) return;
    expect(afterA.value.currentTurnPlayerId).toBe("B");
    expect(afterA.value.playerRoundIndex).toBe(0);

    const afterB = performTurnAction(afterA.value, "B");
    expect(afterB.ok).toBe(true);
    if (!afterB.ok) return;
    expect(afterB.value.playerRoundIndex).toBe(1);
    expect(afterB.value.currentTurnPlayerId).toBe("B");
  });

  it("com seis jogadores percorre a rodada 0 e wrap para B", () => {
    const ids = ["A", "B", "C", "D", "E", "F"];
    let state = startedMatch(ids);
    for (const actor of ["A", "B", "C", "D", "E"]) {
      const stepped = performTurnAction(state, actor);
      expect(stepped.ok).toBe(true);
      if (!stepped.ok) return;
      state = stepped.value;
    }
    expect(state.currentTurnPlayerId).toBe("F");
    expect(state.playerRoundIndex).toBe(0);

    const afterF = performTurnAction(state, "F");
    expect(afterF.ok).toBe(true);
    if (!afterF.ok) return;
    expect(afterF.value.playerRoundIndex).toBe(1);
    expect(afterF.value.currentTurnPlayerId).toBe("B");
  });

  it("não há comando público de skip que avance turno ou rodada", () => {
    expect(matchApi).not.toHaveProperty("advancePlayerRound");
    const started = startedMatch(["A", "B", "C"]);
    const snapshot = structuredClone(started);
    const rejected = performTurnAction(started, "B");
    expect(rejected.ok).toBe(false);
    expect(started).toEqual(snapshot);
    expect(started.currentTurnPlayerId).toBe("A");
  });
});
