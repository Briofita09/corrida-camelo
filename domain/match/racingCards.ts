import {
  INITIAL_SETUP_REVEAL_COUNT,
  OFFICIAL_RACING_DECK_SIZE,
  RACING_CAMEL_IDS,
  RACING_CARD_ONES_PER_COLOR,
  START_SPACE,
} from "./constants";
import { err, ok } from "./result";
import type { RandomFn } from "./playerOrdering";
import type {
  DomainResult,
  RacingCamelId,
  RacingCard,
} from "./types";

export function isRacingCamelId(value: string): value is RacingCamelId {
  return (RACING_CAMEL_IDS as readonly string[]).includes(value);
}

export function isRacingCard(card: {
  camelId: string;
  value: number;
}): card is RacingCard {
  return isRacingCamelId(card.camelId) && (card.value === 1 || card.value === 2);
}

export function createOfficialRacingDeck(): RacingCard[] {
  const deck: RacingCard[] = [];
  for (const camelId of RACING_CAMEL_IDS) {
    for (let i = 0; i < RACING_CARD_ONES_PER_COLOR; i += 1) {
      deck.push({ camelId, value: 1 });
    }
    deck.push({ camelId, value: 2 });
  }
  return deck;
}

export function identityRacingCardOrdering(deck: RacingCard[]): RacingCard[] {
  return deck.map((card) => ({ ...card }));
}

export function shuffleRacingCards(
  deck: RacingCard[],
  random: RandomFn = Math.random,
): RacingCard[] {
  const copy = deck.map((card) => ({ ...card }));
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

export function racingCardKey(card: RacingCard): string {
  return `${card.camelId}:${card.value}`;
}

function toMultiset(cards: RacingCard[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    const key = racingCardKey(card);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function racingCardMultisetsEqual(
  left: RacingCard[],
  right: RacingCard[],
): boolean {
  if (left.length !== right.length) return false;
  const a = toMultiset(left);
  const b = toMultiset(right);
  if (a.size !== b.size) return false;
  for (const [key, count] of a) {
    if (b.get(key) !== count) return false;
  }
  return true;
}

export function subtractRacingCards(
  deck: RacingCard[],
  used: RacingCard[],
): RacingCard[] | null {
  const remaining = deck.map((card) => ({ ...card }));
  for (const card of used) {
    const index = remaining.findIndex(
      (candidate) =>
        candidate.camelId === card.camelId && candidate.value === card.value,
    );
    if (index < 0) return null;
    remaining.splice(index, 1);
  }
  return remaining;
}

export function copyRacingCards(
  cards: RacingCard[] | null,
): RacingCard[] | null {
  if (cards === null) return null;
  return cards.map((card) => ({ ...card }));
}

export type ResolvedSetupCards = {
  revealed: RacingCard[];
  remaining: RacingCard[];
};

export function resolveSetupRacingCards(options?: {
  shuffleRacingCards?: (deck: RacingCard[]) => RacingCard[];
  revealedRacingCards?: ReadonlyArray<{ camelId: string; value: number }>;
  random?: RandomFn;
}): DomainResult<ResolvedSetupCards> {
  const official = createOfficialRacingDeck();

  if (options?.revealedRacingCards !== undefined) {
    const raw = options.revealedRacingCards;
    if (raw.length !== INITIAL_SETUP_REVEAL_COUNT) {
      return err(
        "INVALID_REVEAL_COUNT",
        `Devem ser reveladas exatamente ${INITIAL_SETUP_REVEAL_COUNT} cartas.`,
      );
    }

    const revealed: RacingCard[] = [];
    for (const card of raw) {
      if (!isRacingCard(card)) {
        return err(
          "INVALID_RACING_CARD",
          "Somente cartas de corrida com valor 1 ou 2 são válidas.",
        );
      }
      revealed.push({ camelId: card.camelId, value: card.value });
    }

    const remaining = subtractRacingCards(official, revealed);
    if (!remaining) {
      return err(
        "INVALID_RACING_CARD",
        "As cartas reveladas devem ser um subconjunto do baralho oficial.",
      );
    }

    return ok({ revealed, remaining });
  }

  const shuffle =
    options?.shuffleRacingCards ??
    ((deck: RacingCard[]) => shuffleRacingCards(deck, options?.random ?? Math.random));
  const shuffled = shuffle(official);
  if (shuffled.length < INITIAL_SETUP_REVEAL_COUNT) {
    return err(
      "INVALID_REVEAL_COUNT",
      `Devem ser reveladas exatamente ${INITIAL_SETUP_REVEAL_COUNT} cartas.`,
    );
  }

  const revealed = shuffled
    .slice(0, INITIAL_SETUP_REVEAL_COUNT)
    .map((card) => ({ ...card }));
  const remaining = shuffled
    .slice(INITIAL_SETUP_REVEAL_COUNT)
    .map((card) => ({ ...card }));

  if (
    shuffled.length !== OFFICIAL_RACING_DECK_SIZE ||
    remaining.length !== OFFICIAL_RACING_DECK_SIZE - INITIAL_SETUP_REVEAL_COUNT ||
    !racingCardMultisetsEqual([...revealed, ...remaining], official)
  ) {
    return err(
      "INVALID_RACING_CARD",
      "O embaralhamento deve preservar o baralho oficial de 30 cartas.",
    );
  }

  return ok({ revealed, remaining });
}

export function racingCamelsAreAtStart(
  camels: ReadonlyArray<{ id: string; space: number }>,
): boolean {
  return camels
    .filter((camel) => camel.id !== "Crazy")
    .every((camel) => camel.space === START_SPACE);
}
