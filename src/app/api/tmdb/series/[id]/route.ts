// src/app/api/tmdb/series/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.TMDB_API_KEY}`);
    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: txt }, { status: res.status });
    }
    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch TMDB" }, { status: 500 });
  }
}
