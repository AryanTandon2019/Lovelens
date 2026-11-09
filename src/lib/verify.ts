// Client helper for /api/verify-payment. Retries briefly, because right after the redirect back from checkout a
// payment can still be settling on Dodo's side.

export type Verdict = { valid: boolean; configured?: boolean; reason?: string };

export async function verifyUnlock(input: { payment_id?: string; code?: string }, tries = 3): Promise<Verdict> {
  let last: Verdict = { valid: false, reason: "network" };
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        cache: "no-store",
      });
      last = (await res.json()) as Verdict;
      const retryable = !last.valid && (last.reason === "status" || (last.reason || "").startsWith("upstream"));
      if (!retryable) return last;
    } catch {
      last = { valid: false, reason: "network" };
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return last;
}
