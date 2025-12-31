// src/components/series/SeriesActions.tsx
"use client";

import { useEffect, useState } from "react";
import { Heart, Check, Plus } from "lucide-react";

export default function SeriesActions({ seriesId }: { seriesId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [animFav, setAnimFav] = useState(false);
  const [animList, setAnimList] = useState(false);

  async function fetchStates() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const favRes = await fetch("/api/favorites", { headers: { Authorization: `Bearer ${token}` } });
      if (favRes.ok) {
        const arr = await favRes.json();
        setIsFavorite(arr.some((r: any) => r.series_id === seriesId));
      }
      const listRes = await fetch("/api/mylist", { headers: { Authorization: `Bearer ${token}` } });
      if (listRes.ok) {
        const arr = await listRes.json();
        setIsInList(arr.some((r: any) => r.series_id === seriesId));
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchStates();
  }, [seriesId]);

  async function toggleFavorite() {
    const token = localStorage.getItem("token");
    const prev = isFavorite;
    setIsFavorite(!prev); // optimistic
    setAnimFav(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ series_id: seriesId }),
      });
      const data = await res.json();
      setIsFavorite(Boolean(data.favorite));
    } catch (err) {
      console.error(err);
      setIsFavorite(prev); // rollback
    } finally {
      setTimeout(() => setAnimFav(false), 700);
    }
  }

  async function toggleList() {
    const token = localStorage.getItem("token");
    const prev = isInList;
    setIsInList(!prev);
    setAnimList(true);
    try {
      const res = await fetch("/api/mylist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ series_id: seriesId }),
      });
      const data = await res.json();
      setIsInList(Boolean(data.inList));
    } catch (err) {
      console.error(err);
      setIsInList(prev);
    } finally {
      setTimeout(() => setAnimList(false), 700);
    }
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={toggleFavorite}
        className={`w-12 h-12 rounded-md flex items-center justify-center transition transform ${
          animFav ? "scale-110" : "scale-100"
        } ${isFavorite ? "bg-yellow-400 text-black" : "bg-white/10 text-white"}`}
        aria-label="Add to Favorites"
      >
        {animFav ? <Check className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
      </button>

      <button
        onClick={toggleList}
        className={`w-12 h-12 rounded-md flex items-center justify-center transition transform ${
          animList ? "scale-110" : "scale-100"
        } ${isInList ? "bg-yellow-400 text-black" : "bg-white/10 text-white"}`}
        aria-label="Add to My List"
      >
        {animList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}
