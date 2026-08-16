export const GAME_PHASES = [
  "Created",
  "RaceSetup",
  "LegSetup",
  "LegInProgress",
  "LegPayout",
  "FinalPayout",
  "Finished",
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];

export const BOT_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export type BotDifficulty = (typeof BOT_DIFFICULTIES)[number];

export const CAMEL_IDS = [
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Red",
  "Crazy",
] as const;
export type CamelId = (typeof CAMEL_IDS)[number];

export type CamelDirection = "TowardFinish" | "TowardStart";

export type HumanPlayer = {
  id: string;
  name: string;
  type: "Human";
  money: number;
};

export type BotPlayer = {
  id: string;
  name: string;
  type: "Bot";
  difficulty: BotDifficulty;
  money: number;
};

export type Player = HumanPlayer | BotPlayer;

export type CamelState = {
  id: CamelId;
  space: number;
  stackOrder: number;
  direction: CamelDirection;
};

export type MatchState = {
  id: string;
  phase: GamePhase;
  players: Player[];
  camels: CamelState[];
  currentTurnPlayerId: string | null;
  currentLeg: number;
  /** Índice da rodada de jogadores (deslocamento sobre a ordem base em `players`). */
  playerRoundIndex: number;
};

export type CreateMatchPlayerInput =
  | { id: string; name: string; type: "Human" }
  | { id: string; name: string; type: "Bot"; difficulty?: BotDifficulty };

export type CreateMatchConfig = {
  id: string;
  players: CreateMatchPlayerInput[];
};

export type DomainError = {
  code: string;
  message: string;
};

export type DomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };
