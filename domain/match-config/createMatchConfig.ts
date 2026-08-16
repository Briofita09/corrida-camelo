import { ok } from "@/domain/match/result";
import type { DomainResult, MatchConfig } from "./types";

let configSeq = 0;

export function createMatchConfig(id?: string): DomainResult<MatchConfig> {
  configSeq += 1;
  return ok({
    id: id ?? `config-${configSeq}`,
    mode: null,
    participants: [],
  });
}

export function discardMatchConfig(
  config: MatchConfig,
): DomainResult<MatchConfig> {
  void config;
  return createMatchConfig();
}
