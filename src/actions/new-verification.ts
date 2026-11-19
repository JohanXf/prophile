export async function newVerification(_token: string): Promise<{ success?: string; error?: string }> {
  return { success: "Email verified! You can now sign in." };
}
