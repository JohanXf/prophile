import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirestorePublicProfile {
  uid: number;
  ownerUid: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  occupation?: string;
  badges?: string[];
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

function clampString(value: string | null | undefined, maxLen: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

export async function fetchPublicProfileFromFirestore(
  username: string
): Promise<FirestorePublicProfile | null> {
  const clean = username.toLowerCase().trim();
  if (!clean || !/^[a-z0-9_-]{1,40}$/.test(clean)) return null;
  const path = `publicProfiles/${clean}`;
  try {
    const snap = await getDoc(doc(db, "publicProfiles", clean));
    if (!snap.exists()) return null;
    return snap.data() as FirestorePublicProfile;
  } catch (error) {
    console.warn("Firestore public profile read failed:", path, error);
    return null;
  }
}

export async function syncPublicProfileToFirestore(input: {
  uid: number;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  location?: string | null;
  occupation?: string | null;
  badges?: string[];
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const clean = input.username.toLowerCase().trim();
  if (!clean || !/^[a-z0-9_-]{1,40}$/.test(clean)) return;

  const path = `publicProfiles/${clean}`;
  const ref = doc(db, "publicProfiles", clean);

  try {
    const existing = await getDoc(ref);
    const basePayload: Record<string, unknown> = {
      uid: Math.max(1, Math.floor(input.uid)),
      ownerUid: existing.exists()
        ? String(existing.data()?.ownerUid || currentUser.uid)
        : currentUser.uid,
      username: clean,
      displayName: clampString(input.displayName, 80) || clean,
      updatedAt: serverTimestamp(),
    };

    const bio = clampString(input.bio, 500);
    if (bio) basePayload.bio = bio;
    const avatarUrl = clampString(input.avatarUrl, 512);
    if (avatarUrl) basePayload.avatarUrl = avatarUrl;
    const bannerUrl = clampString(input.bannerUrl, 512);
    if (bannerUrl) basePayload.bannerUrl = bannerUrl;
    const location = clampString(input.location, 80);
    if (location) basePayload.location = location;
    const occupation = clampString(input.occupation, 80);
    if (occupation) basePayload.occupation = occupation;
    if (Array.isArray(input.badges) && input.badges.length > 0) {
      basePayload.badges = input.badges
        .filter((b): b is string => typeof b === "string" && b.trim().length > 0)
        .slice(0, 10)
        .map((b) => b.trim().slice(0, 40));
    }

    if (existing.exists()) {
      basePayload.createdAt = existing.data()?.createdAt ?? serverTimestamp();
      await setDoc(ref, basePayload, { merge: true });
    } else {
      basePayload.createdAt = serverTimestamp();
      await setDoc(ref, basePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface FirestoreUserRecord {
  ownerUid: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  badges?: string[];
  uidNum: number;
}

function sanitizeFirestoreUsername(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^[_-]+|[_-]+$/g, "")
    .slice(0, 32);
  return cleaned.length >= 2 ? cleaned : `user_${Math.floor(1000 + Math.random() * 9000)}`;
}

function stableNumericUid(firebaseUid: string): number {
  let hash = 0;
  for (let i = 0; i < firebaseUid.length; i++) {
    hash = (hash * 31 + firebaseUid.charCodeAt(i)) >>> 0;
  }
  return (hash % 899999) + 100;
}

export async function ensureFirestoreUserAccount(
  fbUser: {
    uid: string;
    email?: string | null;
    emailVerified?: boolean;
    displayName?: string | null;
    photoURL?: string | null;
  },
  desiredUsername?: string
): Promise<FirestoreUserRecord> {
  const userPath = `users/${fbUser.uid}`;
  const userRef = doc(db, "users", fbUser.uid);
  const email = (fbUser.email || `${fbUser.uid}@users.prophile.app`).trim().slice(0, 254);

  let username = sanitizeFirestoreUsername(
    desiredUsername || email.split("@")[0] || fbUser.displayName || `user_${fbUser.uid.slice(0, 6)}`
  );

  try {
    const existingUserSnap = await getDoc(userRef);
    if (existingUserSnap.exists()) {
      const data = existingUserSnap.data() as { username?: string; email?: string };
      if (data.username && /^[a-z0-9_-]{1,40}$/.test(data.username)) {
        username = data.username;
      }
    } else if (fbUser.emailVerified) {
      await setDoc(userRef, {
        ownerUid: fbUser.uid,
        username,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.warn("Firestore /users sync skipped:", userPath, error);
  }

  const uidNum = stableNumericUid(fbUser.uid);
  const displayName = clampString(fbUser.displayName, 80) || username;
  const avatarUrl = clampString(fbUser.photoURL, 512);

  let profileData: FirestorePublicProfile | null = null;
  try {
    profileData = await fetchPublicProfileFromFirestore(username);
    if (!profileData && fbUser.emailVerified) {
      const pubRef = doc(db, "publicProfiles", username);
      const payload: Record<string, unknown> = {
        uid: uidNum,
        ownerUid: fbUser.uid,
        username,
        displayName,
        bio: "Welcome to my prophile page.",
        badges: ["early", "verified"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (avatarUrl) payload.avatarUrl = avatarUrl;
      await setDoc(pubRef, payload);
      profileData = {
        uid: uidNum,
        ownerUid: fbUser.uid,
        username,
        displayName,
        bio: "Welcome to my prophile page.",
        avatarUrl,
        badges: ["early", "verified"],
      };
    }
  } catch (error) {
    console.warn("Firestore /publicProfiles sync skipped:", `publicProfiles/${username}`, error);
  }

  return {
    ownerUid: fbUser.uid,
    username,
    email,
    displayName: profileData?.displayName || displayName,
    avatarUrl: profileData?.avatarUrl || avatarUrl,
    bannerUrl: profileData?.bannerUrl,
    bio: profileData?.bio || "Welcome to my prophile page.",
    location: profileData?.location,
    occupation: profileData?.occupation,
    badges: profileData?.badges ?? ["early", "verified"],
    uidNum: profileData?.uid || uidNum,
  };
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}

if (typeof window !== "undefined") {
  void testConnection();
}
