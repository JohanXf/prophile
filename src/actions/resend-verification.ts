export async function resendVerification(
  _email: string,
  _turnstileToken?: string
): Promise<{ success?: string; error?: string }> {
  return { success: "Verification email resent!" };
}
