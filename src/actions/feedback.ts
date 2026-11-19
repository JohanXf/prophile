import { getStore, saveStore } from "@/lib/local-store";

export async function submitFeedbackAction(
  userId: number,
  type: "like" | "dislike" | "unlike" | "undislike"
) {
  const state = getStore();
  const target = state.users[userId];
  if (!target) return { success: false, error: "Profile not found." };

  if (type === "like") target.likesCount += 1;
  else if (type === "unlike") target.likesCount = Math.max(0, target.likesCount - 1);
  else if (type === "dislike") target.dislikesCount += 1;
  else if (type === "undislike") target.dislikesCount = Math.max(0, target.dislikesCount - 1);

  saveStore(state);
  return {
    success: true,
    likesCount: target.likesCount,
    dislikesCount: target.dislikesCount,
    userReaction: type === "like" ? "like" : type === "dislike" ? "dislike" : null,
  };
}

export async function getDashboardFeedback(
  _receivedPage: string | number = 1,
  _givenPage = 1,
  _limit = 4,
  _extra?: unknown
) {
  const state = getStore();
  const rex = state.users[2];
  const sara = state.users[3];
  const received = [
    {
      id: 1,
      receiverId: 1,
      giverId: rex.id,
      type: "like" as const,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2),
      user: {
        id: rex.id,
        username: rex.username,
        displayName: rex.displayName,
        avatarUrl: rex.avatarUrl,
        avatarShape: rex.avatarShape,
      },
    },
    {
      id: 2,
      receiverId: 1,
      giverId: sara.id,
      type: "like" as const,
      createdAt: new Date(Date.now() - 3600 * 1000 * 12),
      user: {
        id: sara.id,
        username: sara.username,
        displayName: sara.displayName,
        avatarUrl: sara.avatarUrl,
        avatarShape: sara.avatarShape,
      },
    },
  ];
  return {
    success: true,
    received,
    given: [],
    receivedHasMore: false,
    givenHasMore: false,
    receivedTotal: received.length,
    givenTotal: 0,
  };
}
