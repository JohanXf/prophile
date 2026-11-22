const PUBLIC_MEDIA_HOSTS = new Set(["cdn.iuno.lol", "host.iuno.lol"]);

export function isHostedMediaUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:audio/")) return true;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (PUBLIC_MEDIA_HOSTS.has(host)) return true;
    if (host.endsWith(".r2.dev") || host.endsWith(".r2.cloudflarestorage.com")) return true;
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
