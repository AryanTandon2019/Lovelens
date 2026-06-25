"use client";

import React, { useState } from "react";
import { X, Smartphone, Apple, ArrowRight, ArrowLeft } from "lucide-react";

interface UploadTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const iosSteps = [
  {
    title: "1. Open Chat & Tap Name",
    description: "Open the WhatsApp chat with your partner. Tap their name at the very top of the screen to open Contact Info.",
    highlight: "Top Bar (Name & Avatar)"
  },
  {
    title: "2. Scroll & Export Chat",
    description: "Scroll all the way to the bottom of the contact details page. Tap 'Export Chat'.",
    highlight: "'Export Chat' button near the bottom"
  },
  {
    title: "3. Choose 'Without Media'",
    description: "Select 'Without Media' when prompted. This keeps the text file lightweight and fast to parse (no photos/videos).",
    highlight: "'Without Media'"
  },
  {
    title: "4. Save & Upload",
    description: "Tap 'Save to Files' or send it to yourself. Then click the upload zone on our page to select the `.txt` file.",
    highlight: "'Save to Files'"
  }
];

const androidSteps = [
  {
    title: "1. Tap the Three Dots (︙)",
    description: "Open the WhatsApp chat with your partner. Tap the three dots in the top-right corner.",
    highlight: "Top Right (︙ menu)"
  },
  {
    title: "2. Tap 'More' Option",
    description: "In the dropdown menu, tap 'More' (usually at the very bottom).",
    highlight: "'More' option"
  },
  {
    title: "3. Export & 'Without Media'",
    description: "Tap 'Export Chat' and select 'Without Media' to exclude large photo/video attachments.",
    highlight: "'Export Chat' -> 'Without Media'"
  },
  {
    title: "4. Save & Upload",
    description: "Save the generated `.txt` file to your device's Files/Downloads folder, then drop it here.",
    highlight: "Files / Downloads"
  }
];

