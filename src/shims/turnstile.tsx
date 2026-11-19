import React, { useEffect, useState } from "react";

export interface TurnstileProps {
  siteKey?: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  onTimeout?: () => void;
  options?: Record<string, any>;
  className?: string;
}

export const Turnstile: React.FC<TurnstileProps> = ({ onSuccess, className }) => {
  const [status, setStatus] = useState<"verifying" | "verified">("verifying");

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("verified");
      onSuccess?.("prophile-turnstile-token");
    }, 550);
    return () => clearTimeout(timer);
  }, [onSuccess]);

  return (
    <div
      onClick={() => {
        setStatus("verified");
        onSuccess?.("prophile-turnstile-token");
      }}
      className={`flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-[#141416] border border-white/10 w-[260px] cursor-pointer select-none ${className ?? ""}`}
    >
      <div className="flex items-center gap-3">
        {status === "verifying" ? (
          <span className="w-5 h-5 rounded-full border-2 border-[#5b6cf5] border-t-transparent animate-spin inline-block" />
        ) : (
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        )}
        <span className="text-xs text-white/80 font-medium">
          {status === "verifying" ? "Verifying..." : "Verified"}
        </span>
      </div>
      <span className="text-[10px] text-white/30 font-mono">prophile</span>
    </div>
  );
};

export default Turnstile;
