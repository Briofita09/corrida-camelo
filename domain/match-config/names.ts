export function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function isBlankName(name: string): boolean {
  return name.trim().length === 0;
}
