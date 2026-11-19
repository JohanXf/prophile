import { getStore, saveStore } from "@/lib/local-store";
import { domainState, type DomainState, type DomainType } from "@/lib/features/domains";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function addDomain(
  raw: string,
  type: DomainType,
  visibility: "private" | "public"
): Promise<Result<DomainState>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const clean = raw.toLowerCase().trim();
  if (!clean) return { ok: false, error: "Enter a valid domain." };
  state.domains.push({
    id: Date.now(),
    userId: uid,
    hostname: clean,
    type,
    visibility,
    status: "active",
    dcvTarget: null,
  });
  saveStore(state);
  return { ok: true, data: await domainState(uid) };
}

export async function verifyDomain(id: number): Promise<Result<DomainState & { active: boolean }>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const d = state.domains.find((x) => x.id === id);
  if (d) d.status = "active";
  saveStore(state);
  const ds = await domainState(uid);
  return { ok: true, data: { ...ds, active: true } };
}

export async function removeDomain(id: number): Promise<Result<DomainState>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  state.domains = state.domains.filter((x) => x.id !== id);
  saveStore(state);
  return { ok: true, data: await domainState(uid) };
}

export async function setDomainUse(_type: DomainType, _id: number | null): Promise<Result<DomainState>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  return { ok: true, data: await domainState(uid) };
}
