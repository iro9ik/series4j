// src/components/home/Recommendations.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import SeriesCarousel from "@/components/series/SeriesCarousel";
import PosterSkeleton from "@/components/common/PosterSkeleton";

type Series = {
  tmdbId?: string | number;
  id?: string | number;
  name?: string;
  poster_path?: string | null;
  first_air_date?: string | null;
  score?: number;
  [k: string]: any;
};

export default function Recommendations() {
  const [loading, setLoading] = useState(true);
  const [forYou, setForYou] = useState<Series[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [genreSeriesMap, setGenreSeriesMap] = useState<Record<string, Series[]>>({});
  const [unauthenticated, setUnauthenticated] = useState(false);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setUnauthenticated(false);

    try {
      // Try to load recommendations, but don't fail if it errors
      const res = await fetch("/api/recommendations", { credentials: "same-origin" });
      if (res.status === 401) {
        setUnauthenticated(true);
        setForYou([]);
        setGenres([]);
        setGenreSeriesMap({});
        setLoading(false);
        return;
      }

      let forYouData: Series[] = [];

      if (res.ok) {
        const data = await res.json();
        forYouData = Array.isArray(data.forYou) ? data.forYou : [];
      }

      // If Neo4j didn't return enough, fetch from TMDB popular to fill up
      if (forYouData.length < 20) {
        try {
          const tmdbRes = await fetch("/api/series/list?type=popular", { credentials: "same-origin" });
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            const tmdbSeries = (tmdbData.results || []).map((s: any) => ({
              ...s,
              tmdbId: s.id
            }));
            // Add TMDB series that aren't already in forYouData
            const existingIds = new Set(forYouData.map(s => String(s.tmdbId || s.id)));
            const newSeries = tmdbSeries.filter((s: any) => !existingIds.has(String(s.id)));
            forYouData = [...forYouData, ...newSeries].slice(0, 20);
          }
        } catch (e) {
          console.error("Failed to fetch TMDB fallback:", e);
        }
      }

      setForYou(forYouData);

      // Always try to fetch user genres for genre sections
      const userGenresRes = await fetch("/api/user/genres", { credentials: "same-origin" });
      let finalGenres: string[] = [];
      if (userGenresRes.ok) {
        const ug = await userGenresRes.json();
        finalGenres = Array.isArray(ug.genres) ? ug.genres : [];
      }

      // Ensure at least 3 genres
      const defaults = ["Action & Adventure", "Comedy", "Drama", "Sci-Fi & Fantasy", "Animation"];
      for (const d of defaults) {
        if (finalGenres.length >= 3) break;
        if (!finalGenres.includes(d)) finalGenres.push(d);
      }

      setGenres(finalGenres);
    } catch (err: any) {
      console.error("Recommendations load error:", err);
      // Still try to load genres even if recommendations fail
      try {
        const userGenresRes = await fetch("/api/user/genres", { credentials: "same-origin" });
        if (userGenresRes.ok) {
          const ug = await userGenresRes.json();
          setGenres(Array.isArray(ug.genres) ? ug.genres : []);
        }
      } catch { }
    } finally {
      setLoading(false);
    }
  }, []);

  // load per-genre discovered series - get more results
  const loadGenreSeries = useCallback(async (genreNames: string[]) => {
    const map: Record<string, Series[]> = {};
    for (const gname of genreNames) {
      try {
        // Fetch multiple pages to get more series
        const res = await fetch(`/api/tmdb/discover?genreName=${encodeURIComponent(gname)}&page=1`, { credentials: "same-origin" });
        if (!res.ok) {
          map[gname] = [];
          continue;
        }
        const data = await res.json();
        map[gname] = Array.isArray(data.results) ? data.results.slice(0, 20) : [];
      } catch (err) {
        console.error("discover error for", gname, err);
        map[gname] = [];
      }
    }
    setGenreSeriesMap(map);
  }, []);

  useEffect(() => {
    loadRecommendations();
    function onAuthChange() {
      loadRecommendations();
    }
    window.addEventListener("auth-change", onAuthChange);
    return () => window.removeEventListener("auth-change", onAuthChange);
  }, [loadRecommendations]);

  // whenever genres change, load their series
  useEffect(() => {
    if (!genres || genres.length === 0) {
      setGenreSeriesMap({});
      return;
    }
    loadGenreSeries(genres);
  }, [genres, loadGenreSeries]);

  // Loading skeleton

  if (loading) {
    const SkeletonRow = () => (
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <PosterSkeleton key={i} />)}
      </div>
    );

    return (
      <section className="space-y-12">
        <div className="space-y-4">
          {/* First section (Recommendations) - No header skeleton */}
          <SkeletonRow />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
          <SkeletonRow />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse"></div>
          <SkeletonRow />
        </div>
      </section>
    );
  }

  if (unauthenticated) {
    return (
      <section className="bg-black/40 rounded-lg p-4">
        <p className="text-white/70">Log in to see personalized recommendations.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/login" className="px-4 py-2 bg-yellow-400 text-black rounded font-semibold">Login</Link>
          <Link href="/register" className="px-4 py-2 border border-white/20 rounded text-white/90">Sign up</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      {/* Recommended for you */}
      {forYou.length > 0 ? (
        <SeriesCarousel series={forYou} />
      ) : (
        <div className="bg-white/5 p-4 rounded">
          <p className="text-white/70">Complete setup or favorite some series to get recommendations.</p>
        </div>
      )}

      {/* Per-user genre sections - NO View All links */}
      {genres.map((g) => {
        const list = genreSeriesMap[g] || [];
        if (!list || list.length === 0) return null;
        return (
          <div key={g}>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xl font-bold">{g}</h2>
              <Link href={`/series?genre=${encodeURIComponent(g)}`} className="text-xs font-bold text-yellow-400 hover:text-yellow-300 uppercase tracking-wider">
                View All
              </Link>
            </div>
            <SeriesCarousel series={list} />
          </div>
        );
      })}
    </section>
  );
}