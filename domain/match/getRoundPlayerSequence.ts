/**
 * Sequência de jogadores na rodada `roundIndex` a partir da ordem base.
 * Não muta o array de entrada.
 */
export function getRoundPlayerSequence<T>(
  players: readonly T[],
  roundIndex: number,
): T[] {
  const n = players.length;
  if (n === 0) return [];

  const start = ((roundIndex % n) + n) % n;
  const sequence: T[] = [];
  for (let i = 0; i < n; i += 1) {
    sequence.push(players[(start + i) % n] as T);
  }
  return sequence;
}
