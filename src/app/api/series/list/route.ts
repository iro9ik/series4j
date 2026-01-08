// src/app/api/series/list/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "https://api.themoviedb.org/3";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const type = url.searchParams.get("type") || "popular";
        const sortOrder = url.searchParams.get("sort") || "";
        const page = url.searchParams.get("page") || "1";

        if (!process.env.TMDB_API_KEY) {
            return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
        }

        let endpoint = "";
        switch (type) {
            case "popular":
                endpoint = `${BASE_URL}/tv/popular`;
                break;
            case "top_rated":
                endpoint = `${BASE_URL}/tv/top_rated`;
                break;
            case "airing_today":
                endpoint = `${BASE_URL}/tv/airing_today`;
                break;
            case "on_the_air":
                endpoint = `${BASE_URL}/tv/on_the_air`;
                break;
            default:
                endpoint = `${BASE_URL}/tv/popular`;
        }

        const res = await fetch(`${endpoint}?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=${page}`);

        if (!res.ok) {
            console.error("TMDB list error:", res.status);
            return NextResponse.json({ error: "TMDB error" }, { status: 502 });
        }

        const data = await res.json();
        let results = data.results || [];

        // Sort by oldest if requested
        if (sortOrder === "oldest") {
            results = results.sort((a: any, b: any) => {
                const dateA = new Date(a.first_air_date || "2100").getTime();
                const dateB = new Date(b.first_air_date || "2100").getTime();
                return dateA - dateB;
            });
        }

        return NextResponse.json({
            results,
            total_pages: data.total_pages || 1,
            total_results: data.total_results || 0,
            page: data.page || 1
        });
    } catch (err: any) {
        console.error("series list route error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
