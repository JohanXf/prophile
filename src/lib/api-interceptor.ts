import { getStore, updateStore } from "@/lib/local-store";
import { applyTemplateStyle, templateBackgrounds } from "@/lib/template-style";
import { sanitizeTemplateConfig } from "@/lib/template-config";
import { CURATED_ICONIFY_ICONS, iconifyProxyUrl, brandColorFor } from "@/lib/links";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "/showcase-avatar.jpg");
    reader.onerror = () => resolve("/showcase-avatar.jpg");
    reader.readAsDataURL(file);
  });
}

const SAMPLE_SEARCH_TRACKS = [
  {
    id: "sc-1",
    title: "MONTAGEM Miau",
    artist: "Lenar",
    duration: 94,
    artworkUrl: "/showcase-music-cover.jpg",
    audioUrl: "/montagem-miau.mp3",
  },
  {
    id: "sc-2",
    title: "All The Stars",
    artist: "Kendrick Lamar, SZA",
    duration: 232,
    artworkUrl: "/all-the-stars-cover.jpg",
    audioUrl: "/all-the-stars.mp3",
  },
  {
    id: "sc-3",
    title: "Soft Spot",
    artist: "keshi",
    duration: 204,
    artworkUrl: "/soft-spot-cover.jpg",
    audioUrl: "/soft-spot.mp3",
  },
  {
    id: "sc-4",
    title: "After Dark",
    artist: "Mr.Kitty",
    duration: 259,
    artworkUrl: "/showcase-avatar-2.jpg",
    audioUrl: "/montagem-miau.mp3",
  },
];

let installed = false;

