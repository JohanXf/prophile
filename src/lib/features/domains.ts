import { getStore, saveStore } from "@/lib/local-store";

export const DOMAIN_TARGET = "domains.prophile.com";
export const HOSTNAME_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export type DomainType = "profile" | "image_host";
export type DomainRow = {
  id: number;
  hostname: string;
  type: DomainType;
  visibility: "private" | "public";
  status: "pending" | "active";
  dcvTarget: string | null;
};
export type AvailableDomain = { id: number; hostname: string; type: DomainType; owner: string; own: boolean };
export type DomainState = {
  username: string;
  tokens: number;
  domains: DomainRow[];
  available: AvailableDomain[];
  profileDomainId: number | null;
  imageDomainId: number | null;
};

export const cfCreateHostname = async (_hostname: string) => ({ id: "cf-demo-id", status: "active" });
export const cfGetHostname = async (_id: string) => ({ id: "cf-demo-id", status: "active" });
export const cfDeleteHostname = async (_id: string) => ({});

export async function imageShareBase(_userId: number): Promise<string> {
  return typeof window !== "undefined" ? window.location.origin : "https://prophile.com";
}

export function toShareUrl(url: string, base: string): string {
  if (url.startsWith("http")) return url;
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

export async function deleteUserDomains(userId: number): Promise<void> {
  const state = getStore();
  state.domains = state.domains.filter((d) => d.userId !== userId);
  saveStore(state);
}

export async function domainState(userId: number): Promise<DomainState> {
  const state = getStore();
  const user = state.users[userId] ?? state.users[1];
  const ownDomains = state.domains.filter((d) => d.userId === userId);
  const available: AvailableDomain[] = state.domains
    .filter((d) => d.status === "active" && (d.visibility === "public" || d.userId === userId))
    .map((d) => ({
      id: d.id,
      hostname: d.hostname,
      type: d.type,
      owner: state.users[d.userId]?.username ?? "prophile",
      own: d.userId === userId,
    }));

  return {
    username: user?.username ?? "rio",
    tokens: user?.domainTokens ?? 2,
    domains: ownDomains.map((d) => ({
      id: d.id,
      hostname: d.hostname,
      type: d.type,
      visibility: d.visibility,
      status: d.status,
      dcvTarget: d.dcvTarget,
    })),
    available,
    profileDomainId: null,
    imageDomainId: null,
  };
}
