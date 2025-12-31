// src/app/library/page.tsx
"use client";

import { useEffect, useState } from "react";
import SeriesActions from "@/components/series/SeriesActions";

function Card({ s }: { s: any }) {
  return (
    <div className="bg-white/5 rounded-lg shadow-md overflow-hidden">
      <div className="relative h-56 bg-black/20">
        {s.poster_path ? (
          <img src={`https://image.tmdb.org/t/p/w500${s.poster_path}`} alt={s.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60">No image</div>
        )}
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{s.name}</h3>
          <p className="text-sm text-white/70">{s.first_air_date}</p>
        </div>
        <SeriesActions seriesId={String(s.id)} />
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [mylist, setMylist] = useState<any[]>([]);
  const [tab, setTab] = useState<"favorites" | "mylist">("favorites");
  const [sort, setSort] = useState<"newest" | "title-asc" | "title-desc">("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setFavorites([]);
        setMylist([]);
        setLoading(false);
        return;
      }

      // fetch IDs
      const [favRes, listRes] = await Promise.all([
        fetch("/api/favorites", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/mylist", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const favs = favRes.ok ? await favRes.json() : [];
      const lists = listRes.ok ? await listRes.json() : [];

      // fetch details via TMDB proxy
      const ids = Array.from(new Set([...favs.map((f: any) => f.series_id), ...lists.map((l: any) => l.series_id)]));
      const details = await Promise.all(
        ids.map(async (id: string) => {
          const r = await fetch(`/api/tmdb/series/${id}`);
          return r.ok ? r.json() : null;
        })
      );

      const detailMap = new Map<string, any>();
      details.forEach((d) => { if (d) detailMap.set(String(d.id), d); });

      setFavorites(favs.map((f: any) => detailMap.get(String(f.series_id)) || { id: f.series_id }));
      setMylist(lists.map((l: any) => detailMap.get(String(l.series_id)) || { id: l.series_id }));
      setLoading(false);
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Library</h1>
        <div className="flex items-center gap-3">
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="bg-black/60 border border-white/10 rounded-md px-3 py-2">
            <option value="newest">Newest first</option>
            <option value="title-asc">Title A → Z</option>
            <option value="title-desc">Title Z → A</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-3">
          <button onClick={() => setTab("favorites")} className={`px-4 py-2 rounded-md ${tab==="favorites" ? "bg-yellow-400 text-black" : "bg-white/10 text-white"}`}>Favorites</button>
          <button onClick={() => setTab("mylist")} className={`px-4 py-2 rounded-md ${tab==="mylist" ? "bg-yellow-400 text-black" : "bg-white/10 text-white"}`}>My List</button>
        </div>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : tab === "favorites" ? (
        sortArray(favorites).length === 0 ? <p>No favorites yet.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortArray(favorites).map((s: any) => <Card key={s.id} s={s} />)}
          </div>
        )
      ) : (
        sortArray(mylist).length === 0 ? <p>No items in your list yet.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortArray(mylist).map((s: any) => <Card key={s.id} s={s} />)}
          </div>
        )
      )}
    </div>
  );
}
