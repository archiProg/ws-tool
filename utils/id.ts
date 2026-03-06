export function makeId(prefix: string = "id"): string {
  // no native deps; good enough for local ids
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
