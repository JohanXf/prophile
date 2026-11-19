"use client";

import React from "react";
import { PUBLIC_NAME_RE } from "@/lib/features/image-host/unlock";
import UnlockForm from "./UnlockForm";
import NotFound from "@/app/not-found";

export default function UnlockPage({ name }: { name: string }) {
  if (!PUBLIC_NAME_RE.test(name)) return <NotFound />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <UnlockForm name={name} />
    </main>
  );
}
