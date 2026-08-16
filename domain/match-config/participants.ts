import { BOT_DIFFICULTIES } from "@/domain/match";
import { err, ok } from "@/domain/match/result";
import { isBlankName, normalizeNameKey } from "./names";
import type {
  AddParticipantInput,
  ConfigParticipant,
  DomainResult,
  MatchConfig,
} from "./types";

let participantSeq = 0;

function nextParticipantId(): string {
  participantSeq += 1;
  return `participant-${participantSeq}`;
}

function isValidDifficulty(value: unknown): boolean {
  return (
    typeof value === "string" &&
    (BOT_DIFFICULTIES as readonly string[]).includes(value)
  );
}

function requireMode(config: MatchConfig): DomainResult<MatchConfig> {
  if (config.mode === null) {
    return err(
      "MODE_REQUIRED",
      "Defina o modo da partida antes de gerenciar jogadores.",
    );
  }
  return ok(config);
}

function nameTaken(
  participants: ConfigParticipant[],
  name: string,
  exceptId?: string,
): boolean {
  const key = normalizeNameKey(name);
  return participants.some(
    (p) => p.id !== exceptId && normalizeNameKey(p.name) === key,
  );
}

export function addParticipant(
  config: MatchConfig,
  input: AddParticipantInput,
): DomainResult<MatchConfig> {
  const modeCheck = requireMode(config);
  if (!modeCheck.ok) return modeCheck;

  if (isBlankName(input.name)) {
    return err("EMPTY_NAME", "O nome do jogador não pode ser vazio.");
  }

  const trimmed = input.name.trim();
  if (nameTaken(config.participants, trimmed)) {
    return err("DUPLICATE_NAME", "Já existe um jogador com este nome.");
  }

  if (input.type === "Bot" && !isValidDifficulty(input.difficulty)) {
    return err(
      "MISSING_BOT_DIFFICULTY",
      "Cada bot deve ter dificuldade Easy, Medium ou Hard.",
    );
  }

  const participant: ConfigParticipant =
    input.type === "Human"
      ? { id: nextParticipantId(), name: trimmed, type: "Human" }
      : {
          id: nextParticipantId(),
          name: trimmed,
          type: "Bot",
          difficulty: input.difficulty,
        };

  return ok({
    ...config,
    participants: [...config.participants, participant],
  });
}

export function removeParticipant(
  config: MatchConfig,
  participantId: string,
): DomainResult<MatchConfig> {
  const modeCheck = requireMode(config);
  if (!modeCheck.ok) return modeCheck;

  if (!config.participants.some((p) => p.id === participantId)) {
    return err("PARTICIPANT_NOT_FOUND", "Participante não encontrado.");
  }

  return ok({
    ...config,
    participants: config.participants.filter((p) => p.id !== participantId),
  });
}

export function updateParticipant(
  config: MatchConfig,
  participantId: string,
  input: AddParticipantInput,
): DomainResult<MatchConfig> {
  const modeCheck = requireMode(config);
  if (!modeCheck.ok) return modeCheck;

  const index = config.participants.findIndex((p) => p.id === participantId);
  if (index < 0) {
    return err("PARTICIPANT_NOT_FOUND", "Participante não encontrado.");
  }

  if (isBlankName(input.name)) {
    return err("EMPTY_NAME", "O nome do jogador não pode ser vazio.");
  }

  const trimmed = input.name.trim();
  if (nameTaken(config.participants, trimmed, participantId)) {
    return err("DUPLICATE_NAME", "Já existe um jogador com este nome.");
  }

  if (input.type === "Bot" && !isValidDifficulty(input.difficulty)) {
    return err(
      "MISSING_BOT_DIFFICULTY",
      "Cada bot deve ter dificuldade Easy, Medium ou Hard.",
    );
  }

  const updated: ConfigParticipant =
    input.type === "Human"
      ? { id: participantId, name: trimmed, type: "Human" }
      : {
          id: participantId,
          name: trimmed,
          type: "Bot",
          difficulty: input.difficulty,
        };

  const participants = config.participants.map((p, i) =>
    i === index ? updated : p,
  );

  return ok({ ...config, participants });
}
