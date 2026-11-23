import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { authFetch, clearStoredLocalToken, setInMemoryAuthToken } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";
import { navigateTo } from "@/shims/next-navigation";

export async function logout() {
  try {
    await authFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore
  }
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  clearStoredLocalToken();
  setInMemoryAuthToken(null);
  await hydrateStoreFromServer(true);
  navigateTo("/signin", true);
}
