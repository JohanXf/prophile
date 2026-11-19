export async function newPassword(
  _token: string,
  _password: string
): Promise<{ success?: string; error?: string }> {
  return { success: "Your password has been updated!" };
}
