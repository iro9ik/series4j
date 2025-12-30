import { getPopularSeries } from "@/lib/tmdb";
import SeriesCarousel from "@/components/series/SeriesCarousel";
import SetupWrapper from "@/components/setup/SetupWrapper";

export default async function Home() {
  const series = await getPopularSeries();

  return (
    <main className="px-6 py-8 relative">
      {/* Setup Popup */}
      <SetupWrapper />

      {/* Main Content */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-4">Popular TV Series</h1>
        <SeriesCarousel series={series} />
      </section>
    </main>
  );
}
