export type AvailabilityResult = {
  available?: boolean;
  error?: string;
  field?: "username" | "email";
};

export async function checkAvailability({
  username,
  email,
}: {
  username: string;
  email: string;
}): Promise<AvailabilityResult> {
  if (!username || username.trim().length < 2) {
    return { error: "Username must be at least 2 characters.", field: "username" };
  }
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address.", field: "email" };
  }
  return { available: true };
}
