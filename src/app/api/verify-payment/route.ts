// Server-side check of a LoveLens purchase. The report itself is computed in the browser (that's the privacy
// promise), so this route only answers one question: did this payment really happen, for this product?
//
// POST { payment_id: "pay_..." }  -> asks Dodo Payments (GET /payments/{id}, Bearer DODO_PAYMENTS_API_KEY) whether the
//                                     payment succeeded and its cart holds a LoveLens product (the product ids are read
//                                     from the two checkout links, NEXT_PUBLIC_DODO_CHECKOUT_URL and ..._IN).
// POST { code: "..." }            -> checks optional VIP / gift codes kept only on the server (LOVELENS_VIP_CODES,
//                                     comma-separated). Nothing secret is ever sent to the browser.
//
// Env: DODO_PAYMENTS_API_KEY (required for payment checks), DODO_PAYMENTS_ENV ("test" for test mode; live otherwise).

const LIVE = "https://live.dodopayments.com";
const TEST = "https://test.dodopayments.com";

function lovelensProductIds(): string[] {
  const urls = [process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL || "", process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL_IN || ""];
  const ids = urls.flatMap((u) => u.match(/pdt_[A-Za-z0-9]+/g) || []);
  return Array.from(new Set(ids));
}

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let body: { payment_id?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ valid: false, reason: "bad_request" }, 400);
  }

  const code = typeof body.code === "string" ? body.code.trim().toLowerCase() : "";
  if (code) {
    const codes = (process.env.LOVELENS_VIP_CODES || "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    return json({ valid: codes.length > 0 && codes.includes(code), kind: "code" });
  }

  const paymentId = typeof body.payment_id === "string" ? body.payment_id.trim() : "";
  if (!/^pay_[A-Za-z0-9]{6,80}$/.test(paymentId)) {
    return json({ valid: false, reason: "format" });
  }

  const key = process.env.DODO_PAYMENTS_API_KEY;
  if (!key) {
    return json({ valid: false, configured: false, reason: "not_configured" });
  }

  const base = process.env.DODO_PAYMENTS_ENV === "test" ? TEST : LIVE;
  let res: Response;
  try {
    res = await fetch(`${base}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
  } catch {
    return json({ valid: false, configured: true, reason: "upstream_unreachable" }, 502);
  }
  if (res.status === 404) return json({ valid: false, configured: true, reason: "not_found" });
  if (!res.ok) return json({ valid: false, configured: true, reason: `upstream_${res.status}` }, 502);

  const payment = (await res.json().catch(() => null)) as {
    status?: string | null;
    product_cart?: { product_id?: string }[] | null;
  } | null;
  if (!payment) return json({ valid: false, configured: true, reason: "upstream_bad_json" }, 502);

  if (payment.status !== "succeeded") {
    return json({ valid: false, configured: true, reason: "status", status: payment.status ?? null });
  }
  const ours = lovelensProductIds();
  const cart = Array.isArray(payment.product_cart) ? payment.product_cart.map((i) => i?.product_id) : [];
  if (ours.length > 0 && !cart.some((id) => typeof id === "string" && ours.includes(id))) {
    return json({ valid: false, configured: true, reason: "product" });
  }
  return json({ valid: true, configured: true });
}
