import { createMatch } from "./createMatch";
import { identityOrdering } from "./playerOrdering";
import { identityRacingCardOrdering } from "./racingCards";
import { startMatch } from "./startMatch";
import type { MatchState } from "./types";

export function buildValidCreatedMatch(): MatchState {
  const result = createMatch(
    {
      id: "m1",
      players: [
        { id: "h1", name: "Human", type: "Human" },
        { id: "b1", name: "Bot", type: "Bot", difficulty: "Easy" },
      ],
    },
    { ordering: identityOrdering },
  );
  if (!result.ok) throw new Error("failed to build created match");
  return result.value;
}

export function buildValidStartedMatch(): MatchState {
  const started = startMatch(buildValidCreatedMatch(), {
    shuffleRacingCards: identityRacingCardOrdering,
  });
  if (!started.ok) throw new Error("failed to build started match");
  return started.value;
}

export function buildValidFinishedMatch(): MatchState {
  return {
    ...buildValidStartedMatch(),
    phase: "Finished",
    currentLeg: 1,
  };
}
