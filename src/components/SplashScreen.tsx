import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Sparkles } from "lucide-react";

interface SplashScreenProps {
  onFinish: () => void;
  /** Duration in seconds that checkout stays on screen before fading out (default: 4.5) */
  stayDurationSeconds?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  stayDurationSeconds = 4.5,
}) => {
  // Animation phases:
  // 1. "checkin" - CHECKIN appears and holds in center
  // 2. "dissolve" - CHECKIN dissolves out in center
  // 3. "checkout" - CHECKOUT emerges in center and stays for 4-5s
  // 4. "exit" - screen fades out to reveal the app
  const [phase, setPhase] = useState<"checkin" | "dissolve" | "checkout" | "exit">("checkin");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // Timeline:
    // 0ms -> 1500ms: CHECKIN appears and settles
    // 1500ms -> 2200ms: CHECKIN dissolves in center
    // 2200ms: CHECKOUT emerges and stays for stayDurationSeconds (e.g. 4500ms)
    // 2200ms + (stayDurationSeconds * 1000)ms: exit animation
    const timer1 = setTimeout(() => {
      setPhase("dissolve");
    }, 1500);

    const timer2 = setTimeout(() => {
      setPhase("checkout");
    }, 2200);

    const exitTime = 2200 + stayDurationSeconds * 1000;
    const timer3 = setTimeout(() => {
      setPhase("exit");
    }, exitTime);

    const finishTime = exitTime + 600;
    const timer4 = setTimeout(() => {
      onFinish();
    }, finishTime);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onFinish, stayDurationSeconds]);

  // Track progress bar during the checkout stay phase
  useEffect(() => {
    if (phase !== "checkout") return;
    const startTime = Date.now();
    const totalMs = stayDurationSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.max(0, (elapsed / totalMs) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [phase, stayDurationSeconds]);

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhase("exit");
    setTimeout(() => {
      onFinish();
    }, 250);
  };

  return (
    <motion.div
      id="splash-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      onClick={() => {
        // Allow tapping anywhere to enter smoothly
        if (phase === "checkout") {
          handleSkip({ stopPropagation: () => {} } as React.MouseEvent);
        }
      }}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white select-none overflow-hidden cursor-pointer"
    >
      {/* Subtle clean background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top Bar with Skip action */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSkip}
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-slate-900 bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 transition-all shadow-xs"
        >
          <span>Skip</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Center Stage Animation */}
      <div className="relative flex flex-col items-center justify-center min-h-[180px] px-6 text-center max-w-2xl">
        <AnimatePresence mode="wait">
          {(phase === "checkin" || phase === "dissolve") && (
            <motion.div
              key="stage-checkin"
              initial={{ opacity: 0, scale: 0.93, filter: "blur(4px)" }}
              animate={
                phase === "checkin"
                  ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                  : { opacity: 0, scale: 1.04, filter: "blur(8px)" }
              }
              exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
              transition={{
                duration: phase === "checkin" ? 0.7 : 0.6,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center justify-center"
            >
              {/* CHECKIN Wordmark */}
              <h1
                className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 uppercase tracking-[0.24em] leading-none text-center"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontStretch: "115%",
                }}
              >
                CHECKIN
              </h1>

              {/* Status indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-5 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase">
                  Shift Check-In
                </span>
              </motion.div>
            </motion.div>
          )}

          {phase === "checkout" && (
            <motion.div
              key="stage-checkout"
              initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex flex-col items-center justify-center"
            >
              {/* CHECKOUT Wordmark */}
              <h1
                className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 uppercase tracking-[0.24em] leading-none text-center"
                style={{
                  fontFamily:
                    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontStretch: "115%",
                }}
              >
                CHECKOUT
              </h1>

              {/* Full Brand Lockup matching user logo */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-6 flex flex-col items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-[1px] w-6 bg-slate-300" />
                  <span
                    className="text-xs sm:text-sm font-extrabold text-slate-500 tracking-[0.28em] uppercase"
                    style={{ fontStretch: "110%" }}
                  >
                    CHECKIN CHECKOUT
                  </span>
                  <div className="h-[1px] w-6 bg-slate-300" />
                </div>
                <p className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                  Dark Store Fulfillment & Learner Mastery
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle bottom timer bar indicating the 4-5s checkout stay */}
      {phase === "checkout" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 sm:w-64 flex flex-col items-center gap-2">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <motion.div
              className="h-full bg-slate-900 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            Entering Floor... Tap to open
          </span>
        </div>
      )}
    </motion.div>
  );
};
