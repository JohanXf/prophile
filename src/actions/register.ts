import { createNewStoredUser } from "@/lib/local-store";
import { navigateTo } from "@/shims/next-navigation";

export interface RegisterInput {
  username: string;
  email: string;
  password?: string;
  turnstileToken?: string;
}

export async function register(input: RegisterInput): Promise<{ success?: string; error?: string }> {
  const cleanUsername = (input.username || "").toLowerCase().trim();
  if (!cleanUsername || cleanUsername.length < 2) {
    return { error: "Username must be at least 2 characters." };
  }
  createNewStoredUser(cleanUsername, input.email || `${cleanUsername}@prophile.com`);
  setTimeout(() => {
    navigateTo("/dashboard", false);
  }, 600);
  return { success: "Account created! Redirecting to your dashboard..." };
}
