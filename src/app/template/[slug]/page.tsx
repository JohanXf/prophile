"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import TemplatePageClient, { type PublicTemplateView } from "@/components/templates/TemplatePageClient";
import { getStore } from "@/lib/local-store";
import { SITE_CONFIG } from "@/lib/config";
import NotFound from "@/app/not-found";

export default function TemplatePage({ slug }: { slug: string }) {
  const state = getStore();
  const tpl = state.templates.find((t) => t.slug === slug);
  if (!tpl) return <NotFound />;

  const auth = state.sessionUserId !== null;
  const view: PublicTemplateView = {
    id: tpl.id,
    slug: tpl.slug,
    name: tpl.name,
    thumbnailUrl: tpl.thumbnailUrl,
    shareUrl: `${SITE_CONFIG.url}/template/${tpl.slug}`,
    useCount: tpl.useCount,
    favoriteCount: tpl.favoriteCount,
    creatorUsername: tpl.creatorUsername,
    creatorAvatarUrl: tpl.creatorAvatarUrl,
    favorited: Boolean(tpl.favorited ?? tpl.favoritedByViewer),
    requiresPremium: Boolean(tpl.requiresPremium),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isAuthenticated={auth} />
      <TemplatePageClient template={view} isAuthenticated={auth} />
    </div>
  );
}