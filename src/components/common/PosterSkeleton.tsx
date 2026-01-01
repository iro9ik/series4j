// src/components/common/PosterSkeleton.tsx
"use client";

export default function PosterSkeleton({ width = 180, height = 270 }: { width?: number; height?: number }) {
  return (
    <div
      className="rounded-lg bg-white/6 animate-pulse"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      aria-hidden
    />
  );
}
