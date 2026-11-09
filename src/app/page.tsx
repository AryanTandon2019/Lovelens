"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  UploadCloud,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Clock,
  Lock,
  Trash2,
  Check,
  ArrowRight,
  X,
  ChevronDown,
  WifiOff,
} from "lucide-react";
import { parseWhatsAppChat, ChatStats } from "../utils/chatParser";
import { track, trackPurchaseOnce } from "../lib/analytics";
import { verifyUnlock } from "../lib/verify";

// Lazy-load heavy, post-upload UI so the landing page bundle stays small and fast.
const Dashboard = dynamic(() => import("../components/Dashboard"), {
  ssr: false,
});
const UploadTutorial = dynamic(() => import("../components/UploadTutorial"));

interface HistoryItem {
  id: string;
  names: string;
  date: string;
  messageCount: number;
  startDate: string;
  stats: ChatStats;
}

export default function Home() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSavedReport, setHasSavedReport] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [price, setPrice] = useState("₹249");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [inAppDismissed, setInAppDismissed] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SAVED_KEY = "lovelens_stats_v1";
  const HISTORY_KEY = "lovelens_history_v1";

  // Restore a previously analyzed report on load so a refresh doesn't wipe it. Also restore history list.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_KEY);
      if (saved) {
        setHasSavedReport(true);
      }

      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      /* ignore corrupt/unavailable storage */
    }
  }, []);

  // Back from checkout: Dodo adds ?payment_id=pay_...&status=succeeded. The payment is confirmed with Dodo on the
  // server before anything unlocks, so typing "?status=succeeded" into the address bar no longer gives premium away.
  useEffect(() => {
    let params: URLSearchParams;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }
    const status = params.get("status");
    const paymentId = params.get("payment_id") || "";
    if (!status && !paymentId) return;
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {
      /* ignore */
    }
    let cancelled = false;
    (async () => {
      const verdict = paymentId
        ? await verifyUnlock({ payment_id: paymentId })
        : { valid: false, reason: "no_payment_id" as string, configured: true };
      // Until DODO_PAYMENTS_API_KEY is set on the server, a Dodo payment id coming back from checkout is trusted as
      // before, so real buyers are never locked out by a missing setting.
      const fallback = verdict.configured === false && /^pay_[A-Za-z0-9]{6,80}$/.test(paymentId);
      if (cancelled) return;
      try {
        if (verdict.valid || fallback) {
          localStorage.setItem("lovelens_unlocked_v1", "true");
          localStorage.setItem("lovelens_license", paymentId);
          trackPurchaseOnce(paymentId, "$4.99");
          const saved = localStorage.getItem(SAVED_KEY);
          if (saved) setStats(JSON.parse(saved));
        } else {
          track("unlock_rejected", { reason: verdict.reason || "unknown" });
          setPaymentNotice(true);
        }
        localStorage.removeItem("lovelens_pending_payment");
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Regional pricing: India pays in INR, everyone else in USD. Decided by the country the visitor is in (Vercel's
  // edge header via /api/geo), not by the phone's language: an Indian phone set to "English (India)" in Dubai or
  // London should see $4.99. The device time zone is only the first guess while the lookup runs.
  useEffect(() => {
    const globalUrl = process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL || "";
    const indiaUrl = process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL_IN || globalUrl;
    const apply = (india: boolean) => {
      setPrice(india ? "₹249" : "$4.99");
      setCheckoutUrl(india ? indiaUrl : globalUrl);
    };
    let tzIndia = false;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      tzIndia = /Kolkata|Calcutta/.test(tz);
    } catch {
      /* ignore */
    }
    apply(tzIndia);

    const fromIpApi = () =>
      fetch("https://ipapi.co/json/")
        .then((r) => r.json())
        .then((d) => {
          if (typeof d?.country_code === "string") apply(d.country_code.toUpperCase() === "IN");
        });

    fetch("/api/geo", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const country = typeof d?.country === "string" ? d.country.toUpperCase() : "";
        if (country) apply(country === "IN");
        else return fromIpApi();
      })
      .catch(() => fromIpApi().catch(() => undefined));
  }, []);

  // Instagram / Facebook open links in their own browser, where picking a downloaded chat file can be awkward.
  useEffect(() => {
    try {
      setInAppBrowser(/Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent || ""));
    } catch {
      /* ignore */
    }
  }, []);

  // Persist the report whenever it changes (clearing is explicit, via discard).
  useEffect(() => {
    if (!stats) return;
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(stats));
      setHasSavedReport(true);
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [stats]);

  // Re-open the saved report from the upload screen.
  const viewLastReport = () => {
    track("saved_report_open");
    try {
      const saved = localStorage.getItem(SAVED_KEY);
      if (saved) setStats(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  };

  // Permanently remove the saved report from this device.
  const discardSavedReport = () => {
    setStats(null);
    setHasSavedReport(false);
    try {
      localStorage.removeItem(SAVED_KEY);
    } catch {
      /* ignore */
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Helper to delete an item from history list.
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  // Helper to save parsed chat into local history array.
  const saveParsedChat = (parsed: ChatStats) => {
    track("report_generated", { messages: parsed.totalMessages });
    setStats(parsed);
    const newHistoryItem: HistoryItem = {
      id: `${parsed.participants.join("-")}-${parsed.relationshipStartDate}-${parsed.totalMessages}-${Date.now()}`,
      names: parsed.participants.join(" & "),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      messageCount: parsed.totalMessages,
      startDate: parsed.relationshipStartDate,
      stats: parsed,
    };

    setHistory((prev) => {
      // Filter out duplicate reports for the same names and total messages to keep history clean
      const filtered = prev.filter(
        (item) =>
          !(
            item.names === newHistoryItem.names &&
            item.messageCount === newHistoryItem.messageCount
          ),
      );
      const updated = [newHistoryItem, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  };

  const loadingPhrases = [
    "Reading your chat log...",
    "Detecting who texts first...",
    "Counting double texts (yikes)...",
    "Calculating who's more obsessed...",
    "Measuring reply speed gaps...",
    "Analyzing late-night energy...",
    "Scanning for red & green flags...",
    "Finding who said 'I love you' first...",
    "Judging your emoji habits...",
    "Generating your verdict...",
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    track("chat_file_selected", { file_type: file.name.split(".").pop() || "unknown" });
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".zip")) {
      track("report_error", { reason: "wrong_file_type" });
      setErrorMsg(
        "Please upload a `.txt` or `.zip` file exported from WhatsApp.",
      );
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    setLoadingStep(0);

    // Warm up the Dashboard chunk while the loading animation plays, so it's ready instantly.
    void import("../components/Dashboard");

    // Simulate load steps for premium feel and visual feedback
    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < loadingPhrases.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 550);

    if (file.name.endsWith(".zip")) {
      import("jszip").then((JSZip) => {
        const jszip = new JSZip.default();
        jszip
          .loadAsync(file)
          .then((zip) => {
            // Find the first .txt file in the zip
            const txtFiles = Object.keys(zip.files).filter((name) =>
              name.endsWith(".txt"),
            );

            if (txtFiles.length === 0) {
              setErrorMsg(
                "No chat log `.txt` file found inside the uploaded `.zip` file.",
              );
              setIsLoading(false);
              clearInterval(interval);
              return;
            }

            // Prefer _chat.txt (iOS standard) or any file with "chat" in the name, or just the first .txt file
            const chatFileName =
              txtFiles.find(
                (name) =>
                  name === "_chat.txt" || name.toLowerCase().includes("chat"),
              ) || txtFiles[0];

            zip.files[chatFileName].async("string").then((text) => {
              try {
                setTimeout(() => {
                  const parsed = parseWhatsAppChat(text);
                  if (parsed.participants.length < 2) {
                    track("report_error", { reason: "fewer_than_two_senders" });
                    setErrorMsg(
                      "We couldn't identify at least 2 senders in this chat. Make sure you exported the correct WhatsApp chat history.",
                    );
                    setIsLoading(false);
                    clearInterval(interval);
                  } else {
                    saveParsedChat(parsed);
                    setIsLoading(false);
                    clearInterval(interval);
                  }
                }, 5500); // 5.5 seconds loading simulation
              } catch (err) {
                setErrorMsg(
                  "Failed to parse file. Please verify the `.txt` chat log inside the zip is valid.",
                );
                setIsLoading(false);
                clearInterval(interval);
              }
            });
          })
          .catch((err) => {
            setErrorMsg(
              "Failed to read `.zip` file. The archive might be corrupt.",
            );
            setIsLoading(false);
            clearInterval(interval);
          });
      });
      return;
    }

    // Handle raw text file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        setTimeout(() => {
          const parsed = parseWhatsAppChat(text);
          if (parsed.participants.length < 2) {
            track("report_error", { reason: "fewer_than_two_senders" });
            setErrorMsg(
              "We couldn't identify at least 2 senders in this chat. Make sure you exported the correct WhatsApp chat history.",
            );
            setIsLoading(false);
            clearInterval(interval);
          } else {
            saveParsedChat(parsed);
            setIsLoading(false);
            clearInterval(interval);
          }
        }, 5500); // 5.5 seconds loading simulation for satisfying transition
      } catch (err) {
        setErrorMsg(
          "Failed to parse file. Please verify it is a valid WhatsApp chat export `.txt` file.",
        );
        setIsLoading(false);
        clearInterval(interval);
      }
    };

    reader.onerror = () => {
      setErrorMsg("Failed to read file. Please try again.");
      setIsLoading(false);
      clearInterval(interval);
    };

    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleUploadClick = () => {
    track("upload_click");
    fileInputRef.current?.click();
  };

  const openGuide = (where: string) => {
    track("export_guide_open", { where });
    setIsTutorialOpen(true);
  };

  const scrollToUpload = (where: string) => {
    track("cta_click", { where });
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Go back to the upload screen WITHOUT deleting the saved active report.
  const resetChat = () => {
    setStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Render parsed Dashboard view
  if (stats) {
    return (
      <div className="min-h-screen bg-[#fdf7f5] text-slate-800">
        <Dashboard
          stats={stats}
          onReset={resetChat}
          price={price}
          checkoutUrl={checkoutUrl}
        />
      </div>
    );
  }

  // Render Loader view
  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#fdf7f5] p-6 text-[#20090f]">
        {/* Decorative background glows */}
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-rose-200/30 rounded-full blur-[100px] pointer-events-none animate-pulse-soft" />
        <div
          className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-indigo-200/25 rounded-full blur-[110px] pointer-events-none animate-pulse-soft"
          style={{ animationDelay: "3s" }}
        />

        {/* Loading Card */}
        <div className="relative w-full max-w-[380px] overflow-hidden rounded-3xl border border-white/60 bg-white/75 p-8 shadow-xl backdrop-blur-lg text-center flex flex-col items-center">
          {/* Custom Overlapping Pulsing Hearts Animation */}
          <div className="relative mb-10 h-28 w-28 flex items-center justify-center">
            {/* Background glowing rings */}
            <div className="absolute inset-0 rounded-full bg-rose-500/10 blur-xl animate-pulse-soft" />

            {/* Left Heart (Partner A) */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute left-4 top-4 text-rose-500 drop-shadow-md"
            >
              <Heart className="fill-rose-500" size={48} />
            </motion.div>

            {/* Right Heart (Partner B) */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                y: [0, -3, 0],
                x: [0, 4, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              className="absolute right-4 bottom-4 text-indigo-500 drop-shadow-md"
            >
              <Heart className="fill-indigo-500" size={44} />
            </motion.div>

            {/* Floating Sparkle */}
            <motion.div
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-0 right-2 text-yellow-400"
            >
              <Sparkles size={16} className="fill-yellow-400" />
            </motion.div>
          </div>

          <h3 className="text-xl font-black text-slate-800 mb-1">
            Analyzing Your Bond
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
            Reading WhatsApp Log
          </p>

          {/* Active Phrase with smooth slide transitions */}
          <div className="min-h-[2.5rem] mt-4 flex items-center justify-center w-full px-2">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-extrabold text-rose-500 tracking-wide uppercase text-center leading-tight"
              >
                {loadingPhrases[loadingStep]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Liquid progress bar indicator */}
          <div className="mt-8 w-full">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              <span>Progress</span>
              <span>
                {Math.round(((loadingStep + 1) / loadingPhrases.length) * 100)}%
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-white shadow-inner relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-rose-400 to-indigo-505 transition-all duration-300 shadow-sm"
                style={{
                  width: `${((loadingStep + 1) / loadingPhrases.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <p className="mt-8 text-[11px] text-slate-400 font-bold tracking-wide uppercase flex items-center gap-1 justify-center border-t border-slate-100/50 pt-4 w-full">
            <ShieldCheck size={12} className="text-green-500" /> 100%
            Client-Side Privacy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#fdf7f5] text-[#20090f] flex flex-col overflow-x-hidden">
      {/* one soft rose light from the top right */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(55%_50%_at_75%_0%,rgba(251,77,109,0.16),transparent_70%)]" />

      {/* 1. Header */}
      <header className="sticky top-0 z-40 border-b border-[rgba(32,9,15,0.06)] bg-[#fdf7f5]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <button onClick={resetChat} className="flex items-center gap-2" aria-label="LoveLens home">
            <img src="/lovelens_logo.png" alt="" className="h-8 w-8 rounded-xl object-contain" />
            <span className="text-[17px] font-semibold tracking-tight">LoveLens</span>
          </button>
          <nav className="hidden md:flex items-center gap-7 text-sm text-[#6b4a56]">
            <a href="#how" className="hover:text-[#20090f] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#20090f] transition-colors">What you&apos;ll see</a>
            <a href="#pricing" className="hover:text-[#20090f] transition-colors">Pricing</a>
            <a href="#security" className="hover:text-[#20090f] transition-colors">Privacy</a>
          </nav>
          <button onClick={() => scrollToUpload("header")} className="premium-btn rounded-full px-4 py-2 text-sm font-semibold">
            Check my chat
          </button>
        </div>
      </header>

      {/* Instagram / Facebook in-app browser tip */}
      {inAppBrowser && !inAppDismissed && (
        <div className="relative z-30 mx-auto mt-3 w-full max-w-6xl px-5">
          <div className="flex items-start gap-3 rounded-2xl border border-[rgba(32,9,15,0.08)] bg-white px-4 py-3 text-[13px] leading-snug text-[#20090f] shadow-sm">
            <span className="mt-0.5 text-base">💡</span>
            <p className="flex-1">
              You&apos;re in Instagram&apos;s browser. If choosing your chat file doesn&apos;t work, tap <strong>⋯</strong> at the top and{" "}
              <strong>Open in browser</strong>.
            </p>
            <button onClick={() => setInAppDismissed(true)} className="text-[#a78e97] hover:text-[#20090f]" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Payment could not be confirmed */}
      {paymentNotice && (
        <div className="relative z-30 mx-auto mt-3 w-full max-w-6xl px-5">
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-snug text-[#20090f]">
            <span className="mt-0.5 text-base">⚠️</span>
            <p className="flex-1">
              We couldn&apos;t confirm a payment on this link. If you paid, open your report, tap <strong>Unlock</strong>, then{" "}
              <strong>Already purchased?</strong> and paste the payment ID from your receipt email. Or write to{" "}
              <a className="underline" href="mailto:hello@getlovelens.com">hello@getlovelens.com</a>.
            </p>
            <button onClick={() => setPaymentNotice(false)} className="text-[#a78e97] hover:text-[#20090f]" aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Resume saved report */}
      {hasSavedReport && (
        <div className="relative z-30 mx-auto w-full max-w-6xl px-5 pt-4">
          <div className="premium-card flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#fff1f3] text-[#e11d48]">
                <Heart size={16} className="fill-[#e11d48]" />
              </span>
              <div>
                <p className="text-sm font-semibold">Welcome back</p>
                <p className="text-xs text-[#6b4a56]">Your last report is saved on this device.</p>
              </div>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button onClick={viewLastReport} className="premium-btn flex-1 sm:flex-none rounded-full px-5 py-2.5 text-xs font-semibold">
                View last report <ArrowRight size={13} className="inline -mt-0.5" />
              </button>
              <button onClick={discardSavedReport} className="rounded-full border border-[rgba(32,9,15,0.12)] px-4 py-2.5 text-xs font-semibold text-[#6b4a56] hover:text-[#e11d48]">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero */}
      <section className="relative px-5 pt-10 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <span className="eyebrow">
              <ShieldCheck size={13} className="text-[#e11d48]" /> Private WhatsApp chat analysis
            </span>
            <h1 className="font-display mt-5 text-[46px] leading-[1.02] md:text-[76px]">
              Who&apos;s more into who?
              <br />
              <span className="italic text-[#e11d48]">Your chat already knows.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-[#6b4a56]">
              Upload your WhatsApp chat and get the receipts: who texts first, who replies faster, who double-texts, and
              who&apos;s more invested. It never leaves your phone.
            </p>

            {/* Upload */}
            <div id="upload" className="premium-card mt-8 rounded-[28px] p-4 md:p-5">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="rounded-[22px] border border-dashed border-[rgba(225,29,72,0.3)] bg-[#fffafa] px-5 py-6 text-center"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.zip" className="hidden" />
                <button
                  onClick={handleUploadClick}
                  className="premium-btn-rose inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold sm:w-auto"
                >
                  <UploadCloud size={20} /> Choose your chat file
                </button>
                <p className="mt-3 text-[13px] text-[#6b4a56]">
                  Your WhatsApp export (.txt or .zip). Or drop it here.
                </p>
              </div>

              {errorMsg && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-[13px] font-medium text-red-600">
                  {errorMsg}
                </div>
              )}

              <ExportSteps onFullGuide={() => openGuide("hero_steps")} />
            </div>

            {/* Trust */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#6b4a56]">
              <span className="inline-flex items-center gap-1.5"><Lock size={14} className="text-[#e11d48]" /> Runs on your device</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#e11d48]" /> No sign-up</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-[#e11d48]" /> Results in seconds</span>
            </div>
          </div>

          {/* Preview */}
          <div className="md:col-span-5">
            <ReportPreview price={price} />
          </div>
        </div>
      </section>

      {/* Saved analyses */}
      {history.length > 0 && (
        <section className="relative px-5 pb-16">
          <div className="mx-auto max-w-6xl">
            <h3 className="font-display text-3xl">Your saved reports</h3>
            <p className="mt-1 text-sm text-[#6b4a56]">Stored only in this browser.</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="premium-card group relative flex flex-col justify-between rounded-2xl p-5"
                  >
                    {deletingId === item.id && (
                      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-white/95 p-4 text-center">
                        <p className="mb-3 text-sm font-semibold">Delete this report?</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryItem(item.id, e);
                              setDeletingId(null);
                            }}
                            className="rounded-full bg-[#e11d48] px-4 py-1.5 text-xs font-semibold text-white"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingId(null);
                            }}
                            className="rounded-full border border-[rgba(32,9,15,0.12)] px-4 py-1.5 text-xs font-semibold text-[#6b4a56]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(item.id);
                      }}
                      className="absolute right-3 top-3 rounded-full p-1.5 text-[#a78e97] hover:bg-[#fff1f3] hover:text-[#e11d48]"
                      title="Delete from history"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="pr-6">
                      <span className="text-xs text-[#a78e97]">Analyzed {item.date}</span>
                      <h4 className="mt-1 text-base font-semibold">{item.names}</h4>
                      <p className="mt-2 text-[13px] text-[#6b4a56]">
                        {item.messageCount.toLocaleString()} messages · since {item.startDate}
                      </p>
                    </div>
                    <button
                      onClick={() => setStats(item.stats)}
                      className="mt-4 self-start rounded-full bg-[#fff1f3] px-4 py-1.5 text-xs font-semibold text-[#e11d48] hover:bg-[#e11d48] hover:text-white transition-colors"
                    >
                      Open report <ArrowRight size={12} className="inline -mt-0.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      )}

      {/* 3. How it works */}
      <section id="how" className="relative border-t border-[rgba(32,9,15,0.06)] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow">How it works</span>
          <h2 className="font-display mt-4 text-4xl md:text-5xl">Three steps. About a minute.</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { n: "1", t: "Export your chat", d: "In WhatsApp: open the chat, then Export chat, Without media. Takes 30 seconds." },
              { n: "2", t: "Choose the file here", d: "It's read right here in your browser. Nothing is uploaded to any server." },
              { n: "3", t: "See the receipts", d: `Your stats are free. Unlock who's more into who and the full report, one-time ${price}.` },
            ].map((step) => (
              <div key={step.n} className="premium-card rounded-3xl p-6">
                <span className="font-display text-5xl text-[#e11d48]">{step.n}</span>
                <h3 className="mt-3 text-lg font-semibold">{step.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6b4a56]">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. What you'll see */}
      <section id="features" className="relative bg-white/60 border-y border-[rgba(32,9,15,0.06)] px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow">What you&apos;ll see</span>
          <h2 className="font-display mt-4 text-4xl md:text-5xl">Everything your chat says about you two.</h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 rounded-3xl bg-gradient-to-br from-[#fb4d6d] via-[#e11d48] to-[#7c3aed] p-7 text-white shadow-[0_30px_60px_-30px_rgba(225,29,72,0.6)]">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">The verdict</span>
              <h3 className="font-display mt-4 text-4xl leading-tight">Who&apos;s more into who?</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">
                We weigh who starts conversations, who replies faster, who double-texts and who shows more affection, then
                crown the more invested one.
              </p>
            </div>
            {FEATURES.map((f) => (
              <div key={f.title} className="premium-card rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{f.icon}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      f.free ? "bg-emerald-50 text-emerald-700" : "bg-[#fbf3e1] text-[#8a6a1f]"
                    }`}
                  >
                    {f.free ? "Free" : "Full report"}
                  </span>
                </div>
                <h3 className="mt-4 text-[17px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#6b4a56]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Pricing */}
      <section id="pricing" className="relative px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="eyebrow">Pricing</span>
            <h2 className="font-display mt-4 text-4xl md:text-5xl">Start free. Unlock the answer.</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="premium-card rounded-3xl p-7">
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="font-display mt-2 text-5xl">{price.includes("₹") ? "₹0" : "$0"}</p>
              <ul className="mt-6 space-y-3 text-[15px] text-[#20090f]">
                {["Who texts more", "Who replies faster", "Your longest streak", "Your relationship score"].map((x) => (
                  <li key={x} className="flex items-start gap-2.5"><Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" /> {x}</li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-3xl bg-[#20090f] p-7 text-white shadow-[0_40px_80px_-40px_rgba(32,9,15,0.7)]">
              <span className="absolute right-6 top-6 rounded-full bg-[#e11d48] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">The answer</span>
              <h3 className="text-lg font-semibold">Full report</h3>
              <p className="mt-2 flex items-end gap-2">
                <span className="font-display text-5xl">{price}</span>
                <span className="pb-1.5 text-sm text-white/60">one-time · no subscription</span>
              </p>
              <ul className="mt-6 space-y-3 text-[15px]">
                {[
                  "Who's more into who: the verdict",
                  "Who said \"I love you\" first",
                  "Who chases more and the longest silence",
                  "Red & green flags, honeymoon timeline, inside jokes",
                  "The verdict on your share card, plus a PDF",
                ].map((x) => (
                  <li key={x} className="flex items-start gap-2.5"><Check size={16} className="mt-0.5 flex-shrink-0 text-[#fb7185]" /> {x}</li>
                ))}
              </ul>
              <button onClick={() => scrollToUpload("pricing")} className="premium-btn-rose mt-7 w-full rounded-2xl py-3.5 text-[15px] font-semibold">
                Check my chat first
              </button>
              <p className="mt-3 text-center text-xs text-white/55">Secure checkout by Dodo Payments · taxes included</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Privacy */}
      <section id="security" className="relative px-5 pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[#20090f] px-7 py-12 text-white md:px-14 md:py-16">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                <ShieldCheck size={13} /> Privacy
              </span>
              <h2 className="font-display mt-5 text-4xl leading-tight md:text-5xl">Your chat never leaves your phone.</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-white/70">
                LoveLens reads the file inside your browser. There are no servers that see your messages and no account to
                create.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <WifiOff size={26} className="text-[#fb7185]" />
              <h3 className="mt-4 text-lg font-semibold">Don&apos;t take our word for it</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-white/70">
                Load this page, switch on airplane mode, then choose your chat. It still works, because everything happens
                on your device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="relative px-5 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-center text-4xl md:text-5xl">Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQ(price).map((f) => (
              <details key={f.q} className="premium-card group rounded-2xl px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold">
                  {f.q}
                  <ChevronDown size={18} className="flex-shrink-0 text-[#a78e97] transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-[15px] leading-relaxed text-[#6b4a56]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final call */}
      <section className="relative px-5 pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl md:text-6xl">Settle it tonight.</h2>
          <p className="mt-3 text-[17px] text-[#6b4a56]">Who&apos;s more into who? Your chat has the answer.</p>
          <button onClick={() => scrollToUpload("final")} className="premium-btn-rose mt-7 inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold">
            Check my chat <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-[rgba(32,9,15,0.07)] px-5 py-10 text-center text-[13px] text-[#a78e97]">
        <div className="mx-auto max-w-5xl space-y-3">
          <div className="flex items-center justify-center gap-2">
            <img src="/lovelens_logo.png" alt="" className="h-5 w-5 rounded object-contain" />
            <span className="font-semibold text-[#20090f]">LoveLens</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center justify-center gap-5 text-[#6b4a56]">
            <a href="/privacy" className="hover:text-[#e11d48]">Privacy</a>
            <a href="/terms" className="hover:text-[#e11d48]">Terms</a>
            <a href="mailto:hello@getlovelens.com" className="hover:text-[#e11d48]">Contact</a>
          </div>
          <p className="mx-auto max-w-md text-xs leading-relaxed">
            LoveLens is an independent analyzer. WhatsApp is a registered trademark of WhatsApp Inc. This website is not
            affiliated with or endorsed by WhatsApp.
          </p>
        </div>
      </footer>

      <UploadTutorial isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
}

// ---------------------------------------------------------------- landing helpers ----------------------------------

const FEATURES: { icon: string; title: string; desc: string; free: boolean }[] = [
  { icon: "⚡", title: "Reply speed", desc: "Who replies in minutes and who leaves the other on read.", free: true },
  { icon: "🔥", title: "Chat streaks", desc: "Your longest run of days without missing a chat.", free: true },
  { icon: "🚩", title: "Flags audit", desc: "Dry replies against sweet ones: your red and green flags.", free: false },
  { icon: "📲", title: "Who chases more", desc: "The longest run of texts sent without a reply.", free: false },
  { icon: "☀️", title: "Good morning champion", desc: "Who sends the first good morning, and who says goodnight last.", free: false },
  { icon: "📈", title: "Honeymoon timeline", desc: "When your chat peaked, and how the spark has moved since.", free: false },
];

const FAQ = (price: string): { q: string; a: string }[] => [
  {
    q: "Is it really private?",
    a: "Yes. Your chat file is read inside your browser and never sent to any server. You can test it: load the page, turn on airplane mode, then choose your chat.",
  },
  {
    q: "How do I export my WhatsApp chat?",
    a: "iPhone: open the chat, tap the name at the top, scroll down, tap Export Chat, then Without Media, and save it to Files. Android: open the chat, tap ⋮, More, Export chat, Without media, and save it. Then choose that file here.",
  },
  {
    q: "What's free and what's in the full report?",
    a: `Who texts more, reply speed, streaks and your relationship score are free. The full report (one-time ${price}) unlocks who's more into who, who said "I love you" first, who chases more, the flags audit, your timeline, inside jokes and a shareable card.`,
  },
  {
    q: "Is it a subscription?",
    a: "No. You pay once and the full report unlocks on this device.",
  },
  {
    q: "Do I need an account?",
    a: "No sign-up and no email. Choose your chat and your report appears.",
  },
];

/** The export steps right under the upload button, for iPhone or Android (guessed from the device). */
function ExportSteps({ onFullGuide }: { onFullGuide: () => void }) {
  const [device, setDevice] = useState<"iphone" | "android">("iphone");
  useEffect(() => {
    try {
      if (/Android/i.test(navigator.userAgent || "")) setDevice("android");
    } catch {
      /* ignore */
    }
  }, []);
  const steps =
    device === "iphone"
      ? ["Open the chat in WhatsApp and tap their name at the top", "Scroll down, tap Export Chat, then Without Media", "Save to Files, come back here and choose the file"]
      : ["Open the chat in WhatsApp and tap ⋮ at the top right", "Tap More, then Export chat, then Without media", "Save it to your phone, come back here and choose the file"];
  return (
    <div className="mt-4 px-1">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold">How to export your chat</p>
        <div className="flex rounded-full bg-[#f4ebe8] p-0.5 text-xs font-semibold">
          {(["iphone", "android"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`rounded-full px-3 py-1 transition-colors ${device === d ? "bg-white text-[#20090f] shadow-sm" : "text-[#6b4a56]"}`}
            >
              {d === "iphone" ? "iPhone" : "Android"}
            </button>
          ))}
        </div>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2.5 text-[13px] leading-snug text-[#6b4a56]">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#fff1f3] text-[11px] font-semibold text-[#e11d48]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <button onClick={onFullGuide} className="mt-3 text-[13px] font-semibold text-[#e11d48] hover:underline">
        See the guide with pictures <ChevronRight size={13} className="inline -mt-0.5" />
      </button>
    </div>
  );
}

/** The report preview in the hero: the verdict card with the answer blurred, the way the real report teases it. */
function ReportPreview({ price }: { price: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div className="absolute -inset-6 -z-10 rounded-[48px] bg-[radial-gradient(closest-side,rgba(225,29,72,0.18),transparent)]" />
      <div className="premium-card rounded-[32px] p-4">
        <div className="flex items-center justify-between px-1 text-xs text-[#a78e97]">
          <span className="font-semibold text-[#6b4a56]">Your LoveLens report</span>
          <span className="rounded-full bg-[#fff1f3] px-2 py-0.5 font-semibold text-[#e11d48]">Example</span>
        </div>
        <div className="mt-3 rounded-[24px] bg-gradient-to-br from-[#fb4d6d] via-[#e11d48] to-[#7c3aed] p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">The big question</p>
          <p className="font-display mt-1 text-[34px] leading-[1.05]">Who&apos;s more into who?</p>
          <div className="mt-5 flex items-center justify-between">
            <div className="flex flex-col items-center gap-1.5">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-semibold text-[#e11d48] ring-4 ring-white/25">R</span>
              <span className="text-xs text-white/80">Riya</span>
            </div>
            <span className="text-xs font-semibold text-white/70">VS</span>
            <div className="flex flex-col items-center gap-1.5">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-semibold text-[#4f46e5] ring-4 ring-white/25">A</span>
              <span className="text-xs text-white/80">Arjun</span>
            </div>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/25">
            <div className="h-full w-[87%] rounded-full bg-white/85 blur-[2px]" />
          </div>
          <p className="mt-3 text-sm text-white/85">
            One of you carries <span className="inline-block select-none font-semibold blur-[5px]">87%</span> of the effort
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { k: "Texts first", v: "Arjun · 63%" },
            { k: "Replies faster", v: "Arjun · 3 min" },
            { k: "Longest streak", v: "212 days" },
          ].map((row) => (
            <div key={row.k} className="flex items-center justify-between rounded-2xl bg-[#fdf7f5] px-4 py-3 text-sm">
              <span className="text-[#6b4a56]">{row.k}</span>
              <span className="font-semibold">{row.v}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-[#a78e97]">Full report · one-time {price}</p>
      </div>
    </div>
  );
}
