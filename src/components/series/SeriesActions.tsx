// src/components/series/SeriesActions.tsx
"use client";

import { useEffect, useState } from "react";
import { Check, Heart, Plus } from "lucide-react";

export default function SeriesActions({ seriesId }: { seriesId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [animFav, setAnimFav] = useState(false);
  const [animList, setAnimList] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  async function fetchStates() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const favRes = await fetch("/api/favorites", { headers: { Authorization: `Bearer ${token}` } });
      if (favRes.ok) {
        const arr = await favRes.json();
        setIsFavorite(arr.some((r: any) => String(r.series_id) === String(seriesId)));
      }
      const listRes = await fetch("/api/mylist", { headers: { Authorization: `Bearer ${token}` } });
      if (listRes.ok) {
        const arr = await listRes.json();
        setIsInList(arr.some((r: any) => String(r.series_id) === String(seriesId)));
      }
    } catch (err) {
      console.error("Error fetching states:", err);
    }
  }

  useEffect(() => {
    fetchStates();
  }, [seriesId]);

  async function toggleFavorite() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add favorites.");
      return;
    }
    const prev = isFavorite;
    setIsFavorite(!prev); // optimistic UI
    setLoadingFav(true);
    setAnimFav(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ series_id: seriesId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFavorite(Boolean(data.favorite));
      } else {
        console.error("favorite toggle failed:", data);
        setIsFavorite(prev);
      }
    } catch (err) {
      console.error(err);
      setIsFavorite(prev);
    } finally {
      setTimeout(() => {
        setAnimFav(false);
        setLoadingFav(false);
      }, 700);
    }
  }

  async function toggleList() {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to add to your list.");
      return;
    }
    const prev = isInList;
    setIsInList(!prev);
    setLoadingList(true);
    setAnimList(true);
    try {
      const res = await fetch("/api/mylist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ series_id: seriesId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsInList(Boolean(data.inList ?? data.mylist));
      } else {
        console.error("mylist toggle failed:", data);
        setIsInList(prev);
      }
    } catch (err) {
      console.error(err);
      setIsInList(prev);
    } finally {
      setTimeout(() => {
        setAnimList(false);
        setLoadingList(false);
      }, 700);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <button
        onClick={toggleFavorite}
        disabled={loadingFav}
        className={`flex items-center gap-3 px-6 py-3 rounded-full transition-transform transform
          ${animFav ? "scale-105" : "scale-100"}
          ${isFavorite ? "bg-yellow-400 text-black" : "bg-white/10 text-white"}
          hover:opacity-95`}
        aria-pressed={isFavorite}
      >
        <span className="flex items-center justify-center w-6 h-6">
          {animFav ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
        </span>
        <span className="font-semibold text-sm">
          {isFavorite ? "Favorited" : "Add to Favorites"}
        </span>
      </button>

      <button
        onClick={toggleList}
        disabled={loadingList}
        className={`flex items-center gap-3 px-6 py-3 rounded-full transition-transform transform
          ${animList ? "scale-105" : "scale-100"}
          ${isInList ? "bg-yellow-400 text-black" : "bg-white/10 text-white"}
          hover:opacity-95`}
        aria-pressed={isInList}
      >
        <span className="flex items-center justify-center w-6 h-6">
          {animList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
        <span className="font-semibold text-sm">
          {isInList ? "In My List" : "Add to My List"}
        </span>
      </button>
    </div>
  );
}
