import { createMatch } from "./createMatch";
import type { MatchState } from "./types";

export function buildValidCreatedMatch(): MatchState {
  const result = createMatch({
    id: "m1",
    players: [
      { id: "h1", name: "Human", type: "Human" },
      { id: "b1", name: "Bot", type: "Bot", difficulty: "Easy" },
    ],
  });
  if (!result.ok) throw new Error("failed to build created match");
  return result.value;
}

export function buildValidFinishedMatch(): MatchState {
  return {
    ...buildValidCreatedMatch(),
    phase: "Finished",
    currentLeg: 1,
  };
}
