import { authFetch, getFreshAuthToken } from "@/lib/auth-client";
import { auth } from "@/lib/firebase";
import { getStore } from "@/lib/local-store";

export type UploadCategory =
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

export interface UploadMediaOptions {
  category?: UploadCategory;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface UploadMediaResult {
  url: string;
  storageKey?: string;
  file?: {
    id: number;
    url: string;
    name: string;
    size: number;
    kind: "image" | "video" | "audio";
    favorite: boolean;
    locked: boolean;
    createdAt: number;
  };
}

const EXT_MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  cur: "image/x-icon",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

function resolveContentType(file: File | Blob, filename: string): string {
  if (file.type && file.type !== "application/octet-stream") {
    return file.type;
  }
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME_MAP[ext] || file.type || "application/octet-stream";
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(blob);
  });
}

async function compressImageToDataUrl(
  file: File | Blob,
  contentType: string,
  category: UploadCategory
): Promise<string> {
  if (contentType === "image/gif" || contentType === "image/svg+xml" || file.size <= 160 * 1024) {
    return readBlobAsDataUrl(file);
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode image."));
      el.src = objectUrl;
    });
    const maxDim = category === "avatar" || category === "badge" || category === "icon" || category === "cursor" ? 512 : 1400;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readBlobAsDataUrl(file);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/webp", 0.82);
  } catch {
    return readBlobAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function xhrUpload(params: {
  method: "PUT" | "POST";
  url: string;
  body: Blob | FormData;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<{ status: number; responseText: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(params.method, params.url);
    if (params.withCredentials) {
      xhr.withCredentials = true;
    }

    if (params.headers) {
      for (const [k, v] of Object.entries(params.headers)) {
        xhr.setRequestHeader(k, v);
      }
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        params.onProgress?.(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };

    xhr.onload = () => {
      params.onProgress?.(100);
      resolve({ status: xhr.status, responseText: xhr.responseText });
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new Error("Upload canceled."));

    if (params.signal) {
      if (params.signal.aborted) {
        xhr.abort();
        return;
      }
      params.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(params.body);
  });
}

async function uploadViaServerMultipart(
  file: File | Blob,
  filename: string,
  category: UploadCategory,
  options: UploadMediaOptions
): Promise<UploadMediaResult> {
  const uploadEndpoint = category === "image-host" ? "/api/image-host/upload" : "/api/upload";

  const sendOnce = async (forceRefreshToken: boolean) => {
    const form = new FormData();
    form.append("file", file, filename);
    form.append("category", category);

    const token = await getFreshAuthToken(forceRefreshToken);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      return await xhrUpload({
        method: "POST",
        url: uploadEndpoint,
        body: form,
        headers,
        withCredentials: true,
        onProgress: options.onProgress,
        signal: options.signal,
      });
    } catch (xhrErr) {
      if (options.signal?.aborted) {
        throw xhrErr;
      }
      const retryForm = new FormData();
      retryForm.append("file", file, filename);
      retryForm.append("category", category);
      const fetchRes = await authFetch(uploadEndpoint, {
        method: "POST",
        body: retryForm,
        signal: options.signal,
      });
      options.onProgress?.(100);
      return { status: fetchRes.status, responseText: await fetchRes.text() };
    }
  };

  let { status, responseText } = await sendOnce(false);

  if (status === 401) {
    const retryAuth = await sendOnce(true);
    status = retryAuth.status;
    responseText = retryAuth.responseText;
  } else if (status === 502 || status === 503 || status === 504) {
    await new Promise((r) => setTimeout(r, 700));
    const retryWarm = await sendOnce(false);
    status = retryWarm.status;
    responseText = retryWarm.responseText;
  }

  let parsed: { url?: string; storageKey?: string; file?: UploadMediaResult["file"]; error?: string } = {};
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // ignore
  }

  if (status < 200 || status >= 300 || !parsed.url) {
    const fallback =
      status === 401
        ? "Please sign in to upload media files."
        : status === 413
          ? "File is too large to upload."
          : `Upload failed (HTTP ${status || "network"}).`;
    throw new Error(parsed.error || fallback);
  }

  return {
    url: parsed.url,
    storageKey: parsed.storageKey,
    file: parsed.file,
  };
}

let r2DirectPutBlocked = false;

async function saveBlobToIndexedDb(id: string, blob: Blob): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await new Promise<void>((resolve) => {
    try {
      const req = indexedDB.open("prophile-local-media", 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("blobs")) {
          db.createObjectStore("blobs");
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("blobs", "readwrite");
        tx.objectStore("blobs").put(blob, id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          resolve();
        };
      };
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Uploads an image, audio, or video file via Cloudflare R2 presigned PUT URLs
 * when R2 is configured (with automatic fallback to server-side multipart upload
 * if direct browser PUT is blocked by bucket CORS), or directly via authenticated
 * server-side multipart upload.
 */
export async function uploadMediaFile(
  file: File | Blob,
  options: UploadMediaOptions = {}
): Promise<UploadMediaResult> {
  const category = options.category ?? "general";
  const filename = file instanceof File ? file.name : `upload-${Date.now()}.bin`;
  const contentType = resolveContentType(file, filename);
  const sizeBytes = file.size;

  const presignRes = await authFetch("/api/media/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename,
      contentType,
      sizeBytes,
      category,
    }),
    signal: options.signal,
  });

  if (!presignRes.ok) {
    const isSignedInClient = Boolean(auth.currentUser || getStore().currentUserId != null);
    if (presignRes.status === 404 && isSignedInClient) {
      if (contentType.startsWith("image/")) {
        options.onProgress?.(40);
        const dataUrl = await compressImageToDataUrl(file, contentType, category);
        options.onProgress?.(100);
        return { url: dataUrl };
      }

      // Allow video/audio uploads to work locally in the browser even on static preview URLs without Express /api/*
      options.onProgress?.(45);
      const localKey = `${category}-${Date.now()}-${filename}`;
      await saveBlobToIndexedDb(localKey, file);
      const extMatch = filename.match(/\.([a-z0-9]+)$/i);
      const extSuffix = extMatch ? `#.${extMatch[1].toLowerCase()}` : contentType.startsWith("video/") ? "#.mp4" : "";
      const blobUrl = `${URL.createObjectURL(file)}${extSuffix}`;
      options.onProgress?.(100);
      return { url: blobUrl, storageKey: localKey };
    }

    const contentTypeHeader = presignRes.headers.get("content-type") || "";
    const errBody = contentTypeHeader.includes("application/json")
      ? ((await presignRes.json().catch(() => ({}))) as { error?: string })
      : {};

    const fallback =
      presignRes.status === 401
        ? "Please sign in to upload media files."
        : presignRes.status === 404
          ? "Upload API unavailable on this URL (HTTP 404)."
          : presignRes.status === 503
            ? "Database is waking up — please try uploading again in a moment."
            : `Upload failed (HTTP ${presignRes.status}).`;
    throw new Error(errBody.error || fallback);
  }

  const presign = (await presignRes.json()) as {
    mode: "r2" | "multipart";
    uploadUrl: string;
    publicUrl?: string;
    storageKey?: string;
  };

  // Direct Cloudflare R2 presigned PUT flow (falls back to server-side R2 upload if CORS blocks direct PUT)
  if (presign.mode === "r2" && presign.publicUrl && presign.storageKey && !r2DirectPutBlocked) {
    try {
      const putResult = await xhrUpload({
        method: "PUT",
        url: presign.uploadUrl,
        body: file,
        headers: { "Content-Type": contentType },
        onProgress: options.onProgress,
        signal: options.signal,
      });

      if (putResult.status >= 200 && putResult.status < 300) {
        const confirmRes = await authFetch("/api/media/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storageKey: presign.storageKey,
            publicUrl: presign.publicUrl,
            filename,
            contentType,
            sizeBytes,
            category,
          }),
          signal: options.signal,
        });

        if (!confirmRes.ok) {
          const errBody = await confirmRes.json().catch(() => ({}));
          throw new Error((errBody as { error?: string }).error || "Failed to finalize upload.");
        }

        const confirmed = (await confirmRes.json()) as UploadMediaResult;
        return {
          url: confirmed.url || presign.publicUrl,
          storageKey: presign.storageKey,
          file: confirmed.file,
        };
      }
      r2DirectPutBlocked = true;
    } catch (directErr) {
      if (options.signal?.aborted) {
        throw directErr;
      }
      // Remember CORS failure for this session so subsequent uploads skip the failed direct PUT.
      r2DirectPutBlocked = true;
      options.onProgress?.(0);
    }
  }

  return uploadViaServerMultipart(file, filename, category, options);
}
