import { describe, expect, it } from "vitest";
import { RACING_CAMEL_IDS } from "./constants";
import { createOfficialRacingDeck } from "./racingCards";

describe("createOfficialRacingDeck", () => {
  it("tem 30 cartas: 6 por cor de corrida, cinco 1 e uma 2, sem Crazy", () => {
    const deck = createOfficialRacingDeck();
    expect(deck).toHaveLength(30);

    for (const camelId of RACING_CAMEL_IDS) {
      const ofColor = deck.filter((card) => card.camelId === camelId);
      expect(ofColor).toHaveLength(6);
      expect(ofColor.filter((card) => card.value === 1)).toHaveLength(5);
      expect(ofColor.filter((card) => card.value === 2)).toHaveLength(1);
    }

    expect(
      deck.some((card) => (card as { camelId: string }).camelId === "Crazy"),
    ).toBe(false);
    expect(deck.some((card) => (card.value as number) === 0)).toBe(false);
  });

  it("usa ordem estável: por cor em RACING_CAMEL_IDS, cinco 1 e depois o 2", () => {
    const deck = createOfficialRacingDeck();
    let offset = 0;
    for (const camelId of RACING_CAMEL_IDS) {
      for (let i = 0; i < 5; i += 1) {
        expect(deck[offset]).toEqual({ camelId, value: 1 });
        offset += 1;
      }
      expect(deck[offset]).toEqual({ camelId, value: 2 });
      offset += 1;
    }
  });
});
