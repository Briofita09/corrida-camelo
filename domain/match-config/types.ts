import type { BotDifficulty, DomainResult } from "@/domain/match";

export type MatchMode = "SinglePlayerVsBots" | "PassAndPlay";

export type ConfigHumanParticipant = {
  id: string;
  name: string;
  type: "Human";
};

export type ConfigBotParticipant = {
  id: string;
  name: string;
  type: "Bot";
  difficulty: BotDifficulty;
};

export type ConfigParticipant = ConfigHumanParticipant | ConfigBotParticipant;

export type MatchConfig = {
  id: string;
  mode: MatchMode | null;
  participants: ConfigParticipant[];
};

export type AddParticipantInput =
  | { name: string; type: "Human" }
  | { name: string; type: "Bot"; difficulty: BotDifficulty };

export type { BotDifficulty, DomainResult };
