// src/app/page.tsx
import { getPopularSeries, getTopRatedSeries } from "@/lib/tmdb";
import SeriesCarousel from "@/components/series/SeriesCarousel";
import SetupWrapper from "@/components/setup/SetupWrapper";
import Recommendations from "@/components/home/Recommendations";

export default async function Home() {
  const popular = await getPopularSeries();
  const topRated = await getTopRatedSeries();

  return (
    <main className="px-6 py-8 relative">
      {/* Setup Popup */}
      <SetupWrapper />

      {/* Popular */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-4">Popular TV Shows</h1>
        <SeriesCarousel series={popular} />
      </section>

      {/* Top Rated */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Top Rated</h2>
        <SeriesCarousel series={topRated} />
      </section>

      {/* Recommendations */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">Recommended for you</h2>
        <Recommendations />
      </section>
    </main>
  );
}
