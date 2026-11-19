export async function forgotPassword(
  _email: string,
  _turnstileToken?: string
): Promise<{ success?: string; error?: string }> {
  return { success: "If an account exists for that email, a reset link has been sent." };
}
