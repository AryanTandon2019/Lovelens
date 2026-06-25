"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import { X, Download, Share2, Heart, Flame, MessageSquare, Calendar, Loader2, Award, Lock } from "lucide-react";

interface ShareCardData {
  p1: string;
  p2: string;
  score: number;
  pct1: number;
  pct2: number;
  totalMessages: number;
  daysTogether: number;
  longestStreak: number;
  p1Effort: number;
  p2Effort: number;
  isUnlocked: boolean;
  isBalanced: boolean;
  effortLeader: string;
}

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareCardData;
}

const initials = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

export default function ShareCard({ isOpen, onClose, data }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generate = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    // Render at 2x for a crisp, share-ready image.
    return toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
  };

  const handleDownload = async () => {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await generate();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = `lovelens-${data.p1}-and-${data.p2}.png`.replace(/\s+/g, "-");
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Couldn't generate the image. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await generate();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "lovelens.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: "Our LoveLens Report",
          text: `${data.p1} & ${data.p2} scored ${data.score}% chemistry 💘 Analyze your chats free at getlovelens.com`,
        });
      } else {
        // No native share (e.g. desktop) → fall back to download.
        const link = document.createElement("a");
        link.download = "lovelens.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      // AbortError = user dismissed the share sheet; ignore that case.
      if ((e as Error)?.name !== "AbortError") {
        setError("Sharing failed. Try downloading instead.");
      }
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/70 backdrop-blur-sm">
      <div className="min-h-full flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[340px] flex justify-between items-center mb-3">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Share your card</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* CAPTURE TARGET */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[min(340px,calc(100vw-1.5rem))] overflow-hidden rounded-[32px] p-6 text-white border border-white/25 shadow-2xl"
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
                {initials(data.p1)}
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner animate-pulse">
              <Heart className="fill-white text-white" size={14} />
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-400 to-purple-400 blur-sm opacity-60 pointer-events-none" />
              <div className="relative h-14 w-14 rounded-2xl bg-white text-indigo-600 flex items-center justify-center text-lg font-black shadow-lg border border-white/30">
                {initials(data.p2)}
              </div>
            </div>
          </div>
          <p className="text-center text-base font-black mb-1 tracking-tight truncate">{data.p1} &amp; {data.p2}</p>

          {/* Chemistry score circular gauge design */}
          <div className="relative mx-auto my-6 h-28 w-28 flex items-center justify-center">
            {/* Rotating dashed ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/35 animate-[spin_25s_linear_infinite] pointer-events-none" />
            {/* Glowing inner circle */}
            <div className="h-24 w-24 rounded-full bg-white/12 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center shadow-xl">
              <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/70">Chemistry</span>
              <span className="text-3xl font-black text-white tracking-tighter mt-0.5">{data.score}%</span>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <div className="rounded-2xl bg-white/8 border border-white/15 p-3 text-center shadow-md">
              <MessageSquare size={13} className="mx-auto mb-1 text-rose-200" />
              <span className="block text-sm font-black leading-tight text-white">{data.totalMessages.toLocaleString()}</span>
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">Texts</span>
            </div>
            <div className="rounded-2xl bg-white/8 border border-white/15 p-3 text-center shadow-md">
              <Calendar size={13} className="mx-auto mb-1 text-indigo-200" />
              <span className="block text-sm font-black leading-tight text-white">{data.daysTogether.toLocaleString()}</span>
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">Days</span>
            </div>
            <div className="rounded-2xl bg-white/8 border border-white/15 p-3 text-center shadow-md">
              <Flame size={13} className="mx-auto mb-1 text-amber-300" />
              <span className="block text-sm font-black leading-tight text-white">{data.longestStreak}</span>
              <span className="block text-[8px] font-semibold uppercase tracking-wider text-white/60 mt-0.5">Streak</span>
            </div>
          </div>

          {/* Verdict line */}
          <div className="rounded-2xl bg-gradient-to-r from-black/25 to-black/10 border border-white/10 p-3.5 text-center flex flex-col items-center justify-center shadow-inner">
            <span className="block text-[8px] font-extrabold uppercase tracking-[0.2em] text-white/60 mb-1">Who's more into who?</span>
            {data.isUnlocked ? (
              <div className="flex items-center justify-center gap-1.5 text-xs font-black bg-white/15 border border-white/10 rounded-full px-3 py-1 text-white shadow-sm mt-1.5">
                {data.isBalanced ? (
                  <>
                    <Heart size={11} className="fill-rose-300 text-rose-300" />
                    <span>Balanced Connection</span>
                  </>
                ) : (
                  <>
                    <Award size={11} className="text-yellow-300 fill-yellow-300" />
                    <span>{data.effortLeader} leans in more</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-xs font-black bg-white/10 border border-white/10 rounded-full px-3 py-1 text-white shadow-sm mt-1.5">
                <Lock size={11} className="text-white/80" />
                <span>Locked · getlovelens.com</span>
              </div>
            )}
          </div>

          {/* Footer / call to action (the viral hook) */}
          <div className="flex items-center justify-center gap-1.5 mt-5 text-[9px] font-black text-white/90">
            <Heart size={10} className="fill-white text-white animate-pulse" />
            <span>Analyze your chats free at <span className="underline">getlovelens.com</span></span>
          </div>
        </div>
      </div>

      {/* Actions (outside capture) */}
      <div className="w-full max-w-[340px] mt-4 flex gap-3">
        <button
          onClick={handleShare}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-rose-600 shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} Share
        </button>
        <button
          onClick={handleDownload}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-white/15 border border-white/30 px-4 py-3.5 text-sm font-black text-white backdrop-blur-sm hover:bg-white/25 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          <Download size={16} /> Save image
        </button>
      </div>

      {error && <p className="mt-3 text-xs font-bold text-rose-200">{error}</p>}
      <p className="mt-3 text-[10px] font-semibold text-white/50 text-center max-w-[340px]">
        Tip: post it to your story and tag your partner 💕
      </p>
      </div>
    </div>,
    document.body
  );
}
