// src/app/page.tsx
import { getPopularSeries, getTopRatedSeries } from "@/lib/tmdb";
import SeriesCarousel from "@/components/series/SeriesCarousel";
import SetupWrapper from "@/components/setup/SetupWrapper";
import Recommendations from "@/components/home/Recommendations";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 text-sm font-medium transition group"
      >
        View All
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default async function Home() {
  const popular = await getPopularSeries();
  const topRated = await getTopRatedSeries();

  return (
    <main className="px-6 py-8 relative">
      {/* Setup Popup */}
      <SetupWrapper />

      {/* Popular */}
      <section className="mb-10">
        <SectionHeader title="Popular TV Shows" href="/series?sort=popular" />
        <SeriesCarousel series={popular} />
      </section>

      {/* Top Rated */}
      <section className="mb-10">
        <SectionHeader title="Top Rated" href="/series?sort=toprated" />
        <SeriesCarousel series={topRated} />
      </section>

      {/* Recommendations */}
      <section className="mb-10">
        <SectionHeader title="Recommended for you" href="/series?sort=popular" />
        <Recommendations />
      </section>
    </main>
  );
}

