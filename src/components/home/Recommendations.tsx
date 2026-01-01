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
  const [similar, setSimilar] = useState<Series[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [genreSeriesMap, setGenreSeriesMap] = useState<Record<string, Series[]>>({});
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthenticated(false);

    try {
      const res = await fetch("/api/recommendations", { credentials: "same-origin" });
      if (res.status === 401) {
        setUnauthenticated(true);
        setForYou([]);
        setSimilar([]);
        setGenres([]);
        setGenreSeriesMap({});
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data && data.error) || `Failed (${res.status})`);
      }
      const data = await res.json();
      setForYou(Array.isArray(data.forYou) ? data.forYou : []);
      setSimilar(Array.isArray(data.similarTastes) ? data.similarTastes : []);
      // recommendedGenres is an array of {name, score}
      const recGenres = Array.isArray(data.recommendedGenres) ? data.recommendedGenres.map((g:any)=>g.name) : [];
      // But we want the user's chosen genres — fetch them
      const userGenresRes = await fetch("/api/user/genres", { credentials: "same-origin" });
      if (userGenresRes.ok) {
        const ug = await userGenresRes.json();
        setGenres(Array.isArray(ug.genres) ? ug.genres : []);
      } else {
        setGenres([]);
      }
    } catch (err: any) {
      console.error("Recommendations load error:", err);
      setError(err?.message ?? "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  // load per-genre discovered series
  const loadGenreSeries = useCallback(async (genreNames: string[]) => {
    const map: Record<string, Series[]> = {};
    for (const gname of genreNames) {
      try {
        const res = await fetch(`/api/tmdb/discover?genreName=${encodeURIComponent(gname)}`, { credentials: "same-origin" });
        if (!res.ok) {
          map[gname] = [];
          continue;
        }
        const data = await res.json();
        map[gname] = Array.isArray(data.results) ? data.results.slice(0, 12) : [];
      } catch (err) {
        console.error("discover error for", gname, err);
        map[gname] = [];
      }
    }
    setGenreSeriesMap(map);
  }, []);

  useEffect(() => {
    loadRecommendations();
    // refresh when auth changes (login/logout)
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

  // Loading skeleton: show poster-only skeletons
  if (loading) {
    const placeholders = Array.from({ length: 8 }).map((_, i) => <PosterSkeleton key={i} />);
    return (
      <section className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">{placeholders}</div>
      </section>
    );
  }

  if (unauthenticated) {
    return (
      <section className="p-6 bg-black/40 rounded-lg">
        <h2 className="text-xl font-bold">Recommended for you</h2>
        <p className="mt-2 text-white/70">Log in to see personalized recommendations based on your selected genres.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/login" className="px-4 py-2 bg-yellow-400 text-black rounded font-semibold">Login</Link>
          <Link href="/register" className="px-4 py-2 border border-white/20 rounded text-white/90">Sign up</Link>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6 bg-black/40 rounded-lg">
        <p className="text-red-400">Error: {error}</p>
      </section>
    );
  }

  return (
    <section className="p-6 space-y-8">
      {/* Recommended for you — poster-only carousel */}
      <div>
        <h2 className="text-xl font-bold mb-3">Recommended for you</h2>
        {forYou.length === 0 ? (
          <div className="bg-white/5 p-4 rounded">
            <p className="text-white/70">No personalized recommendations yet. Complete setup or favorite some series.</p>
          </div>
        ) : (
          <SeriesCarousel series={forYou} />
        )}
      </div>

      {/* Similar tastes — poster-only carousel */}
      <div>
        <h2 className="text-xl font-bold mb-3">Similar tastes</h2>
        {similar.length === 0 ? (
          <div className="bg-white/5 p-4 rounded">
            <p className="text-white/70">We couldn't find series from users with similar tastes yet.</p>
          </div>
        ) : (
          <SeriesCarousel series={similar} />
        )}
      </div>

      {/* Per-user genre sections */}
      {genres.map((g) => {
        const list = genreSeriesMap[g] || [];
        if (!list || list.length === 0) return null;
        return (
          <div key={g}>
            <h2 className="text-xl font-bold mb-3">{g}</h2>
            <SeriesCarousel series={list} />
          </div>
        );
      })}
    </section>
  );
}