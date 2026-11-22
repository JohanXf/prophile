"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FREE_FEATURES, PREMIUM_FEATURES } from "@/lib/plan-features";
import { useRouter } from "next/navigation";
import { MorphingText } from "@/components/ui/morphing-text";
import { BlurTextEffect } from "@/components/ui/blur-text-effect";
import GlyphPortal from "@/components/ui/glyph-portal";
import TopFade from "@/components/ui/top-fade";
import dynamic from "next/dynamic";

const AuroraEffect = dynamic(
  () => import("@/components/profile/layouts/background-effects/Aurora").then((m) => m.AuroraEffect),
  { ssr: false },
);
import { useState } from "react";
import { useHeavyFxAllowed } from "@/lib/heavy-fx";
import { motion } from "framer-motion";
import { PREMIUM_PLAN, CURRENCIES, type Currency } from "@/lib/payments/plans";

interface PricingProps {
  isAuthenticated?: boolean;
  isPremium?: boolean;
  hasImageHost?: boolean;
  hasVerified?: boolean;
  hasDonator?: boolean;
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f05e23" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <path d="M20 6L9 17L4 12" />
    </svg>
  );
}

export default function PricingClient({
  isAuthenticated = false,
  isPremium = false,
}: PricingProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>("USD");
  const heavyFxAllowed = useHeavyFxAllowed();
  const plan = PREMIUM_PLAN[currency];

  const handleEnterClick = (e: React.MouseEvent<HTMLElement>) => {
    const enter = (e.target as HTMLElement).closest<HTMLElement>("[data-gp-enter]");
    if (!enter) return;
    e.preventDefault();
    const content = e.currentTarget.querySelector<HTMLElement>(".gp-pricing [data-gp-content]");
    if (!content) return;
    const keyboard = e.detail === 0;
    if (!keyboard) enter.blur();
    const startY = window.scrollY;
    const targetY = startY + content.getBoundingClientRect().top;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, targetY);
      if (keyboard) content.focus({ preventScroll: true });
      return;
    }
    let cancelled = false;
    const cancel = () => { cancelled = true; teardown(); };
    const onKey = (ev: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(ev.key)) cancel();
    };
    const teardown = () => {
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
      window.removeEventListener("keydown", onKey);
    };
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    window.addEventListener("keydown", onKey);
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const start = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / 1600);
      window.scrollTo(0, startY + distance * ease(t));
      if (t < 1) requestAnimationFrame(step);
      else { teardown(); if (keyboard) content.focus({ preventScroll: true }); }
    };
    requestAnimationFrame(step);
  };

  return (
    <main className="bg-black relative" onClick={handleEnterClick} style={{ fontFamily: "var(--font-comfortaa)" }}>
      <Navbar isAuthenticated={isAuthenticated} />

      <TopFade />

      <style>{`
        .gp-pricing [data-gp-caption]{inset:calc(var(--gp-word-bottom,55%) + 44px) 24px auto;justify-content:center;}
        .gp-pricing [data-gp-enter]{min-height:44px;padding:0 22px;gap:14px;background:rgba(240,94,35,.20);border-radius:12px;color:#fff;font-size:13px;font-weight:400;box-shadow:0 0 15px rgba(240,94,35,.10);transition:background .18s,box-shadow .18s;}
        .gp-pricing [data-gp-enter]:hover{background:rgba(240,94,35,.30);box-shadow:0 0 20px rgba(240,94,35,.18);}
        .gp-pricing [data-gp-enter]:focus-visible{outline:2px solid #f68553;outline-offset:4px;}
        .gp-pricing [data-gp-content]{align-content:start;padding-top:clamp(88px,12vh,132px);padding-bottom:84px;}
      `}</style>

      <GlyphPortal
        className="gp-pricing relative z-10"
        word="PREMIUM"
        interactive={false}
        scrollLength={1.7}
        enterLabel="View plan"
        style={{
          "--gp-paper": "#000000",
          "--gp-ink": "rgba(255,255,255,0.70)",
          "--gp-field": "#000000",
          "--gp-foreground": "#ffffff",
          fontFamily: "var(--font-comfortaa)",
        }}
        background={
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "#000000" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: "scale(var(--gp-field-scale,1))",
                background:
                  "radial-gradient(78% 42% at 50% 40%, rgba(240,94,35,0.42) 0%, rgba(240,94,35,0.10) 50%, transparent 76%)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: "scaleY(-1)",
                  WebkitMaskImage:
                    "radial-gradient(66% 80% at 50% 10%, #000 0%, rgba(0,0,0,0.5) 46%, transparent 74%)",
                  maskImage:
                    "radial-gradient(66% 80% at 50% 10%, #000 0%, rgba(0,0,0,0.5) 46%, transparent 74%)",
                }}
              >
                {heavyFxAllowed && <AuroraEffect colors={["#c44110", "#f05e23", "#f68553"]} intensity={52} blend={0.72} />}
              </div>
            </div>
          </div>
        }
        front={
          <div
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              bottom: "calc(100% - var(--gp-word-top, 35%) + 26px)",
              textAlign: "center",
              margin: 0,
            }}
          >
            <p className="text-[15px] md:text-[16px] font-light tracking-wide text-white/60">
              Simple pricing. One monthly plan at $1/month.
            </p>
            <p className="mt-1.5 text-[12.5px] font-light tracking-wide text-white/35">
              Start free, upgrade anytime, cancel whenever you want.
            </p>
          </div>
        }
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-medium text-white tracking-tight leading-[1.05]">
                Made super simple,
              </h1>
              <div className="text-[#f68553]" style={{ fontFamily: "var(--font-caviar-dreams)" }}>
                <MorphingText
                  texts={["just $1/month.", "for all creators.", "scales with you.", "cancel anytime."]}
                  className="mx-0 h-9 w-[17ch] max-w-none text-center text-3xl md:h-14 md:text-5xl lg:text-5xl"
                />
              </div>
            </div>
            <div className="max-w-xl">
              <BlurTextEffect className="text-base font-light leading-relaxed text-white/50">
                No confusing tiers or add-ons. Free to start, or unlock everything for $1/month.
              </BlurTextEffect>
            </div>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="relative inline-flex items-center gap-1 rounded-full border border-[#f05e23]/10 bg-[#f05e23]/3 p-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`relative z-10 rounded-full px-5 py-1.5 text-[13px] font-light transition-colors cursor-pointer ${
                    currency === c ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {currency === c && (
                    <motion.div
                      layoutId="currency-bubble"
                      className="absolute inset-0 z-0 rounded-full bg-[#f05e23]/20 shadow-[0_0_15px_rgba(240,94,35,0.1)]"
                      transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end text-left">
            <div className="w-full bg-[#0c0c0c] border border-white/5 rounded-[20px] p-5 sm:p-6 shadow-sm text-left flex flex-col">
              <p className="text-[14px] font-normal text-white/90 tracking-tight mb-1">Free</p>
              <p className="text-[12.5px] font-light text-white/40 mb-4">Everything you need to start.</p>
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-4xl font-medium text-white tabular-nums">{plan.symbol}0</span>
                <span className="text-sm font-light text-white/40">/ month</span>
              </div>

              <ul className="flex flex-col gap-3 mb-8">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[13px] font-light text-white/70">
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-[13px] font-light text-white/35">
                  <CheckIcon />
                  And much more, etc.
                </li>
              </ul>

              <button
                onClick={() => router.push(isAuthenticated ? "/dashboard" : "/register")}
                className="mt-auto w-full bg-[#f05e23]/20 hover:bg-[#f05e23]/30 text-white font-normal rounded-xl py-2.5 text-sm transition-all shadow-[0_0_15px_rgba(240,94,35,0.1)] cursor-pointer"
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              </button>
            </div>
            <div className="w-full bg-[#0c0c0c] border border-[#f05e23]/40 rounded-[20px] p-5 sm:p-6 text-left flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(240,94,35,0.12)]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#f05e23]/[0.07] via-transparent to-transparent pointer-events-none" />
              <div className="relative flex flex-col h-full">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[14px] font-normal text-white/90 tracking-tight flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 512 512" fill="#f05e23" aria-hidden="true">
                      <path d="M396.31 32H264l84.19 112.26L396.31 32Zm-280.62 0 48.12 112.26L248 32H115.69ZM256 74.67 192 160h128l-64-85.33Zm166.95-23.61L376.26 160H488L422.95 51.06Zm-333.9 0L23 160h112.74L89.05 51.06ZM146.68 192H24l222.8 288h.53L146.68 192Zm218.64 0L264.67 480h.53L488 192H365.32Zm-35.93 0H182.61L256 400l73.39-208Z" />
                    </svg>
                    Premium
                  </p>
                  <span className="text-[11px] font-medium text-white bg-[#f05e23] rounded-full px-2.5 py-0.5">
                    {isPremium ? "Active" : "Monthly"}
                  </span>
                </div>
                <p className="text-[12.5px] font-light text-white/40 mb-4">Unlock everything, billed monthly. Cancel anytime.</p>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-medium text-white tabular-nums">{plan.symbol}{plan.display}</span>
                  <span className="text-sm font-light text-white/40">/ month</span>
                </div>

                <ul className="flex flex-col gap-3 mb-8">
                  {PREMIUM_FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13px] font-light text-white/70">
                      <CheckIcon />
                      {feature}
                    </li>
                  ))}
                  <li className="flex items-start gap-2.5 text-[13px] font-light text-white/35">
                    <CheckIcon />
                    Billed monthly, cancel anytime
                  </li>
                </ul>

                {isPremium ? (
                  <div className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-[#f05e23]/15 py-2.5 text-sm font-normal text-white ring-1 ring-inset ring-[#f05e23]/30">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f05e23" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    You already have Premium
                  </div>
                ) : (
                  <button
                    onClick={() => router.push(isAuthenticated ? "/checkout" : "/register")}
                    className="mt-auto w-full bg-[#f05e23]/20 hover:bg-[#f05e23]/30 text-white font-normal rounded-xl py-2.5 text-sm transition-all shadow-[0_0_15px_rgba(240,94,35,0.1)] cursor-pointer"
                  >
                    Subscribe — {plan.symbol}{plan.display}/month
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </GlyphPortal>

      <Footer />
    </main>
  );
}
