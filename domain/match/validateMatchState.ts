import {
  INITIAL_SETUP_REVEAL_COUNT,
  MAX_PLAYERS,
  MIN_MONEY,
  MIN_PLAYERS,
  OFFICIAL_RACING_DECK_SIZE,
  START_SPACE,
} from "./constants";
import { err, ok } from "./result";
import {
  createOfficialRacingDeck,
  isRacingCard,
  racingCardMultisetsEqual,
} from "./racingCards";
import {
  BOT_DIFFICULTIES,
  CAMEL_IDS,
  GAME_PHASES,
  type BotDifficulty,
  type CamelId,
  type CamelState,
  type DomainResult,
  type GamePhase,
  type MatchState,
  type Player,
  type RacingCard,
} from "./types";

function isGamePhase(value: unknown): value is GamePhase {
  return (
    typeof value === "string" &&
    (GAME_PHASES as readonly string[]).includes(value)
  );
}

function isBotDifficulty(value: unknown): value is BotDifficulty {
  return (
    typeof value === "string" &&
    (BOT_DIFFICULTIES as readonly string[]).includes(value)
  );
}

function isCamelId(value: unknown): value is CamelId {
  return (
    typeof value === "string" && (CAMEL_IDS as readonly string[]).includes(value)
  );
}

function validatePlayers(players: unknown): DomainResult<Player[]> {
  if (!Array.isArray(players)) {
    return err("INVALID_PLAYERS", "Lista de jogadores inválida.");
  }

  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    return err(
      "INVALID_PLAYER_COUNT",
      `A partida deve ter entre ${MIN_PLAYERS} e ${MAX_PLAYERS} jogadores.`,
    );
  }

  const ids = new Set<string>();
  let humanCount = 0;
  const normalized: Player[] = [];

  for (const raw of players) {
    if (!raw || typeof raw !== "object") {
      return err("INVALID_PLAYER", "Jogador inválido.");
    }
    const player = raw as Record<string, unknown>;
    if (typeof player.id !== "string" || !player.id) {
      return err("INVALID_PLAYER", "Jogador sem identificador.");
    }
    if (ids.has(player.id)) {
      return err("DUPLICATE_PLAYER_ID", "Identificadores duplicados.");
    }
    ids.add(player.id);

    if (typeof player.name !== "string") {
      return err("INVALID_PLAYER", "Jogador sem nome.");
    }

    if (typeof player.money !== "number" || !Number.isInteger(player.money)) {
      return err("INVALID_MONEY", "Dinheiro do jogador deve ser inteiro.");
    }
    if (player.money < MIN_MONEY) {
      return err(
        "INVALID_MONEY",
        `Dinheiro do jogador não pode ser inferior a ${MIN_MONEY}.`,
      );
    }

    if (player.type === "Human") {
      humanCount += 1;
      if ("difficulty" in player && player.difficulty !== undefined) {
        return err(
          "INVALID_PLAYER",
          "Jogador humano não deve ter dificuldade.",
        );
      }
      normalized.push({
        id: player.id,
        name: player.name,
        type: "Human",
        money: player.money,
      });
    } else if (player.type === "Bot") {
      if (!isBotDifficulty(player.difficulty)) {
        return err(
          "MISSING_BOT_DIFFICULTY",
          "Bot deve ter dificuldade Easy, Medium ou Hard.",
        );
      }
      normalized.push({
        id: player.id,
        name: player.name,
        type: "Bot",
        difficulty: player.difficulty,
        money: player.money,
      });
    } else {
      return err("INVALID_PLAYER", "Tipo de jogador inválido.");
    }
  }

  if (humanCount < 1) {
    return err(
      "MISSING_HUMAN",
      "A partida deve ter pelo menos um jogador humano.",
    );
  }

  return ok(normalized);
}

