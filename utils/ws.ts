export function isValidWsEndpoint(s: string): boolean {
  const v = (s || "").trim();
  return v.startsWith("ws://") || v.startsWith("wss://");
}

export function safeJsonValidateMaybe(text: string): { ok: boolean; reason?: string } {
  const t = (text || "").trim();
  if (!t) return { ok: true };
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      JSON.parse(t);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, reason: e?.message ?? "Invalid JSON" };
    }
  }
  return { ok: true };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
