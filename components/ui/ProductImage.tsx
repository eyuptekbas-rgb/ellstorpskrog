"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  resolveProductImage,
  resolveProductThumbnail,
  shouldUnoptimizeImage,
} from "@/lib/brand/images";

type Props = {
  src: string | null | undefined;
  categorySlug: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  thumbnail?: boolean;
  /** When false, parent handles gradient overlay (e.g. product-image-shell) */
  overlay?: boolean;
};

export default function ProductImage({
  src,
  categorySlug,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  priority = false,
  thumbnail = false,
  overlay = true,
}: Props) {
  const resolved = thumbnail
    ? resolveProductThumbnail(src, categorySlug)
    : resolveProductImage(src, categorySlug);
  const fallback = thumbnail
    ? resolveProductThumbnail(null, categorySlug)
    : resolveProductImage(null, categorySlug);

  const [imgSrc, setImgSrc] = useState(resolved);

  useEffect(() => {
    setImgSrc(resolved);
  }, [resolved]);

  const image = (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      unoptimized={shouldUnoptimizeImage(imgSrc)}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback);
      }}
    />
  );

  if (!overlay || !fill) return image;

  return (
    <div className="relative h-full w-full">
      {image}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/85 via-[#0a0a0a]/25 to-transparent"
        aria-hidden
      />
    </div>
  );
}
