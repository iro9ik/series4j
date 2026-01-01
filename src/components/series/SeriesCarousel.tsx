// src/components/series/SeriesCarousel.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";

export type CarouselItem = {
  id?: number | string;
  tmdbId?: number | string;
  poster_path?: string | null;
  name?: string;
};

export default function SeriesCarousel({ series }: { series: CarouselItem[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  function scroll(dir: "left" | "right") {
    if (!ref.current) return;
    // scroll amount tuned to card width + gap
    ref.current.scrollBy({
      left: dir === "left" ? -760 : 760,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      {/* left */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20
                   bg-black/60 hover:bg-black/80
                   w-14 h-14 rounded-full flex items-center justify-center"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-8 h-8 text-white" />
      </button>

      <div
        ref={ref}
        className="flex gap-6 overflow-x-auto scrollbar-hide px-16 py-4 scroll-smooth snap-x snap-mandatory"
      >
        {series.map((s) => {
          const sid = s.id ?? s.tmdbId;
          const href = `/series/${sid}`;
          const img = s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : null;

          return (
            <Link
              key={String(sid ?? s.name ?? Math.random())}
              href={href}
              className="min-w-[220px] w-[220px] flex-shrink-0 snap-start transition-transform duration-300 hover:scale-105"
            >
              <div className="rounded-lg overflow-hidden">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={s.name} className="w-full h-[330px] object-cover rounded-lg shadow-lg" />
                ) : (
                  <div className="w-full h-[330px] bg-white/6 rounded-lg flex items-center justify-center text-white/60">No image</div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* right */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20
                   bg-black/60 hover:bg-black/80
                   w-14 h-14 rounded-full flex items-center justify-center"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-8 h-8 text-white" />
      </button>
    </div>
  );
}
