"use client";

// "Your Chat Wrapped": the report opens as full-screen story slides (tap to go on, hold to pause), the way people
// already love Spotify Wrapped and Instagram stories. Every free stat gets its own big, animated moment; the last
// slide is the cliffhanger: a drumroll, a name roulette that stops on a lock, and the button to reveal who's more into
// who. After paying, the same slide lands on the winner with a crown and confetti.

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import confetti from "canvas-confetti";

export type WrappedData = {
  p1: string;
  p2: string;
  totalMessages: number;
  count1: number;
  count2: number;
  pct1: number;
  pct2: number;
  reply1: number; // seconds
  reply2: number;
  longestStreak: number;
  peakHour: number; // 0-23
  topEmoji: { emoji: string; count: number } | null;
  score: number;
  effortLeader: string;
  effortLeaderPct: number;
  isBalanced: boolean;
  p1Effort: number;
  p2Effort: number;
  verdict: string;
};

type Props = {
  data: WrappedData;
  isUnlocked: boolean;
  price: string;
  startAtFinale?: boolean;
  onUnlock: () => void;
  onClose: () => void;
  onSlide?: (index: number, id: string) => void;
};

const SLIDE_MS = 5200;

const fmtReply = (sec: number) => {
  if (!isFinite(sec) || sec <= 0) return "—";
  const m = Math.round(sec / 60);
  if (m < 1) return "under a minute";
  if (m < 60) return `${m} min`;
  const h = Math.round((m / 60) * 10) / 10;
  return `${h} h`;
};
const hourLabel = (h: number) => (h === 0 ? "12 AM" : h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`);

function useCountUp(target: number, active: boolean, ms = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) {
      setV(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, ms]);
  return v;
}

/** Emoji that drift and spin around a slide. */
function Floaters({ items, n = 9 }: { items: string[]; n?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {Array.from({ length: n }).map((_, i) => {
        const left = (i * 37 + 11) % 92;
        const top = (i * 53 + 7) % 88;
        return (
          <motion.span
            key={i}
            className="absolute select-none text-3xl md:text-4xl"
            style={{ left: `${left}%`, top: `${top}%`, opacity: 0.55 }}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: [0, 12, -12, 0], y: [0, -14, 0] }}
            transition={{ delay: 0.15 + i * 0.07, duration: 3 + (i % 3), repeat: Infinity, repeatType: "mirror" }}
          >
            {items[i % items.length]}
          </motion.span>
        );
      })}
    </div>
  );
}

const Pop = ({ delay = 0, children, className = "" }: { delay?: number; children: React.ReactNode; className?: string }) => (
  <motion.div
    className={`relative z-10 ${className}`}
    initial={{ opacity: 0, y: 24, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay, type: "spring", stiffness: 260, damping: 18 }}
  >
    {children}
  </motion.div>
);

export default function ChatWrapped({ data, isUnlocked, price, startAtFinale = false, onUnlock, onClose, onSlide }: Props) {
  const d = data;
  const fasterIsP1 = (d.reply1 || Infinity) <= (d.reply2 || Infinity);
  const fast = fasterIsP1 ? d.p1 : d.p2;
  const slow = fasterIsP1 ? d.p2 : d.p1;
  const fastSec = Math.min(d.reply1 || Infinity, d.reply2 || Infinity);
  const slowSec = Math.max(d.reply1 || 0, d.reply2 || 0);
  const texter = d.count1 >= d.count2 ? d.p1 : d.p2;
  const texterPct = Math.max(d.pct1, d.pct2);

  const slides = [
    { id: "intro", bg: "from-[#ff2e7e] via-[#ff6b3d] to-[#ffc93c]" },
    { id: "texter", bg: "from-[#7c3aed] via-[#c026d3] to-[#ff2e7e]" },
    { id: "race", bg: "from-[#0ea5e9] via-[#6366f1] to-[#a855f7]" },
    { id: "streak", bg: "from-[#f97316] via-[#ef4444] to-[#db2777]" },
    { id: "peak", bg: "from-[#1e1b4b] via-[#4338ca] to-[#7c3aed]" },
    ...(d.topEmoji ? [{ id: "emoji", bg: "from-[#facc15] via-[#fb923c] to-[#f43f5e]" }] : []),
    { id: "chemistry", bg: "from-[#ec4899] via-[#f43f5e] to-[#fb7185]" },
    { id: "finale", bg: "from-[#160a2b] via-[#5b21b6] to-[#be185d]" },
  ];
  const last = slides.length - 1;
  const [idx, setIdx] = useState(startAtFinale ? last : 0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdRef = useRef(false);
  const slide = slides[idx];

  const go = useCallback(
    (n: number) => {
      const next = Math.max(0, Math.min(last, n));
      setIdx(next);
      setProgress(0);
    },
    [last],
  );

  useEffect(() => {
    onSlide?.(idx, slides[idx].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // auto-advance (the finale waits for the user)
  useEffect(() => {
    if (idx === last || paused) return;
    let raf = 0;
    let t0 = performance.now() - progress * SLIDE_MS;
    const tick = (t: number) => {
      const k = (t - t0) / SLIDE_MS;
      if (k >= 1) {
        go(idx + 1);
        return;
      }
      setProgress(k);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      t0 = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, go, last]);

  // keyboard and body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [idx, go, onClose]);

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (holdRef.current) return;
    const x = e.clientX / window.innerWidth;
    if (x < 0.3) go(idx - 1);
    else if (idx < last) go(idx + 1);
  };

  return (
    <div className="fixed inset-0 z-[49] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`relative h-full w-full max-w-[480px] overflow-hidden bg-gradient-to-br ${slide.bg} text-white transition-colors duration-500 sm:my-6 sm:h-[min(860px,94vh)] sm:rounded-[36px] sm:shadow-2xl`}
        onClick={onTap}
        onPointerDown={() => {
          holdRef.current = false;
          const t = setTimeout(() => {
            holdRef.current = true;
            setPaused(true);
          }, 260);
          const up = () => {
            clearTimeout(t);
            setPaused(false);
            setTimeout(() => (holdRef.current = false), 0);
            window.removeEventListener("pointerup", up);
          };
          window.addEventListener("pointerup", up);
        }}
      >
        {/* progress */}
        <div className="absolute inset-x-0 top-0 z-20 flex gap-1 px-3 pt-3">
          {slides.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: `${i < idx ? 100 : i === idx ? (idx === last ? 100 : progress * 100) : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 top-5 z-20 flex items-center justify-between px-4 pt-2">
          <span className="font-fun text-sm font-bold">LoveLens Wrapped 💘</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="absolute inset-0 flex flex-col items-center justify-center px-7 pb-10 pt-20 text-center"
            initial={{ opacity: 0, x: 60, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -60, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {slide.id === "intro" && <Intro d={d} />}
            {slide.id === "texter" && <Texter d={d} texter={texter} texterPct={texterPct} />}
            {slide.id === "race" && <Race fast={fast} slow={slow} fastSec={fastSec} slowSec={slowSec} />}
            {slide.id === "streak" && <Streak days={d.longestStreak} />}
            {slide.id === "peak" && <Peak hour={d.peakHour} />}
            {slide.id === "emoji" && d.topEmoji && <TopEmoji e={d.topEmoji} />}
            {slide.id === "chemistry" && <Chemistry score={d.score} />}
            {slide.id === "finale" && <Finale d={d} isUnlocked={isUnlocked} price={price} onUnlock={onUnlock} onClose={onClose} />}
          </motion.div>
        </AnimatePresence>

        {idx < last && (
          <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs font-semibold text-white/70">
            Tap to continue · hold to pause
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- slides

function Intro({ d }: { d: WrappedData }) {
  const n = useCountUp(d.totalMessages, true, 1600);
  return (
    <>
      <Floaters items={["💌", "💬", "✨", "💘", "📱"]} />
      <Pop className="relative">
        <span className="rounded-full bg-white/25 px-4 py-1.5 text-sm font-bold backdrop-blur-sm">
          {d.p1} &amp; {d.p2}
        </span>
      </Pop>
      <Pop delay={0.2} className="relative mt-6">
        <p className="font-fun text-2xl font-bold">We just read</p>
        <p className="font-fun mt-1 text-[84px] font-extrabold leading-none drop-shadow-[0_6px_0_rgba(0,0,0,0.18)]">{n.toLocaleString()}</p>
        <p className="font-fun mt-2 text-2xl font-bold">of your messages 👀</p>
      </Pop>
      <Pop delay={1.2} className="relative mt-8">
        <p className="text-lg font-semibold text-white/90">Let&apos;s see what they say about you two…</p>
      </Pop>
    </>
  );
}

function Texter({ d, texter, texterPct }: { d: WrappedData; texter: string; texterPct: number }) {
  return (
    <>
      <Floaters items={["📱", "💬", "⌨️", "🗯️"]} n={7} />
      <Pop className="relative">
        <p className="font-fun text-2xl font-bold">The texting award 🏆 goes to…</p>
      </Pop>
      <Pop delay={0.7} className="relative mt-5">
        <motion.p className="font-fun text-[64px] font-extrabold leading-none" animate={{ rotate: [0, -3, 3, 0] }} transition={{ delay: 1, duration: 0.6 }}>
          {texter}!
        </motion.p>
        <p className="font-fun mt-3 text-3xl font-bold">{texterPct}% of all messages</p>
      </Pop>
      <Pop delay={1.3} className="relative mt-8 w-full">
        <div className="flex h-12 w-full overflow-hidden rounded-full border-2 border-white/70 bg-white/20">
          <motion.div className="flex h-full items-center justify-start bg-white pl-4 text-sm font-bold text-[#c026d3]" initial={{ width: "50%" }} animate={{ width: `${d.pct1}%` }} transition={{ delay: 1.5, duration: 1.1, ease: "easeOut" }}>
            {d.pct1 >= 18 ? `${d.p1} ${d.pct1}%` : ""}
          </motion.div>
          <div className="flex flex-1 items-center justify-end pr-4 text-sm font-bold">{d.pct2 >= 18 ? `${d.p2} ${d.pct2}%` : ""}</div>
        </div>
        <p className="mt-3 text-sm font-semibold text-white/85">
          {d.count1.toLocaleString()} vs {d.count2.toLocaleString()} texts
        </p>
      </Pop>
    </>
  );
}

function Race({ fast, slow, fastSec, slowSec }: { fast: string; slow: string; fastSec: number; slowSec: number }) {
  const close = slowSec > 0 && fastSec / slowSec > 0.8;
  const lane = (name: string, emoji: string, time: string, dur: number, winner: boolean) => (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-sm font-bold">
        <span>{name}</span>
        <span>{time}</span>
      </div>
      <div className="relative h-14 w-full overflow-hidden rounded-2xl border-2 border-white/60 bg-white/15">
        <div className="absolute inset-y-0 right-3 flex items-center text-2xl">🏁</div>
        <motion.span className="absolute top-1/2 -translate-y-1/2 text-4xl" initial={{ left: "2%" }} animate={{ left: "74%" }} transition={{ delay: 0.8, duration: dur, ease: "easeInOut" }}>
          {emoji}
        </motion.span>
        {winner && (
          <motion.span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd23f] px-3 py-1 text-xs font-extrabold text-[#20090f]" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + dur, type: "spring" }}>
            WINNER
          </motion.span>
        )}
      </div>
    </div>
  );
  return (
    <>
      <Pop className="relative">
        <p className="font-fun text-4xl font-extrabold">The reply race ⚡</p>
        <p className="mt-2 text-lg font-semibold text-white/85">Who answers faster?</p>
      </Pop>
      <Pop delay={0.4} className="relative mt-8 w-full space-y-5">
        {lane(fast, "🐇", fmtReply(fastSec), 1.1, !close)}
        {lane(slow, close ? "🐇" : "🐢", fmtReply(slowSec), close ? 1.3 : 2.8, false)}
      </Pop>
      <Pop delay={3.6} className="relative mt-7">
        <p className="font-fun text-2xl font-bold">{close ? "Neck and neck! 🤝" : `${fast} doesn't keep anyone waiting 💨`}</p>
      </Pop>
    </>
  );
}

function Streak({ days }: { days: number }) {
  const n = useCountUp(days, true, 1500);
  return (
    <>
      <Floaters items={["🔥", "✨", "🔥"]} n={8} />
      <Pop className="relative">
        <p className="font-fun text-2xl font-bold">Your longest texting streak</p>
      </Pop>
      <Pop delay={0.3} className="relative mt-4">
        <motion.p className="text-[96px] leading-none" animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          🔥
        </motion.p>
        <p className="font-fun text-[88px] font-extrabold leading-none">{n}</p>
        <p className="font-fun mt-1 text-3xl font-bold">days in a row</p>
      </Pop>
      <Pop delay={1.6} className="relative mt-6">
        <p className="text-lg font-semibold text-white/90">{days >= 30 ? "Not a single day without each other 🥹" : "Every streak starts somewhere 💪"}</p>
      </Pop>
    </>
  );
}

function Peak({ hour }: { hour: number }) {
  const part =
    hour >= 21 || hour < 5
      ? { icon: "🌙", float: ["🌙", "⭐", "✨"], line: "Late-night talkers. Classic. 😏" }
      : hour >= 17
        ? { icon: "🌇", float: ["🌇", "✨", "💬"], line: "Evening texters: the day's done, the chat begins 💬" }
        : hour >= 12
          ? { icon: "☀️", float: ["☀️", "☁️", "✨"], line: "Afternoon chatters, apparently nothing else to do 😄" }
          : { icon: "🌅", float: ["🌅", "☕", "✨"], line: "Morning people! Good-morning texts on repeat ☀️" };
  return (
    <>
      <Floaters items={part.float} n={10} />
      <Pop>
        <p className="font-fun text-2xl font-bold">Your chat comes alive at</p>
      </Pop>
      <Pop delay={0.4} className="mt-5">
        <p className="text-7xl">{part.icon}</p>
        <p className="font-fun mt-2 text-[76px] font-extrabold leading-none">{hourLabel(hour)}</p>
      </Pop>
      <Pop delay={1.2} className="mt-6">
        <p className="text-lg font-semibold text-white/90">{part.line}</p>
      </Pop>
    </>
  );
}

function TopEmoji({ e }: { e: { emoji: string; count: number } }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl"
            style={{ left: `${(i * 23 + 5) % 95}%` }}
            initial={{ top: "-10%" }}
            animate={{ top: "110%", rotate: 360 }}
            transition={{ delay: (i % 8) * 0.25, duration: 3 + (i % 4), repeat: Infinity, ease: "linear" }}
          >
            {e.emoji}
          </motion.span>
        ))}
      </div>
      <Pop className="relative">
        <p className="font-fun text-2xl font-bold">Your #1 emoji</p>
      </Pop>
      <Pop delay={0.4} className="relative mt-4">
        <motion.p className="text-[140px] leading-none" animate={{ rotate: [-8, 8, -8] }} transition={{ repeat: Infinity, duration: 1.4 }}>
          {e.emoji}
        </motion.p>
        <p className="font-fun mt-3 text-3xl font-bold">used {e.count.toLocaleString()} times</p>
      </Pop>
    </>
  );
}

function Chemistry({ score }: { score: number }) {
  const n = useCountUp(score, true, 1500);
  const R = 88;
  const C = 2 * Math.PI * R;
  return (
    <>
      <Floaters items={["💞", "💖", "💘", "💗"]} n={10} />
      <Pop className="relative">
        <p className="font-fun text-2xl font-bold">Your chemistry score</p>
      </Pop>
      <Pop delay={0.3} className="relative mt-6">
        <div className="relative mx-auto h-56 w-56">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle cx="100" cy="100" r={R} stroke="rgba(255,255,255,0.25)" strokeWidth="16" fill="none" />
            <circle cx="100" cy="100" r={R} stroke="#fff" strokeWidth="16" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (C * n) / 100} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-fun text-6xl font-extrabold">{n}%</span>
            <span className="text-2xl">💞</span>
          </div>
        </div>
      </Pop>
      <Pop delay={1.5} className="relative mt-6">
        <p className="font-fun text-2xl font-bold">{score >= 90 ? "Off the charts. 🏆" : score >= 75 ? "Strong chemistry ✨" : "There's a spark. Keep going 🔥"}</p>
      </Pop>
    </>
  );
}

function Finale({ d, isUnlocked, price, onUnlock, onClose }: { d: WrappedData; isUnlocked: boolean; price: string; onUnlock: () => void; onClose: () => void }) {
  const [phase, setPhase] = useState<"drum" | "spin" | "stop">("drum");
  const [shown, setShown] = useState(d.p1);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("spin"), 1400);
    return () => clearTimeout(t1);
  }, []);
  useEffect(() => {
    if (phase !== "spin") return;
    let i = 0;
    let delay = 70;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i++;
      setShown(i % 2 ? d.p2 : d.p1);
      delay *= 1.12;
      if (delay > 420) {
        setPhase("stop");
        if (isUnlocked) {
          setShown(d.effortLeader);
          confetti({ particleCount: 160, spread: 90, origin: { y: 0.55 }, colors: ["#ff2e7e", "#ffd23f", "#7c3aed", "#ffffff"] });
        }
        return;
      }
      timer = setTimeout(step, delay);
    };
    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [phase, d.p1, d.p2, d.effortLeader, isUnlocked]);

  return (
    <>
      <Floaters items={["💘", "👀", "🥁", "✨"]} n={8} />
      <Pop className="relative">
        <p className="font-fun text-xl font-bold text-white/85">And now… the big one 🥁</p>
        <p className="font-fun mt-2 text-[44px] font-extrabold leading-[1.02]">Who&apos;s more into who?</p>
      </Pop>

      <Pop delay={0.5} className="relative mt-8 w-full">
        <div className="pop-card mx-auto flex h-28 w-full max-w-[320px] items-center justify-center overflow-hidden rounded-3xl bg-white text-[#20090f]">
          {phase === "drum" ? (
            <motion.span className="text-5xl" animate={{ rotate: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 0.3 }}>
              🥁
            </motion.span>
          ) : phase === "spin" || isUnlocked ? (
            <span className="font-fun flex items-center gap-2 text-4xl font-extrabold">
              {phase === "stop" && isUnlocked && <span>👑</span>}
              {shown}
            </span>
          ) : (
            <span className="font-fun flex items-center gap-3 text-4xl font-extrabold">
              <span className="select-none blur-[9px]">{"●".repeat(5)}</span>
              <Lock size={30} className="text-[#e11d48]" />
            </span>
          )}
        </div>
      </Pop>

      {phase === "stop" && (
        <Pop className="relative mt-6 w-full">
          {isUnlocked ? (
            <>
              <p className="font-fun text-3xl font-extrabold">
                {d.isBalanced ? "It's a tie! 🤝" : `${d.effortLeader} carries ${d.effortLeaderPct}%!`}
              </p>
              <p className="mx-auto mt-3 max-w-sm text-[15px] font-medium text-white/90">{d.verdict}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="pop-btn mt-7 w-full rounded-2xl bg-[#ffd23f] py-4 text-lg font-extrabold text-[#20090f]"
              >
                See my full report 🎉
              </button>
            </>
          ) : (
            <>
              <p className="font-fun text-2xl font-extrabold">
                {d.isBalanced ? "It's SO close… but someone's ahead 👀" : `One of you carries ${d.effortLeaderPct}% of the effort 😳`}
              </p>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock();
                }}
                className="pop-btn mt-7 w-full rounded-2xl bg-[#ffd23f] py-4 text-lg font-extrabold text-[#20090f]"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              >
                🔓 Reveal who · {price}
              </motion.button>
              <p className="mt-2.5 text-xs font-semibold text-white/75">One-time · no subscription · already worked out from your chat</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="mt-5 text-sm font-semibold text-white/80 underline underline-offset-4"
              >
                See the rest of my report
              </button>
            </>
          )}
        </Pop>
      )}
    </>
  );
}
