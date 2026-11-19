export function browserSupportsWebAuthn(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential !== "undefined";
}

export async function startAuthentication(_opts?: unknown): Promise<Record<string, unknown>> {
  return { id: "demo-passkey-id", rawId: "demo-passkey-id", type: "public-key", response: {} };
}

export async function startRegistration(_opts?: unknown): Promise<Record<string, unknown>> {
  return { id: "demo-passkey-id", rawId: "demo-passkey-id", type: "public-key", response: {} };
}
