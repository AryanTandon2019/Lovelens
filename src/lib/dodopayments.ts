// Dodo Payments configuration
//
// No backend or secret keys are needed on the frontend: we open Dodo Payments' overlay checkout
// using the client SDK, and verify the checkout events client-side.
//
// Configure NEXT_PUBLIC_DODO_CHECKOUT_URL in your .env.local file.

export const DODOPAYMENTS = {
  checkoutUrl: process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL ?? "",
};

export function isPaymentsConfigured(): boolean {
  return Boolean(DODOPAYMENTS.checkoutUrl);
}

// Affonso affiliate tracking configuration.
//
// Only the PUBLIC program ID is needed on the frontend — it identifies which
// affiliate program to attribute referrals to. Your Affonso <-> Dodo API key
// connection is configured entirely inside the Affonso dashboard and never
// touches this codebase.
//
// Configure NEXT_PUBLIC_AFFONSO_PROGRAM_ID in your .env.local file once you've
// created your program at affonso.io.
export const AFFONSO_PROGRAM_ID = process.env.NEXT_PUBLIC_AFFONSO_PROGRAM_ID ?? "";

export function isAffiliateTrackingConfigured(): boolean {
  return Boolean(AFFONSO_PROGRAM_ID);
}

/**
 * Reads the Affonso referral ID set by the tracking pixel (window.affonso_referral)
 * once a visitor has landed via a creator's referral link. Returns null if the
 * visitor wasn't referred, or if the pixel hasn't loaded yet.
 */
export function getAffonsoReferralId(): string | null {
  if (typeof window === "undefined") return null;
  const referral = (window as unknown as { affonso_referral?: string }).affonso_referral;
  return typeof referral === "string" && referral.length > 0 ? referral : null;
}

/**
 * Appends the Affonso referral metadata param to a Dodo Payments checkout URL,
 * if a referral is present. This is what lets Affonso attribute the sale back
 * to the referring creator for commission tracking.
 */
export function appendAffiliateReferral(checkoutUrl: string): string {
  const referralId = getAffonsoReferralId();
  if (!referralId) return checkoutUrl;

  const separator = checkoutUrl.includes("?") ? "&" : "?";
  return `${checkoutUrl}${separator}metadata_affonso_referral=${encodeURIComponent(referralId)}`;
}
