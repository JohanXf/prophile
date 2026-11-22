import { authFetch, getFreshAuthToken } from "@/lib/auth-client";

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
  const form = new FormData();
  form.append("file", file, filename);
  form.append("category", category);

  const token = await getFreshAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const uploadEndpoint = category === "image-host" ? "/api/image-host/upload" : "/api/upload";

  let status = 0;
  let responseText = "";

  try {
    const mpResult = await xhrUpload({
      method: "POST",
      url: uploadEndpoint,
      body: form,
      headers,
      withCredentials: true,
      onProgress: options.onProgress,
      signal: options.signal,
    });
    status = mpResult.status;
    responseText = mpResult.responseText;
  } catch (xhrErr) {
    if (options.signal?.aborted) {
      throw xhrErr;
    }
    // Retry once via fetch in case XHR hit a transient proxy error
    const retryForm = new FormData();
    retryForm.append("file", file, filename);
    retryForm.append("category", category);
    const fetchRes = await authFetch(uploadEndpoint, {
      method: "POST",
      body: retryForm,
      signal: options.signal,
    });
    status = fetchRes.status;
    responseText = await fetchRes.text();
    options.onProgress?.(100);
  }

  let parsed: { url?: string; storageKey?: string; file?: UploadMediaResult["file"]; error?: string } = {};
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // ignore
  }

  if (status < 200 || status >= 300 || !parsed.url) {
    throw new Error(parsed.error || `Upload failed (HTTP ${status || "network"}).`);
  }

  return {
    url: parsed.url,
    storageKey: parsed.storageKey,
    file: parsed.file,
  };
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
    const errBody = await presignRes.json().catch(() => ({}));
    throw new Error((errBody as { error?: string }).error || "Sign in to upload media files.");
  }

  const presign = (await presignRes.json()) as {
    mode: "r2" | "multipart";
    uploadUrl: string;
    publicUrl?: string;
    storageKey?: string;
  };

  // Direct Cloudflare R2 presigned PUT flow (falls back to server-side R2 upload if CORS blocks direct PUT)
  if (presign.mode === "r2" && presign.publicUrl && presign.storageKey) {
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
    } catch (directErr) {
      if (options.signal?.aborted) {
        throw directErr;
      }
      // Direct R2 PUT failed (commonly due to R2 bucket CORS not allowing the preview origin).
      // Fall back transparently to server-side multipart upload -> R2.
      options.onProgress?.(0);
    }
  }

  return uploadViaServerMultipart(file, filename, category, options);
}
