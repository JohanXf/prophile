import { getStore, saveStore } from "@/lib/local-store";
import { navigateTo } from "@/shims/next-navigation";

export async function logout() {
  const state = getStore();
  state.currentUserId = null;
  saveStore(state);
  navigateTo("/signin", true);
}
