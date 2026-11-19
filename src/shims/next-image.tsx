import React from "react";

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string | { src: string };
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
  quality?: number;
  sizes?: string;
}

export function normalizeImageSrc(raw: string): string {
  if (!raw) return "";
  if (raw.startsWith("/api/widgets/github/avatar/")) {
    const user = decodeURIComponent(raw.replace("/api/widgets/github/avatar/", "").split("?")[0]);
    return `https://github.com/${encodeURIComponent(user)}.png`;
  }
  if (raw.startsWith("/api/widgets/") && raw.includes("/image?")) {
    try {
      const u = new URL(raw, "http://localhost");
      const target = u.searchParams.get("url");
      if (target) return target;
    } catch {}
  }
  if (raw.startsWith("/api/icons/svg?")) {
    try {
      const u = new URL(raw, "http://localhost");
      const icon = u.searchParams.get("icon") || "";
      const color = u.searchParams.get("color");
      const [prefix, ...rest] = icon.split(":");
      if (prefix && rest.length > 0) {
        return `https://api.iconify.design/${prefix}/${rest.join(":")}.svg${color ? `?color=%23${color}` : ""}`;
      }
    } catch {}
  }
  return raw;
}

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      fill,
      priority,
      unoptimized: _unoptimized,
      quality: _quality,
      sizes,
      style,
      className,
      ...rest
    },
    ref
  ) => {
    const rawSrc = typeof src === "string" ? src : src?.src ?? "";
    const resolvedSrc = normalizeImageSrc(rawSrc);
    const fillStyle: React.CSSProperties | undefined = fill
      ? {
          position: "absolute",
          height: "100%",
          width: "100%",
          inset: 0,
          ...style,
        }
      : style;

    return (
      <img
        ref={ref}
        src={resolvedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        sizes={sizes}
        loading={priority ? "eager" : rest.loading}
        style={fillStyle}
        className={className}
        referrerPolicy="no-referrer"
        {...rest}
      />
    );
  }
);

Image.displayName = "Image";
export default Image;
