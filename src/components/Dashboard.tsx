"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Heart, MessageSquare, Flame, Calendar, Award, Zap, 
  MessageCircle, Reply, Share2, ArrowLeft, Clock, ShieldCheck, 
  Lock, Sparkles, Moon, Sun, AlertTriangle, ShieldAlert,
  Smile, Frown, Users, Activity, HelpCircle, FileText, ChevronRight, BarChart2,
  TrendingUp, BookOpen, SmilePlus
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from "recharts";
import { ChatStats } from "../utils/chatParser";

import dynamic from "next/dynamic";

// Load on demand: PaywallModal only when unlocking, ShareCard (html-to-image) only when sharing.
const PaywallModal = dynamic(() => import("./PaywallModal"), { ssr: false });
const ShareCard = dynamic(() => import("./ShareCard"), { ssr: false });

interface DashboardProps {
  stats: ChatStats;
  onReset: () => void;
  price?: string;
  checkoutUrl?: string;
}

type TabType = "verdict" | "overview" | "loveaudit" | "timeline" | "lexicon" | "quirks" | "emojis" | "activity";

export default function Dashboard({ stats, onReset, price = "₹249", checkoutUrl }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [revealReady, setRevealReady] = useState(false);
  const [exitToastVisible, setExitToastVisible] = useState(false);
  const [exitToastDismissed, setExitToastDismissed] = useState(false);
  const premiumGalleryRef = React.useRef<HTMLDivElement>(null);

  const {
    participants, totalMessages, messageCounts, wordCounts,
    avgMessageLength, doubleTextCounts, initiationCounts,
    avgResponseTimes, topEmojis, hourlyActivity, weeklyActivity,
    mostActiveDay, longestStreak, currentStreak,
    // Premium stats
    longestSilence, lateNightRatios, daytimeRatios, loveSentimentRatios,
    redFlags, greenFlags, morningTexts, nightTexts, maxConsecutiveTexts,
    uniqueWordsCount, mediaCounts,
    // V5 Premium stats
    monthlyActivity, sparkShift, petNamesCounts, apologyCounts, questionCounts, vocabularyOverlapPct,
    // V6 conversion stats
    firstILoveYou, daysTogether, relationshipStartDate, interestBalance
  } = stats;

  const p1 = participants[0] || "Partner A";
  const p2 = participants[1] || "Partner B";

  const count1 = messageCounts[p1] || 0;
  const count2 = messageCounts[p2] || 0;
  const pct1 = totalMessages > 0 ? Math.round((count1 / totalMessages) * 100) : 50;
  const pct2 = 100 - pct1;

  // Relationship score logic
  const calculateScore = () => {
    let score = 75; // baseline
    const balanceDiff = Math.abs(pct1 - pct2);
    score -= Math.min(15, balanceDiff * 0.3);

    const avgTime1 = avgResponseTimes[p1] || 0;
    const avgTime2 = avgResponseTimes[p2] || 0;
    const combinedAvgResponseMin = (avgTime1 + avgTime2) / 120;
    if (combinedAvgResponseMin < 15) score += 10;
    else if (combinedAvgResponseMin < 60) score += 5;
    else if (combinedAvgResponseMin > 360) score -= 10;

    const affection1 = loveSentimentRatios[p1] || 0;
    const affection2 = loveSentimentRatios[p2] || 0;
    const avgAffection = (affection1 + affection2) / 2;
    score += Math.min(10, avgAffection * 0.5);

    score += Math.min(10, longestStreak * 0.2);

    const spamDiff = Math.abs((maxConsecutiveTexts[p1] || 0) - (maxConsecutiveTexts[p2] || 0));
    score -= Math.min(5, spamDiff * 0.2);

    return Math.max(50, Math.min(99, Math.round(score)));
  };

  const relationshipScore = calculateScore();

  // V6: Interest balance derived helpers (p1Score maps to participants[0] = p1)
  const p1Effort = interestBalance?.p1Score ?? 50;
  const p2Effort = interestBalance?.p2Score ?? 50;
  const effortLeader = p1Effort >= p2Effort ? p1 : p2;
  const effortLeaderPct = Math.max(p1Effort, p2Effort);
  const isBalanced = Math.abs(p1Effort - p2Effort) < 4;

  // Initials for avatar badges
  const initials = (name: string) =>
    name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  // V6: redacted-teaser magnitudes (reveal the juicy number, hide WHO)
  const maxDoubleText = Math.max(doubleTextCounts[p1] || 0, doubleTextCounts[p2] || 0);
  const maxInitiation = Math.max(initiationCounts[p1] || 0, initiationCounts[p2] || 0);
  const maxNightPct = Math.max(lateNightRatios[p1] || 0, lateNightRatios[p2] || 0);
  const nightOwl = (lateNightRatios[p1] || 0) >= (lateNightRatios[p2] || 0) ? p1 : p2;
  const chaser = maxDoubleText === (doubleTextCounts[p1] || 0) ? p1 : p2;
  const starter = maxInitiation === (initiationCounts[p1] || 0) ? p1 : p2;

  // V6: Couple archetype (a fun, shareable verdict derived from existing signals)
  const coupleArchetype = (() => {
    const avgReply = ((avgResponseTimes[p1] || 0) + (avgResponseTimes[p2] || 0)) / 2; // seconds
    const avgAffection = ((loveSentimentRatios[p1] || 0) + (loveSentimentRatios[p2] || 0)) / 2;
    const avgNight = ((lateNightRatios[p1] || 0) + (lateNightRatios[p2] || 0)) / 2;
    if (!isBalanced && effortLeaderPct >= 66) return { emoji: "🎯", name: "The Chaser & The Chased", desc: "One of you leads the dance — the effort gap is real." };
    if (avgNight >= 25) return { emoji: "🦉", name: "The Night Owls", desc: "Your love language is 2am texts." };
    if (avgReply > 0 && avgReply < 600 && avgAffection >= 8) return { emoji: "🐦", name: "The Lovebirds", desc: "Fast replies and big feelings — practically glued to the chat." };
    if (avgReply > 3600) return { emoji: "🐢", name: "The Slow Burners", desc: "You take your time, but you always come back." };
    if (isBalanced) return { emoji: "⚖️", name: "The Power Couple", desc: "Perfectly balanced effort. Relationship goals." };
    return { emoji: "💞", name: "The Steady Pair", desc: "A warm, consistent rhythm that just works." };
  })();

  // Restore lifetime premium unlock (per-device) so a refresh never revokes paid access.
  useEffect(() => {
    try {
      if (localStorage.getItem("lovelens_unlocked_v1") === "true") {
        setIsUnlocked(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Trigger confetti on mount
  useEffect(() => {
    const duration = 1.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#FF4E88", "#8B5CF6", "#F59E0B"]
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#FF4E88", "#8B5CF6", "#F59E0B"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Trigger staggered reveal after a brief moment so the page paints first
    setTimeout(() => setRevealReady(true), 100);
  }, []);

  // Exit-intent toast: show a nudge when user scrolls past the premium gallery without buying
  useEffect(() => {
    if (isUnlocked || exitToastDismissed) return;
    const el = premiumGalleryRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Fire when the gallery leaves the viewport (scrolled past it)
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          // Small delay so it feels natural, not jarring
          setTimeout(() => setExitToastVisible(true), 1500);
          observer.disconnect();
        }
      },
      { threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isUnlocked, exitToastDismissed]);

  // Format hourly data for Recharts
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const formattedHour = hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
    return {
      hour: formattedHour,
      [p1]: hourlyActivity[p1]?.[hour] || 0,
      [p2]: hourlyActivity[p2]?.[hour] || 0,
      total: (hourlyActivity[p1]?.[hour] || 0) + (hourlyActivity[p2]?.[hour] || 0)
    };
  });

  // Format weekly data for Recharts
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weeklyData = daysOfWeek.map((day, idx) => ({
    day: day.substring(0, 3),
    [p1]: weeklyActivity[p1]?.[idx] || 0,
    [p2]: weeklyActivity[p2]?.[idx] || 0,
    total: (weeklyActivity[p1]?.[idx] || 0) + (weeklyActivity[p2]?.[idx] || 0)
  }));

  // Find Peak Month for Spark Timeline (V5)
  let peakMonthStr = "N/A";
  let peakMonthCount = 0;
  for (const [month, count] of Object.entries(monthlyActivity)) {
    if (count > peakMonthCount) {
      peakMonthCount = count;
      peakMonthStr = month;
    }
  }

  let formattedPeakMonth = "N/A";
  if (peakMonthStr !== "N/A") {
    const [year, month] = peakMonthStr.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    formattedPeakMonth = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  // Helpers
  const formatReplySpeed = (sec: number) => {
    if (sec === 0) return "N/A";
    if (sec < 60) return `${sec}s`;
    const mins = Math.round(sec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    return `${hrs}h`;
  };

  function formatLongSilence(sec: number) {
    if (sec < 60) return `${sec}s`;
    const mins = Math.round(sec / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hrs < 24) return `${hrs}h ${remainingMins}m`;
    const days = Math.floor(hrs / 24);
    const remainingHrs = hrs % 24;
    return `${days}d ${remainingHrs}h`;
  }

  const handleUnlockSuccess = () => {
    setIsUnlocked(true);
    setExitToastVisible(false);
    setExitToastDismissed(true);
    try {
      // Lifetime, device-wide unlock — applies to every chat analyzed on this device.
      localStorage.setItem("lovelens_unlocked_v1", "true");
    } catch {
      /* ignore */
    }
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 }
    });
  };

  // Dev-only helper to clear the persisted unlock so the locked flow can be re-tested.
  const resetUnlockForDev = () => {
    setIsUnlocked(false);
    try {
      localStorage.removeItem("lovelens_unlocked_v1");
      localStorage.removeItem("lovelens_license");
    } catch {
      /* ignore */
    }
  };

  // Curiosity Blur Wrapper
  const renderTeasedValue = (value: React.ReactNode, placeholder: string) => {
    if (isUnlocked) {
      return <span className="transition-all duration-300">{value}</span>;
    }
    return (
      <span 
        onClick={(e) => {
          e.stopPropagation();
          setIsPaywallOpen(true);
        }}
        className="relative group cursor-pointer inline-flex items-center gap-1"
      >
        <span className="blur-[5px] select-none filter opacity-50 transition-all font-black">{placeholder}</span>
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white rounded-full p-1 shadow-sm hover:scale-110 active:scale-95 transition-all">
          <Lock size={9} />
        </span>
      </span>
    );
  };

  // V6: Premium highlights gallery (real redacted teasers — reveal the number, hide WHO).
  // Defined here so all helper functions/values above are initialized first.
  const premiumHighlights: {
    icon: string;
    accent: string;
    title: string;
    answer: string;
    sub: string;
    teaser: string;
  }[] = [
    {
      icon: "💗", accent: "bg-rose-50 text-rose-500 border-rose-100",
      title: "First \u201CI Love You\u201D",
      answer: firstILoveYou ? firstILoveYou.sender : "Not found",
      sub: firstILoveYou ? `said it on ${firstILoveYou.date}` : "No declaration detected yet",
      teaser: firstILoveYou ? `Someone said it first on ${firstILoveYou.date}` : "No \u201CI love you\u201D detected yet",
    },
    {
      icon: "📲", accent: "bg-indigo-50 text-indigo-500 border-indigo-100",
      title: "The Chaser",
      answer: chaser,
      sub: `${maxDoubleText.toLocaleString()} double texts`,
      teaser: `One of you double-texted ${maxDoubleText.toLocaleString()}\u00D7 before a reply`,
    },
    {
      icon: "💬", accent: "bg-rose-50 text-rose-500 border-rose-100",
      title: "Conversation Starter",
      answer: starter,
      sub: `${maxInitiation.toLocaleString()} first texts`,
      teaser: `Someone breaks the silence ${maxInitiation.toLocaleString()}\u00D7`,
    },
    {
      icon: "⏳", accent: "bg-amber-50 text-amber-500 border-amber-100",
      title: "Longest Silence",
      answer: longestSilence.ignorer,
      sub: `${formatLongSilence(longestSilence.duration || 0)} of silence`,
      teaser: `Someone got left on read for ${formatLongSilence(longestSilence.duration || 0)}`,
    },
    {
      icon: "🦉", accent: "bg-violet-50 text-violet-500 border-violet-100",
      title: "Night Owl",
      answer: nightOwl,
      sub: `${maxNightPct}% of texts after midnight`,
      teaser: `Someone sends ${maxNightPct}% of texts past midnight`,
    },
    {
      icon: coupleArchetype.emoji, accent: "bg-emerald-50 text-emerald-500 border-emerald-100",
      title: "Couple Archetype",
      answer: coupleArchetype.name,
      sub: coupleArchetype.desc,
      teaser: "We've crowned you a certain type of couple\u2026",
    },
  ];

  // Staggered reveal animation helper
  const revealVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, delay, ease: "easeOut" as const }
    }),
  };

  return (
    <div className="relative min-h-screen pb-28 pt-6 overflow-x-hidden">
      <div className="screen-only">
        {/* Visual background decorations */}
        <div className="absolute top-[10%] left-[-100px] w-[350px] h-[350px] bg-rose-200/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-100px] w-[350px] h-[350px] bg-indigo-200/25 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto w-full max-w-4xl px-4">
        {/* Top Header Navigation — single compact row on mobile */}
        <div className="mb-6 md:mb-8 flex items-center justify-between gap-2">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 rounded-full border border-rose-100 bg-white/80 backdrop-blur-sm px-3 sm:px-5 py-2.5 text-xs font-black text-slate-600 shadow-sm hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95 cursor-pointer flex-shrink-0"
            aria-label="Back to upload"
          >
            <ArrowLeft size={14} /> <span className="hidden sm:inline">Back</span>
          </button>

          <div 
            onClick={onReset} 
            className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-rose-100/50 px-3 sm:px-4 py-2 rounded-full shadow-sm flex-shrink-0 cursor-pointer hover:bg-rose-50/50 hover:border-rose-200 transition-colors"
          >
            <img src="/lovelens_logo.png" alt="LoveLens Logo" className="h-5 w-5 object-contain rounded" />
            <h1 className="text-sm font-black text-slate-800 tracking-tight hidden sm:block">LoveLens</h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsShareOpen(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-indigo-500 hover:opacity-95 px-3.5 sm:px-5 py-2.5 text-xs font-black text-white shadow-md shadow-rose-200 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              aria-label="Share card"
            >
              <Share2 size={14} /> <span className="hidden sm:inline">Share Card</span>
            </button>
            <button
              onClick={() => {
                if (!isUnlocked) {
                  setIsPaywallOpen(true);
                } else {
                  window.print();
                }
              }}
              className="flex items-center justify-center gap-1.5 rounded-full bg-white border border-rose-100 hover:border-rose-200 px-3.5 sm:px-4 py-2.5 text-xs font-black text-slate-600 shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              aria-label="Download PDF report"
            >
              {isUnlocked ? (
                <FileText size={14} className="text-rose-500" />
              ) : (
                <Lock size={12} className="text-rose-400" />
              )}
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Brand Banner */}
        <motion.div
          className="mb-8 text-center"
          variants={revealVariants}
          initial="hidden"
          animate={revealReady ? "visible" : "hidden"}
          custom={0}
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100/60 px-4 py-1.5 text-[10px] font-black text-rose-500 tracking-widest uppercase mb-3 shadow-sm">
            <Sparkles size={10} className="animate-pulse" /> CHAT ANALYSIS WRAPPED
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 md:text-4xl bg-gradient-to-r from-slate-800 via-rose-500 to-indigo-600 bg-clip-text text-transparent break-words px-2">
            {p1} & {p2}
          </h2>
          <p className="mt-1.5 text-slate-400 text-xs font-semibold">
            All stats calculated locally inside your web browser.
          </p>
        </motion.div>

        {/* Relationship Score Hero Card */}
        <motion.div
          className="mb-8 relative overflow-hidden rounded-3xl border border-rose-100/50 bg-gradient-to-br from-white/95 via-rose-50/20 to-indigo-50/30 p-6 shadow-md backdrop-blur-md"
          variants={revealVariants}
          initial="hidden"
          animate={revealReady ? "visible" : "hidden"}
          custom={0.15}
        >
          {/* Decorative glows inside card */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-400/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-5 md:gap-6 relative z-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100/60 px-3 py-1 text-[9px] font-black text-rose-500 tracking-wider uppercase shadow-sm">
                💖 Chemistry Meter
              </span>
              <h3 className="text-xl font-black text-slate-800">Your Relationship Score</h3>
              <p className="text-xs text-slate-500 font-semibold max-w-md leading-relaxed">
                {relationshipScore >= 90 
                  ? "Unstoppable connection! You two share an exceptional texting compatibility, replying fast and maintaining deep mutual engagement. 🏆"
                  : relationshipScore >= 75
                    ? "Strong chemistry! You maintain a balanced chat dynamic with great emotional warmth and steady rhythms. 💫"
                    : "Work in progress! You might have different texting speeds or active times, but the effort is definitely there. ☕"}
              </p>
            </div>
            
            {/* Score Ring UI */}
            <div className="relative flex items-center justify-center h-28 w-28 flex-shrink-0">
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#FFE4E6" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                {/* Foreground Progress Ring with Gradient */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="url(#scoreGradient)" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * relationshipScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF4E88" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Inner score text */}
              <div className="flex flex-col items-center justify-center relative">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{relationshipScore}%</span>
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5 animate-pulse">Match</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* (Free stats + premium gallery relocated below the flagship for conversion) */}

        {/* FLAGSHIP: "Who's Into Who More?" Interest Balance Hero */}
        <motion.div
          className="mb-8 relative overflow-hidden rounded-3xl border border-rose-300/40 bg-gradient-to-br from-rose-500 via-rose-500 to-indigo-600 p-6 md:p-8 shadow-xl"
          variants={revealVariants}
          initial="hidden"
          animate={revealReady ? "visible" : "hidden"}
          custom={0.35}
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[9px] font-black text-white tracking-widest uppercase backdrop-blur-sm border border-white/20">
                💘 The Big Question
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black text-rose-600 tracking-wider uppercase shadow-sm">
                {isUnlocked ? <><Sparkles size={9} className="fill-rose-500 text-rose-500" /> Revealed</> : <><Lock size={9} /> Locked</>}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black text-white text-center tracking-tight">Who's more into who?</h3>
            <p className="text-[10px] font-black text-white/60 text-center uppercase tracking-[0.2em] mt-1 mb-6">Interest &amp; Effort Balance</p>

            {/* VS battle row */}
            <div className="flex items-end justify-center gap-3 md:gap-8 mb-6">
              {/* Partner 1 */}
              <div className="flex flex-col items-center gap-2 flex-1 max-w-[38%]">
                <div className={`relative h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center text-lg md:text-2xl font-black shadow-lg ring-4 bg-white text-rose-600 ${isUnlocked && !isBalanced && effortLeader === p1 ? "ring-yellow-300 scale-110" : "ring-white/30"}`}>
                  {initials(p1)}
                  {isUnlocked && !isBalanced && effortLeader === p1 && <span className="absolute -top-4 text-2xl drop-shadow">👑</span>}
                </div>
                <span className="text-xs font-black text-white truncate max-w-full">{p1}</span>
                {isUnlocked
                  ? <span className="text-xl font-black text-white">{p1Effort}%</span>
                  : <span className="text-xl font-black text-white/50 blur-[4px] select-none">??%</span>}
              </div>

              {/* Center VS */}
              <div className="flex flex-col items-center pb-8">
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm flex items-center justify-center text-white font-black text-xs md:text-sm shadow-inner">VS</div>
              </div>

              {/* Partner 2 */}
              <div className="flex flex-col items-center gap-2 flex-1 max-w-[38%]">
                <div className={`relative h-16 w-16 md:h-20 md:w-20 rounded-full flex items-center justify-center text-lg md:text-2xl font-black shadow-lg ring-4 bg-white text-indigo-600 ${isUnlocked && !isBalanced && effortLeader === p2 ? "ring-yellow-300 scale-110" : "ring-white/30"}`}>
                  {initials(p2)}
                  {isUnlocked && !isBalanced && effortLeader === p2 && <span className="absolute -top-4 text-2xl drop-shadow">👑</span>}
                </div>
                <span className="text-xs font-black text-white truncate max-w-full">{p2}</span>
                {isUnlocked
                  ? <span className="text-xl font-black text-white">{p2Effort}%</span>
                  : <span className="text-xl font-black text-white/50 blur-[4px] select-none">??%</span>}
              </div>
            </div>

            {isUnlocked ? (
              <>
                <div className="h-5 w-full overflow-hidden rounded-full bg-black/25 p-0.5 flex shadow-inner mb-4">
                  <div className="h-full rounded-l-full bg-white transition-all duration-700" style={{ width: `${p1Effort}%` }} />
                  <div className="h-full rounded-r-full bg-yellow-300 transition-all duration-700" style={{ width: `${p2Effort}%` }} />
                </div>
                <div className="rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm p-4 text-center">
                  <p className="text-xs md:text-sm font-bold text-white leading-relaxed">{interestBalance.verdict}</p>
                </div>
              </>
            ) : (
              <>
                {/* Mystery bar — equal halves so width reveals nothing */}
                <div className="relative h-9 w-full overflow-hidden rounded-full bg-black/25 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex">
                    <div className="h-full w-1/2 bg-white/20" />
                    <div className="h-full w-1/2 bg-white/10" />
                  </div>
                  <div className="relative flex items-center gap-1.5 text-white font-black text-[11px] uppercase tracking-wider">
                    <Lock size={12} /> {isBalanced ? "Too close to call…" : `One of you carries ${effortLeaderPct}%`}
                  </div>
                </div>
                <p className="text-center text-xs font-bold text-white/85 mb-5 max-w-md mx-auto leading-relaxed">
                  {isBalanced
                    ? "Your effort split is surprisingly close… but there's still a winner. Unlock to see who. 👀"
                    : `One of you is putting in ${effortLeaderPct}% of the effort — initiating, replying faster, being more affectionate. But who? 👀`}
                </p>
                <button
                  onClick={() => setIsPaywallOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-rose-600 shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  <Lock size={14} /> Reveal who's more into who · {price}
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Premium Insights Gallery — the juicy locked stuff, surfaced high up */}
        <motion.div
          ref={premiumGalleryRef}
          className="mb-8"
          variants={revealVariants}
          initial="hidden"
          animate={revealReady ? "visible" : "hidden"}
          custom={0.55}
        >          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                {isUnlocked ? <>Your Juiciest Insights <Sparkles size={16} className="text-rose-500 fill-rose-500" /></> : <>The Stuff You Really Want 👀</>}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {isUnlocked ? "The highlights from your full premium report." : "We crunched the spicy stats. Tap any card to reveal who."}
              </p>
            </div>
            {!isUnlocked && (
              <button
                onClick={() => setIsPaywallOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-600 px-5 py-3 text-xs font-black text-white shadow-md shadow-rose-200 hover:scale-[1.01] active:scale-[0.98] transition-all"
              >
                <Lock size={13} /> Unlock all · {price}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {premiumHighlights.map((item, idx) => (
              <button
                key={idx}
                onClick={() => !isUnlocked && setIsPaywallOpen(true)}
                className={`text-left rounded-3xl border p-4 md:p-5 shadow-sm backdrop-blur-md transition-all duration-300 ${
                  isUnlocked
                    ? "border-white/60 bg-white/80 cursor-default"
                    : "border-rose-100 bg-white/70 cursor-pointer hover:border-rose-300 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`h-9 w-9 rounded-xl border flex items-center justify-center text-base ${item.accent}`}>
                    {item.icon}
                  </span>
                  {!isUnlocked && (
                    <span className="h-6 w-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                      <Lock size={11} />
                    </span>
                  )}
                </div>
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">{item.title}</span>
                {isUnlocked ? (
                  <>
                    <h4 className="text-base font-black text-slate-800 mt-1 leading-tight break-words">{item.answer}</h4>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-snug">{item.sub}</p>
                  </>
                ) : (
                  <>
                    <h4 className="text-base font-black text-slate-300 mt-1 blur-[5px] select-none">●●●●●</h4>
                    <p className="text-[10px] font-bold text-rose-500 mt-1 leading-snug line-clamp-2">{item.teaser}</p>
                  </>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Condensed Free Stats Strip */}
        <motion.div
          className="mb-8"
          variants={revealVariants}
          initial="hidden"
          animate={revealReady ? "visible" : "hidden"}
          custom={0.7}
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
            Talking since {relationshipStartDate} · {daysTogether.toLocaleString()} days together
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { icon: <MessageSquare size={14} />, color: "bg-rose-500", label: "Total Texts", value: totalMessages.toLocaleString() },
              { icon: <Award size={14} />, color: "bg-indigo-500", label: "Total Words", value: ((wordCounts[p1] || 0) + (wordCounts[p2] || 0)).toLocaleString() },
              { icon: <Flame size={14} />, color: "bg-orange-500", label: "Streak Record", value: `${longestStreak}d` },
              { icon: <Flame size={14} />, color: "bg-rose-400", label: "Current Streak", value: currentStreak > 0 ? `${currentStreak}d 🔥` : "—" },
              { icon: <Calendar size={14} />, color: "bg-purple-500", label: "Busiest Day", value: `${mostActiveDay.count}` },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur-md flex items-center gap-2.5">
                <span className={`h-8 w-8 rounded-lg ${s.color} text-white flex items-center justify-center flex-shrink-0`}>{s.icon}</span>
                <div className="min-w-0">
                  <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider truncate">{s.label}</span>
                  <span className="block text-sm font-black text-slate-800 truncate">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tab Selectors — natural-width scroll on mobile, equal-width on desktop */}
        <motion.div
          className="mb-8 flex overflow-x-auto rounded-2xl bg-slate-100 p-1.5 border border-slate-200/40 scrollbar-none snap-x gap-1"
          variants={revealVariants}
          initial="hidden"
          animate={revealReady ? "visible" : "hidden"}
          custom={0.85}
        >
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "verdict", label: "The Verdict 💘", locked: !isUnlocked },
              { id: "emojis", label: "Emoji Battle" },
              { id: "activity", label: "Activity Rhythm" },
              { id: "loveaudit", label: "Love Audit", locked: !isUnlocked },
              { id: "timeline", label: "Spark Timeline", locked: !isUnlocked },
              { id: "lexicon", label: "Lexicon & Jokes", locked: !isUnlocked },
              { id: "quirks", label: "Habit Quirks", locked: !isUnlocked }
            ] as { id: TabType; label: string; locked?: boolean }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 md:flex-1 snap-start py-2.5 px-3.5 md:px-4 rounded-xl font-bold text-[11px] md:text-xs text-center whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-1 ${
                activeTab === tab.id
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.locked && <Lock size={10} className="text-slate-400" />}
            </button>
          ))}
        </motion.div>

        {/* Tab Content Display Area */}
        <motion.div
          className="min-h-[380px]"
          variants={revealVariants}
          initial="hidden"
          animate={revealReady ? "visible" : "hidden"}
          custom={1.0}
        >
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Who Texts More */}
              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageCircle className="text-rose-500" size={16} /> Who Texts More?
                </h3>
                <div className="flex justify-between items-end text-xs font-black text-slate-600 mb-2">
                  <span>{p1} ({pct1}%)</span>
                  <span>{p2} ({pct2}%)</span>
                </div>
                <div className="h-5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 border border-white shadow-inner flex">
                  <div 
                    className="h-full rounded-l-full bg-gradient-to-r from-rose-500 to-rose-400 flex items-center justify-center text-[9px] text-white font-extrabold transition-all duration-500" 
                    style={{ width: `${pct1}%` }}
                  >
                    {pct1 >= 15 && `${pct1}%`}
                  </div>
                  <div 
                    className="h-full rounded-r-full bg-gradient-to-r from-indigo-400 to-indigo-500 flex items-center justify-center text-[9px] text-white font-extrabold transition-all duration-500" 
                    style={{ width: `${pct2}%` }}
                  >
                    {pct2 >= 15 && `${pct2}%`}
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold text-slate-500 text-center leading-relaxed">
                  {count1 === count2 
                    ? "An absolute 50/50 balance! You two are perfectly in harmony." 
                    : count1 > count2 
                      ? `${p1} takes the lead with ${count1.toLocaleString()} messages, while ${p2} sent ${count2.toLocaleString()}.`
                      : `${p2} takes the lead with ${count2.toLocaleString()} messages, while ${p1} sent ${count1.toLocaleString()}.`
                  }
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Box: Avg reply time */}
                <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Reply className="text-rose-500" size={14} /> Average Reply Speed
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-slate-600 truncate max-w-[150px]">{p1}</span>
                      <span className="font-extrabold text-slate-800">{formatReplySpeed(avgResponseTimes[p1] || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-3">
                      <span className="text-slate-600 truncate max-w-[150px]">{p2}</span>
                      <span className="font-extrabold text-slate-800">{formatReplySpeed(avgResponseTimes[p2] || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Premium Box: Longest Silence Gap */}
                <div 
                  onClick={() => !isUnlocked && setIsPaywallOpen(true)}
                  className={`rounded-3xl border p-6 shadow-md backdrop-blur-md transition-all duration-300 ${
                    isUnlocked ? "border-white/60 bg-white/70" : "border-rose-100 bg-rose-50/10 cursor-pointer hover:border-rose-300"
                  }`}
                >
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="text-rose-500" size={14} /> Longest Silence Record
                    </span>
                    {!isUnlocked && (
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Lock size={8} /> Premium
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1">
                    <div className="text-xl font-black text-slate-800">
                      {renderTeasedValue(formatLongSilence(longestSilence.duration || 0), "14h 23m")}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 mt-1">
                      {isUnlocked ? (
                        <>Taken by <strong className="font-black">{longestSilence.ignorer}</strong> on {longestSilence.date}</>
                      ) : (
                        <>Ignored by {renderTeasedValue("Alex", "Partner")} on {renderTeasedValue("Nov 12", "Date")}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: THE VERDICT (V6 FLAGSHIP PREMIUM) */}
          {activeTab === "verdict" && (
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-lg font-black text-slate-800">The Verdict 💘</h3>
                <p className="text-xs font-semibold text-slate-500">Who's actually more into who — broken down signal by signal.</p>
              </div>

              {/* Effort breakdown */}
              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Activity className="text-rose-500" size={14} /> Effort Signals — Who Leads Each
                </h4>
                <div className="space-y-3">
                  {[
                    { label: "Starts conversations", leader: (initiationCounts[p1] || 0) >= (initiationCounts[p2] || 0) ? p1 : p2, icon: "💬" },
                    { label: "Replies faster", leader: ((avgResponseTimes[p1] || Infinity) <= (avgResponseTimes[p2] || Infinity)) ? p1 : p2, icon: "⚡" },
                    { label: "More affectionate", leader: (loveSentimentRatios[p1] || 0) >= (loveSentimentRatios[p2] || 0) ? p1 : p2, icon: "❤️" },
                    { label: "Double-texts more", leader: (doubleTextCounts[p1] || 0) >= (doubleTextCounts[p2] || 0) ? p1 : p2, icon: "📲" },
                    { label: "Writes more", leader: (wordCounts[p1] || 0) >= (wordCounts[p2] || 0) ? p1 : p2, icon: "✍️" }
                  ].map((sig, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-600 border-b border-slate-100/50 last:border-0 pb-2.5 last:pb-0">
                      <span className="flex items-center gap-2"><span>{sig.icon}</span> {sig.label}</span>
                      <span className="font-black text-rose-500">
                        {renderTeasedValue(sig.leader, "Partner")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-gradient-to-r from-rose-50 to-indigo-50 border border-rose-100 p-4 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Overall Verdict</span>
                  {isUnlocked ? (
                    <p className="text-sm font-black text-slate-800 leading-relaxed">{interestBalance.verdict}</p>
                  ) : (
                    <p className="text-sm font-black text-slate-800">
                      {renderTeasedValue(`${effortLeader} is more invested`, "Someone is more invested")}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Who said I love you first */}
                <div
                  onClick={() => !isUnlocked && setIsPaywallOpen(true)}
                  className={`rounded-3xl border p-6 shadow-md backdrop-blur-md ${isUnlocked ? "border-white/60 bg-white/70" : "border-rose-100 bg-rose-50/10 cursor-pointer hover:border-rose-300"}`}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Who Said "I Love You" First 💗</span>
                  {firstILoveYou ? (
                    <>
                      <h4 className="text-2xl font-black text-slate-800">
                        {renderTeasedValue(firstILoveYou.sender, "Partner")}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 mt-2">
                        {isUnlocked
                          ? `Dropped the L-word first on ${firstILoveYou.date}.`
                          : <>Someone blinked first on {firstILoveYou.date}. Unlock to see who. 👀</>}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 mt-2">No explicit "I love you" detected in this chat yet.</p>
                  )}
                </div>

                {/* Who chases more */}
                <div
                  onClick={() => !isUnlocked && setIsPaywallOpen(true)}
                  className={`rounded-3xl border p-6 shadow-md backdrop-blur-md ${isUnlocked ? "border-white/60 bg-white/70" : "border-rose-100 bg-rose-50/10 cursor-pointer hover:border-rose-300"}`}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">The Chaser 📲 (Double Texts)</span>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-600 truncate max-w-[120px]">{p1}</span>
                    <span className="font-extrabold text-slate-800">{renderTeasedValue(`${doubleTextCounts[p1] || 0}x`, "128x")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-2.5">
                    <span className="text-slate-600 truncate max-w-[120px]">{p2}</span>
                    <span className="font-extrabold text-slate-800">{renderTeasedValue(`${doubleTextCounts[p2] || 0}x`, "44x")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-50 pt-2">
                    Times one of you sent a follow-up before getting a reply.
                  </p>
                </div>

                {/* Who initiates */}
                <div
                  onClick={() => !isUnlocked && setIsPaywallOpen(true)}
                  className={`rounded-3xl border p-6 shadow-md backdrop-blur-md ${isUnlocked ? "border-white/60 bg-white/70" : "border-rose-100 bg-rose-50/10 cursor-pointer hover:border-rose-300"}`}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">The Conversation Starter 💬</span>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-600 truncate max-w-[120px]">{p1}</span>
                    <span className="font-extrabold text-slate-800">{renderTeasedValue(`${initiationCounts[p1] || 0}x`, "312x")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-2.5">
                    <span className="text-slate-600 truncate max-w-[120px]">{p2}</span>
                    <span className="font-extrabold text-slate-800">{renderTeasedValue(`${initiationCounts[p2] || 0}x`, "190x")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-50 pt-2">
                    Who breaks the silence and texts first after a long gap.
                  </p>
                </div>

                {/* Avg message length */}
                <div
                  onClick={() => !isUnlocked && setIsPaywallOpen(true)}
                  className={`rounded-3xl border p-6 shadow-md backdrop-blur-md ${isUnlocked ? "border-white/60 bg-white/70" : "border-rose-100 bg-rose-50/10 cursor-pointer hover:border-rose-300"}`}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Essayist vs One-Worder ✍️</span>
                  <div className="flex justify-between items-center text-sm font-semibold mb-2">
                    <span className="text-slate-600 truncate max-w-[120px]">{p1}</span>
                    <span className="font-extrabold text-slate-800">{renderTeasedValue(`${avgMessageLength[p1] || 0} words/msg`, "12.4 words/msg")}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-2.5">
                    <span className="text-slate-600 truncate max-w-[120px]">{p2}</span>
                    <span className="font-extrabold text-slate-800">{renderTeasedValue(`${avgMessageLength[p2] || 0} words/msg`, "4.1 words/msg")}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-50 pt-2">
                    Average words per message — who pours their heart out.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOVE AUDIT (RED & GREEN FLAGS) (PREMIUM) */}
          {activeTab === "loveaudit" && (
            <div className="space-y-6 relative">
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-black text-slate-800">Relationship Flags Audit</h3>
                  <p className="text-xs font-semibold text-slate-500">A side-by-side count of habits, words of affection, and argument frequency.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* RED FLAGS BOX */}
                  <div className="rounded-3xl border border-red-100 bg-white/70 p-6 shadow-md backdrop-blur-md">
                    <h4 className="text-sm font-black text-red-500 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-red-50 pb-2">
                      <ShieldAlert size={16} /> Red Flags Audit
                    </h4>
                    <div className="space-y-4">
                      {/* Stat 1: Dry Responding */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Dry Responses ("ok", "k", "yeah")</span>
                          <span className="text-red-500 font-black">
                            {renderTeasedValue(`${p1}: ${redFlags.dryTexts[p1]} | ${p2}: ${redFlags.dryTexts[p2]}`, "p1: 24 | p2: 120")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Flat, low-effort replies.</p>
                      </div>

                      {/* Stat 2: Argument Words */}
                      <div className="flex flex-col gap-1 border-t border-slate-100/50 pt-3">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Argument Word Count</span>
                          <span className="text-red-500 font-black">
                            {renderTeasedValue(`${p1}: ${redFlags.arguments[p1]} | ${p2}: ${redFlags.arguments[p2]}`, "p1: 15 | p2: 4")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Frequency of words like “stop”, “angry”, “fight”, “ignore”.</p>
                      </div>
                    </div>
                  </div>

                  {/* GREEN FLAGS BOX */}
                  <div className="rounded-3xl border border-green-100 bg-white/70 p-6 shadow-md backdrop-blur-md">
                    <h4 className="text-sm font-black text-green-600 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b border-green-50 pb-2">
                      <ShieldCheck size={16} className="text-green-600" /> Green Flags Audit
                    </h4>
                    <div className="space-y-4">
                      {/* Stat 1: Words of Affection */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Words of Affection</span>
                          <span className="text-green-600 font-black">
                            {renderTeasedValue(`${p1}: ${greenFlags.affection[p1]} | ${p2}: ${greenFlags.affection[p2]}`, "p1: 284 | p2: 125")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Counts terms like “love”, “babe”, “miss you”, “cute”.</p>
                      </div>

                      {/* Stat 2: Long Texts */}
                      <div className="flex flex-col gap-1 border-t border-slate-100/50 pt-3">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                          <span>Paragraph Text messages</span>
                          <span className="text-green-600 font-black">
                            {renderTeasedValue(`${p1}: ${greenFlags.longTexts[p1]} | ${p2}: ${greenFlags.longTexts[p2]}`, "p1: 42 | p2: 14")}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Messages containing 20+ words.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPARK TIMELINE (V5 PREMIUM NEW) */}
          {activeTab === "timeline" && (
            <div className="space-y-6 relative">
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-black text-slate-800">Honeymoon & Spark Timeline</h3>
                  <p className="text-xs font-semibold text-slate-500">Nostalgic comparison of your relationship stages.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Honeymoon peak card */}
                  <div className="rounded-3xl border border-rose-100 bg-rose-50/20 p-6 shadow-md backdrop-blur-md flex flex-col justify-between h-44">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Honeymoon Peak Month 📈</span>
                      <h4 className="text-2xl font-black text-slate-800">
                        {renderTeasedValue(formattedPeakMonth, "October 2024")}
                      </h4>
                      <p className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed">
                        Your absolute peak texting month! You exchanged {renderTeasedValue(peakMonthCount.toLocaleString(), "12,481")} messages.
                      </p>
                    </div>
                  </div>

                  {/* Spark Shift card */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md flex flex-col justify-between h-44">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Spark Shift (Early vs Recent) ⚡</span>
                      <div className="flex justify-between items-center text-sm font-semibold mb-2">
                        <span className="text-slate-500">Early Stage Daily Avg:</span>
                        <span className="font-extrabold text-slate-800">
                          {renderTeasedValue(`${sparkShift.firstPeriodAvg} texts/day`, "180 texts/day")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-2.5">
                        <span className="text-slate-500">Recent Stage Daily Avg:</span>
                        <span className="font-extrabold text-slate-800">
                          {renderTeasedValue(`${sparkShift.recentPeriodAvg} texts/day`, "84 texts/day")}
                        </span>
                      </div>
                    </div>
                    
                    {/* Spark shift calculation indicator badge */}
                    <div className="mt-2 text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
                      {isUnlocked ? (
                        sparkShift.recentPeriodAvg >= sparkShift.firstPeriodAvg ? (
                          <span>🔥 Texting increased by {Math.round(((sparkShift.recentPeriodAvg - sparkShift.firstPeriodAvg) / Math.max(1, sparkShift.firstPeriodAvg)) * 100)}%! The spark is stronger than ever!</span>
                        ) : (
                          <span>☕ Texting decreased by {Math.round(((sparkShift.firstPeriodAvg - sparkShift.recentPeriodAvg) / Math.max(1, sparkShift.firstPeriodAvg)) * 100)}%. Time to plan a date night!</span>
                        )
                      ) : (
                        <span>Locked • Compare first 30 days vs last 30 days</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LEXICON & JOKES (V5 PREMIUM NEW) */}
          {activeTab === "lexicon" && (
            <div className="space-y-6 relative">
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-black text-slate-800">Inside Jokes & Lexicon Audit</h3>
                  <p className="text-xs font-semibold text-slate-500">Detailed stats on your pet names, peacekeepers, and vocab overlaps.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pet Names counts */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">Pet Names Used 💖</span>
                    <div className="flex justify-between items-center text-sm font-semibold mb-2">
                      <span className="text-slate-600 truncate max-w-[120px]">{p1}</span>
                      <span className="font-extrabold text-slate-800">
                        {renderTeasedValue(`${petNamesCounts[p1]} times`, "284 times")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-2.5">
                      <span className="text-slate-600 truncate max-w-[120px]">{p2}</span>
                      <span className="font-extrabold text-slate-800">
                        {renderTeasedValue(`${petNamesCounts[p2]} times`, "125 times")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-50 pt-2">
                      Counts terms like “babe”, “baby”, “honey”, “darling”, “shona”, “jaan”.
                    </p>
                  </div>

                  {/* Apology counts */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">The Peacekeeper Meter (Apologies) 🙏</span>
                    <div className="flex justify-between items-center text-sm font-semibold mb-2">
                      <span className="text-slate-600 truncate max-w-[120px]">{p1}</span>
                      <span className="font-extrabold text-slate-800">
                        {renderTeasedValue(`${apologyCounts[p1]} apologies`, "42 apologies")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-2.5">
                      <span className="text-slate-600 truncate max-w-[120px]">{p2}</span>
                      <span className="font-extrabold text-slate-800">
                        {renderTeasedValue(`${apologyCounts[p2]} apologies`, "14 apologies")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-3 border-t border-slate-50 pt-2">
                      Counts how often you say “sorry”, “apologize”, “my bad”.
                    </p>
                  </div>

                  {/* Vocabulary Overlap */}
                  <div className="rounded-3xl border border-rose-100 bg-rose-50/20 p-6 shadow-md backdrop-blur-md flex flex-col justify-between h-40">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Slang & Vocabulary Overlap 🤝</span>
                      <h4 className="text-2xl font-black text-slate-800">
                        {renderTeasedValue(`${vocabularyOverlapPct}% Match`, "72% Match")}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-2">
                        This calculates the overlap of unique words shared between you two. The higher it is, the more inside slang you share!
                      </p>
                    </div>
                  </div>

                  {/* Curiosity count */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md flex flex-col justify-between h-40">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Curiosity Index (Questions Asked) ❓</span>
                      <div className="flex justify-between items-center text-sm font-semibold mb-2 mt-2">
                        <span className="text-slate-600 truncate max-w-[120px]">{p1}</span>
                        <span className="font-extrabold text-slate-800">
                          {renderTeasedValue(`${questionCounts[p1]?.toLocaleString()} ?`, "1,284 ?")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-semibold border-t border-slate-100/50 pt-2">
                        <span className="text-slate-600 truncate max-w-[120px]">{p2}</span>
                        <span className="font-extrabold text-slate-800">
                          {renderTeasedValue(`${questionCounts[p2]?.toLocaleString()} ?`, "921 ?")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: HABIT QUIRKS (PREMIUM) */}
          {activeTab === "quirks" && (
            <div className="space-y-6 relative">
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-black text-slate-800">Behavioral Habits & Quirks</h3>
                  <p className="text-xs font-semibold text-slate-500">Fun texting metrics calculated purely on your message patterns.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Greetings */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                      ☀️ Morning vs 🌙 Night Greetings
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>Good Morning Texts Sent (6am - 10am)</span>
                        <span className="text-rose-500 font-black">
                          {renderTeasedValue(`${p1}: ${morningTexts[p1]} | ${p2}: ${morningTexts[p2]}`, "p1: 48 | p2: 12")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-t border-slate-100/50 pt-3">
                        <span>Good Night Texts Sent (10pm - 2am)</span>
                        <span className="text-indigo-500 font-black">
                          {renderTeasedValue(`${p1}: ${nightTexts[p1]} | ${p2}: ${nightTexts[p2]}`, "p1: 85 | p2: 124")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Desperation */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                      🤡 Spam Desperation Meter
                    </h4>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600">
                        Maximum number of consecutive texts sent in a row before receiving a reply:
                      </p>
                      <div className="flex justify-between items-end font-black text-sm text-rose-500 pt-2">
                        <span>{p1}: {renderTeasedValue(`${maxConsecutiveTexts[p1]} texts`, "14 texts")}</span>
                        <span>{p2}: {renderTeasedValue(`${maxConsecutiveTexts[p2]} texts`, "4 texts")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vocabulary size */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                      🗣️ Vocabulary Size (Unique Words)
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>{p1}'s Unique Words count</span>
                        <span className="text-rose-500 font-black">
                          {renderTeasedValue(`${uniqueWordsCount[p1]?.toLocaleString()} words`, "4,821 words")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-t border-slate-100/50 pt-3">
                        <span>{p2}'s Unique Words count</span>
                        <span className="text-indigo-500 font-black">
                          {renderTeasedValue(`${uniqueWordsCount[p2]?.toLocaleString()} words`, "3,281 words")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Media counts */}
                  <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md space-y-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                      🎙️ Media & Voice Notes Count
                    </h4>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                        <span>{p1}'s Media Attachments</span>
                        <span className="text-rose-500 font-black">
                          {renderTeasedValue(`${mediaCounts[p1]} files`, "421 files")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-slate-600 border-t border-slate-100/50 pt-3">
                        <span>{p2}'s Media Attachments</span>
                        <span className="text-indigo-500 font-black">
                          {renderTeasedValue(`${mediaCounts[p2]} files`, "185 files")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EMOJI BATTLE */}
          {activeTab === "emojis" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                <h3 className="text-sm font-black text-rose-500 uppercase tracking-wider mb-4 border-b border-rose-100/50 pb-2">{p1}'s Top Emojis</h3>
                {topEmojis[p1] && topEmojis[p1].length > 0 ? (
                  <div className="space-y-3">
                    {topEmojis[p1].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-rose-100/30 p-3 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-xs font-black text-slate-600">Rank #{idx + 1}</span>
                        </div>
                        <span className="text-xs font-black text-rose-500 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">{item.count} times</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">No emojis detected.</div>
                )}
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                <h3 className="text-sm font-black text-indigo-500 uppercase tracking-wider mb-4 border-b border-indigo-100/50 pb-2">{p2}'s Top Emojis</h3>
                {topEmojis[p2] && topEmojis[p2].length > 0 ? (
                  <div className="space-y-3">
                    {topEmojis[p2].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-indigo-100/30 p-3 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="text-xs font-black text-slate-600">Rank #{idx + 1}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">{item.count} times</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs font-semibold">No emojis detected.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ACTIVITY RHYTHM */}
          {activeTab === "activity" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart2 className="text-rose-500" size={16} /> Daily Texting Rhythm
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorP1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF4E88" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF4E88" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorP2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="hour" tick={{ fontSize: 9, fontWeight: "bold" }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 9, fontWeight: "bold" }} stroke="#94A3B8" />
                      <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid #F1F5F9", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                      <Area type="monotone" dataKey={p1} stroke="#FF4E88" strokeWidth={2} fillOpacity={1} fill="url(#colorP1)" />
                      <Area type="monotone" dataKey={p2} stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorP2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/70 p-6 shadow-md backdrop-blur-md">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="text-rose-500" size={16} /> Active Days of the Week
                </h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: "bold" }} stroke="#94A3B8" />
                      <YAxis tick={{ fontSize: 10, fontWeight: "bold" }} stroke="#94A3B8" />
                      <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid #F1F5F9" }} />
                      <Bar dataKey={p1} fill="#FF4E88" radius={[4, 4, 0, 0]} />
                      <Bar dataKey={p2} fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

        </motion.div>

      </div>

      {/* Sticky unlock CTA — always visible when locked, so non-scrollers still convert */}
      {!isUnlocked && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-xl flex items-center justify-between gap-3 rounded-2xl border border-rose-200/60 bg-white/90 backdrop-blur-md px-4 py-3 shadow-xl shadow-rose-200/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm"><Lock size={15} /></span>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">{isBalanced ? "Who edges ahead? 👀" : `Who's putting in ${effortLeaderPct}%? 👀`}</p>
                <p className="text-[10px] font-semibold text-slate-500 truncate">Unlock the verdict + 15 insights · lifetime access</p>
              </div>
            </div>
            <button
              onClick={() => setIsPaywallOpen(true)}
              className="whitespace-nowrap rounded-xl bg-rose-500 hover:bg-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-rose-200 active:scale-95 transition-all"
            >
              Unlock {price}
            </button>
          </div>
        </div>
      )}
      {/* Dev-only: reset the unlock flag to re-test the locked → pay → unlock flow */}
      {process.env.NODE_ENV !== "production" && (
        <button
          onClick={resetUnlockForDev}
          className="fixed bottom-4 left-4 z-50 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-[10px] font-black text-slate-500 shadow-md backdrop-blur-sm hover:text-rose-500 hover:border-rose-300 transition-colors"
        >
          🔧 Reset unlock (dev)
        </button>
      )}

      {/* Exit-intent toast nudge — slides up when user scrolls past locked content */}
      <AnimatePresence>
        {exitToastVisible && !isUnlocked && !exitToastDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 max-w-[300px] w-full"
          >
            <div className="relative rounded-2xl border border-rose-200/60 bg-white/95 backdrop-blur-md p-4 shadow-2xl shadow-rose-200/30">
              {/* Dismiss button */}
              <button
                onClick={() => { setExitToastVisible(false); setExitToastDismissed(true); }}
                className="absolute top-2 right-2 h-5 w-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs hover:bg-rose-100 hover:text-rose-500 transition-colors"
                aria-label="Dismiss"
              >
                ✕
              </button>
              <div className="flex items-start gap-3">
                <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 text-lg shadow-sm">
                  👀
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-800 leading-tight">
                    Psst — you scrolled past the good stuff
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-1 leading-snug">
                    You're 1 tap away from seeing who's really more invested.
                  </p>
                  <button
                    onClick={() => { setExitToastVisible(false); setExitToastDismissed(true); setIsPaywallOpen(true); }}
                    className="mt-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 px-3.5 py-1.5 text-[11px] font-black text-white shadow-sm active:scale-95 transition-all"
                  >
                    Reveal now · {price}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div> {/* screen-only */}

    {/* PDF PRINT REPORT CONTAINER */}
    <div className="print-only-report hidden print:block bg-[#FFF7F7]">
      
      {/* PAGE 1: Chemistry & Core Stats */}
      <div className="print-page">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-rose-200/40 pb-4">
          <div className="flex items-center gap-2">
            <img src="/lovelens_logo.png" alt="Logo" className="h-8 w-8 object-contain rounded-xl shadow-sm" />
            <span className="text-base font-black text-slate-800 tracking-tight">LoveLens Report</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-rose-50/50 border border-rose-100 px-3 py-1 rounded-full">PRIVATE CONNECTION AUDIT</span>
        </div>

        {/* Senders and Chemistry */}
        <div className="my-auto space-y-10 text-center">
          <div>
            <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100">CHAT REVELATION</span>
            <h2 className="text-3xl font-black text-slate-800 mt-4 tracking-tight">{p1} & {p2}</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">WhatsApp chat log analyzed locally inside the browser</p>
          </div>

          {/* Chemistry Meter */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative flex items-center justify-center h-36 w-36 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#FFE4E6" strokeWidth="8" fill="transparent" />
                <circle cx="50" cy="50" r="40" stroke="#FF4E88" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * relationshipScore) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{relationshipScore}%</span>
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-0.5 animate-pulse">Chemistry</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-600 max-w-md mx-auto leading-relaxed">
              {relationshipScore >= 90 
                ? "Unstoppable connection! You two share an exceptional texting compatibility, replying fast and maintaining deep mutual engagement. 🏆"
                : relationshipScore >= 75
                  ? "Strong chemistry! You maintain a balanced chat dynamic with great emotional warmth and steady rhythms. 💫"
                  : "Work in progress! You might have different texting speeds or active times, but the effort is definitely there. ☕"}
            </p>
          </div>

          {/* Interest Balance Verdict (V6) */}
          <div className="max-w-lg mx-auto rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">💘 Who's More Into Who</span>
            <div className="flex justify-between items-end text-[11px] font-black text-slate-700 mb-1.5">
              <span className="truncate max-w-[45%]">{p1} · {p1Effort}%</span>
              <span className="truncate max-w-[45%] text-right">{p2} · {p2Effort}%</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 flex">
              <div className="h-full bg-rose-500" style={{ width: `${p1Effort}%` }} />
              <div className="h-full bg-indigo-500" style={{ width: `${p2Effort}%` }} />
            </div>
            <p className="text-[10px] font-semibold text-slate-500 mt-2 leading-relaxed">{interestBalance.verdict}</p>
          </div>

          {/* Core Summary Stats Grid - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto text-left pt-2">
            <div className="bg-white border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-rose-100 flex-shrink-0">
                <MessageSquare size={18} className="fill-white" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Texts</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">{totalMessages.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-100 flex-shrink-0">
                <Flame size={18} className="fill-white" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Streak Record</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">{longestStreak} Days</span>
              </div>
            </div>

            <div className="bg-white border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-purple-100 flex-shrink-0">
                <Calendar size={18} className="fill-white" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Busiest Day</span>
                <span className="text-xs font-black text-slate-800 tracking-tight truncate block max-w-[140px]" title={mostActiveDay.date}>{mostActiveDay.date}</span>
              </div>
            </div>

            <div className="bg-white border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-10 w-10 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100 flex-shrink-0">
                <Award size={18} className="fill-white" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Words</span>
                <span className="text-lg font-black text-slate-800 tracking-tight">{((wordCounts[p1] || 0) + (wordCounts[p2] || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-rose-100/60 pt-4 flex justify-between text-[9px] font-black text-slate-400 tracking-wider">
          <span>GENERATED SECURELY BY GETLOVELENS.COM</span>
          <span>PAGE 1 OF 3</span>
        </div>
      </div>

      {/* PAGE 2: Love Audit & Lexicon Audit */}
      <div className="print-page">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-rose-200/40 pb-4">
          <span className="text-xs font-black text-slate-800 tracking-tight">LoveLens Wrapped Report</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-rose-50/50 border border-rose-100 px-3 py-1 rounded-full">RED & GREEN FLAGS</span>
        </div>

        {/* Body */}
        <div className="my-auto space-y-8 text-center">
          <div>
            <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100">AUDITS & JOKES</span>
            <h3 className="text-2xl font-black text-slate-800 mt-4 tracking-tight">Relationship Flags & Lexicon Audit</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Check core emotional words, responses, apologizer profiles, and overlap scores</p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto text-left">
            {/* Red Flags Card */}
            <div className="border border-red-100 bg-white rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs font-black text-red-500 uppercase tracking-wider mb-4 border-b border-red-50 pb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-red-500" /> Red Flags Audit
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Dry Responses ("ok", "k", "yeah")</span>
                    <span className="text-red-500 font-black">{p1}: {redFlags.dryTexts[p1]} | {p2}: {redFlags.dryTexts[p2]}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">Flat, low-effort replies.</p>
                </div>
                <div className="border-t border-slate-100/50 pt-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Argument Words</span>
                    <span className="text-red-500 font-black">{p1}: {redFlags.arguments[p1]} | {p2}: {redFlags.arguments[p2]}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">Frequency of fight/annoy keywords.</p>
                </div>
              </div>
            </div>

            {/* Green Flags Card */}
            <div className="border border-green-100 bg-white rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs font-black text-green-600 uppercase tracking-wider mb-4 border-b border-green-50 pb-2 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-green-600" /> Green Flags Audit
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Words of Affection</span>
                    <span className="text-green-600 font-black">{p1}: {greenFlags.affection[p1]} | {p2}: {greenFlags.affection[p2]}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">Frequency of love/affection keywords.</p>
                </div>
                <div className="border-t border-slate-100/50 pt-3">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Paragraph texts (20+ words)</span>
                    <span className="text-green-600 font-black">{p1}: {greenFlags.longTexts[p1]} | {p2}: {greenFlags.longTexts[p2]}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium">Long-form thoughtful messages.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lexicon / Jokes Info - 3 Columns */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto text-left pt-2">
            <div className="border border-rose-100 bg-white rounded-3xl p-4 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-2">
                <Heart size={16} className="fill-rose-500" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pet Names Used</span>
              <span className="text-xs font-black text-slate-800 mt-1 block">{p1}: {petNamesCounts[p1]} | {p2}: {petNamesCounts[p2]}</span>
            </div>
            
            <div className="border border-rose-100 bg-white rounded-3xl p-4 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-2">
                <Smile size={16} />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Apology Index</span>
              <span className="text-xs font-black text-slate-800 mt-1 block">{p1}: {apologyCounts[p1]} | {p2}: {apologyCounts[p2]}</span>
            </div>

            <div className="border border-rose-100 bg-white rounded-3xl p-4 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-2">
                <Sparkles size={16} className="fill-purple-500" />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Slang Match Overlap</span>
              <span className="text-sm font-black text-rose-500 mt-1 block">{vocabularyOverlapPct}% Match</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-rose-100/60 pt-4 flex justify-between text-[9px] font-black text-slate-400 tracking-wider">
          <span>GENERATED SECURELY BY GETLOVELENS.COM</span>
          <span>PAGE 2 OF 3</span>
        </div>
      </div>

      {/* PAGE 3: Spark Timeline & Quirks */}
      <div className="print-page">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-rose-200/40 pb-4">
          <span className="text-xs font-black text-slate-800 tracking-tight">LoveLens Wrapped Report</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-rose-50/50 border border-rose-100 px-3 py-1 rounded-full">TIMELINE & QUIRKS</span>
        </div>

        {/* Body */}
        <div className="my-auto space-y-8 text-center">
          <div>
            <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100">SPARKS & HABITS</span>
            <h3 className="text-2xl font-black text-slate-800 mt-4 tracking-tight">Honeymoon Sparks & Habits</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Review text volume shifts, greeting records, and active responses</p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto text-left">
            {/* Spark Timeline Card */}
            <div className="border border-rose-100 bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider border-b border-rose-50 pb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-rose-500" /> Spark Timeline
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Honeymoon Peak:</span>
                  <span className="font-extrabold text-slate-800">{formattedPeakMonth}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-100/50 pt-2">
                  <span className="text-slate-500">Early Stage Daily Avg:</span>
                  <span className="font-extrabold text-slate-800">{sparkShift.firstPeriodAvg} texts/day</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-100/50 pt-2">
                  <span className="text-slate-500">Recent Stage Daily Avg:</span>
                  <span className="font-extrabold text-slate-800">{sparkShift.recentPeriodAvg} texts/day</span>
                </div>
              </div>
            </div>

            {/* Habit Quirks Card */}
            <div className="border border-rose-100 bg-white rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Zap size={14} className="text-indigo-500" /> Behavioral Quirks
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Morning Greetings:</span>
                  <span className="font-extrabold text-slate-800">{p1}: {morningTexts[p1]} | {p2}: {morningTexts[p2]}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-100/50 pt-2">
                  <span className="text-slate-500">Night Greetings:</span>
                  <span className="font-extrabold text-slate-800">{p1}: {nightTexts[p1]} | {p2}: {nightTexts[p2]}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-100/50 pt-2">
                  <span className="text-slate-500">Max Consecutive (Spam):</span>
                  <span className="font-extrabold text-slate-800">{p1}: {maxConsecutiveTexts[p1]} | {p2}: {maxConsecutiveTexts[p2]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional details row - 2 columns */}
          <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto text-left pt-2">
            <div className="bg-white border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-9 w-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={16} />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Vocabulary Size (Unique Words)</span>
                <span className="text-xs font-black text-slate-800">{p1}: {uniqueWordsCount[p1]?.toLocaleString()} | {p2}: {uniqueWordsCount[p2]?.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white border border-rose-100 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-9 w-9 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity size={16} />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Media & Voice Notes Shared</span>
                <span className="text-xs font-black text-slate-800">{p1}: {mediaCounts[p1]} files | {p2}: {mediaCounts[p2]} files</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-rose-100/60 pt-4 flex justify-between text-[9px] font-black text-slate-400 tracking-wider">
          <span>GENERATED SECURELY BY GETLOVELENS.COM</span>
          <span>PAGE 3 OF 3</span>
        </div>
      </div>
    </div>

      <PaywallModal 
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onSuccess={handleUnlockSuccess}
        price={price}
        checkoutUrl={checkoutUrl}
      />

      <ShareCard
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        data={{
          p1,
          p2,
          score: relationshipScore,
          pct1,
          pct2,
          totalMessages,
          daysTogether,
          longestStreak,
          p1Effort,
          p2Effort,
          isUnlocked,
          isBalanced,
          effortLeader,
        }}
      />
    </div>
  );
}
