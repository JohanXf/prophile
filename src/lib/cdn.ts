export const CDN_BASE = "https://cdn.prophile.com/";
export const IMAGE_HOST_BASE = "https://host.prophile.com/";

const STORED_MEDIA_HOSTS = new Set(["cdn.prophile.com", "cdn.iuno.lol"]);

function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function fileIdForHosts(url: string | null | undefined, hosts: Set<string>): string | null {
  const host = hostnameOf(url);
  if (!host || !hosts.has(host)) return null;
  try {
    const name = new URL(url as string).pathname.replace(/^\//, "");
    if (!name || name.includes("/") || !/^[A-Za-z0-9._-]+$/.test(name)) return null;
    return name;
  } catch {
    return null;
  }
}

export function isStoredMediaUrl(url: string | null | undefined): boolean {
  const host = hostnameOf(url);
  return host !== null && STORED_MEDIA_HOSTS.has(host);
}

export function storedFileId(url: string | null | undefined): string | null {
  return fileIdForHosts(url, STORED_MEDIA_HOSTS);
}

export function toCdnUrl(url: string): string {
  const id = storedFileId(url);
  if (!id) return url;
  if (url.startsWith(CDN_BASE)) return url;
  return `${CDN_BASE}${id}`;
}
