"use client";

import { useEffect, useState } from "react";
import { Heart, Plus, Check } from "lucide-react";

export default function SeriesActions({ seriesId }: { seriesId: string }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // Initial fetch
  useEffect(() => {
    let mounted = true;
    async function fetchStates() {
      try {
        const [favRes, listRes] = await Promise.all([
          fetch("/api/favorites", { credentials: "same-origin" }),
          fetch("/api/mylist", { credentials: "same-origin" }),
        ]);

        if (mounted && favRes.ok) {
          const data = await favRes.json().catch(() => []);
          if (Array.isArray(data)) {
            setIsFavorite(data.some((r: any) => String(r.series_id) === String(seriesId)));
          }
        }

        if (mounted && listRes.ok) {
          const data = await listRes.json().catch(() => []);
          if (Array.isArray(data)) {
            setIsInList(data.some((r: any) => String(r.series_id) === String(seriesId)));
          }
        }
      } catch (err) {
        console.error("Error fetching actions states:", err);
      }
    }
    fetchStates();
    return () => { mounted = false; };
  }, [seriesId]);

  async function toggleFavorite() {
    if (loadingFav) return;
    const previousState = isFavorite;

    // Optimistic UI update
    setIsFavorite(!previousState);
    setLoadingFav(true);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ series_id: seriesId }),
      });

      if (res.status === 401) {
        alert("Please log in to manage favorites.");
        setIsFavorite(previousState);
        return;
      }

      const data = await res.json();

      if (!res.ok || typeof data.favorite === "undefined") {
        console.warn("Favorite toggle unexpected response:", data);
        // If server didn't explicitly return new state, revert to previous or rely on the optimistic update?
        // Optimistic update assumes success. If it failed, we must revert.
        if (data.error) {
          console.error("Server error:", data.error);
          setIsFavorite(previousState);
        } else {
          // If we got {} or success status but no payload, it's ambiguous. 
          // Ideally we trust the optimistic update if it was a 200 OK.
          // But let's check explicitly.
          if (res.ok) {
            // assume success if status is 200 even if body is empty (though it shouldn't be)
            // But generally we expect { favorite: boolean }
            // Let's rely on data.favorite if present.
          } else {
            setIsFavorite(previousState);
          }
        }
      } else {
        // Sync with server state
        setIsFavorite(Boolean(data.favorite));
      }

    } catch (err) {
      console.error("Favorite toggle network error:", err);
      setIsFavorite(previousState);
    } finally {
      setLoadingFav(false);
    }
  }

  async function toggleList() {
    if (loadingList) return;
    const previousState = isInList;

    setIsInList(!previousState);
    setLoadingList(true);

    try {
      const res = await fetch("/api/mylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ series_id: seriesId }),
      });

      if (res.status === 401) {
        alert("Please log in to manage your list.");
        setIsInList(previousState);
        return;
      }

      const data = await res.json();

      if (!res.ok || typeof data.inList === "undefined") {
        console.warn("List toggle unexpected response:", data);
        if (data.error) {
          setIsInList(previousState);
        } else {
          if (!res.ok) setIsInList(previousState);
        }
      } else {
        setIsInList(Boolean(data.inList));
      }

    } catch (err) {
      console.error("List toggle network error:", err);
      setIsInList(previousState);
    } finally {
      setLoadingList(false);
    }
  }

  return (
    <div className="flex gap-4 mt-8">
      {/* Favorite Button */}
      <button
        onClick={toggleFavorite}
        disabled={loadingFav}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 border-2 ${isFavorite
            ? "bg-yellow-400 border-yellow-400 text-black hover:bg-yellow-300 hover:border-yellow-300"
            : "bg-transparent border-white/20 text-white hover:border-yellow-400 hover:text-yellow-400"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loadingFav ? (
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-black" : ""}`} />
        )}
        {isFavorite ? "Favorited" : "Favorite"}
      </button>

      {/* Add/Remove from List Button */}
      <button
        onClick={toggleList}
        disabled={loadingList}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 border-2 ${isInList
            ? "bg-yellow-400 border-yellow-400 text-black hover:bg-yellow-300 hover:border-yellow-300"
            : "bg-transparent border-white/20 text-white hover:border-yellow-400 hover:text-yellow-400"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loadingList ? (
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          isInList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />
        )}
        {isInList ? "In List" : "Add to List"}
      </button>
    </div>
  );
}
