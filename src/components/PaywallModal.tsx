"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Lock, KeyRound, ShieldCheck, CheckCircle2, Sparkles, Loader2, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { isPaymentsConfigured, DODOPAYMENTS, appendAffiliateReferral } from "../lib/dodopayments";
import { track, priceToValue, rememberCheckoutPrice } from "../lib/analytics";
import { verifyUnlock } from "../lib/verify";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  price?: string;
  checkoutUrl?: string;
}

export default function PaywallModal({ isOpen, onClose, onSuccess, price = "₹249", checkoutUrl }: PaywallModalProps) {
  const [state, setState] = useState<"idle" | "processing" | "success">("idle");
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showKeyEntry, setShowKeyEntry] = useState(false);

  // Funnel: the paywall was shown
  useEffect(() => {
    if (isOpen) track("paywall_open", priceToValue(price));
  }, [isOpen, price]);

  // Handle Dodo message events and storage events (cross-tab sync)
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      // Only Dodo's own pages, and only a payment the server confirms with Dodo, can unlock.
      if (!/^https:\/\/([a-z0-9-]+\.)*dodopayments\.com$/.test(event.origin)) return;
      const payload = event.data;
      const eventType = payload?.event_type || payload?.event;
      const paymentId: string = payload?.data?.payment_id || "";
      const looksPaid =
        eventType === "checkout.success" ||
        eventType === "payment.succeeded" ||
        (eventType === "checkout.status" && payload?.data?.status === "succeeded");
      if (!looksPaid || !paymentId) return;
      setState("processing");
      void verifyUnlock({ payment_id: paymentId }).then((verdict) => {
        if (!verdict.valid) {
          setState("idle");
          setError("We couldn't confirm that payment yet. Use \"Already purchased?\" with the payment ID from your receipt.");
          return;
        }
        try {
          localStorage.setItem("lovelens_unlocked_v1", "true");
          localStorage.setItem("lovelens_license", paymentId);
        } catch {
          /* ignore */
        }
        finishUnlock();
      });
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lovelens_unlocked_v1" && e.newValue === "true") {
        finishUnlock();
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [isOpen]);

  // Polling fallback to check localStorage for unlock status (handles background tab suspensions on mobile)
  useEffect(() => {
    if (state !== "processing" || !isOpen) return;

    const interval = setInterval(() => {
      try {
        if (localStorage.getItem("lovelens_unlocked_v1") === "true") {
          clearInterval(interval);
          finishUnlock();
        }
      } catch {
        /* ignore */
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state, isOpen]);

  if (!isOpen) return null;

  const activeCheckoutUrl = checkoutUrl || DODOPAYMENTS.checkoutUrl;
  const configured = Boolean(activeCheckoutUrl);

  const finishUnlock = () => {
    setState("success");
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF4E88", "#8B5CF6", "#10B981"],
    });
    setTimeout(() => {
      onSuccess();
      onClose();
      setState("idle");
      setLicenseKey("");
      setError(null);
      setShowKeyEntry(false);
    }, 1500);
  };

  const openCheckout = () => {
    if (activeCheckoutUrl) {
      // Funnel: checkout started (GA4's recommended event), and keep the price for the purchase event on return
      track("begin_checkout", priceToValue(price));
      rememberCheckoutPrice(price);
      // Build a redirect URL so Dodo sends the user back after payment
      const redirectUrl = window.location.origin + window.location.pathname + "?status=succeeded";
      const separator = activeCheckoutUrl.includes("?") ? "&" : "?";
      let fullUrl = `${activeCheckoutUrl}${separator}redirect_url=${encodeURIComponent(redirectUrl)}`;

      // If this visitor arrived via a creator's referral link, attach the
      // Affonso referral metadata so the sale is attributed to them for commission.
      fullUrl = appendAffiliateReferral(fullUrl);
      
      // Save current state so the report persists across the redirect
      try {
        // Stats are already saved in localStorage by page.tsx (SAVED_KEY)
        localStorage.setItem("lovelens_pending_payment", "true");
      } catch {
        /* ignore */
      }
      
      // Navigate in the same window for a reliable flow
      window.location.href = fullUrl;
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const key = licenseKey.trim();
    if (!key) {
      setError("Paste the payment ID from your receipt email (it starts with pay_).");
      return;
    }
    setState("processing");
    const isPayment = /^pay_/i.test(key);
    // Checked on the server: a payment with Dodo, or a VIP code kept only on the server. Nothing to guess here.
    const verdict = await verifyUnlock(isPayment ? { payment_id: key } : { code: key });
    if (verdict.valid) {
      try {
        localStorage.setItem("lovelens_unlocked_v1", "true");
        localStorage.setItem("lovelens_license", key);
      } catch {
        /* ignore */
      }
      track("unlock_restored", { kind: isPayment ? "payment" : "code" });
      finishUnlock();
      return;
    }
    setState("idle");
    if (verdict.configured === false) {
      setError("We can't check payments right now. Email hello@getlovelens.com with your receipt and we'll unlock it for you.");
    } else if (isPayment) {
      setError("We couldn't find a completed LoveLens payment with that ID. Check the payment ID in your receipt email.");
    } else {
      setError("That code isn't valid.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-[#20090f]/55 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-[min(420px,calc(100vw-1.5rem))] overflow-hidden rounded-[28px] bg-white shadow-[0_40px_80px_-30px_rgba(32,9,15,0.55)] my-auto">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(32,9,15,0.06)] px-5 sm:px-6 py-3.5">
            <div className="flex items-center gap-1.5">
              <img src="/lovelens_logo.png" alt="LoveLens Logo" className="h-5 w-5 object-contain rounded" />
              <h3 className="text-sm font-semibold tracking-tight text-[#20090f]">LoveLens</h3>
            </div>
            {state === "idle" && (
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Processing */}
          {state === "processing" && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[320px]">
              <div className="relative mb-6 h-16 w-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-rose-100" />
                <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
              </div>
              <h4 className="text-lg font-black text-slate-800 mb-1">Confirming your purchase</h4>
              <p className="text-xs font-semibold text-rose-500 animate-pulse mb-6">Waiting for payment to complete...</p>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all cursor-pointer"
              >
                Go back &amp; enter key manually
              </button>
            </div>
          )}

          {/* Success */}
          {state === "success" && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[320px] bg-green-50/20">
              <div className="mb-4 text-green-500 bg-green-50 border border-green-100 p-3 rounded-full animate-bounce">
                <CheckCircle2 size={44} className="fill-green-100" />
              </div>
              <h4 className="text-xl font-black text-green-600 mb-1">You're unlocked! 💘</h4>
              <p className="text-xs font-bold text-slate-500">Revealing your premium insights…</p>
            </div>
          )}

          {/* Idle */}
          {state === "idle" && (
            <div className="p-5 sm:p-6 space-y-5">
              {/* Value proposition */}
              <div className="text-center">
                <span className="eyebrow"><Sparkles size={12} className="text-[#e11d48]" /> Full report</span>
                <h4 className="font-display mt-3 text-[30px] leading-[1.05] text-[#20090f]">Find out who&apos;s more into who</h4>
                <p className="mt-2 text-sm text-[#6b4a56]">Everything in your chat, decoded. Unlocks on this device instantly.</p>
              </div>
              <ul className="space-y-2.5 rounded-2xl border border-[rgba(32,9,15,0.08)] bg-[#fdf7f5] p-4 text-left">
                {[
                  "The verdict: who's more invested, and by how much",
                  "Who said \"I love you\" first",
                  "Who chases more: double texts and longest silence",
                  "Red & green flags audit",
                  "Your honeymoon timeline and inside jokes",
                  "A shareable love card",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] font-medium text-[#20090f]">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-[#e11d48] text-white"><Check size={10} strokeWidth={3} /></span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-end justify-center gap-2">
                <span className="font-display text-[44px] leading-none text-[#20090f]">{price}</span>
                <span className="pb-1.5 text-xs font-semibold text-[#6b4a56]">one-time · no subscription</span>
              </div>

              {configured ? (
                <>
                  <button
                    onClick={openCheckout}
                    className="premium-btn-rose w-full flex items-center justify-center gap-2 rounded-2xl py-4 px-4 text-[15px] font-semibold cursor-pointer"
                  >
                    <Lock size={16} /> Unlock my full report
                  </button>
                  <p className="text-[11px] text-[#a78e97] font-medium text-center leading-relaxed">
                    Secure checkout, then you come straight back here with your report unlocked.
                  </p>

                  {/* Fallback for people who paid elsewhere / on another device */}
                  {!showKeyEntry ? (
                    <button
                      onClick={() => setShowKeyEntry(true)}
                      className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors underline"
                    >
                      Already purchased? Restore with your payment ID
                    </button>
                  ) : (
                    <form onSubmit={handleValidate} className="pt-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                          placeholder="Payment ID (pay_…) or access code"
                          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-base font-semibold focus:border-rose-400 focus:outline-none transition-all placeholder:text-slate-300"
                        />
                        <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      {error && <p className="mt-2 text-xs font-bold text-rose-500">⚠️ {error}</p>}
                      <button
                        type="submit"
                        className="mt-3 w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-900 py-3.5 px-4 font-black text-sm text-white active:scale-[0.98] transition-all"
                      >
                        <Sparkles size={15} /> Unlock my report
                      </button>
                    </form>
                  )}
                </>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-xs font-bold text-slate-500 bg-amber-50 border border-amber-100 rounded-2xl p-3">
                    Checkout isn&apos;t connected yet. Add your Dodo Payments buy link to{" "}
                    <code className="text-rose-500">NEXT_PUBLIC_DODO_CHECKOUT_URL</code> to go live.
                  </p>
                  {process.env.NODE_ENV !== "production" && (
                    <button
                      onClick={() => {
                        onClose();
                        onSuccess();
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-300 py-3 px-4 font-black text-sm text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <Loader2 size={15} /> Preview unlock (dev only)
                    </button>
                  )}
                </div>
              )}

              {/* Security stamp */}
              <div className="space-y-1.5 border-t border-[rgba(32,9,15,0.07)] pt-4 text-center text-[11px] font-medium text-[#6b4a56]">
                <p className="flex items-center justify-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" /> Secure checkout by Dodo Payments · taxes included</p>
                <p className="flex items-center justify-center gap-1.5"><Lock size={12} className="text-[#e11d48]" /> Your chat never leaves your device</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
