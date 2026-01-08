// src/app/series/[id]/page.tsx
import { getSeriesDetails } from "@/lib/tmdb";
import { getNeo4jSession } from "@/lib/neo4j";
import SeriesActions from "@/components/series/SeriesActions";
import ViewTracker from "@/components/series/ViewTracker";

type Props = { params: Promise<{ id: string }>; };

export default async function SeriesDetails({ params }: Props) {
  const { id } = await params;
  const series = await getSeriesDetails(id);
  const tmdb = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.TMDB_API_KEY}`).then(r => r.json());

  // tmdb.genres is an array like [{ id: 18, name: "Drama" }, ...]
  const genreNames = (tmdb.genres || []).map((g: any) => g.name);

  // upsert into neo4j
  const session = getNeo4jSession();
  try {
    await session.run(
      `MERGE (s:Series {tmdbId: $tmdbId})
       SET s.name = $name, s.poster_path = $poster_path, s.first_air_date = $first_air_date, s.overview = $overview, s.popularity = $popularity, s.vote_average = $vote_average
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
        popularity: tmdb.popularity || 0,
        vote_average: tmdb.vote_average || 0,
        genres: genreNames,
      }
    );
  } catch (e) {
    console.error("Failed to upsert Series into Neo4j:", e);
  } finally {
    try { await session.close(); } catch { }
  }

  if (!series) {
    return <div className="p-6">Series not found</div>;
  }

  return (
    <div className="relative min-h-screen">
      {/* View Tracker - client component to track VIEWED relation */}
      <ViewTracker
        seriesId={String(series.id)}
        seriesName={series.name}
        posterPath={series.poster_path}
        firstAirDate={series.first_air_date}
        overview={series.overview}
        genres={genreNames}
      />

      {/* backdrop */}
      {series.backdrop_path && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${series.backdrop_path})` }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        </div>
      )}

      {/* content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row gap-10">
        {/* poster */}
        {series.poster_path && (
          <img src={`https://image.tmdb.org/t/p/w500${series.poster_path}`} alt={series.name} className="w-[300px] rounded-xl shadow-2xl" />
        )}

        <div className="flex-1">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{series.name}</h1>
              <p className="text-gray-300 mb-4">{series.first_air_date} • ⭐ {series.vote_average}</p>
            </div>
            <div className="flex-shrink-0">
              <SeriesActions seriesId={String(series.id)} />
            </div>
          </div>

          <p className="text-lg leading-relaxed mb-6 max-w-2xl">{series.overview}</p>

          {/* Genre tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {genreNames.map((g: string) => (
              <span key={g} className="text-xs bg-white/5 text-white/80 px-3 py-1 rounded-full">{g}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

