import {
  createMatch,
  type CreateMatchOptions,
  type CreateMatchPlayerInput,
  type MatchState,
} from "@/domain/match";
import { err, ok } from "@/domain/match/result";
import type { DomainResult, MatchConfig } from "./types";
import { validateMatchConfig } from "./validateMatchConfig";

export function createMatchFromConfig(
  config: MatchConfig,
  matchId?: string,
  options?: CreateMatchOptions,
): DomainResult<MatchState> {
  const validation = validateMatchConfig(config);
  if (!validation.ok) return validation;

  const players: CreateMatchPlayerInput[] = config.participants.map(
    (p, index) => {
      const id = `p-${index + 1}`;
      if (p.type === "Human") {
        return { id, name: p.name, type: "Human" };
      }
      return {
        id,
        name: p.name,
        type: "Bot",
        difficulty: p.difficulty,
      };
    },
  );

  const result = createMatch(
    {
      id: matchId ?? `match-from-${config.id}`,
      players,
    },
    options,
  );

  if (!result.ok) {
    return err(result.error.code, result.error.message);
  }

  return ok(result.value);
}
