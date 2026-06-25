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
