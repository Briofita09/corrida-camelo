import {
  INITIAL_MONEY,
  MAX_PLAYERS,
  MIN_PLAYERS,
  START_SPACE,
} from "./constants";
import { err, ok } from "./result";
import {
  createRandomOrdering,
  type CreateMatchOptions,
} from "./playerOrdering";
import {
  BOT_DIFFICULTIES,
  CAMEL_IDS,
  type BotDifficulty,
  type CamelState,
  type CreateMatchConfig,
  type CreateMatchPlayerInput,
  type DomainResult,
  type MatchState,
  type Player,
} from "./types";

function isBotDifficulty(value: unknown): value is BotDifficulty {
  return (
    typeof value === "string" &&
    (BOT_DIFFICULTIES as readonly string[]).includes(value)
  );
}

function validateCreateConfig(
  config: CreateMatchConfig,
): DomainResult<CreateMatchConfig> {
  const { players } = config;

  if (!Array.isArray(players) || players.length === 0) {
    return err("INVALID_PLAYER_COUNT", "A partida deve ter jogadores.");
  }

  if (players.length < MIN_PLAYERS) {
    return err(
      "INVALID_PLAYER_COUNT",
      `A partida deve ter no mínimo ${MIN_PLAYERS} jogadores.`,
    );
  }

  if (players.length > MAX_PLAYERS) {
    return err(
      "INVALID_PLAYER_COUNT",
      `A partida deve ter no máximo ${MAX_PLAYERS} jogadores.`,
    );
  }

  const humanCount = players.filter((p) => p.type === "Human").length;
  if (humanCount < 1) {
    return err(
      "MISSING_HUMAN",
      "A partida deve ter pelo menos um jogador humano.",
    );
  }

  const ids = new Set<string>();
  for (const player of players) {
    if (!player.id || ids.has(player.id)) {
      return err(
        "DUPLICATE_PLAYER_ID",
        "Identificadores de jogadores devem ser únicos.",
      );
    }
    ids.add(player.id);

    if (player.type === "Bot") {
      if (!isBotDifficulty(player.difficulty)) {
        return err(
          "MISSING_BOT_DIFFICULTY",
          "Cada bot deve ter dificuldade Easy, Medium ou Hard.",
        );
      }
    }
  }

  return ok(config);
}

function toPlayers(inputs: CreateMatchPlayerInput[]): Player[] {
  return inputs.map((input) => {
    if (input.type === "Human") {
      return {
        id: input.id,
        name: input.name,
        type: "Human",
        money: INITIAL_MONEY,
      };
    }
    return {
      id: input.id,
      name: input.name,
      type: "Bot",
      difficulty: input.difficulty as BotDifficulty,
      money: INITIAL_MONEY,
    };
  });
}

function initialCamels(): CamelState[] {
  return CAMEL_IDS.map((id, index) => ({
    id,
    space: START_SPACE,
    stackOrder: index,
    direction: id === "Crazy" ? "TowardStart" : "TowardFinish",
  }));
}

export function createMatch(
  config: CreateMatchConfig,
  options?: CreateMatchOptions,
): DomainResult<MatchState> {
  const validation = validateCreateConfig(config);
  if (!validation.ok) {
    return validation;
  }

  const random = options?.random ?? Math.random;
  const ordering = options?.ordering ?? createRandomOrdering();
  const orderedInputs = ordering.order(config.players, random);

  return ok({
    id: config.id,
    phase: "Created",
    players: toPlayers(orderedInputs),
    camels: initialCamels(),
    currentTurnPlayerId: null,
    currentLeg: 0,
    playerRoundIndex: 0,
    setupRevealedRacingCards: null,
    remainingRacingCards: null,
  });
}
