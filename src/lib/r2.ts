import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export type MediaCategory =
  | "avatar"
  | "banner"
  | "background"
  | "audio"
  | "badge"
  | "icon"
  | "cursor"
  | "embed"
  | "image-host"
  | "general";

const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/flac",
  "audio/webm",
]);

const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export const MAX_MEDIA_BYTES = 50 * 1024 * 1024; // 50 MB for R2
export const MAX_DB_FALLBACK_BYTES = 12 * 1024 * 1024; // 12 MB for PostgreSQL fallback

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const accountId = process.env.R2_ACCOUNT_ID!;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return cachedClient;
}

export function classifyMediaKind(mimeType: string): "image" | "video" | "audio" | null {
  const clean = mimeType.toLowerCase().split(";")[0].trim();
  if (ALLOWED_IMAGE_MIMES.has(clean)) return "image";
  if (ALLOWED_VIDEO_MIMES.has(clean)) return "video";
  if (ALLOWED_AUDIO_MIMES.has(clean)) return "audio";
  return null;
}

export function validateMediaFile(mimeType: string, sizeBytes: number): {
  ok: true;
  kind: "image" | "video" | "audio";
} | {
  ok: false;
  error: string;
} {
  const kind = classifyMediaKind(mimeType);
  if (!kind) {
    return {
      ok: false,
      error: `Unsupported file type (${mimeType}). Allowed: images, audio (MP3/WAV/OGG/M4A/FLAC), and video (MP4/WebM).`,
    };
  }
  const limit = isR2Configured() ? MAX_MEDIA_BYTES : MAX_DB_FALLBACK_BYTES;
  if (sizeBytes <= 0 || sizeBytes > limit) {
    const mb = Math.round(limit / (1024 * 1024));
    return {
      ok: false,
      error: `File size must be between 1 byte and ${mb} MB.`,
    };
  }
  return { ok: true, kind };
}

function sanitizeExtension(filename: string, mimeType: string): string {
  const extFromName = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  if (extFromName && extFromName.length <= 6) return extFromName;
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
    "audio/flac": "flac",
    "audio/webm": "webm",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mimeType.toLowerCase()] || "bin";
}

export function generateStorageKey(
  userId: number,
  category: MediaCategory,
  filename: string,
  mimeType: string
): string {
  const ext = sanitizeExtension(filename, mimeType);
  const token = crypto.randomBytes(10).toString("hex");
  const safeCategory = category.replace(/[^a-z0-9-]/g, "");
  return `u/${userId}/${safeCategory}/${Date.now()}-${token}.${ext}`;
}

export function buildR2PublicUrl(storageKey: string): string {
  const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  if (publicBase) {
    return `${publicBase}/${storageKey}`;
  }
  return `/api/media/object/${encodeURIComponent(storageKey)}`;
}

export async function createPresignedUploadUrl(params: {
  userId: number;
  category: MediaCategory;
  filename: string;
  contentType: string;
  sizeBytes: number;
}): Promise<{
  storageKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresIn: number;
}> {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured");
  }
  const storageKey = generateStorageKey(
    params.userId,
    params.category,
    params.filename,
    params.contentType
  );
  const bucket = process.env.R2_BUCKET_NAME!;
  const expiresIn = 300;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: storageKey,
    ContentType: params.contentType,
    ContentLength: params.sizeBytes,
    CacheControl: "public, max-age=31536000, immutable",
  });
  const uploadUrl = await getSignedUrl(getR2Client(), cmd, { expiresIn });
  return {
    storageKey,
    uploadUrl,
    publicUrl: buildR2PublicUrl(storageKey),
    expiresIn,
  };
}

export async function uploadBufferToR2(params: {
  storageKey: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ publicUrl: string; storageKey: string }> {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured");
  }
  const bucket = process.env.R2_BUCKET_NAME!;
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.storageKey,
      Body: params.buffer,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return {
    storageKey: params.storageKey,
    publicUrl: buildR2PublicUrl(params.storageKey),
  };
}

export async function getObjectFromR2(storageKey: string): Promise<{
  body: Uint8Array;
  contentType: string;
} | null> {
  if (!isR2Configured()) return null;
  try {
    const res = await getR2Client().send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: storageKey,
      })
    );
    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    return {
      body: bytes,
      contentType: res.ContentType || "application/octet-stream",
    };
  } catch {
    return null;
  }
}

export async function deleteObjectFromR2(storageKey: string): Promise<void> {
  if (!isR2Configured()) return;
  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: storageKey,
      })
    );
  } catch (error) {
    console.error("Failed to delete R2 object:", error instanceof Error ? error.message : String(error));
  }
}
