import { authFetch } from "@/lib/auth-client";
import { getStore, hydrateStoreFromServer } from "@/lib/local-store";
import { domainState, type DomainState, type DomainType } from "@/lib/features/domains";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function addDomain(
  raw: string,
  type: DomainType,
  visibility: "private" | "public"
): Promise<Result<DomainState>> {
  const res = await authFetch("/api/domains", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostname: raw, type, visibility }),
  });
  const body = (await res.json().catch(() => ({}))) as { data?: DomainState; error?: string };
  if (!res.ok) return { ok: false, error: body.error || "Failed to add domain." };
  await hydrateStoreFromServer();
  return { ok: true, data: body.data! };
}

export async function verifyDomain(id: number): Promise<Result<DomainState & { active: boolean }>> {
  const res = await authFetch(`/api/domains/${id}/verify`, { method: "POST" });
  const body = (await res.json().catch(() => ({}))) as {
    data?: DomainState & { active: boolean };
    error?: string;
  };
  if (!res.ok) return { ok: false, error: body.error || "Failed to verify domain." };
  await hydrateStoreFromServer();
  return { ok: true, data: body.data! };
}

export async function removeDomain(id: number): Promise<Result<DomainState>> {
  const res = await authFetch(`/api/domains/${id}`, { method: "DELETE" });
  const body = (await res.json().catch(() => ({}))) as { data?: DomainState; error?: string };
  if (!res.ok) return { ok: false, error: body.error || "Failed to remove domain." };
  await hydrateStoreFromServer();
  return { ok: true, data: body.data! };
}

export async function setDomainUse(_type: DomainType, _id: number | null): Promise<Result<DomainState>> {
  const state = getStore();
  return { ok: true, data: await domainState(state.currentUserId ?? 1) };
}
