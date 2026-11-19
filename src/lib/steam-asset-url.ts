const STEAM_ITEM_CDN =
  "https://cdn.fastly.steamstatic.com/steamcommunity/public/images/";

export function steamAssetUrl(path: string): string {
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${STEAM_ITEM_CDN}${path}`;
}
