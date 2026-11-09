// Google Analytics 4 events for the conversion funnel.
//
// The GA4 tag is loaded in app/layout.tsx (window.gtag). These helpers send the funnel steps so the GA4 reports show
// where visitors drop off: landing -> chat file chosen -> report generated -> paywall opened -> checkout started ->
// purchase. GA4 counts "purchase" (with value and currency) as revenue and marks it as a key event by default.

type Params = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Params = {}): void {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, params);
    }
  } catch {
    /* analytics must never break the app */
  }
}

/** "₹249" -> { value: 249, currency: "INR" }, "$4.99" -> { value: 4.99, currency: "USD" } */
export function priceToValue(price: string): { value: number; currency: string } {
  const value = parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
  const currency = price.includes("₹") ? "INR" : "USD";
  return { value, currency };
}

const PENDING_PRICE_KEY = "lovelens_pending_price";
const TRACKED_KEY = "lovelens_purchase_tracked";

/** Remember the price shown when checkout started, so the purchase can be valued after the redirect back. */
export function rememberCheckoutPrice(price: string): void {
  try {
    localStorage.setItem(PENDING_PRICE_KEY, price);
  } catch {
    /* ignore */
  }
}

/** Send one GA4 purchase per payment id (a refresh of the return page must not count twice). */
export function trackPurchaseOnce(paymentId: string, fallbackPrice: string): void {
  try {
    if (!paymentId || localStorage.getItem(TRACKED_KEY) === paymentId) return;
    const price = localStorage.getItem(PENDING_PRICE_KEY) || fallbackPrice;
    const { value, currency } = priceToValue(price);
    track("purchase", {
      transaction_id: paymentId,
      value,
      currency,
      items: [{ item_id: "lovelens_full_report", item_name: "LoveLens full report", price: value, quantity: 1 }],
    });
    localStorage.setItem(TRACKED_KEY, paymentId);
    localStorage.removeItem(PENDING_PRICE_KEY);
  } catch {
    /* ignore */
  }
}
