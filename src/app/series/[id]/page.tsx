import { getSeriesDetails } from "@/lib/tmdb";
import { getNeo4jSession } from "@/lib/neo4j";
import SeriesActions from "@/components/series/SeriesActions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SeriesDetails({ params }: Props) {
  const { id } = await params;
  const series = await getSeriesDetails(id);
  const tmdb = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.TMDB_API_KEY}`).then(r => r.json());
  // tmdb.genres is an array like [{ id: 18, name: "Drama" }, ...]
  const genreNames = (tmdb.genres || []).map((g: any) => g.name);
  const session = getNeo4jSession();
  await session.run(
  `MERGE (s:Series {tmdbId: $tmdbId})
   SET s.name = $name, s.poster_path = $poster_path, s.first_air_date = $first_air_date, s.overview = $overview
   WITH s
   UNWIND $genres AS genreName
     MERGE (g:Genre {name: genreName})
     MERGE (s)-[:HAS_GENRE]->(g)`,
  {
    tmdbId: String(tmdb.id),
    name: tmdb.name,
    poster_path: tmdb.poster_path,
    first_air_date: tmdb.first_air_date,
    overview: tmdb.overview,
    genres: genreNames,
  }
);
await session.close();
  if (!series) {
    return <div className="p-6">Series not found</div>;
  }

  return (
    <div className="relative min-h-screen">
      {/* BACKDROP */}
      {series.backdrop_path && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${series.backdrop_path})`,
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        </div>
      )}

      {/* CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row gap-10">
        {/* POSTER */}
        {series.poster_path && (
          <img
            src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
            alt={series.name}
            className="w-[300px] rounded-xl shadow-2xl"
          />
        )}
        <div className="flex gap-4">
        <SeriesActions seriesId={String(series.id)} />
        </div>
        {/* INFO */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{series.name}</h1>

          <p className="text-gray-300 mb-4">
            {series.first_air_date} • ⭐ {series.vote_average}
          </p>

          <p className="text-lg leading-relaxed mb-6 max-w-2xl">
            {series.overview}
          </p>

          <div className="flex gap-4">
            <button className="bg-yellow-500 text-black px-6 py-3 rounded-full font-semibold hover:bg-yellow-400 transition">
              Add to Favorites
            </button>

            <button className="bg-white/20 backdrop-blur px-6 py-3 rounded-full hover:bg-white/30 transition">
              Add to My List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
