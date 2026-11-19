"use client";

import React from "react";
import ProfileView from "@/app/[username]/ProfileView";
import PreviewToolbar from "@/components/templates/PreviewToolbar";
import { getStore } from "@/lib/local-store";
import { applyTemplateStyle, templateBackgrounds } from "@/lib/template-style";
import { sanitizeTemplateConfig } from "@/lib/template-config";
import NotFound from "@/app/not-found";

export default function TemplatePreviewPage({ templateId }: { templateId: string }) {
  const id = parseInt(templateId, 10);
  const state = getStore();
  const userId = state.sessionUserId ?? 1;
  const template = state.templates.find((t) => t.id === id);
  const user = state.users[userId] ?? state.users[1];

  if (!template || !user) return <NotFound />;

  const sanitized = sanitizeTemplateConfig(template.config);
  const styleOverrides = applyTemplateStyle({}, sanitized as Record<string, unknown>);
  const backgrounds = templateBackgrounds(sanitized as Record<string, unknown>);

  return (
    <div className="relative">
      <ProfileView
        username={user.username}
        isPreview
        styleOverrides={styleOverrides}
        backgroundOverride={backgrounds}
      />
      <PreviewToolbar
        templateId={id}
        templateName={template.name}
        slug={template.slug}
        isPublic={template.isPublic}
        username={user.username}
      />
    </div>
  );
}