export { createMatchConfig, discardMatchConfig } from "./createMatchConfig";
export { setMatchMode } from "./setMatchMode";
export {
  addParticipant,
  removeParticipant,
  updateParticipant,
} from "./participants";
export { validateMatchConfig } from "./validateMatchConfig";
export { createMatchFromConfig } from "./createMatchFromConfig";
export { normalizeNameKey, isBlankName } from "./names";
export type {
  AddParticipantInput,
  ConfigBotParticipant,
  ConfigHumanParticipant,
  ConfigParticipant,
  DomainResult,
  MatchConfig,
  MatchMode,
} from "./types";
