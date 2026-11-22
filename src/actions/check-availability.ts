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
  const params = new URLSearchParams();
  if (username) params.set("username", username);
  if (email) params.set("email", email);
  const res = await fetch(`/api/auth/check-availability?${params.toString()}`);
  if (!res.ok) return { available: false, error: "Could not verify availability." };
  return (await res.json()) as AvailabilityResult;
}
