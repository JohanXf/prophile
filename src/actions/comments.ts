import { getStore, saveStore } from "@/lib/local-store";

export async function addComment(profileId: number, content: string, replyToId?: number) {
  const state = getStore();
  const authorId = state.currentUserId ?? 1;
  const author = state.users[authorId] ?? state.users[1];
  const newComment = {
    id: Date.now(),
    profileId,
    authorId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    pinned: false,
    likesCount: 0,
    likedByMe: false,
    replyToId: replyToId ?? null,
  };
  state.comments.unshift(newComment);
  saveStore(state);
  return {
    success: true,
    comment: {
      ...newComment,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatarUrl: author.avatarUrl,
        avatarShape: author.avatarShape,
      },
      replies: [],
    },
  };
}

export async function getComments(profileId: number, _page = 1, _limit = 10, _sort?: string) {
  const state = getStore();
  const items = state.comments
    .filter((c) => c.profileId === profileId && !c.replyToId)
    .map((c) => {
      const author = state.users[c.authorId] ?? state.users[1];
      const replies = state.comments
        .filter((r) => r.replyToId === c.id)
        .map((r) => {
          const rAuthor = state.users[r.authorId] ?? state.users[1];
          return {
            ...r,
            author: {
              id: rAuthor.id,
              username: rAuthor.username,
              displayName: rAuthor.displayName,
              avatarUrl: rAuthor.avatarUrl,
              avatarShape: rAuthor.avatarShape,
            },
          };
        });
      return {
        ...c,
        author: {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl,
          avatarShape: author.avatarShape,
        },
        replies,
      };
    });
  return {
    success: true,
    comments: items,
    total: items.length,
    hasMore: false,
  };
}

export async function toggleLikeComment(commentId: number, _type?: "like" | "dislike") {
  const state = getStore();
  const target = state.comments.find((c) => c.id === commentId);
  if (target) {
    target.likedByMe = !target.likedByMe;
    target.likesCount = Math.max(0, target.likesCount + (target.likedByMe ? 1 : -1));
    saveStore(state);
  }
  return {
    success: true,
    liked: target?.likedByMe ?? false,
    likesCount: target?.likesCount ?? 0,
  };
}

export async function togglePinComment(commentId: number) {
  const state = getStore();
  const target = state.comments.find((c) => c.id === commentId);
  if (target) {
    target.pinned = !target.pinned;
    saveStore(state);
  }
  return { success: true, pinned: target?.pinned ?? false };
}

export async function editComment(commentId: number, content: string) {
  const state = getStore();
  const target = state.comments.find((c) => c.id === commentId);
  if (target) {
    target.content = content.trim();
    saveStore(state);
  }
  return { success: true, content: content.trim() };
}

export async function deleteComment(commentId: number, _profileId?: number) {
  const state = getStore();
  state.comments = state.comments.filter((c) => c.id !== commentId && c.replyToId !== commentId);
  saveStore(state);
  return { success: true };
}

export async function getDashboardComments(_receivedPage: string | number = 1, _limit: string | number = 4, _givenPage: string | number = 1) {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const received = state.comments
    .filter((c) => c.profileId === uid)
    .map((c) => {
      const author = state.users[c.authorId] ?? state.users[2];
      return {
        id: c.id,
        content: c.content,
        createdAt: new Date(c.createdAt),
        pinned: c.pinned,
        likesCount: c.likesCount,
        likedByMe: c.likedByMe,
        author: {
          id: author.id,
          username: author.username,
          displayName: author.displayName,
          avatarUrl: author.avatarUrl,
          avatarShape: author.avatarShape,
        },
      };
    });
  const given = state.comments
    .filter((c) => c.authorId === uid)
    .map((c) => {
      const target = state.users[c.profileId] ?? state.users[1];
      return {
        id: c.id,
        content: c.content,
        createdAt: new Date(c.createdAt),
        pinned: c.pinned,
        likesCount: c.likesCount,
        likedByMe: c.likedByMe,
        profileUser: {
          id: target.id,
          username: target.username,
          displayName: target.displayName,
          avatarUrl: target.avatarUrl,
          avatarShape: target.avatarShape,
        },
      };
    });

  return {
    success: true,
    received,
    given,
    receivedHasMore: false,
    givenHasMore: false,
    receivedTotal: received.length,
    givenTotal: given.length,
  };
}