export function installApiInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Also intercept HTMLImageElement.prototype.src setter for raw <img> tags that use /api/widgets/.../image
  try {
    const imgSrcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
    if (imgSrcDesc?.set && imgSrcDesc?.get && imgSrcDesc.configurable !== false) {
      Object.defineProperty(HTMLImageElement.prototype, "src", {
        configurable: true,
        enumerable: true,
        get() {
          return imgSrcDesc.get!.call(this);
        },
        set(val: string) {
          let next = val;
          if (typeof val === "string") {
            if (val.startsWith("/api/widgets/github/avatar/")) {
              const user = decodeURIComponent(val.replace("/api/widgets/github/avatar/", "").split("?")[0]);
              next = `https://github.com/${encodeURIComponent(user)}.png`;
            } else if (val.startsWith("/api/widgets/") && val.includes("/image?")) {
              try {
                const u = new URL(val, window.location.origin);
                const target = u.searchParams.get("url");
                if (target) next = target;
              } catch {}
            }
          }
          imgSrcDesc.set!.call(this, next);
        },
      });
    }
  } catch {
    // ignore if HTMLImageElement.prototype.src is locked
  }

  // Intercept XMLHttpRequest.prototype for /api/image-host/upload without assigning window.XMLHttpRequest
  try {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    const xhrUrls = new WeakMap<XMLHttpRequest, string>();

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      username?: string | null,
      password?: string | null
    ) {
      xhrUrls.set(this, typeof url === "string" ? url : url.toString());
      return origOpen.call(this, method, url, async, username ?? null, password ?? null);
    };

    XMLHttpRequest.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      const interceptedUrl = xhrUrls.get(this) || "";
      if (interceptedUrl.startsWith("/api/image-host/upload") && body instanceof FormData) {
        const file = body.get("file");
        if (file instanceof Blob) {
          const xhr = this;
          fileToDataUrl(file).then((dataUrl) => {
            const name = file instanceof File ? file.name : "upload.png";
            const size = file.size || 240000;
            const kind = file.type.startsWith("video/") ? "video" : "image";
            updateStore((s) => {
              const nextId = s.imageHostFiles.reduce((m, f) => Math.max(m, f.id), 0) + 1;
              s.imageHostFiles.unshift({
                id: nextId,
                url: dataUrl,
                name,
                size,
                kind,
                favorite: false,
                locked: false,
                createdAt: Date.now(),
              });
            });
            try {
              Object.defineProperty(xhr, "status", { value: 200, configurable: true });
              Object.defineProperty(xhr, "readyState", { value: 4, configurable: true });
              Object.defineProperty(xhr, "responseText", {
                value: JSON.stringify({ url: dataUrl }),
                configurable: true,
              });
            } catch {}
            xhr.dispatchEvent(new Event("load"));
            xhr.onload?.(new ProgressEvent("load"));
          });
          return;
        }
      }
      return origSend.call(this, body);
    };
  } catch {
    // ignore if XMLHttpRequest.prototype is locked
  }

  const origFetch = window.fetch.bind(window);

  const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl, window.location.origin);
    } catch {
      return origFetch(input, init);
    }

    if (parsedUrl.origin !== window.location.origin || !parsedUrl.pathname.startsWith("/api/")) {
      return origFetch(input, init);
    }

    const path = parsedUrl.pathname;
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

    // 1. Auth
    if (path === "/api/auth/me") {
      const state = getStore();
      const user = state.sessionUserId != null ? state.users[state.sessionUserId] || null : null;
      return jsonResponse({ authenticated: Boolean(user), user });
    }

    // 2. Track view
    if (path === "/api/track-view") {
      return jsonResponse({ ok: true });
    }

    // 3. Profile me & live stats
    if (path === "/api/profile/me") {
      const state = getStore();
      const uid = state.sessionUserId ?? 1;
      const user = state.users[uid] ?? state.users[1];
      return jsonResponse({
        user,
        backgrounds: state.userBackgrounds[uid] ?? [],
        equippedBadges: state.equippedBadges[uid] ?? [],
        customBadges: state.customBadges[uid] ?? [],
      });
    }

    if (path === "/api/profile/live") {
      const username = (parsedUrl.searchParams.get("username") || "").toLowerCase();
      const state = getStore();
      const user = Object.values(state.users).find((u) => u.username.toLowerCase() === username) ?? state.users[1];
      return jsonResponse({
        views: user?.views ?? 14820,
        likes: user?.likesCount ?? 642,
        dislikes: user?.dislikesCount ?? 12,
      });
    }

    // 4. Generic file upload (/api/upload)
    if (path === "/api/upload" && method === "POST") {
      const body = init?.body;
      if (body instanceof FormData) {
        const file = body.get("file");
        if (file instanceof Blob) {
          const dataUrl = await fileToDataUrl(file);
          return jsonResponse({ url: dataUrl });
        }
      }
      return jsonResponse({ url: "/showcase-avatar.jpg" });
    }

    // 5. Music search & lyrics
    if (path === "/api/music/search") {
      const q = (parsedUrl.searchParams.get("q") || "").toLowerCase().trim();
      const tracks = q
        ? SAMPLE_SEARCH_TRACKS.filter(
            (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
          )
        : SAMPLE_SEARCH_TRACKS;
      return jsonResponse({ tracks: tracks.length > 0 ? tracks : SAMPLE_SEARCH_TRACKS });
    }

    if (path === "/api/music/lyrics") {
      try {
        const res = await origFetch("/montagem-miau-lyrics.json");
        const lyrics = await res.json();
        return jsonResponse({ lyrics });
      } catch {
        return jsonResponse({
          lyrics: [
            { time: 0, text: "♪ Instrumental ♪" },
            { time: 4, text: "Feel the rhythm in the night" },
            { time: 8, text: "Moving through the neon light" },
          ],
        });
      }
    }

    // 6. Icons search & batch
    if (path === "/api/icons/search") {
      const query = (parsedUrl.searchParams.get("query") || "").trim();
      if (!query) return jsonResponse({ icons: CURATED_ICONIFY_ICONS });
      try {
        const r = await origFetch(
          `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=48`
        );
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data.icons)) {
            return jsonResponse({
              icons: data.icons.map((name: string) => ({
                name,
                url: iconifyProxyUrl(name),
                color: brandColorFor(name),
              })),
            });
          }
        }
      } catch {}
      const filtered = CURATED_ICONIFY_ICONS.filter((i) => i.toLowerCase().includes(query.toLowerCase()));
      return jsonResponse({
        icons: (filtered.length ? filtered : CURATED_ICONIFY_ICONS).map((name) => ({
          name,
          url: iconifyProxyUrl(name),
          color: brandColorFor(name),
        })),
      });
    }

    if (path === "/api/icons/batch") {
      const rawIcons = (parsedUrl.searchParams.get("icons") || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const icons: Record<string, { url: string; color: string }> = {};
      for (const name of rawIcons) {
        icons[name] = {
          url: iconifyProxyUrl(name),
          color: brandColorFor(name),
        };
      }
      return jsonResponse({ icons });
    }

    // 7. Templates
    if (path === "/api/templates") {
      if (method === "GET") {
        const tab = parsedUrl.searchParams.get("tab") || "discover";
        const q = (parsedUrl.searchParams.get("q") || "").toLowerCase().trim();
        const state = getStore();
        const uid = state.sessionUserId ?? 1;
        let items = [...state.templates];
        if (tab === "mine") items = items.filter((t) => t.creatorId === uid);
        if (tab === "favorites") items = items.filter((t) => t.favorited);
        if (q) {
          items = items.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
              (t.creatorUsername || "").toLowerCase().includes(q)
          );
        }
        return jsonResponse({ items, nextCursor: null });
      }
      if (method === "POST") {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const state = getStore();
        const uid = state.sessionUserId ?? 1;
        const user = state.users[uid] ?? state.users[1];
        let createdItem: unknown = null;
        updateStore((s) => {
          const nextId = s.templates.reduce((m, t) => Math.max(m, t.id), 0) + 1;
          const slug = `${(body.name || "template").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nextId}`;
          const tpl = {
            id: nextId,
            slug,
            name: body.name || "Untitled Template",
            thumbnailUrl: "/showcase.jpg",
            tags: Array.isArray(body.tags) ? body.tags : ["custom"],
            isPublic: Boolean(body.isPublic ?? true),
            useCount: 1,
            favoriteCount: 0,
            favoritedByViewer: false,
            requiresPremium: false,
            creatorId: uid,
            creatorUsername: user?.username ?? "rio",
            creatorAvatarUrl: user?.avatarUrl ?? "/showcase-avatar.jpg",
            createdAt: new Date().toISOString(),
            favorited: false,
            config: {
              style: {
                profileBgColor: user?.profileBgColor ?? "#0a0a0c",
                profileBorderColor: user?.profileBorderColor ?? "#8b93f0",
                pageBgColor: user?.pageBgColor ?? "#050505",
              },
              backgrounds: s.userBackgrounds[uid] ?? ["/showcase.jpg"],
            },
          };
          s.templates.unshift(tpl);
          createdItem = tpl;
        });
        return jsonResponse({ template: createdItem });
      }
    }

    const tplMatch = path.match(/^\/api\/templates\/(\d+)(?:\/(apply|favorite))?$/);
    if (tplMatch) {
      const id = Number(tplMatch[1]);
      const action = tplMatch[2];
      if (!action && method === "GET") {
        const tpl = getStore().templates.find((t) => t.id === id);
        return tpl ? jsonResponse({ template: tpl }) : jsonResponse({ error: "Not found" }, 404);
      }
      if (!action && (method === "PATCH" || method === "PUT")) {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        let updated: unknown = null;
        updateStore((s) => {
          const tpl = s.templates.find((t) => t.id === id);
          if (tpl) {
            if (typeof body.name === "string") tpl.name = body.name;
            if (Array.isArray(body.tags)) tpl.tags = body.tags;
            if (typeof body.isPublic === "boolean") tpl.isPublic = body.isPublic;
            updated = tpl;
          }
        });
        return jsonResponse({ template: updated });
      }
      if (!action && method === "DELETE") {
        updateStore((s) => {
          s.templates = s.templates.filter((t) => t.id !== id);
        });
        return jsonResponse({ ok: true });
      }
      if (action === "favorite") {
        const favorited = method === "POST";
        let favCount = 0;
        updateStore((s) => {
          const tpl = s.templates.find((t) => t.id === id);
          if (tpl) {
            tpl.favorited = favorited;
            tpl.favoriteCount = Math.max(0, tpl.favoriteCount + (favorited ? 1 : -1));
            favCount = tpl.favoriteCount;
          }
        });
        return jsonResponse({ favorited, favoriteCount: favCount });
      }
      if (action === "apply" && method === "POST") {
        updateStore((s) => {
          const tpl = s.templates.find((t) => t.id === id);
          const uid = s.sessionUserId ?? 1;
          const user = s.users[uid];
          if (tpl && user) {
            tpl.useCount += 1;
            const sanitized = sanitizeTemplateConfig(tpl.config);
            const overrides = applyTemplateStyle({}, sanitized as Record<string, unknown>);
            Object.assign(user, overrides);
            const bgs = templateBackgrounds(sanitized as Record<string, unknown>);
            if (bgs && bgs.length > 0) {
              s.userBackgrounds[uid] = bgs;
            }
          }
        });
        return jsonResponse({ ok: true });
      }
    }

    // 8. Image Host endpoints
    if (path === "/api/image-host/stats") {
      const files = getStore().imageHostFiles;
      const storageUsedBytes = files.reduce((acc, f) => acc + f.size, 0);
      return jsonResponse({
        totalUploads: files.length,
        storageUsedBytes,
        favorites: files.filter((f) => f.favorite).length,
        byKind: [
          { kind: "image", count: files.filter((f) => f.kind === "image").length },
          { kind: "video", count: files.filter((f) => f.kind === "video").length },
        ],
        recent: files.map((f) => ({ at: f.createdAt, size: f.size })),
      });
    }

    if (path === "/api/image-host/activity") {
      const limit = Number(parsedUrl.searchParams.get("limit") || 15);
      const offset = Number(parsedUrl.searchParams.get("offset") || 0);
      const files = getStore().imageHostFiles;
      const items = files.map((f) => ({
        action: "upload",
        kind: f.kind,
        name: f.name,
        size: f.size,
        url: f.url,
        createdAt: f.createdAt,
      }));
      return jsonResponse({ items: items.slice(offset, offset + limit), total: items.length });
    }

    if (path === "/api/image-host/files") {
      if (method === "GET") {
        const limit = Number(parsedUrl.searchParams.get("limit") || 24);
        const offset = Number(parsedUrl.searchParams.get("offset") || 0);
        const filter = parsedUrl.searchParams.get("filter") || "all";
        let files = [...getStore().imageHostFiles];
        if (filter === "image" || filter === "video") files = files.filter((f) => f.kind === filter);
        else if (filter === "favorite") files = files.filter((f) => f.favorite);
        return jsonResponse({ files: files.slice(offset, offset + limit), total: files.length });
      }
      if (method === "PATCH") {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
        const favorite = Boolean(body.favorite);
        updateStore((s) => {
          for (const f of s.imageHostFiles) {
            if (ids.includes(f.id)) f.favorite = favorite;
          }
        });
        return jsonResponse({ updatedIds: ids });
      }
      if (method === "DELETE") {
        const body = init?.body ? JSON.parse(String(init.body)) : {};
        const ids: number[] = Array.isArray(body.ids) ? body.ids : [];
        let usedBytes = 0;
        updateStore((s) => {
          s.imageHostFiles = s.imageHostFiles.filter((f) => !ids.includes(f.id));
          usedBytes = s.imageHostFiles.reduce((acc, f) => acc + f.size, 0);
        });
        return jsonResponse({ deletedIds: ids, usedBytes });
      }
    }

    if (path.match(/^\/api\/image-host\/files\/\d+\/password$/)) {
      const id = Number(path.split("/")[4]);
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const locked = Boolean(body.password);
      updateStore((s) => {
        const file = s.imageHostFiles.find((f) => f.id === id);
        if (file) file.locked = locked;
      });
      return jsonResponse({ locked });
    }

    if (path === "/api/image-host/unlock") {
      return jsonResponse({ url: "/showcase.jpg" });
    }

    // 9. Checkout endpoints
    if (path === "/api/checkout/polar" || path === "/api/checkout/order" || path === "/api/checkout/verify") {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      const product = body.product || "premium";
      updateStore((s) => {
        const uid = s.sessionUserId ?? 1;
        const user = s.users[uid];
        if (user) {
          if (product === "premium") user.isPremium = true;
          if (product === "image-host") user.hasImageHost = true;
          if (product === "badge-token") user.badgeTokens = (user.badgeTokens || 0) + (body.quantity || 1);
          if (product === "alias-token") user.aliasTokens = (user.aliasTokens || 0) + (body.quantity || 1);
          if (product === "domain-token") user.domainTokens = (user.domainTokens || 0) + (body.quantity || 1);
        }
      });
      if (path === "/api/checkout/polar") {
        return jsonResponse({ url: "/dashboard" });
      }
      return jsonResponse({
        orderId: `order_${Date.now()}`,
        amount: 399,
        currency: "USD",
        keyId: "demo_key",
        ok: true,
      });
    }

    // 10. Live Widgets (/api/widgets/*)
    if (path.startsWith("/api/widgets/discord/user/")) {
      const userId = decodeURIComponent(path.replace("/api/widgets/discord/user/", ""));
      return jsonResponse({
        id: userId,
        username: "rio",
        global_name: "Rio",
        avatar: null,
        avatarUrl: "/showcase-avatar.jpg",
        status: "online",
        custom_status: { text: "building prophile ✨", emoji_name: "⚡" },
        activities: [
          {
            name: "Visual Studio Code",
            type: 0,
            details: "Editing Layout1.tsx",
            state: "Workspace: prophile",
            large_image_url: "/showcase-music-cover.jpg",
          },
        ],
        badges: ["staff", "partner", "hypesquad_brilliance", "early_supporter", "nitro"],
      });
    }

    if (path.startsWith("/api/widgets/discord/invite/")) {
      const code = decodeURIComponent(path.replace("/api/widgets/discord/invite/", ""));
      return jsonResponse({
        code,
        guild: {
          id: "128940192840192",
          name: `${code.toUpperCase()} Community`,
          icon: null,
          banner: "/showcase-banner.jpg",
          splash: null,
        },
        approximate_member_count: 14820,
        approximate_presence_count: 3490,
      });
    }

    if (path.startsWith("/api/widgets/github/user/")) {
      const username = decodeURIComponent(path.replace("/api/widgets/github/user/", ""));
      try {
        const ghRes = await origFetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
        if (ghRes.ok) {
          const gh = await ghRes.json();
          return jsonResponse({
            login: gh.login,
            name: gh.name || gh.login,
            avatar_url: gh.avatar_url,
            followers: gh.followers ?? 120,
            following: gh.following ?? 18,
            public_repos: gh.public_repos ?? 42,
            html_url: gh.html_url || `https://github.com/${username}`,
          });
        }
      } catch {}
      return jsonResponse({
        login: username,
        name: username,
        avatar_url: "/showcase-avatar.jpg",
        followers: 428,
        following: 34,
        public_repos: 29,
        html_url: `https://github.com/${username}`,
      });
    }

    if (path.startsWith("/api/widgets/github/repo/")) {
      const rest = path.replace("/api/widgets/github/repo/", "");
      const [owner, repo] = rest.split("/").map(decodeURIComponent);
      try {
        const ghRes = await origFetch(
          `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
        );
        if (ghRes.ok) {
          const gh = await ghRes.json();
          return jsonResponse({
            full_name: gh.full_name,
            owner: { avatar_url: gh.owner?.avatar_url || "/showcase-avatar.jpg" },
            stargazers_count: gh.stargazers_count ?? 1280,
            forks_count: gh.forks_count ?? 140,
            subscribers_count: gh.subscribers_count ?? 45,
            open_issues_count: gh.open_issues_count ?? 4,
            language: gh.language || "TypeScript",
            html_url: gh.html_url || `https://github.com/${owner}/${repo}`,
          });
        }
      } catch {}
      return jsonResponse({
        full_name: `${owner}/${repo}`,
        owner: { avatar_url: "/showcase-avatar.jpg" },
        stargazers_count: 1420,
        forks_count: 185,
        subscribers_count: 64,
        open_issues_count: 3,
        language: "TypeScript",
        html_url: `https://github.com/${owner}/${repo}`,
      });
    }

    if (path.startsWith("/api/widgets/spotify/item/")) {
      const parts = path.replace("/api/widgets/spotify/item/", "").split("/");
      const type = parts[0] || "track";
      const id = parts[1] || "default";
      return jsonResponse({
        id,
        type,
        name: "All The Stars (with SZA)",
        subtitle: "Kendrick Lamar, SZA",
        imageUrl: "/all-the-stars-cover.jpg",
        url: `https://open.spotify.com/${type}/${id}`,
        releaseYear: "2018",
        durationMs: 232000,
        explicit: true,
      });
    }

    if (path.startsWith("/api/widgets/apple-music/item/")) {
      return jsonResponse({
        name: "Soft Spot",
        subtitle: "keshi",
        imageUrl: "/soft-spot-cover.jpg",
        url: "https://music.apple.com",
        releaseYear: "2024",
        kind: "song",
      });
    }

    if (path.startsWith("/api/widgets/soundcloud/")) {
      const handle = decodeURIComponent(path.split("/").pop() || "artist");
      return jsonResponse({
        kind: "user",
        username: handle,
        displayName: handle,
        avatarUrl: "/showcase-music-cover.jpg",
        bannerUrl: "/showcase-banner.jpg",
        followers: 18400,
        tracksCount: 42,
        verified: true,
        url: `https://soundcloud.com/${handle}`,
      });
    }

    if (path.startsWith("/api/widgets/youtube/channel/")) {
      const handle = decodeURIComponent(path.replace("/api/widgets/youtube/channel/", ""));
      return jsonResponse({
        handle: handle.startsWith("@") ? handle : `@${handle}`,
        title: handle.replace(/^@/, ""),
        avatarUrl: "/showcase-avatar.jpg",
        bannerUrl: "/showcase-banner.jpg",
        subscriberCount: 142000,
        videoCount: 86,
        viewCount: 9420000,
        url: `https://youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`,
        latestVideo: {
          id: "dQw4w9WgXcQ",
          title: "Designing Next-Gen Shaders & Interactive Profiles",
          thumbnailUrl: "/showcase-banner-2.jpg",
          publishedAt: "2 days ago",
          viewCount: 48200,
        },
      });
    }

    if (path.startsWith("/api/widgets/twitch/channel/")) {
      const login = decodeURIComponent(path.replace("/api/widgets/twitch/channel/", ""));
      return jsonResponse({
        login,
        displayName: login,
        description: "Streaming creative coding, Valorant & late-night vibes.",
        profileImageUrl: "/showcase-avatar-2.jpg",
        OfflineImageUrl: "/showcase-banner-2.jpg",
        followers: 28900,
        isLive: true,
        stream: {
          title: "Late Night Ranked + Shader Experiments ✨",
          gameName: "VALORANT",
          viewerCount: 412,
          thumbnailUrl: "/showcase-banner.jpg",
        },
      });
    }

    if (path.startsWith("/api/widgets/tiktok/user/")) {
      const username = decodeURIComponent(path.replace("/api/widgets/tiktok/user/", ""));
      return jsonResponse({
        username,
        nickname: username,
        avatarUrl: "/showcase-avatar.jpg",
        followers: 94500,
        following: 120,
        hearts: 2400000,
        videos: 64,
        verified: true,
        signature: "digital creator • prophile",
        url: `https://www.tiktok.com/@${username}`,
      });
    }

    if (path.startsWith("/api/widgets/instagram/user/")) {
      const username = decodeURIComponent(path.replace("/api/widgets/instagram/user/", ""));
      return jsonResponse({
        username,
        fullName: username,
        avatarUrl: "/showcase-avatar-2.jpg",
        followers: 62300,
        following: 310,
        posts: 48,
        isVerified: true,
        biography: "visuals & motion",
        url: `https://www.instagram.com/${username}/`,
      });
    }

    if (path.startsWith("/api/widgets/telegram/user/")) {
      const username = decodeURIComponent(path.replace("/api/widgets/telegram/user/", ""));
      return jsonResponse({
        username,
        title: username,
        description: "Updates, resources & announcements.",
        avatarUrl: "/showcase-avatar.jpg",
        membersCount: 12450,
        onlineCount: 840,
        kind: "channel",
        url: `https://t.me/${username}`,
      });
    }

    if (path.startsWith("/api/widgets/pinterest/user/")) {
      const username = decodeURIComponent(path.replace("/api/widgets/pinterest/user/", ""));
      return jsonResponse({
        username,
        name: username,
        avatar_url: "/showcase-avatar.jpg",
        pin_count: 642,
        first_pin_image: "/showcase-banner.jpg",
        url: `https://www.pinterest.com/${username}/`,
      });
    }

    if (path.startsWith("/api/widgets/pinterest/board/")) {
      const rest = path.replace("/api/widgets/pinterest/board/", "");
      const [username, board] = rest.split("/").map(decodeURIComponent);
      return jsonResponse({
        username,
        board_slug: board,
        name: board.replace(/-/g, " "),
        owner_name: username,
        owner_username: username,
        owner_image: "/showcase-avatar.jpg",
        pin_count: 128,
        cover_image: "/showcase-banner-2.jpg",
        first_pin_image: "/showcase-banner.jpg",
        url: `https://www.pinterest.com/${username}/${board}/`,
      });
    }

    if (path.startsWith("/api/widgets/steam/user/")) {
      const id = decodeURIComponent(path.replace("/api/widgets/steam/user/", ""));
      return jsonResponse({
        personaname: id,
        profileurl: `https://steamcommunity.com/id/${id}`,
        avatarfull: "/showcase-avatar.jpg",
        profile_background: "/showcase-banner.jpg",
        level: 88,
        game_count: 214,
        member_since: "October 14, 2018",
      });
    }

    if (path.startsWith("/api/widgets/roblox/user/")) {
      const username = decodeURIComponent(path.replace("/api/widgets/roblox/user/", ""));
      return jsonResponse({
        id: 1948201,
        username,
        displayName: username,
        avatarUrl: "/showcase-avatar-2.jpg",
        friendsCount: 184,
        followersCount: 12900,
        followingCount: 45,
        created: "2019-04-12T00:00:00Z",
        isVerified: true,
      });
    }

    if (path.startsWith("/api/widgets/valorant/player/")) {
      const rest = path.replace("/api/widgets/valorant/player/", "");
      const [name, tag] = rest.split("/").map(decodeURIComponent);
      return jsonResponse({
        name: name || "Rio",
        tag: tag || "NA1",
        account_level: 245,
        card_id: "9fb348bc-41a0-91ad-8a3e-818035c4e561",
        current_rank: { tier: 24, tier_name: "Immortal 1", rr: 68 },
        highest_rank: { tier: 27, tier_name: "Radiant" },
        last_matches: {
          any: { agent: "Jett", map: "Ascent" },
          competitive: { agent: "Jett", map: "Ascent" },
        },
      });
    }

    if (path.startsWith("/api/widgets/genshin/user/")) {
      const uid = decodeURIComponent(path.replace("/api/widgets/genshin/user/", ""));
      return jsonResponse({
        uid,
        nickname: "Traveler",
        level: 60,
        world_level: 8,
        signature: "Ad Astra Abyssosque",
        achievements: 1180,
        spiral_abyss: "12-3",
        avatar_url: "/showcase-avatar.jpg",
        namecard_url: "/showcase-banner.jpg",
      });
    }

    if (path.startsWith("/api/widgets/weather/current/")) {
      const location = decodeURIComponent(path.replace("/api/widgets/weather/current/", ""));
      return jsonResponse({
        location: location || "Tokyo",
        country: "JP",
        temp_c: 19,
        temp_f: 66,
        condition: "Clear sky",
        code: 0,
        is_day: false,
        humidity: 58,
        wind_kph: 11,
      });
    }

    return jsonResponse({ ok: true });
  };

  (globalThis as unknown as { __prophileFetch?: typeof fetch }).__prophileFetch = customFetch;

  try {
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      configurable: true,
      writable: true,
    });
  } catch {
    try {
      Object.defineProperty(Window.prototype, "fetch", {
        value: customFetch,
        configurable: true,
        writable: true,
      });
    } catch {
      // environment locks window.fetch; Vite plugin routes app fetch() calls through globalThis.__prophileFetch
    }
  }
}
