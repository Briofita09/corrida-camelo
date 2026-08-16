import { MAX_PLAYERS, MIN_PLAYERS } from "@/domain/match";
import { err, ok } from "@/domain/match/result";
import type { DomainResult, MatchConfig } from "./types";

export function validateMatchConfig(
  config: MatchConfig,
): DomainResult<MatchConfig> {
  if (config.mode === null) {
    return err("MODE_REQUIRED", "A configuração precisa de um modo.");
  }

  const { participants, mode } = config;
  const total = participants.length;

  if (total < MIN_PLAYERS) {
    return err(
      "INVALID_PLAYER_COUNT",
      `A partida deve ter no mínimo ${MIN_PLAYERS} jogadores.`,
    );
  }

  if (total > MAX_PLAYERS) {
    return err(
      "INVALID_PLAYER_COUNT",
      `A partida deve ter no máximo ${MAX_PLAYERS} jogadores.`,
    );
  }

  const humans = participants.filter((p) => p.type === "Human");
  const bots = participants.filter((p) => p.type === "Bot");

  if (humans.length < 1) {
    return err(
      "MISSING_HUMAN",
      "A partida deve ter pelo menos um jogador humano.",
    );
  }

  if (mode === "SinglePlayerVsBots") {
    if (humans.length !== 1) {
      return err(
        "INVALID_SINGLE_PLAYER",
        "Single-player exige exatamente um jogador humano.",
      );
    }
    if (bots.length < 1) {
      return err(
        "INVALID_SINGLE_PLAYER",
        "Single-player exige pelo menos um bot.",
      );
    }
  }

  if (mode === "PassAndPlay") {
    if (humans.length < 2) {
      return err(
        "INVALID_PASS_AND_PLAY",
        "Pass-and-play exige pelo menos dois jogadores humanos.",
      );
    }
  }

  return ok(config);
}