function validateCamels(camels: unknown): DomainResult<CamelState[]> {
  if (!Array.isArray(camels) || camels.length !== CAMEL_IDS.length) {
    return err(
      "INVALID_CAMELS",
      "O estado deve incluir exatamente os 6 camelos.",
    );
  }

  const seen = new Set<CamelId>();
  const stackKey = new Set<string>();
  const normalized: CamelState[] = [];

  for (const raw of camels) {
    if (!raw || typeof raw !== "object") {
      return err("INVALID_CAMEL", "Camelo inválido.");
    }
    const camel = raw as Record<string, unknown>;
    if (!isCamelId(camel.id)) {
      return err("INVALID_CAMEL", "Identidade de camelo inválida.");
    }
    if (seen.has(camel.id)) {
      return err("DUPLICATE_CAMEL", "Identidades de camelos duplicadas.");
    }
    seen.add(camel.id);

    if (typeof camel.space !== "number" || camel.space < 0) {
      return err("INVALID_POSITION", "Espaço do camelo inválido.");
    }
    if (typeof camel.stackOrder !== "number" || camel.stackOrder < 0) {
      return err("INVALID_STACK", "Ordem de pilha inválida.");
    }

    const key = `${camel.space}:${camel.stackOrder}`;
    if (stackKey.has(key)) {
      return err(
        "INVALID_STACK",
        "Dois camelos não podem compartilhar espaço e ordem de pilha.",
      );
    }
    stackKey.add(key);

    if (camel.direction !== "TowardFinish" && camel.direction !== "TowardStart") {
      return err("INVALID_DIRECTION", "Direção do camelo inválida.");
    }

    if (camel.id === "Crazy" && camel.direction !== "TowardStart") {
      return err(
        "INVALID_DIRECTION",
        "Crazy Camel deve ter direção TowardStart no estado válido desta US.",
      );
    }

    if (camel.id !== "Crazy" && camel.direction !== "TowardFinish") {
      return err(
        "INVALID_DIRECTION",
        "Camelos de corrida devem ter direção TowardFinish.",
      );
    }

    normalized.push({
      id: camel.id,
      space: camel.space,
      stackOrder: camel.stackOrder,
      direction: camel.direction,
    });
  }

  for (const id of CAMEL_IDS) {
    if (!seen.has(id)) {
      return err("INVALID_CAMELS", "Lista de camelos incompleta.");
    }
  }

  return ok(normalized);
}

function parseRacingCardList(value: unknown): DomainResult<RacingCard[]> {
  if (!Array.isArray(value)) {
    return err("INVALID_RACING_CARDS", "Lista de cartas de corrida inválida.");
  }
  const cards: RacingCard[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") {
      return err("INVALID_RACING_CARD", "Carta de corrida inválida.");
    }
    const card = raw as { camelId?: unknown; value?: unknown };
    if (typeof card.camelId !== "string" || typeof card.value !== "number") {
      return err("INVALID_RACING_CARD", "Carta de corrida inválida.");
    }
    const candidate = { camelId: card.camelId, value: card.value };
    if (!isRacingCard(candidate)) {
      return err(
        "INVALID_RACING_CARD",
        "Somente cartas de corrida com valor 1 ou 2 são válidas.",
      );
    }
    cards.push({ camelId: candidate.camelId, value: candidate.value });
  }
  return ok(cards);
}

function validateSetupCardFields(
  phase: GamePhase,
  raw: Record<string, unknown>,
): DomainResult<{
  setupRevealedRacingCards: RacingCard[] | null;
  remainingRacingCards: RacingCard[] | null;
}> {
  if (phase === "Created") {
    if (
      raw.setupRevealedRacingCards !== null &&
      raw.setupRevealedRacingCards !== undefined
    ) {
      return err(
        "INVALID_RACING_CARDS",
        "Em Created as cartas reveladas da preparação devem ser nulas.",
      );
    }
    if (
      raw.remainingRacingCards !== null &&
      raw.remainingRacingCards !== undefined
    ) {
      return err(
        "INVALID_RACING_CARDS",
        "Em Created o pool restante de cartas deve ser nulo.",
      );
    }
    return ok({
      setupRevealedRacingCards: null,
      remainingRacingCards: null,
    });
  }

  const revealedResult = parseRacingCardList(raw.setupRevealedRacingCards);
  if (!revealedResult.ok) return revealedResult;
  const remainingResult = parseRacingCardList(raw.remainingRacingCards);
  if (!remainingResult.ok) return remainingResult;

  const revealed = revealedResult.value;
  const remaining = remainingResult.value;

  if (revealed.length !== INITIAL_SETUP_REVEAL_COUNT) {
    return err(
      "INVALID_REVEAL_COUNT",
      `Devem ser reveladas exatamente ${INITIAL_SETUP_REVEAL_COUNT} cartas.`,
    );
  }
  if (
    remaining.length !==
    OFFICIAL_RACING_DECK_SIZE - INITIAL_SETUP_REVEAL_COUNT
  ) {
    return err(
      "INVALID_RACING_CARDS",
      "O pool restante deve conter 25 cartas de corrida.",
    );
  }

  const official = createOfficialRacingDeck();
  if (!racingCardMultisetsEqual([...revealed, ...remaining], official)) {
    return err(
      "INVALID_RACING_CARDS",
      "As cartas reveladas e o pool restante devem formar o baralho oficial.",
    );
  }

  return ok({
    setupRevealedRacingCards: revealed,
    remainingRacingCards: remaining,
  });
}

