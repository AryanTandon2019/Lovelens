"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, UploadCloud, ShieldCheck, HelpCircle, Sparkles,
  ChevronRight, Smile, Flame, Clock, Award, Lock, Trash2,
  Calendar, MessageSquare, BarChart2
} from "lucide-react";
import { parseWhatsAppChat, ChatStats } from "../utils/chatParser";

// Lazy-load heavy, post-upload UI so the landing page bundle stays small and fast.
const Dashboard = dynamic(() => import("../components/Dashboard"), { ssr: false });
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
  const [price, setPrice] = useState("₹149");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [mockupTab, setMockupTab] = useState<"report" | "share">("report");
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

  // Check for successful payment redirect parameters on load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
      const paymentId = params.get("payment_id");
      
      if (status === "succeeded" || paymentId) {
        localStorage.setItem("lovelens_unlocked_v1", "true");
        if (paymentId) {
          localStorage.setItem("lovelens_license", paymentId);
        }
        // Clean URL search parameters to keep the layout pretty
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Regional pricing and checkout URL detection
  useEffect(() => {
    const defaultGlobalUrl = process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL || "";
    const defaultIndiaUrl = process.env.NEXT_PUBLIC_DODO_CHECKOUT_URL_IN || defaultGlobalUrl;

    const checkIsIndia = () => {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const locale = navigator.language || "";
        if (
          tz.includes("Kolkata") ||
          tz.includes("Calcutta") ||
          locale.toLowerCase().includes("in")
        ) {
          return true;
        }
      } catch (e) {
        // Fallback
      }
      return false;
    };

    if (checkIsIndia()) {
      setPrice("₹149");
      setCheckoutUrl(defaultIndiaUrl);
    } else {
      setPrice("$2.99");
      setCheckoutUrl(defaultGlobalUrl);
    }

    // Async geolocation check to refine detection
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.country_code === "string") {
          const isIndia = data.country_code.toUpperCase() === "IN";
          if (isIndia) {
            setPrice("₹149");
            setCheckoutUrl(defaultIndiaUrl);
          } else {
            setPrice("$2.99");
            setCheckoutUrl(defaultGlobalUrl);
          }
        }
      })
      .catch((err) => {
        console.warn("LoveLens regional detection IP fallback failed:", err);
      });
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
    setStats(parsed);
    const newHistoryItem: HistoryItem = {
      id: `${parsed.participants.join("-")}-${parsed.relationshipStartDate}-${parsed.totalMessages}-${Date.now()}`,
      names: parsed.participants.join(" & "),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      messageCount: parsed.totalMessages,
      startDate: parsed.relationshipStartDate,
      stats: parsed,
    };

    setHistory((prev) => {
      // Filter out duplicate reports for the same names and total messages to keep history clean
      const filtered = prev.filter(
        (item) => !(item.names === newHistoryItem.names && item.messageCount === newHistoryItem.messageCount)
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
    "Reading chat log...",
    "Normalizing timestamp patterns...",
    "Extracting emojis...",
    "Calculating reply speeds...",
    "Analyzing late-night text streaks...",
    "Generating relationship stats..."
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".zip")) {
      setErrorMsg("Please upload a `.txt` or `.zip` file exported from WhatsApp.");
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
    }, 600);

    if (file.name.endsWith(".zip")) {
      import("jszip").then((JSZip) => {
        const jszip = new JSZip.default();
        jszip.loadAsync(file).then((zip) => {
          // Find the first .txt file in the zip
          const txtFiles = Object.keys(zip.files).filter(name => name.endsWith(".txt"));

          if (txtFiles.length === 0) {
            setErrorMsg("No chat log `.txt` file found inside the uploaded `.zip` file.");
            setIsLoading(false);
            clearInterval(interval);
            return;
          }

          // Prefer _chat.txt (iOS standard) or any file with "chat" in the name, or just the first .txt file
          const chatFileName = txtFiles.find(name => name === "_chat.txt" || name.toLowerCase().includes("chat")) || txtFiles[0];

          zip.files[chatFileName].async("string").then((text) => {
            try {
              setTimeout(() => {
                const parsed = parseWhatsAppChat(text);
                if (parsed.participants.length < 2) {
                  setErrorMsg("We couldn't identify at least 2 senders in this chat. Make sure you exported the correct WhatsApp chat history.");
                  setIsLoading(false);
                  clearInterval(interval);
                } else {
                  saveParsedChat(parsed);
                  setIsLoading(false);
                  clearInterval(interval);
                }
              }, 3000); // 3 seconds loading simulation
            } catch (err) {
              setErrorMsg("Failed to parse file. Please verify the `.txt` chat log inside the zip is valid.");
              setIsLoading(false);
              clearInterval(interval);
            }
          });
        }).catch((err) => {
          setErrorMsg("Failed to read `.zip` file. The archive might be corrupt.");
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
            setErrorMsg("We couldn't identify at least 2 senders in this chat. Make sure you exported the correct WhatsApp chat history.");
            setIsLoading(false);
            clearInterval(interval);
          } else {
            saveParsedChat(parsed);
            setIsLoading(false);
            clearInterval(interval);
          }
        }, 3000); // 3 seconds loading simulation for satisfying transition
      } catch (err) {
        setErrorMsg("Failed to parse file. Please verify it is a valid WhatsApp chat export `.txt` file.");
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
    fileInputRef.current?.click();
  };

  // Go back to the upload screen WITHOUT deleting the saved active report.
  const resetChat = () => {
    setStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Mock static data for the dashboard mockup preview
  const previewFeatures = [
    {
      title: "Relationship Style",
      value: "Speed Dialers",
      desc: "Instant replies! You two practically live in the chat.",
      icon: <Award className="text-yellow-500" size={18} />,
      color: "bg-yellow-50 border-yellow-100"
    },
    {
      title: "Who Texts More?",
      value: "You (58%)",
      desc: "You send 12,839 messages compared to their 9,283.",
      icon: <Smile className="text-rose-500" size={18} />,
      color: "bg-rose-50 border-rose-100"
    },
    {
      title: "Who Replies Faster?",
      value: "Them (12 min)",
      desc: "They reply within minutes, while you take about 35 mins.",
      icon: <Clock className="text-indigo-500" size={18} />,
      color: "bg-indigo-50 border-indigo-100"
    },
    {
      title: "Streak Record",
      value: "241 Days",
      desc: "You haven't missed a single day of chatting for months!",
      icon: <Flame className="text-orange-500" size={18} />,
      color: "bg-orange-50 border-orange-100"
    }
  ];

  // Render parsed Dashboard view
  if (stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-rose-100/50 to-indigo-50 text-slate-800">
        <Dashboard stats={stats} onReset={resetChat} price={price} checkoutUrl={checkoutUrl} />
      </div>
    );
  }

  // Render Loader view
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF7F7] via-rose-50 to-indigo-50 p-6 text-slate-800">
        {/* Decorative background glows */}
        <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-rose-200/30 rounded-full blur-[100px] pointer-events-none animate-pulse-soft" />
        <div className="absolute bottom-[20%] right-[10%] w-80 h-80 bg-indigo-200/25 rounded-full blur-[110px] pointer-events-none animate-pulse-soft" style={{ animationDelay: "3s" }} />

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
                y: [0, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
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
                x: [0, 4, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3
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

          <h3 className="text-xl font-black text-slate-800 mb-1">Analyzing Your Bond</h3>
          <p className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">Reading WhatsApp Log</p>

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
              <span>{Math.round(((loadingStep + 1) / loadingPhrases.length) * 100)}%</span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-white shadow-inner relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-rose-400 to-indigo-505 transition-all duration-300 shadow-sm"
                style={{ width: `${((loadingStep + 1) / loadingPhrases.length) * 100}%` }}
              />
            </div>
          </div>

          <p className="mt-8 text-[11px] text-slate-400 font-bold tracking-wide uppercase flex items-center gap-1 justify-center border-t border-slate-100/50 pt-4 w-full">
            <ShieldCheck size={12} className="text-green-500" /> 100% Client-Side Privacy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FFF7F7] text-slate-800 flex flex-col justify-between overflow-hidden">
      {/* Decorative Large Glowing Blur Bubbles */}
      <div className="absolute top-[10%] left-[-100px] w-[350px] h-[350px] bg-rose-200/40 rounded-full blur-[120px] pointer-events-none animate-pulse-soft" />
      <div className="absolute bottom-[30%] right-[-100px] w-[400px] h-[400px] bg-indigo-200/30 rounded-full blur-[130px] pointer-events-none animate-pulse-soft" style={{ animationDelay: "2s" }} />

      {/* 1. Header/Nav */}
      <header className="sticky top-0 z-40 border-b border-rose-100/40 bg-white/70 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div onClick={resetChat} className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
            <img src="/lovelens_logo.png" alt="LoveLens Logo" className="h-8 w-8 object-contain rounded-lg shadow-sm" />
            <span className="text-xl font-black tracking-tight text-slate-800">
              Love<span className="text-rose-500">Lens</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); setIsTutorialOpen(true); }} className="hover:text-rose-500 transition-colors">How to Export</a>
            <a href="#security" className="hover:text-rose-500 transition-colors">Privacy Promise</a>
            <a href="#features" className="hover:text-rose-500 transition-colors">Features</a>
          </nav>
          <div>
            <button
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-rose-500 hover:bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              How to Export ↗
            </button>
          </div>
        </div>
      </header>

      {/* Resume saved report banner */}
      {hasSavedReport && (
        <div className="relative z-30 mx-auto w-full max-w-5xl px-6 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-rose-200/60 bg-white/80 backdrop-blur-md px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <span className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0">
                <Heart size={16} className="fill-white" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-800">Welcome back 👋</p>
                <p className="text-xs font-semibold text-slate-500">Your last report is saved on this device.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={viewLastReport}
                className="flex-1 sm:flex-none rounded-full bg-rose-500 hover:bg-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-rose-200 active:scale-95 transition-all"
              >
                View last report →
              </button>
              <button
                onClick={discardSavedReport}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Hero Section */}
      <section className="relative px-6 py-12 md:py-20 flex-1 flex flex-col justify-center">
        {/* Floating background graphics */}
        <div className="absolute top-10 right-[15%] text-rose-300/15 select-none pointer-events-none animate-float">
          <Heart size={44} className="fill-rose-300/10 text-rose-300/20" />
        </div>
        <div className="absolute bottom-20 left-[10%] text-rose-300/10 select-none pointer-events-none animate-float-slow">
          <Heart size={56} className="fill-rose-200/5 text-rose-200/10" />
        </div>
        <div className="absolute top-1/2 left-[5%] text-indigo-300/20 select-none pointer-events-none animate-float-fast">
          <Sparkles size={32} className="fill-indigo-200/10 text-indigo-300/20" />
        </div>

        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left Column: Headline and Upload zone */}
          <div className="md:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-100/50 px-3 py-1 text-xs font-bold text-rose-500 shadow-sm">
              <Sparkles size={12} className="text-rose-400 fill-rose-400" /> 100% Secure & Client-Side (No Servers)
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800 leading-tight">
              Understand your relationship like <span className="bg-gradient-to-r from-rose-500 to-rose-400 bg-clip-text text-transparent underline decoration-rose-200 decoration-wavy">never before</span>.
            </h1>

            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl font-medium">
              Upload your WhatsApp chat history and instantly find out who texts more, who replies faster, who said "I love you" first — and the big one: who's actually more into who. Beautiful, shareable, and 100% private.
            </p>

            {/* Drag & Drop Upload Zone */}
            <div className="space-y-3">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleUploadClick}
                className="group relative flex flex-col items-center justify-center border-2 border-dashed border-rose-200 hover:border-rose-400 bg-white hover:bg-rose-50/20 p-8 rounded-3xl cursor-pointer shadow-lg shadow-rose-100/50 hover:shadow-xl transition-all duration-300 text-center"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.zip"
                  className="hidden"
                />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 group-hover:scale-110 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 mb-4">
                  <UploadCloud size={28} />
                </div>

                <h3 className="text-lg font-black text-slate-800 mb-1">
                  Upload your chat log
                </h3>

                <p className="text-xs text-slate-400 font-semibold mb-3">
                  Drag and drop your WhatsApp `.txt` or `.zip` export file here
                </p>

                <button className="rounded-full bg-rose-500 group-hover:bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-200 transition-all">
                  Select Chat File
                </button>
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-500 text-center animate-pulse">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Upload Assistance Trigger */}
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500">
                <span>Not sure how?</span>
                <button
                  onClick={() => setIsTutorialOpen(true)}
                  className="text-rose-500 hover:text-rose-600 underline flex items-center gap-0.5"
                >
                  See 3-tap export guide <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Trust signals (honest — no fabricated reviews) */}
            <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-green-500" /> 100% private</span>
              <span className="inline-flex items-center gap-1.5"><Lock size={13} className="text-rose-500" /> No sign-up</span>
              <span className="inline-flex items-center gap-1.5"><Sparkles size={13} className="text-indigo-500 fill-indigo-500" /> Instant results</span>
            </div>
          </div>

          {/* Right Column: Beautiful Interactive Preview Mockup Card */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[340px]">
              
              {/* Tab Selector */}
              <div className="flex gap-1 p-1.5 bg-rose-50/70 border border-rose-100/40 rounded-full mb-4 shadow-sm backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setMockupTab("report")}
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    mockupTab === "report"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-rose-500"
                  }`}
                >
                  <BarChart2 size={13} />
                  <span>Report Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMockupTab("share")}
                  className={`flex-1 py-2 px-3 rounded-full text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    mockupTab === "share"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-rose-500"
                  }`}
                >
                  <Sparkles size={13} />
                  <span>Share Card</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mockupTab === "report" ? (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full rounded-3xl border border-white/60 bg-white/70 p-6 shadow-xl backdrop-blur-md"
                  >
                    <div className="absolute -top-3 -right-3 rounded-full bg-rose-500 text-white p-2 shadow-lg animate-bounce z-10">
                      <Sparkles size={16} />
                    </div>

                    <div className="flex items-center justify-between border-b border-rose-100/50 pb-4 mb-4">
                      <div className="flex items-center gap-2">
                        <img src="/lovelens_logo.png" alt="Logo" className="h-8 w-8 object-contain rounded-lg shadow-sm" />
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">Your Love Report</h4>
                          <p className="text-[9px] font-semibold text-slate-400">Preview Data</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-extrabold text-rose-500 uppercase tracking-wider">
                        Live Preview
                      </div>
                    </div>

                    {/* Relationship Score */}
                    <div className="text-center bg-rose-50/50 border border-rose-100/40 rounded-2xl p-3 mb-4 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Relationship Score</span>
                      <span className="text-3xl font-black text-rose-500 block">92%</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-0.5">
                        <span>You share a super strong bond!</span>
                        <Heart size={10} className="fill-rose-500 text-rose-500 inline" />
                      </div>
                    </div>

                    {/* Mini Features List */}
                    <div className="space-y-3">
                      {previewFeatures.map((feat, idx) => (
                        <div key={idx} className={`flex items-start gap-3 border rounded-2xl p-3 bg-white/90 shadow-sm`}>
                          <div className="mt-0.5">{feat.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{feat.title}</span>
                            </div>
                            <h5 className="text-sm font-black text-slate-800 mt-0.5">{feat.value}</h5>
                            <p className="text-[10px] text-slate-500 font-medium leading-normal mt-0.5">{feat.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-rose-100/40 text-center">
                      <span className="text-[10px] font-bold text-slate-400">Full Premium Report · One-time {price}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="share"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full overflow-hidden rounded-[32px] p-6 text-white shadow-2xl border border-white/25"
                    style={{
                      background: "linear-gradient(135deg, #FF3366 0%, #FF5E97 45%, #6F2CFF 100%)",
                      boxShadow: "0 25px 60px -15px rgba(111, 44, 255, 0.5)",
                    }}
                  >
                    {/* glows */}
                    <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/20 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                      {/* Brand */}
                      <div className="flex items-center justify-center gap-1.5 mb-6">
                        <img src="/lovelens_logo.png" alt="LoveLens" className="h-6 w-6 object-contain bg-white/10 rounded-md border border-white/10" />
                        <span className="text-base font-black tracking-tight">
                          Love<span className="text-white/80">Lens</span>
                        </span>
                      </div>

                      {/* Couple + VS avatars */}
                      <div className="flex items-center justify-center gap-6 mb-6">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 blur-sm opacity-60 pointer-events-none" />
                          <div className="relative h-14 w-14 rounded-2xl bg-white text-rose-500 flex items-center justify-center text-lg font-black shadow-lg border border-white/30">
                            AX
                          </div>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner animate-pulse">
                          <Heart className="fill-white text-white" size={14} />
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-400 to-purple-400 blur-sm opacity-60 pointer-events-none" />
                          <div className="relative h-14 w-14 rounded-2xl bg-white text-indigo-600 flex items-center justify-center text-lg font-black shadow-lg border border-white/30">
                            JU
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-base font-black mb-1 tracking-tight truncate">Alex &amp; Julia</p>

                      {/* Chemistry score circular gauge design */}
                      <div className="relative mx-auto my-6 h-28 w-28 flex items-center justify-center">
                        {/* Rotating dashed ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/35 animate-[spin_25s_linear_infinite] pointer-events-none" />
                        {/* Glowing inner circle */}
                        <div className="h-24 w-24 rounded-full bg-white/12 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center shadow-xl">
                          <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/70">Chemistry</span>
                          <span className="text-3xl font-black text-white tracking-tighter mt-0.5">92%</span>
                        </div>
                      </div>

                      {/* Mini stats */}
                      <div className="grid grid-cols-3 gap-2.5 mb-6">
                        <div className="rounded-2xl bg-white/8 border border-white/15 p-3 text-center shadow-md">
                          <MessageSquare size={13} className="mx-auto mb-1 text-rose-200" />
                          <span className="block text-sm font-black leading-tight text-white">22,122</span>
                          <span className="block text-[8px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">Texts</span>
                        </div>
                        <div className="rounded-2xl bg-white/8 border border-white/15 p-3 text-center shadow-md">
                          <Calendar size={13} className="mx-auto mb-1 text-indigo-200" />
                          <span className="block text-sm font-black leading-tight text-white">241</span>
                          <span className="block text-[8px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">Days</span>
                        </div>
                        <div className="rounded-2xl bg-white/8 border border-white/15 p-3 text-center shadow-md">
                          <Flame size={13} className="mx-auto mb-1 text-amber-300" />
                          <span className="block text-sm font-black leading-tight text-white">120</span>
                          <span className="block text-[8px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">Streak</span>
                        </div>
                      </div>

                      {/* Verdict line */}
                      <div className="rounded-2xl bg-gradient-to-r from-black/25 to-black/10 border border-white/10 p-3.5 text-center flex flex-col items-center justify-center shadow-inner">
                        <span className="block text-[8px] font-extrabold uppercase tracking-[0.2em] text-white/60 mb-1">Who's more into who?</span>
                        <div className="flex items-center justify-center gap-1.5 text-xs font-black bg-white/10 border border-white/10 rounded-full px-3 py-1 text-white shadow-sm mt-1.5">
                          <Lock size={11} className="text-white/80" />
                          <span>Locked · getlovelens.com</span>
                        </div>
                      </div>

                      {/* Footer / call to action */}
                      <div className="flex items-center justify-center gap-1.5 mt-5 text-[9px] font-black text-white/90">
                        <Heart size={10} className="fill-white text-white animate-pulse" />
                        <span>Analyze your chats free at <span className="underline">getlovelens.com</span></span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </section>

      {/* 2.5 History / Old Chats Section */}
      {history.length > 0 && (
        <section className="relative px-6 pb-16 z-20">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-rose-100/60 bg-white/70 p-6 md:p-8 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  <Heart size={16} className="fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Your Saved Analyses History</h3>
                  <p className="text-[11px] font-semibold text-slate-500">Access previous reports instantly. Saved 100% locally in your browser.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group relative flex flex-col justify-between rounded-2xl border border-rose-100/50 bg-white/95 p-5 shadow-sm hover:border-rose-300 hover:shadow-md transition-all duration-300"
                    >
                      {/* Delete confirmation overlay */}
                      {deletingId === item.id && (
                        <div className="absolute inset-0 z-30 rounded-2xl bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                          <Trash2 className="text-rose-500 mb-1 animate-bounce" size={20} />
                          <p className="text-xs font-black text-slate-800 mb-2">Delete this report?</p>
                          <div className="flex items-center gap-1.5 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(item.id, e);
                                setDeletingId(null);
                              }}
                              className="rounded-full bg-rose-500 hover:bg-rose-600 px-3 py-1 text-[10px] font-black text-white shadow-sm transition-all cursor-pointer"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="rounded-full border border-slate-200 hover:bg-slate-50 px-3 py-1 text-[10px] font-bold text-slate-500 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete item button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(item.id);
                        }}
                        className="absolute top-3 right-3 rounded-full p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all cursor-pointer z-20"
                        title="Delete from history"
                      >
                        <Trash2 size={13} />
                      </button>

                      <div className="pr-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                          Analyzed {item.date}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1">
                          {item.names} 💘
                        </h4>
                        <div className="mt-3 space-y-1">
                          <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                            <span>📊</span> {item.messageCount.toLocaleString()} messages
                          </p>
                          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                            <span>📅</span> Start: {item.startDate}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-rose-500">
                          {item.stats.interestBalance?.p1Score
                            ? `Score: ${item.stats.interestBalance.p1Score}% / ${item.stats.interestBalance.p2Score}%`
                            : "Click to load"}
                        </span>
                        <button
                          onClick={() => setStats(item.stats)}
                          className="rounded-full bg-rose-50 hover:bg-rose-500 hover:text-white px-3.5 py-1.5 text-[10px] font-black text-rose-500 transition-all cursor-pointer"
                        >
                          View Report →
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Trust strip (honest value props, no fabricated press) */}
      <section className="bg-slate-50/50 border-y border-slate-100 py-6 px-6">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-green-500" /> Parsed in your browser</span>
          <span className="inline-flex items-center gap-1.5"><Lock size={13} className="text-rose-500" /> Nothing uploaded</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={13} className="text-indigo-500" /> Results in seconds</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles size={13} className="text-rose-500" /> Shareable card</span>
        </div>
      </section>

      {/* 4. Features Section (Mobile Swipeable Carousel, Desktop Grid) */}
      <section id="features" className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-bold text-rose-500 tracking-wide mb-2">
              POWERFUL INSIGHTS
            </span>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              Everything you need to know about your bond
            </h2>
            <p className="mt-2 text-slate-500 text-sm md:text-base max-w-xl mx-auto">
              Get detailed relationship analysis calculated locally in milliseconds.
            </p>
          </div>

          {/* Layout: Grid on desktop, horizontal scroll on mobile */}
          <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto snap-x md:overflow-visible pb-4 md:pb-0 px-2 md:px-0 -mx-6 md:mx-0 scrollbar-none">

            {/* Feature 1: Who's Into Who (Flagship Premium) */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-500 to-indigo-600 p-6 shadow-md flex flex-col justify-between ml-6 md:ml-0">
              <div>
                <div className="h-10 w-10 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Heart className="fill-white" size={18} />
                </div>
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-1.5">
                  Who's Into Who? <span className="text-[10px] bg-white text-rose-600 px-2 py-0.5 rounded-full font-bold uppercase">Prem</span>
                </h3>
                <p className="text-sm text-white/85 leading-relaxed font-medium">
                  Our flagship verdict. We weigh who initiates, replies faster, double-texts, and shows more affection to crown the more invested partner.
                </p>
              </div>
            </div>

            {/* Feature 2: Reply Time */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-100/50 bg-rose-50/20 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-indigo-200">
                  <Clock size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Reply Time Analysis</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Measure reply speeds to see who leaves the other on read, and who is the instant replier.
                </p>
              </div>
            </div>

            {/* Feature 3: Chat Streaks */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-100/50 bg-rose-50/20 p-6 shadow-sm flex flex-col justify-between mr-6 md:mr-0">
              <div>
                <div className="h-10 w-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-orange-200">
                  <Flame size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Chat Streaks</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Calculate your consecutive texting days streak and see if you have kept the spark alive!
                </p>
              </div>
            </div>

            {/* Feature 4: Flags Audit (Premium) */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-100/50 bg-rose-50/20 p-6 shadow-sm flex flex-col justify-between ml-6 md:ml-0 md:mt-4">
              <div>
                <div className="h-10 w-10 bg-red-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-red-200">
                  <Lock size={16} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  Flags Audit <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Prem</span>
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Audit your relationship flags: check dry responses count (Red Flags) vs romantic keywords count (Green Flags).
                </p>
              </div>
            </div>

            {/* Feature 5: Desperation Meter (Premium) */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-100/50 bg-rose-50/20 p-6 shadow-sm flex flex-col justify-between md:mt-4">
              <div>
                <div className="h-10 w-10 bg-purple-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-purple-200">
                  <Lock size={16} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  Desperation Meter <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Prem</span>
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Tracks the record for consecutive messages sent without getting a reply. Who is chasing who?
                </p>
              </div>
            </div>

            {/* Feature 6: Greeting Champ (Premium) */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-100/50 bg-rose-50/20 p-6 shadow-sm flex flex-col justify-between md:mt-4">
              <div>
                <div className="h-10 w-10 bg-yellow-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-yellow-200">
                  <Lock size={16} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  Greeting Champions <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Prem</span>
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Count who sends the first good morning greeting (6am-10am) and who texts last before bedtime.
                </p>
              </div>
            </div>

            {/* Feature 7: Honeymoon Timeline (Premium) */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-100/50 bg-rose-50/20 p-6 shadow-sm flex flex-col justify-between md:mt-4">
              <div>
                <div className="h-10 w-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-emerald-200">
                  <Lock size={16} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  Honeymoon Timeline <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Prem</span>
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Track message frequency trends over time to identify your Honeymoon phase peak and overall Spark shift.
                </p>
              </div>
            </div>

            {/* Feature 8: Inside Jokes & Lexicon (Premium) */}
            <div className="min-w-[280px] md:min-w-0 snap-center rounded-3xl border border-rose-100/50 bg-rose-50/20 p-6 shadow-sm flex flex-col justify-between mr-6 md:mr-0 md:mt-4">
              <div>
                <div className="h-10 w-10 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-indigo-200">
                  <Lock size={16} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  Lexicon & Inside Jokes <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">Prem</span>
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Count pet names, apologies, questions asked, and check your slang overlap matching score.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Security & Privacy Focus Section (Wi-Fi Tip) */}
      <section id="security" className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/60 bg-white/70 p-8 md:p-12 shadow-lg backdrop-blur-md text-center max-w-3xl mx-auto space-y-6">
            <div className="mx-auto h-16 w-16 bg-green-500/10 border border-green-500/25 rounded-2xl flex items-center justify-center text-green-600 mb-2">
              <ShieldCheck size={36} />
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-slate-800">
              Your Privacy is Our #1 Priority
            </h2>

            <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">
              We never upload your chat history to any servers. All calculations, parsing, and stats rendering happen 100% locally in your web browser.
            </p>

            {/* Pro Tip Box */}
            <div className="p-4 bg-green-50 border border-green-200/50 rounded-2xl inline-block text-left text-xs max-w-md mx-auto">
              <span className="font-bold text-green-700 block mb-0.5">💡 Try This Privacy Test:</span>
              <p className="text-green-600 leading-relaxed font-semibold">
                Once the page is loaded, <strong className="font-black">turn off your Wi-Fi / Mobile Data</strong> and upload your chat file. The analyzer will work perfectly because it runs entirely on your device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Why couples use it (honest — no fabricated testimonial) */}
      <section className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-rose-50/40 border border-rose-100/50 p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />

            {/* 3D Clay Hearts Graphic */}
            <div className="w-28 h-28 relative flex-shrink-0 animate-float overflow-hidden rounded-3xl shadow-sm border border-rose-100">
              <img src="/love_hearts_clay.png" alt="Clay Hearts Hugging" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-4 text-center md:text-left">
              <span className="inline-block rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-[10px] font-black text-rose-500 tracking-widest uppercase">
                Settle the debate
              </span>
              <blockquote className="text-base md:text-lg font-black text-slate-800 leading-snug">
                "Who texts more? Who replies faster? Who's actually more into who?" LoveLens reads your real chat history and gives you the receipts — privately, in seconds.
              </blockquote>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Everything runs on your device. Your messages never leave your browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-rose-100 bg-slate-50 py-12 px-6 text-center text-xs font-semibold text-slate-400">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex items-center justify-center gap-1.5">
            <img src="/lovelens_logo.png" alt="Logo" className="h-4 w-4 object-contain rounded" />
            <span className="text-slate-800 font-black">LoveLens</span>
            <span>© 2026. Made with love for couples worldwide.</span>
          </div>
          <div className="flex items-center justify-center gap-5 text-[11px] font-bold text-slate-500">
            <a href="/privacy" className="hover:text-rose-500 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-rose-500 transition-colors">Terms of Service</a>
            <a href="mailto:hello@getlovelens.com" className="hover:text-rose-500 transition-colors">Contact</a>
          </div>
          <p className="max-w-md mx-auto leading-relaxed text-[10px]">
            LoveLens is an independent analyzer. WhatsApp is a registered trademark of WhatsApp Inc. This website is not affiliated with or endorsed by WhatsApp.
          </p>
        </div>
      </footer>

      {/* 8. Modals/Drawers */}
      <UploadTutorial isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

    </div>
  );
}
