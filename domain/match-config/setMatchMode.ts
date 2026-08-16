import { ok } from "@/domain/match/result";
import type { DomainResult, MatchConfig, MatchMode } from "./types";

export function setMatchMode(
  config: MatchConfig,
  mode: MatchMode,
): DomainResult<MatchConfig> {
  const clearingParticipants = config.mode !== null;

  return ok({
    ...config,
    mode,
    participants: clearingParticipants ? [] : [...config.participants],
  });
}
