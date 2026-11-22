"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import QRCode from "qrcode";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Copy, Download, ExternalLink, QrCode, X } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface ShareProfileModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

export default function ShareProfileModal({ open, onClose, username }: ShareProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<"main" | "qr">("main");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const profilePath = `/${username}`;
  const fullUrl =
    typeof window !== "undefined" ? `${window.location.origin}${profilePath}` : `https://prophile.lol${profilePath}`;
  const displayUrl = `prophile/${username}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setView("main");
      setCopied(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || view !== "qr") return;
    let active = true;
    QRCode.toDataURL(fullUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: "#0c0c0c",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) toast.error("Failed to generate QR code.");
      });
    return () => {
      active = false;
    };
  }, [open, view, fullUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Profile URL copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy URL.");
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `prophile-${username}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded!");
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          style={{ fontFamily: "var(--font-comfortaa)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-profile-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-[420px] rounded-[24px] bg-[#0c0c0c] border border-white/[0.08] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                {view === "qr" ? (
                  <button
                    type="button"
                    onClick={() => setView("main")}
                    className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white transition-colors mb-2 cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>
                ) : null}
                <h2
                  id="share-profile-title"
                  className="text-[20px] font-medium text-white tracking-tight leading-snug"
                >
                  {view === "qr" ? "Prophile QR Code" : "Share Your Profile"}
                </h2>
                <p className="text-[13px] text-white/45 mt-1.5 leading-relaxed">
                  {view === "qr"
                    ? `Scan to open ${displayUrl} on any device.`
                    : "Share your Prophile link everywhere you're active."}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {view === "main" ? (
              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setView("qr")}
                  className="w-full rounded-2xl border border-white/[0.07] bg-[#121212] hover:bg-[#161616] hover:border-[#f05e23]/30 px-3.5 py-3 flex items-center gap-3.5 transition-all cursor-pointer group text-left"
                >
                  <span className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.07] group-hover:bg-[#f05e23]/12 group-hover:border-[#f05e23]/30 flex items-center justify-center text-white/85 group-hover:text-[#f05e23] transition-colors shrink-0">
                    <QrCode size={18} />
                  </span>
                  <span className="text-[14px] font-normal text-white/90 group-hover:text-white transition-colors">
                    Prophile QR Code
                  </span>
                </button>

                <Link
                  href={profilePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="w-full rounded-2xl border border-white/[0.07] bg-[#121212] hover:bg-[#161616] hover:border-[#f05e23]/30 px-3.5 py-3 flex items-center gap-3.5 transition-all group"
                >
                  <span className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.07] group-hover:bg-[#f05e23]/12 group-hover:border-[#f05e23]/30 flex items-center justify-center text-white/85 group-hover:text-[#f05e23] transition-colors shrink-0">
                    <ExternalLink size={18} />
                  </span>
                  <span className="text-[14px] font-normal text-white/90 group-hover:text-white transition-colors">
                    Open My Page
                  </span>
                </Link>

                <div className="w-full rounded-2xl border border-white/[0.07] bg-[#121212] pl-4 pr-2 py-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-[13.5px] text-white/85 truncate select-all">
                    {displayUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy profile URL"
                    title="Copy profile URL"
                    className="h-10 w-10 shrink-0 rounded-xl bg-[#f05e23] hover:bg-[#d64e18] text-white flex items-center justify-center transition-all cursor-pointer shadow-[0_4px_18px_rgba(240,94,35,0.3)] active:scale-95"
                  >
                    {copied ? <Check size={17} strokeWidth={2.5} /> : <Copy size={17} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-white border-2 border-[#f05e23]/30 shadow-[0_0_32px_rgba(240,94,35,0.14)]">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${displayUrl}`}
                      className="w-48 h-48 block rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full border-2 border-[#f05e23]/30 border-t-[#f05e23] animate-spin" />
                    </div>
                  )}
                </div>

                <div className="w-full flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    disabled={!qrDataUrl}
                    className="flex-1 h-10 rounded-xl bg-[#f05e23] hover:bg-[#d64e18] text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_4px_18px_rgba(240,94,35,0.28)]"
                  >
                    <Download size={15} />
                    Download PNG
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label="Copy profile URL"
                    title="Copy profile URL"
                    className="h-10 w-10 shrink-0 rounded-xl border border-white/[0.08] bg-[#141414] hover:bg-[#1a1a1a] hover:border-[#f05e23]/35 text-white/85 hover:text-[#f05e23] flex items-center justify-center transition-all cursor-pointer"
                  >
                    {copied ? <Check size={16} className="text-[#4ade80]" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