export function validateMatchState(input: unknown): DomainResult<MatchState> {
  if (!input || typeof input !== "object") {
    return err("INVALID_STATE", "Estado da partida inválido.");
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.id !== "string" || !raw.id) {
    return err("INVALID_STATE", "Partida sem identificador.");
  }

  if (!isGamePhase(raw.phase)) {
    return err("INVALID_PHASE", "Fase da partida desconhecida ou inválida.");
  }

  const playersResult = validatePlayers(raw.players);
  if (!playersResult.ok) return playersResult;

  const camelsResult = validateCamels(raw.camels);
  if (!camelsResult.ok) return camelsResult;

  if (raw.phase === "Created") {
    if (camelsResult.value.some((camel) => camel.space !== START_SPACE)) {
      return err(
        "CAMELS_NOT_AT_START",
        "Em Created todos os camelos devem estar no espaço 0.",
      );
    }
  }

  const cardsResult = validateSetupCardFields(raw.phase, raw);
  if (!cardsResult.ok) return cardsResult;

  if (
    raw.currentTurnPlayerId !== null &&
    typeof raw.currentTurnPlayerId !== "string"
  ) {
    return err("INVALID_TURN", "Turno atual inválido.");
  }

  if (raw.phase === "Created" && raw.currentTurnPlayerId !== null) {
    return err("INVALID_TURN", "Em Created o turno deve ser nulo.");
  }

  if (raw.phase === "RaceSetup" || raw.phase === "LegInProgress") {
    if (
      typeof raw.currentTurnPlayerId !== "string" ||
      !playersResult.value.some((p) => p.id === raw.currentTurnPlayerId)
    ) {
      return err(
        "INVALID_TURN",
        `Em ${raw.phase} o turno deve referenciar um jogador existente.`,
      );
    }
  }

  if (typeof raw.currentLeg !== "number" || !Number.isInteger(raw.currentLeg)) {
    return err("INVALID_LEG", "Número da perna inválido.");
  }

  if (raw.phase === "Created" || raw.phase === "RaceSetup") {
    if (raw.currentLeg !== 0) {
      return err(
        "INVALID_LEG",
        "Em Created/RaceSetup o número da perna deve ser 0.",
      );
    }
  } else if (raw.currentLeg < 1) {
    return err(
      "INVALID_LEG",
      "A partir do ciclo de pernas, currentLeg deve ser >= 1.",
    );
  }

  let playerRoundIndex = 0;
  if (raw.playerRoundIndex !== undefined) {
    if (
      typeof raw.playerRoundIndex !== "number" ||
      !Number.isInteger(raw.playerRoundIndex) ||
      raw.playerRoundIndex < 0
    ) {
      return err(
        "INVALID_PLAYER_ROUND_INDEX",
        "playerRoundIndex deve ser um inteiro >= 0.",
      );
    }
    playerRoundIndex = raw.playerRoundIndex;
  }

  return ok({
    id: raw.id,
    phase: raw.phase,
    players: playersResult.value,
    camels: camelsResult.value,
    currentTurnPlayerId: raw.currentTurnPlayerId as string | null,
    currentLeg: raw.currentLeg,
    playerRoundIndex,
    setupRevealedRacingCards: cardsResult.value.setupRevealedRacingCards,
    remainingRacingCards: cardsResult.value.remainingRacingCards,
  });
}
