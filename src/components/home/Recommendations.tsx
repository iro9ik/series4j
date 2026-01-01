"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Series = {
  tmdbId?: string | number;
  name?: string;
  poster_path?: string;
  first_air_date?: string;
  score?: number;
  [k: string]: any;
};

export default function Recommendations() {
  const [loading, setLoading] = useState(true);
  const [forYou, setForYou] = useState<Series[]>([]);
  const [similar, setSimilar] = useState<Series[]>([]);
  const [genres, setGenres] = useState<{name:string,score:number}[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/recommendations");
        if (!res.ok) return;
        const data = await res.json();
        setForYou(data.forYou || []);
        setSimilar(data.similarTastes || []);
        setGenres(data.recommendedGenres || []);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Loading recommendations…</div>;

  return (
    <section className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-3">Recommended for you</h2>
        {forYou.length === 0 ? (
          <div>
            <p className="text-white/70">No personalized series found yet.</p>
            {genres.length > 0 && (
              <p className="text-white/70 mt-2">Try these genres: {genres.map(g => g.name).join(", ")}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {forYou.map(s => (
              <div key={s.tmdbId ?? s.name} className="bg-white/5 rounded-lg overflow-hidden">
                <div className="h-48 bg-black/20 overflow-hidden">
                  {s.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w500${s.poster_path}`} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/60">No image</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{s.name}</h3>
                  <p className="text-xs text-white/70">{s.first_air_date}</p>
                  <p className="text-xs text-yellow-400 font-medium mt-1">Score: {s.score ?? "-"}</p>
                  <Link href={`/series/${s.tmdbId ?? s.id}`} className="mt-2 inline-block text-sm text-yellow-400">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Similar tastes</h2>
        {similar.length === 0 ? (
          <div>
            <p className="text-white/70">We couldn't find series from users with similar tastes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {similar.map(s => (
              <div key={s.tmdbId ?? s.name} className="bg-white/5 rounded-lg overflow-hidden">
                <div className="h-48 bg-black/20 overflow-hidden">
                  {s.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w500${s.poster_path}`} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/60">No image</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{s.name}</h3>
                  <p className="text-xs text-white/70">{s.first_air_date}</p>
                  <p className="text-xs text-yellow-400 font-medium mt-1">Score: {s.score ?? "-"}</p>
                  <Link href={`/series/${s.tmdbId ?? s.id}`} className="mt-2 inline-block text-sm text-yellow-400">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
