export const MAX_PASSKEYS = 10;

export async function listPasskeys(_userId: number) {
  return [];
}

export async function startPasskeyRegistration(_userId: number) {
  return { challenge: "demo-challenge" };
}

export async function finishPasskeyRegistration(_userId: number, _response: unknown, _name: string): Promise<boolean> {
  return true;
}

export async function startPasskeyLogin() {
  return { challengeId: "demo-id", options: {} as Record<string, unknown> };
}

export async function finishPasskeyLogin(_challengeId: string, _response: unknown): Promise<number | null> {
  return 1;
}

export async function deletePasskey(_userId: number, _id: number): Promise<boolean> {
  return true;
}
