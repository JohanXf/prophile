import { SITE_CONFIG } from "@/lib/config";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export const DEFAULT_EMBED_COLOR = "#5b6cf5";

export function normalizeEmbedColor(color: string | null | undefined): string {
  const val = color?.trim().toLowerCase();
  return val && /^#[0-9a-f]{6}$/.test(val) ? val : DEFAULT_EMBED_COLOR;
}

export function formatTabTitle(
  tabTitle: string | null | undefined,
  username: string,
): string {
  const custom = tabTitle?.trim().replace(/^@+/, "").trim();
  return custom ? `@${custom}` : `@${username} | ${SITE_CONFIG.name}`;
}

const ALLOWED_IMAGE_PREFIXES = [
  "https://cdn.prophile.gg/",
  "https://cdn.discordapp.com/",
];

export function isAllowedOgImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return ALLOWED_IMAGE_PREFIXES.some((p) => url.startsWith(p));
}

type OgInputs = {
  embedBackgroundUrl?: string | null;
  embedIconUrl?: string | null;
  displayName?: string | null;
};

function simpleHash(str: string): string {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0")).slice(0, 12);
}

export function ogImageVersion(inputs: OgInputs): string {
  return simpleHash(
    [inputs.embedBackgroundUrl ?? "", inputs.embedIconUrl ?? "", inputs.displayName ?? ""].join("|"),
  );
}

export function buildOgImagePath(username: string, inputs: OgInputs): string {
  return `/api/og/${encodeURIComponent(username)}?v=${ogImageVersion(inputs)}`;
}

export function buildOgImageUrl(username: string, inputs: OgInputs): string {
  return `${SITE_CONFIG.url}${buildOgImagePath(username, inputs)}`;
}
