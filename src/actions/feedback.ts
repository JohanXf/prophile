import { authFetch } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";

export async function submitFeedbackAction(
  userId: number,
  type: "like" | "dislike" | "unlike" | "undislike"
) {
  const res = await authFetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, type }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: (body as { error?: string }).error || "Sign in to react to profiles." };
  }
  await hydrateStoreFromServer();
  return body;
}

export async function getDashboardFeedback(
  _receivedPage: string | number = 1,
  _givenPage = 1,
  _limit = 4,
  _extra?: unknown
) {
  const res = await authFetch("/api/dashboard/feedback");
  if (!res.ok) {
    return {
      success: true,
      received: [],
      given: [],
      receivedHasMore: false,
      givenHasMore: false,
      receivedTotal: 0,
      givenTotal: 0,
    };
  }
  const data = await res.json();
  return {
    ...data,
    received: (data.received ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      createdAt: new Date(String(r.createdAt)),
    })),
    given: (data.given ?? []).map((g: Record<string, unknown>) => ({
      ...g,
      createdAt: new Date(String(g.createdAt)),
    })),
  };
}
