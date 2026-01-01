// src/app/api/tmdb/discover/route.ts
import { NextResponse } from "next/server";
import { getTvGenres } from "@/lib/tmdb";

const BASE_URL = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const genreName = url.searchParams.get("genreName") || "";

    if (!process.env.TMDB_API_KEY) {
      console.error("TMDB_API_KEY missing");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // map genreName -> tmdb id (case-insensitive)
    const genres = await getTvGenres();
    const match = genres.find((g:any) => (g.name || "").toLowerCase() === genreName.toLowerCase());
    if (!match) {
      return NextResponse.json({ results: [] });
    }

    const genreId = match.id;

    const res = await fetch(`${BASE_URL}/discover/tv?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}&language=en-US&page=1`);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("TMDB discover error:", res.status, txt);
      return NextResponse.json({ error: "TMDB error" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (err: any) {
    console.error("discover route error:", err && (err.stack || err.message || err));
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
