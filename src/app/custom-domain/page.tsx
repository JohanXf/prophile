"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function CustomDomainPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-center">
      <h1 className="text-[22px] sm:text-[28px] font-normal tracking-tight text-white">
        This domain is part of the <span className="text-[#f05e23]">prophile</span> {type === "image_host" ? "image hosting" : "profile"} service.
      </h1>
    </main>
  );
}
