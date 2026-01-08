// src/app/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import SeriesCard from "@/components/series/SeriesCard";
import PosterSkeleton from "@/components/common/PosterSkeleton";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [mylist, setMylist] = useState<any[]>([]);
  const [tab, setTab] = useState<"favorites" | "mylist">("favorites");
  const [sort, setSort] = useState<"newest" | "title-asc" | "title-desc">("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch IDs using cookie (credentials: include/same-origin)
        const [favRes, listRes] = await Promise.all([
          fetch("/api/favorites", { credentials: "same-origin" }),
          fetch("/api/mylist", { credentials: "same-origin" }),
        ]);

        if (favRes.status === 401 || listRes.status === 401) {
          // Redirect or show login prompt
          return;
        }

        const favs = favRes.ok ? await favRes.json() : [];
        const lists = listRes.ok ? await listRes.json() : [];

        // unique IDs to fetch from TMDB
        const allIds = new Set([...favs.map((f: any) => f.series_id), ...lists.map((l: any) => l.series_id)]);
        const uniqueIds = Array.from(allIds).filter(Boolean);

        const details = await Promise.all(
          uniqueIds.map(async (id: any) => {
            const r = await fetch(`/api/tmdb/series/${id}`);
            return r.ok ? r.json() : null;
          })
        );

        const detailMap = new Map<string, any>();
        details.forEach((d) => { if (d) detailMap.set(String(d.id), d); });

        setFavorites(favs.map((f: any) => detailMap.get(String(f.series_id))).filter(Boolean));
        setMylist(lists.map((l: any) => detailMap.get(String(l.series_id))).filter(Boolean));
      } catch (err) {
        console.error("Library load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function sortArray(arr: any[]) {
    if (!arr) return [];
    if (sort === "newest") return [...arr].sort((a, b) => ((b.first_air_date || "") > (a.first_air_date || "")) ? 1 : -1);
    if (sort === "title-asc") return [...arr].sort((a, b) => ((a.name || "")).localeCompare((b.name || "")));
    if (sort === "title-desc") return [...arr].sort((a, b) => ((b.name || "")).localeCompare((a.name || "")));
    return arr;
  }

  const activeList = tab === "favorites" ? favorites : mylist;
  const sortedList = sortArray(activeList);

  return (
    <div className="min-h-screen pt-24 px-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Your Library</h1>
          <p className="text-white/60">Manage your favorites and watchlist.</p>
        </div>

        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-lg p-1 relative">
            {/* Animated Background for Tab */}
            <div
              className={`absolute inset-y-1 bg-yellow-400 rounded-md shadow-lg transition-all duration-300 ease-out ${tab === "favorites" ? "left-1 w-[88px]" : "left-[96px] w-[80px]"}`}
            ></div>

            <button
              onClick={() => setTab("favorites")}
              className={`relative z-10 px-4 py-2 rounded-md text-sm font-bold transition-colors ${tab === "favorites" ? "text-black" : "text-white/70 hover:text-white"}`}
            >
              Favorites
            </button>
            <button
              onClick={() => setTab("mylist")}
              className={`relative z-10 px-4 py-2 rounded-md text-sm font-bold transition-colors ${tab === "mylist" ? "text-black" : "text-white/70 hover:text-white"}`}
            >
              My List
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/10 mx-2"></div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-transparent text-sm font-medium text-white/80 focus:outline-none cursor-pointer hover:text-white"
          >
            <option value="newest" className="bg-black">Newest Added</option>
            <option value="title-asc" className="bg-black">Title (A-Z)</option>
            <option value="title-desc" className="bg-black">Title (Z-A)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
          {[...Array(14)].map((_, i) => <PosterSkeleton key={i} />)}
        </div>
      ) : sortedList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 animate-fade-in">
          <p className="text-2xl font-bold text-white mb-2">It's empty here.</p>
          <p className="text-white/50 mb-6">Start adding series to your {tab === "favorites" ? "favorites" : "list"}!</p>
          <a href="/series" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition">Browse Series</a>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {sortedList.map((s: any) => (
            <SeriesCard
              key={s.id}
              id={s.id}
              title={s.name}
              poster={s.poster_path}
            />
          ))}
        </div>
      )}
    </div>
  );
}


