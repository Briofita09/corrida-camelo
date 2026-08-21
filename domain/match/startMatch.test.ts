import { describe, expect, it } from "vitest";
import { CRAZY_INITIAL_SPACE, RACING_CAMEL_IDS } from "./constants";
import { createMatch } from "./createMatch";
import { identityOrdering } from "./playerOrdering";
import {
  createOfficialRacingDeck,
  identityRacingCardOrdering,
  racingCardMultisetsEqual,
} from "./racingCards";
import { startMatch } from "./startMatch";
import type { MatchState, RacingCard } from "./types";

function orderedCreatedMatch(): MatchState {
  const result = createMatch(
    {
      id: "m1",
      players: [
        { id: "A", name: "A", type: "Human" },
        { id: "B", name: "B", type: "Bot", difficulty: "Easy" },
        { id: "C", name: "C", type: "Bot", difficulty: "Medium" },
      ],
    },
    { ordering: identityOrdering },
  );
  if (!result.ok) throw new Error("setup failed");
  return result.value;
}

function camel(state: MatchState, id: string) {
  const found = state.camels.find((c) => c.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

const CONTROLLED_SEQUENCE: RacingCard[] = [
  { camelId: "Yellow", value: 1 },
  { camelId: "Green", value: 2 },
  { camelId: "Blue", value: 1 },
  { camelId: "Purple", value: 1 },
  { camelId: "Yellow", value: 1 },
];

describe("startMatch", () => {
  it("revela 5 cartas, posiciona camelos e grava o pool restante", () => {
    const created = orderedCreatedMatch();
    const snapshot = structuredClone(created);

    expect(created.setupRevealedRacingCards).toBeNull();
    expect(created.remainingRacingCards).toBeNull();
    expect(created.camels.every((c) => c.space === 0)).toBe(true);

    const result = startMatch(created, {
      revealedRacingCards: CONTROLLED_SEQUENCE,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.phase).toBe("RaceSetup");
    expect(result.value.currentTurnPlayerId).toBe("A");
    expect(result.value.playerRoundIndex).toBe(0);
    expect(result.value.players.map((p) => p.id)).toEqual(["A", "B", "C"]);
    expect(result.value.players.every((p) => p.money === 3)).toBe(true);

    expect(result.value.setupRevealedRacingCards).toEqual(CONTROLLED_SEQUENCE);
    expect(result.value.remainingRacingCards).toHaveLength(25);
    expect(
      racingCardMultisetsEqual(
        [
          ...(result.value.setupRevealedRacingCards ?? []),
          ...(result.value.remainingRacingCards ?? []),
        ],
        createOfficialRacingDeck(),
      ),
    ).toBe(true);

    expect(camel(result.value, "Yellow").space).toBe(2);
    expect(camel(result.value, "Green").space).toBe(2);
    expect(camel(result.value, "Blue").space).toBe(2);
    expect(camel(result.value, "Purple").space).toBe(2);
    expect(camel(result.value, "Red").space).toBe(0);

    const crazy = camel(result.value, "Crazy");
    expect(crazy.space).toBe(CRAZY_INITIAL_SPACE);
    expect(crazy.direction).toBe("TowardStart");
    expect(crazy.space).not.toBe(0);
    expect(
      result.value.camels.filter((c) => c.space === CRAZY_INITIAL_SPACE),
    ).toHaveLength(1);
    for (const racingId of RACING_CAMEL_IDS) {
      const racing = camel(result.value, racingId);
      expect(racing.direction).toBe("TowardFinish");
      expect(racing.space).not.toBe(CRAZY_INITIAL_SPACE);
    }

    expect(created).toEqual(snapshot);
    expect(created.phase).toBe("Created");
    expect(created.setupRevealedRacingCards).toBeNull();
  });

  it("início é determinístico dada a mesma sequência", () => {
    const created = orderedCreatedMatch();
    const options = { revealedRacingCards: CONTROLLED_SEQUENCE };
    const first = startMatch(structuredClone(created), options);
    const second = startMatch(structuredClone(created), options);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.value).toEqual(second.value);
  });

  it("usa shuffle injetado: reveladas são as 5 primeiras da permutação", () => {
    const reversed = (deck: RacingCard[]) => [...deck].reverse();
    const expected = reversed(createOfficialRacingDeck()).slice(0, 5);
    const result = startMatch(orderedCreatedMatch(), {
      shuffleRacingCards: reversed,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.setupRevealedRacingCards).toEqual(expected);
    expect(result.value.remainingRacingCards).toHaveLength(25);
  });

  it("identityRacingCardOrdering deixa Yellow no espaço 5 e Red no 0", () => {
    const result = startMatch(orderedCreatedMatch(), {
      shuffleRacingCards: identityRacingCardOrdering,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(camel(result.value, "Yellow").space).toBe(5);
    expect(camel(result.value, "Red").space).toBe(0);
    expect(camel(result.value, "Crazy").space).toBe(CRAZY_INITIAL_SPACE);
    expect(camel(result.value, "Crazy").direction).toBe("TowardStart");
    expect(result.value.setupRevealedRacingCards).toEqual([
      { camelId: "Yellow", value: 1 },
      { camelId: "Yellow", value: 1 },
      { camelId: "Yellow", value: 1 },
      { camelId: "Yellow", value: 1 },
      { camelId: "Yellow", value: 1 },
    ]);
  });

  it("rejeita sequência com quantidade diferente de 5", () => {
    const created = orderedCreatedMatch();
    const snapshot = structuredClone(created);
    const four = startMatch(created, {
      revealedRacingCards: CONTROLLED_SEQUENCE.slice(0, 4),
    });
    expect(four.ok).toBe(false);
    if (!four.ok) expect(four.error.code).toBe("INVALID_REVEAL_COUNT");
    expect(created).toEqual(snapshot);
    expect(camel(created, "Crazy").space).toBe(0);
    expect(camel(created, "Crazy").direction).toBe("TowardStart");

    const six = startMatch(created, {
      revealedRacingCards: [...CONTROLLED_SEQUENCE, { camelId: "Red", value: 1 }],
    });
    expect(six.ok).toBe(false);
    if (!six.ok) expect(six.error.code).toBe("INVALID_REVEAL_COUNT");
    expect(created).toEqual(snapshot);
    expect(camel(created, "Crazy").space).toBe(0);
    expect(camel(created, "Crazy").direction).toBe("TowardStart");
  });

  it("rejeita carta com valor ou cor inválidos", () => {
    const created = orderedCreatedMatch();
    const snapshot = structuredClone(created);
    const invalidValue = startMatch(created, {
      revealedRacingCards: [
        { camelId: "Yellow", value: 0 },
        { camelId: "Green", value: 1 },
        { camelId: "Blue", value: 1 },
        { camelId: "Purple", value: 1 },
        { camelId: "Red", value: 1 },
      ],
    });
    expect(invalidValue.ok).toBe(false);
    if (!invalidValue.ok) expect(invalidValue.error.code).toBe("INVALID_RACING_CARD");

    const crazy = startMatch(created, {
      revealedRacingCards: [
        { camelId: "Crazy", value: 1 },
        { camelId: "Green", value: 1 },
        { camelId: "Blue", value: 1 },
        { camelId: "Purple", value: 1 },
        { camelId: "Red", value: 1 },
      ],
    });
    expect(crazy.ok).toBe(false);
    if (!crazy.ok) expect(crazy.error.code).toBe("INVALID_RACING_CARD");
    expect(created).toEqual(snapshot);
    expect(created.camels.every((c) => c.space === 0)).toBe(true);
    expect(camel(created, "Crazy").space).toBe(0);
    expect(camel(created, "Crazy").direction).toBe("TowardStart");
  });

  it("rejeita camelos de corrida fora da largada", () => {
    const created = orderedCreatedMatch();
    const moved: MatchState = {
      ...created,
      camels: created.camels.map((c) =>
        c.id === "Yellow" ? { ...c, space: 1 } : c,
      ),
    };
    const result = startMatch(moved, { revealedRacingCards: CONTROLLED_SEQUENCE });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("CAMELS_NOT_AT_START");
  });

  it("rejeita iniciar partida já iniciada e preserva Crazy no espaço 7", () => {
    const started = startMatch(orderedCreatedMatch(), {
      revealedRacingCards: CONTROLLED_SEQUENCE,
    });
    if (!started.ok) throw new Error("start failed");
    expect(camel(started.value, "Crazy").space).toBe(CRAZY_INITIAL_SPACE);
    expect(camel(started.value, "Crazy").direction).toBe("TowardStart");
    const snapshot = structuredClone(started.value);
    const again = startMatch(started.value);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.code).toBe("INVALID_PHASE");
    expect(started.value).toEqual(snapshot);
    expect(started.value.setupRevealedRacingCards).toEqual(CONTROLLED_SEQUENCE);
    expect(camel(started.value, "Crazy").space).toBe(CRAZY_INITIAL_SPACE);
    expect(camel(started.value, "Crazy").direction).toBe("TowardStart");
  });

  it("rejeita iniciar partida já em andamento (LegInProgress)", () => {
    const started = startMatch(orderedCreatedMatch(), {
      revealedRacingCards: CONTROLLED_SEQUENCE,
    });
    if (!started.ok) throw new Error("start failed");
    const inProgress: MatchState = {
      ...started.value,
      phase: "LegInProgress",
      currentLeg: 1,
    };
    const snapshot = structuredClone(inProgress);
    const result = startMatch(inProgress);
    expect(result.ok).toBe(false);
    expect(inProgress).toEqual(snapshot);
  });

  it("rejeita iniciar Created com invariantes quebrados", () => {
    const created = orderedCreatedMatch();
    const invalid: MatchState = {
      ...created,
      camels: created.camels.slice(0, 5),
    };
    const snapshot = structuredClone(invalid);
    const result = startMatch(invalid);
    expect(result.ok).toBe(false);
    expect(invalid).toEqual(snapshot);
  });

  it("rejeita mutação em partida Finished", () => {
    const started = startMatch(orderedCreatedMatch(), {
      revealedRacingCards: CONTROLLED_SEQUENCE,
    });
    if (!started.ok) throw new Error("start failed");
    const finished: MatchState = {
      ...started.value,
      phase: "Finished",
      currentLeg: 1,
    };
    const snapshot = structuredClone(finished);
    const result = startMatch(finished);
    expect(result.ok).toBe(false);
    expect(finished).toEqual(snapshot);
  });

  it("nenhum camelo tem dono; Crazy não é camelo de corrida e está desclassificado por identidade", () => {
    const created = orderedCreatedMatch();
    const started = startMatch(created, {
      revealedRacingCards: CONTROLLED_SEQUENCE,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    const crazies = started.value.camels.filter((c) => c.id === "Crazy");
    expect(crazies).toHaveLength(1);
    expect((RACING_CAMEL_IDS as readonly string[]).includes("Crazy")).toBe(
      false,
    );

    for (const camelState of started.value.camels) {
      expect(Object.keys(camelState).sort()).toEqual([
        "direction",
        "id",
        "space",
        "stackOrder",
      ]);
      expect(camelState).not.toHaveProperty("owner");
      expect(camelState).not.toHaveProperty("playerId");
      expect(camelState).not.toHaveProperty("disqualified");
    }

    const crazy = crazies[0]!;
    expect(crazy.id).toBe("Crazy");
  });

  it("o sentido do doido é sempre o contrário dos de corrida na Created e após o início", () => {
    const created = orderedCreatedMatch();
    expect(camel(created, "Crazy").direction).toBe("TowardStart");
    for (const racingId of RACING_CAMEL_IDS) {
      expect(camel(created, racingId).direction).toBe("TowardFinish");
    }

    const started = startMatch(created, {
      revealedRacingCards: CONTROLLED_SEQUENCE,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) return;

    expect(camel(started.value, "Crazy").direction).toBe("TowardStart");
    for (const racingId of RACING_CAMEL_IDS) {
      expect(camel(started.value, racingId).direction).toBe("TowardFinish");
    }
  });
});