export default function UploadTutorial({ isOpen, onClose }: UploadTutorialProps) {
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = platform === "ios" ? iosSteps : androidSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const changePlatform = (plat: "ios" | "android") => {
    setPlatform(plat);
    setCurrentStep(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/50 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">How to Export WhatsApp Chat</h3>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Platform Selector */}
        <div className="flex gap-2 p-4 justify-center border-b border-rose-50">
          <button
            onClick={() => changePlatform("ios")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
              platform === "ios"
                ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Apple size={16} /> iPhone (iOS)
          </button>
          <button
            onClick={() => changePlatform("android")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
              platform === "android"
                ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Smartphone size={16} /> Android
          </button>
        </div>

        {/* Content Slider */}
        <div className="p-6">
          {/* Mockup phone preview representing each step */}
          <div className="mb-6 flex justify-center">
            <div className="relative w-full h-48 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-200 rounded-full" /> {/* notch */}
              
              {/* Visual guides for step-by-step drawing */}
              {platform === "ios" && currentStep === 0 && (
                <div className="w-full max-w-[200px] bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 bg-rose-50 animate-pulse border-2 border-rose-500 rounded p-1">
                    <div className="w-6 h-6 rounded-full bg-rose-200 flex-shrink-0" />
                    <div className="w-16 h-3 bg-slate-300 rounded" />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="w-full h-2 bg-slate-100 rounded" />
                    <div className="w-5/6 h-2 bg-slate-100 rounded" />
                  </div>
                </div>
              )}

              {platform === "ios" && currentStep === 1 && (
                <div className="w-full max-w-[200px] space-y-2 bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                  <div className="w-16 h-2 bg-slate-200 rounded mx-auto" />
                  <div className="w-full h-6 border border-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">Media, Docs, Links</div>
                  <div className="w-full h-6 border border-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">Starred Messages</div>
                  <div className="w-full h-6 border-2 border-rose-500 bg-rose-50 rounded flex items-center justify-center text-[10px] text-rose-600 font-bold animate-pulse">Export Chat</div>
                </div>
              )}

              {platform === "ios" && currentStep === 2 && (
                <div className="absolute bottom-0 w-full max-w-[220px] bg-white border-t border-x border-slate-200 rounded-t-xl p-3 shadow-lg flex flex-col gap-2">
                  <div className="text-[10px] text-center text-slate-400">Attaching media will generate a larger file.</div>
                  <div className="w-full h-8 border border-slate-200 rounded-md flex items-center justify-center text-[11px] text-blue-500 font-semibold cursor-not-allowed">Attach Media</div>
                  <div className="w-full h-8 border-2 border-rose-500 bg-rose-50 rounded-md flex items-center justify-center text-[11px] text-rose-600 font-bold animate-pulse">Without Media</div>
                </div>
              )}

              {platform === "ios" && currentStep === 3 && (
                <div className="w-full max-w-[180px] bg-slate-900 text-white rounded-lg p-3 shadow-md flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs">💬</div>
                  <div className="text-[10px] font-semibold">WhatsApp Chat.txt</div>
                  <div className="text-[8px] text-slate-400">Text Document • 248 KB</div>
                  <div className="w-full h-6 mt-1 border border-slate-700 bg-rose-500 rounded flex items-center justify-center text-[9px] text-white font-semibold animate-bounce">Ready to Upload</div>
                </div>
              )}

              {platform === "android" && currentStep === 0 && (
                <div className="w-full max-w-[200px] bg-white border border-slate-200 rounded-lg p-2 shadow-sm relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-200" />
                      <div className="w-12 h-2 bg-slate-300 rounded" />
                    </div>
                    <div className="w-4 h-4 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center text-[8px] font-bold text-rose-600 animate-pulse">︙</div>
                  </div>
                  <div className="absolute right-2 top-6 bg-white border border-slate-200 rounded shadow-md p-1 flex flex-col gap-1 w-20">
                    <div className="w-full h-2 bg-slate-100 rounded" />
                    <div className="w-full h-2 bg-slate-100 rounded" />
                    <div className="w-full h-2 bg-rose-200 rounded" />
                  </div>
                </div>
              )}

              {platform === "android" && currentStep === 1 && (
                <div className="w-full max-w-[200px] bg-white border border-slate-200 rounded-lg p-2 shadow-sm relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-slate-200" />
                      <div className="w-12 h-2 bg-slate-300 rounded" />
                    </div>
                    <div className="w-2 h-2 bg-slate-300 rounded" />
                  </div>
                  <div className="absolute right-2 top-6 bg-white border border-slate-200 rounded shadow-md p-1 flex flex-col gap-1 w-20">
                    <div className="w-full h-2 bg-slate-100 rounded" />
                    <div className="w-full h-2 bg-slate-100 rounded" />
                    <div className="w-full h-3 border border-rose-500 bg-rose-50 rounded flex items-center justify-center text-[6px] text-rose-600 font-bold animate-pulse">More</div>
                  </div>
                </div>
              )}

              {platform === "android" && currentStep === 2 && (
                <div className="w-full max-w-[200px] bg-white border border-slate-200 rounded-lg p-2 shadow-sm relative">
                  <div className="absolute right-2 top-2 bg-white border border-slate-200 rounded shadow-md p-1 flex flex-col gap-1 w-20">
                    <div className="w-full h-2 bg-slate-100 rounded" />
                    <div className="w-full h-3 border border-rose-500 bg-rose-50 rounded flex items-center justify-center text-[6px] text-rose-600 font-bold animate-pulse">Export chat</div>
                    <div className="w-full h-2 bg-slate-100 rounded" />
                  </div>
                </div>
              )}

              {platform === "android" && currentStep === 3 && (
                <div className="w-full max-w-[180px] bg-slate-900 text-white rounded-lg p-3 shadow-md flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs">💬</div>
                  <div className="text-[10px] font-semibold">WhatsApp Chat.txt</div>
                  <div className="text-[8px] text-slate-400">Text Document • 185 KB</div>
                  <div className="w-full h-6 mt-1 border border-slate-700 bg-rose-500 rounded flex items-center justify-center text-[9px] text-white font-semibold animate-bounce">Ready to Upload</div>
                </div>
              )}
            </div>
          </div>

          {/* Stepper info */}
          <div className="text-center min-h-[100px]">
            <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-xs font-bold text-rose-500 mb-2">
              Step {currentStep + 1} of {steps.length}
            </span>
            <h4 className="text-base font-bold text-slate-800 mb-1">{steps[currentStep].title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed">{steps[currentStep].description}</p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-rose-50 bg-slate-50 px-6 py-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              currentStep === 0 
                ? "text-slate-300 cursor-not-allowed" 
                : "text-slate-600 hover:text-rose-500"
            }`}
          >
            <ArrowLeft size={16} /> Back
          </button>
          
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  idx === currentStep ? "w-5 bg-rose-500" : "bg-slate-300"
                }`}
              />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-sm font-semibold text-rose-500 hover:text-rose-600 transition-colors"
            >
              Got it!
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
