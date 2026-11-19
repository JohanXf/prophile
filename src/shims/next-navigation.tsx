import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

interface NavigationContextValue {
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string>;
  version: number;
  push: (href: string, options?: { scroll?: boolean }) => void;
  replace: (href: string, options?: { scroll?: boolean }) => void;
  refresh: () => void;
  back: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

let globalNavigate: ((href: string, replace?: boolean, scroll?: boolean) => void) | null = null;
let globalRefresh: (() => void) | null = null;

export function navigateTo(href: string, replace = false, scroll = true) {
  if (globalNavigate) {
    globalNavigate(href, replace, scroll);
  } else if (typeof window !== "undefined") {
    if (replace) window.history.replaceState({}, "", href);
    else window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export function triggerRefresh() {
  if (globalRefresh) globalRefresh();
}

export function NavigationProvider({
  children,
  params = {},
}: {
  children: React.ReactNode;
  params?: Record<string, string>;
}) {
  const [loc, setLoc] = useState(() => ({
    pathname: typeof window !== "undefined" ? window.location.pathname : "/",
    search: typeof window !== "undefined" ? window.location.search : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
  }));
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onPopState = () => {
      setLoc({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const scrollToHash = useCallback((hash: string) => {
    if (!hash) return;
    const id = hash.replace(/^#/, "");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }, []);

  const navigate = useCallback(
    (href: string, replace = false, scroll = true) => {
      if (typeof window === "undefined") return;
      if (href.startsWith("/api/auth/discord")) {
        window.dispatchEvent(new CustomEvent("prophile:discord-login", { detail: { href } }));
        return;
      }
      const url = new URL(href, window.location.origin);
      if (replace) {
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      } else {
        window.history.pushState({}, "", url.pathname + url.search + url.hash);
      }
      setLoc({
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
      });
      if (url.hash) {
        scrollToHash(url.hash);
      } else if (scroll) {
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    },
    [scrollToHash]
  );

  const push = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      navigate(href, false, options?.scroll !== false);
    },
    [navigate]
  );

  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      navigate(href, true, options?.scroll !== false);
    },
    [navigate]
  );

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
    window.dispatchEvent(new CustomEvent("prophile:store-updated"));
  }, []);

  const back = useCallback(() => {
    if (typeof window !== "undefined") window.history.back();
  }, []);

  useEffect(() => {
    globalNavigate = navigate;
    globalRefresh = refresh;
    return () => {
      globalNavigate = null;
      globalRefresh = null;
    };
  }, [navigate, refresh]);

  const value = useMemo(
    () => ({
      pathname: loc.pathname,
      search: loc.search,
      hash: loc.hash,
      params,
      version,
      push,
      replace,
      refresh,
      back,
    }),
    [loc.pathname, loc.search, loc.hash, params, version, push, replace, refresh, back]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function usePathname(): string {
  const ctx = useContext(NavigationContext);
  if (ctx) return ctx.pathname;
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

export function useSearchParams(): URLSearchParams {
  const ctx = useContext(NavigationContext);
  const search = ctx ? ctx.search : typeof window !== "undefined" ? window.location.search : "";
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const ctx = useContext(NavigationContext);
  return (ctx?.params ?? {}) as T;
}

export function useRouter() {
  const ctx = useContext(NavigationContext);
  return useMemo(
    () => ({
      push: ctx?.push ?? ((href: string, opts?: { scroll?: boolean }) => navigateTo(href, false, opts?.scroll !== false)),
      replace: ctx?.replace ?? ((href: string, opts?: { scroll?: boolean }) => navigateTo(href, true, opts?.scroll !== false)),
      refresh: ctx?.refresh ?? (() => triggerRefresh()),
      back: ctx?.back ?? (() => window.history.back()),
      forward: () => window.history.forward(),
      prefetch: async () => {},
    }),
    [ctx]
  );
}

export function redirect(href: string): never {
  navigateTo(href, true, true);
  throw new Error(`NEXT_REDIRECT:${href}`);
}

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}
