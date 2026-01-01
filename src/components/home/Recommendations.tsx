// src/components/home/Recommendations.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SeriesCarousel, { CarouselItem } from "@/components/series/SeriesCarousel";

type SeriesFromApi = {
  tmdbId?: number | string;
  id?: number | string;
  poster_path?: string | null;
  name?: string;
  first_air_date?: string | null;
  score?: number;
};

function TitleSkeleton() {
  return <div className="h-6 w-48 bg-white/10 rounded animate-pulse"></div>;
}
function CardSkeleton() {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden animate-pulse">
      <div className="h-[330px] bg-white/10" />
      <div className="p-3">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/8 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Recommendations() {
  const [loading, setLoading] = useState(true);
  const [forYou, setForYou] = useState<SeriesFromApi[]>([]);
  const [similar, setSimilar] = useState<SeriesFromApi[]>([]);
  const [perGenreSections, setPerGenreSections] = useState<any[]>([]);
  const [userGenres, setUserGenres] = useState<string[]>([]);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      setUnauthenticated(false);
      try {
        const res = await fetch("/api/recommendations", { credentials: "same-origin" });
        if (res.status === 401) {
          if (!mounted) return;
          setUnauthenticated(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          let msg = `Request failed ${res.status}`;
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
          } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        if (!mounted) return;

        setForYou(data.forYou || []);
        setSimilar(data.similarTastes || []);
        setPerGenreSections(data.perGenreSections || []);
        setUserGenres(data.userGenres || []);
      } catch (err: any) {
        console.error("Recommendations load error:", err);
        setError(err?.message || "Failed to load recommendations");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <section className="p-6 space-y-8">
        <div>
          <TitleSkeleton />
          <div className="mt-4">
            <div className="flex gap-6 overflow-x-auto px-16 py-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="min-w-[220px] w-[220px]"><CardSkeleton /></div>)}
            </div>
          </div>
        </div>

        <div>
          <TitleSkeleton />
          <div className="mt-4">
            <div className="flex gap-6 overflow-x-auto px-16 py-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="min-w-[220px] w-[220px]"><CardSkeleton /></div>)}
            </div>
          </div>
        </div>

        <div>
          <TitleSkeleton />
          <div className="mt-4">
            <div className="flex gap-6 overflow-x-auto px-16 py-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="min-w-[220px] w-[220px]"><CardSkeleton /></div>)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (unauthenticated) {
    return (
      <section className="p-6">
        <h2 className="text-xl font-bold">Recommended for you</h2>
        <p className="mt-2 text-white/70">Log in to see personalized recommendations.</p>
        <div className="mt-4 flex gap-3">
          <Link href="/login" className="px-4 py-2 bg-yellow-400 text-black rounded">Login</Link>
          <Link href="/register" className="px-4 py-2 border border-white/20 rounded">Sign up</Link>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6">
        <h2 className="text-xl font-bold">Recommendations</h2>
        <p className="text-red-400 mt-2">Error: {error}</p>
      </section>
    );
  }

  const toCarouselItems = (arr: SeriesFromApi[]) =>
    arr.map((s) => ({ id: s.tmdbId ?? s.id, tmdbId: s.tmdbId ?? s.id, poster_path: s.poster_path, name: s.name }));

  return (
    <section className="p-6 space-y-12">
      {/* Recommended for you */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Recommended for you</h2>
        </div>
        {forYou.length === 0 ? (
          <div className="bg-white/5 p-4 rounded">
            <p className="text-white/70">No personalized series yet. Try completing the setup.</p>
            <div className="mt-3">
              <Link href="/series" className="px-4 py-2 bg-yellow-400 text-black rounded">Browse Series</Link>
            </div>
          </div>
        ) : (
          <SeriesCarousel series={toCarouselItems(forYou)} />
        )}
      </div>

      {/* Similar tastes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Similar tastes</h2>
        </div>
        {similar.length === 0 ? (
          <div className="bg-white/5 p-4 rounded">
            <p className="text-white/70">No series from similar users yet. Try favoriting more series.</p>
          </div>
        ) : (
          <SeriesCarousel series={toCarouselItems(similar)} />
        )}
      </div>

      {/* Per-genre sections */}
      {perGenreSections.map((sec: any) => (
        <div key={sec.genre}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">{sec.title}</h3>
            {/* Removed genre tag from home (requested) */}
          </div>
          {sec.items && sec.items.length > 0 ? (
            <SeriesCarousel series={sec.items.map((s: any) => ({ id: s.tmdbId ?? s.id, tmdbId: s.tmdbId ?? s.id, poster_path: s.poster_path, name: s.name }))} />
          ) : (
            <div className="bg-white/5 p-4 rounded">
              <p className="text-white/70">No picks for {sec.genre} yet.</p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
