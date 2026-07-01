"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Lock, KeyRound, ShieldCheck, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { isPaymentsConfigured, DODOPAYMENTS, appendAffiliateReferral } from "../lib/dodopayments";

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

  // Handle Dodo message events and storage events (cross-tab sync)
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin.includes("dodopayments.com")) {
        const payload = event.data;
        const eventType = payload?.event_type || payload?.event;

        if (
          eventType === "checkout.success" ||
          eventType === "payment.succeeded" ||
          (eventType === "checkout.status" && payload?.data?.status === "succeeded")
        ) {
          try {
            localStorage.setItem("lovelens_unlocked_v1", "true");
            if (payload?.data?.checkout_id) {
              localStorage.setItem("lovelens_license", payload.data.checkout_id);
            }
          } catch {
            /* ignore */
          }
          finishUnlock();
        }
      }
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
      setError("Please paste your checkout ID or transaction reference.");
      return;
    }
    setState("processing");

    // Standard client-side bypass check for offline purchase recovery or testing
    const bypassCode = process.env.NEXT_PUBLIC_DODO_BYPASS_CODE || "lovelens_vip";
    const keyLower = key.toLowerCase();
    if (
      keyLower === bypassCode.toLowerCase() ||
      keyLower.startsWith("cks_") ||
      keyLower.startsWith("pay_") ||
      keyLower.startsWith("pdt_") ||
      keyLower.startsWith("dis_") ||
      keyLower.startsWith("ref_") ||
      keyLower.startsWith("sub_")
    ) {
      setTimeout(() => {
        try {
          localStorage.setItem("lovelens_unlocked_v1", "true");
          localStorage.setItem("lovelens_license", key);
        } catch {
          /* ignore */
        }
        finishUnlock();
      }, 1000);
    } else {
      setTimeout(() => {
        setState("idle");
        setError("That reference doesn't appear to be a valid Dodo checkout session.");
      }, 1000);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm">
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative w-full max-w-[min(420px,calc(100vw-1.5rem))] overflow-hidden rounded-3xl bg-white shadow-2xl my-auto">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-rose-100/50 bg-rose-50/30 px-5 sm:px-6 py-4">
            <div className="flex items-center gap-1.5">
              <img src="/lovelens_logo.png" alt="LoveLens Logo" className="h-5 w-5 object-contain rounded" />
              <h3 className="text-sm font-black tracking-tight text-slate-800 uppercase">Unlock Premium</h3>
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
              <div className="text-center bg-gradient-to-r from-rose-50 to-indigo-50 border border-rose-100/30 p-4 rounded-2xl">
                <span className="text-[9px] font-black tracking-widest text-rose-500 uppercase block mb-1">Premium Upgrade</span>
                <h4 className="text-base font-black text-slate-800">Find out who&apos;s more into who 💘</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-1 leading-normal">
                  Unlock the Interest Balance verdict, who said &quot;I love you&quot; first, who chases more, the longest silence,
                  flag audits + a shareable card. One payment, lifetime access on this device.
                </p>
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  <span className="text-xs text-slate-400 line-through font-semibold">{price.includes("$") ? "$9.99" : "₹499"}</span>
                  <span className="text-lg font-black text-rose-500">{price}</span>
                  <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full">Save 50%</span>
                </div>
              </div>

              {configured ? (
                <>
                  <button
                    onClick={openCheckout}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-400 hover:opacity-95 py-4 px-4 font-black text-sm text-white shadow-lg shadow-rose-200 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Lock size={16} /> Pay {price} {"&"} unlock instantly
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium text-center leading-relaxed">
                    You'll be redirected to a secure checkout. After payment you'll return here automatically with your report unlocked.
                  </p>

                  {/* Fallback for people who paid elsewhere / on another device */}
                  {!showKeyEntry ? (
                    <button
                      onClick={() => setShowKeyEntry(true)}
                      className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors underline"
                    >
                      Already purchased? Restore access reference
                    </button>
                  ) : (
                    <form onSubmit={handleValidate} className="pt-1">
                      <div className="relative">
                        <input
                          type="text"
                          value={licenseKey}
                          onChange={(e) => setLicenseKey(e.target.value)}
                          placeholder="Paste checkout ID or reference"
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
              <div className="flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-center">
                <ShieldCheck size={16} className="text-green-500" />
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Secured by Dodo Payments · taxes included
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}
