// app/util/cn.ts (simple, zéro any)
export function cn(...parts: ReadonlyArray<string | undefined | null | false>): string {
  return parts.filter(Boolean).join(" ");
}