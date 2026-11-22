import { authFetch } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";

export async function addComment(profileId: number, content: string, replyToId?: number) {
  const res = await authFetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, content, replyToId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, error: (body as { error?: string }).error || "Sign in to post a comment." };
  await hydrateStoreFromServer();
  return body;
}

export async function getComments(profileId: number, _page = 1, _limit = 10, _sort?: string) {
  const res = await authFetch(`/api/comments?profileId=${encodeURIComponent(String(profileId))}`);
  if (!res.ok) return { success: false, comments: [], total: 0, hasMore: false };
  return res.json();
}

export async function toggleLikeComment(commentId: number, _type?: "like" | "dislike") {
  const res = await authFetch(`/api/comments/${commentId}/like`, { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, liked: false, likesCount: 0, error: (body as { error?: string }).error };
  await hydrateStoreFromServer();
  return body;
}

export async function togglePinComment(commentId: number) {
  const res = await authFetch(`/api/comments/${commentId}/pin`, { method: "POST" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, pinned: false };
  await hydrateStoreFromServer();
  return body;
}

export async function editComment(commentId: number, content: string) {
  const res = await authFetch(`/api/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { success: false, content };
  await hydrateStoreFromServer();
  return body;
}

export async function deleteComment(commentId: number, _profileId?: number) {
  const res = await authFetch(`/api/comments/${commentId}`, { method: "DELETE" });
  if (!res.ok) return { success: false };
  await hydrateStoreFromServer();
  return { success: true };
}

export async function getDashboardComments(
  _receivedPage: string | number = 1,
  _limit: string | number = 4,
  _givenPage: string | number = 1
) {
  const res = await authFetch("/api/dashboard/comments");
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
    received: (data.received ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      createdAt: new Date(String(c.createdAt)),
    })),
    given: (data.given ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      createdAt: new Date(String(c.createdAt)),
    })),
  };
}
