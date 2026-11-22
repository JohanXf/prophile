import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../lib/firebase-admin.ts";
import { findUserById, getOrCreateUserFromAuth, type DbUserRow } from "../db/repository.ts";
import {
  getSessionCookieToken,
  isLocalSessionToken,
  verifySessionToken,
} from "../lib/password-auth.ts";

export interface AuthenticatedRequest extends Request {
  authUser?: {
    uid: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  dbUser?: DbUserRow;
}

async function resolveSessionToken(req: Request, token: string): Promise<DbUserRow | null> {
  if (isLocalSessionToken(token)) {
    const payload = verifySessionToken(token);
    if (!payload) return null;
    const dbUser = await findUserById(payload.userId);
    if (!dbUser) return null;
    (req as AuthenticatedRequest).authUser = {
      uid: dbUser.uid ?? `local_${dbUser.id}`,
      email: dbUser.email ?? undefined,
      name: dbUser.displayName ?? dbUser.username,
      picture: dbUser.avatarUrl ?? undefined,
    };
    (req as AuthenticatedRequest).dbUser = dbUser;
    return dbUser;
  }

  const decoded = await adminAuth.verifyIdToken(token);
  const dbUser = await getOrCreateUserFromAuth({
    uid: decoded.uid,
    email: decoded.email ?? null,
    name: decoded.name ?? null,
    picture: decoded.picture ?? null,
  });
  (req as AuthenticatedRequest).authUser = {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name,
    picture: decoded.picture,
  };
  (req as AuthenticatedRequest).dbUser = dbUser;
  return dbUser;
}

async function resolveAuth(req: Request): Promise<DbUserRow | null> {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7).trim();
    if (token) {
      return resolveSessionToken(req, token);
    }
  }

  const cookieToken = getSessionCookieToken(req);
  if (cookieToken) {
    return resolveSessionToken(req, cookieToken);
  }

  return null;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const dbUser = await resolveAuth(req);
    if (!dbUser) {
      return res.status(401).json({ error: "Authentication required. Please sign in." });
    }
    next();
  } catch (error) {
    console.error("Auth verification failed:", error instanceof Error ? error.message : String(error));
    return res.status(401).json({ error: "Invalid or expired authentication token." });
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    await resolveAuth(req);
  } catch {
    // Treat invalid token on optional routes as unauthenticated
  }
  next();
}
