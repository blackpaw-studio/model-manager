"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";
import { useNsfw } from "../providers/nsfw-provider";
import { Lightbox } from "./lightbox";
import type { ImageInfo } from "../../lib/types";

function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `/api/images${path}`;
}

interface ImageGalleryProps {
  images: ImageInfo[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { isBlurred, revealedIds, toggleReveal } = useNsfw();

  if (images.length === 0) return null;

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {images.map((img, index) => {
          const thumbUrl = imageUrl(img.thumbPath);
          const shouldBlur =
            isBlurred(img.nsfwLevel) && !revealedIds.has(img.id);

          if (!thumbUrl) return null;

          return (
            <button
              key={img.id}
              onClick={() => {
                if (shouldBlur) {
                  toggleReveal(img.id);
                } else {
                  setLightboxIndex(index);
                }
              }}
              className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <img
                src={thumbUrl}
                alt={img.prompt?.slice(0, 80) ?? "Model image"}
                className={cn(
                  "w-full transition-all duration-300",
                  shouldBlur && "blur-2xl scale-110",
                  !shouldBlur &&
                    "group-hover:brightness-110 group-hover:scale-[1.02]"
                )}
                loading="lazy"
                style={{
                  aspectRatio:
                    img.width && img.height
                      ? `${img.width}/${img.height}`
                      : undefined,
                }}
              />
              {shouldBlur && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/80">
                    Click to reveal
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {lightboxIndex != null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
