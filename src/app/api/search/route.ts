// src/app/api/search/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const query = url.searchParams.get("q") || "";
        const genre = url.searchParams.get("genre") || "";
        const page = url.searchParams.get("page") || "1";

        if (!process.env.TMDB_API_KEY) {
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        if (!query.trim()) {
            return NextResponse.json({ results: [], total_pages: 0, total_results: 0 });
        }

        // Search TMDB
        const searchUrl = `${BASE_URL}/search/tv?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`;
        const res = await fetch(searchUrl);

        if (!res.ok) {
            console.error("TMDB search error:", res.status);
            return NextResponse.json({ error: "TMDB error" }, { status: 502 });
        }

        const data = await res.json();
        let results = data.results || [];

        // Filter by genre if specified
        if (genre) {
            // Get genre ID mapping
            const genresRes = await fetch(`${BASE_URL}/genre/tv/list?api_key=${process.env.TMDB_API_KEY}&language=en-US`);
            if (genresRes.ok) {
                const genresData = await genresRes.json();
                const genreMatch = (genresData.genres || []).find(
                    (g: any) => g.name.toLowerCase() === genre.toLowerCase()
                );
                if (genreMatch) {
                    results = results.filter((s: any) => (s.genre_ids || []).includes(genreMatch.id));
                }
            }
        }

        return NextResponse.json({
            results,
            total_pages: data.total_pages || 1,
            total_results: data.total_results || 0,
            page: data.page || 1
        });
    } catch (err: any) {
        console.error("search route error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
