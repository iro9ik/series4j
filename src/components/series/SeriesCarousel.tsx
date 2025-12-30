"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";

export default function SeriesCarousel({ series }: { series: any[] }) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!ref.current) return;
    ref.current.scrollBy({
      left: dir === "left" ? -600 : 600,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      {/* LEFT ARROW */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                   bg-black/60 hover:bg-black/80
                   w-14 h-14 rounded-full flex items-center justify-center"
      >
        <ChevronLeft className="w-9 h-9 text-white" />
      </button>

      {/* LIST */}
      <div
        ref={ref}
        className="flex gap-6 overflow-x-scroll scrollbar-hide
                   px-16 pt-6 pb-4 scroll-smooth"
      >
        {series.map((s) => (
          <Link
            key={s.id}
            href={`/series/${s.id}`}
            className="min-w-[180px]
                       transition-transform duration-300
                       hover:scale-110"
          >
            <img
              src={`https://image.tmdb.org/t/p/w300${s.poster_path}`}
              alt={s.name}
              className="rounded-lg"
            />
          </Link>
        ))}
      </div>

      {/* RIGHT ARROW */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                   bg-black/60 hover:bg-black/80
                   w-14 h-14 rounded-full flex items-center justify-center"
      >
        <ChevronRight className="w-9 h-9 text-white" />
      </button>
    </div>
  );
}
