export const sendOTP = async (
  _email: string,
  _turnstileToken?: string
): Promise<{ success?: string; error?: string }> => {
  return { success: "Verification code sent! (Enter any 6 digits)" };
};
