"use client";

import { cachedFetch } from "@/lib/fetch-cache";
import { useEffect, useState } from "react";
export interface SteamUserData {
  personaname: string;
  profileurl: string;
  avatarfull: string;
  avatarframe?: string | null;
  animated_avatar?: string | null;
  profile_background?: string | null;
  profile_background_webm?: string | null;
  profile_background_mp4?: string | null;
  mini_profile_background?: string | null;
  mini_profile_background_webm?: string | null;
  mini_profile_background_mp4?: string | null;
  level?: number | null;
  game_count?: number | null;
  member_since?: string | null;
  is_private?: boolean;
  library_private?: boolean;
}
import { useDebouncedValue } from "./useDebouncedValue";

export function useSteamUser(input: string) {
  const cleanInput = (input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\//i, "")
    .replace(/\/$/, "");

  const isValidId = Boolean(cleanInput);

  const [data, setData] = useState<SteamUserData | null>(null);
  const [loading, setLoading] = useState<boolean>(isValidId);
  const [error, setError] = useState<Error | null>(null);

  const { value: fetchInput, isPending } = useDebouncedValue(cleanInput);

  useEffect(() => {
    if (!fetchInput) {
      setData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchUser = async () => {
      setData(null);
      setLoading(true);
      setError(null);

      try {
        const res = await cachedFetch(
          `/api/widgets/steam/user/${encodeURIComponent(fetchInput)}`,
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error("Failed to load Steam profile");
        const json = (await res.json()) as SteamUserData;
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Failed to load Steam profile"));
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchInput]);

  return {
    data: isValidId && !isPending ? data : null,
    loading: isValidId ? isPending || loading : false,
    error: isValidId && !isPending ? error : null,
    isValidId,
    cleanInput,
  };
}
