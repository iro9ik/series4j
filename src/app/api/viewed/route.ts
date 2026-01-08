// src/app/api/viewed/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getNeo4jSession } from "@/lib/neo4j";

function getTokenFromRequest(req: Request): string | null {
    const auth = req.headers.get("authorization");
    if (auth && auth.startsWith("Bearer ")) return auth.split(" ")[1];
    const cookie = req.headers.get("cookie") || "";
    for (const part of cookie.split(";")) {
        const [k, v] = part.trim().split("=");
        if (k === "token") return decodeURIComponent(v || "");
    }
    return null;
}

async function getUserIdFromToken(req: Request) {
    const token = getTokenFromRequest(req);
    if (!token) return null; // Don't throw - allow anonymous viewing
    try {
        const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
        return payload.userId;
    } catch {
        return null;
    }
}

/** Track that user viewed a series - creates VIEWED relationship in Neo4j */
export async function POST(req: Request) {
    let session: any = null;
    try {
        const userId = await getUserIdFromToken(req);
        if (!userId) {
            // Anonymous user, skip tracking
            return NextResponse.json({ tracked: false, reason: "not_logged_in" });
        }

        const { series_id, series_name, poster_path, first_air_date, overview, genres } = await req.json();
        if (!series_id) {
            return NextResponse.json({ error: "series_id is required" }, { status: 400 });
        }

        session = getNeo4jSession();

        // Upsert User node
        await session.run(
            `MERGE (u:User {id: $userId})`,
            { userId }
        );

        // Upsert Series node with all properties
        await session.run(
            `MERGE (s:Series {tmdbId: $tmdbId})
       SET s.name = $name, 
           s.poster_path = $poster_path, 
           s.first_air_date = $first_air_date, 
           s.overview = $overview`,
            {
                tmdbId: String(series_id),
                name: series_name || "",
                poster_path: poster_path || "",
                first_air_date: first_air_date || "",
                overview: overview || ""
            }
        );

        // Create genre relationships if provided
        if (genres && Array.isArray(genres) && genres.length > 0) {
            await session.run(
                `MATCH (s:Series {tmdbId: $tmdbId})
         UNWIND $genres AS genreName
           MERGE (g:Genre {name: genreName})
           MERGE (s)-[:HAS_GENRE]->(g)`,
                { tmdbId: String(series_id), genres }
            );
        }

        // Create VIEWED relationship with timestamp
        await session.run(
            `MATCH (u:User {id: $userId})
       MATCH (s:Series {tmdbId: $tmdbId})
       MERGE (u)-[r:VIEWED]->(s)
       ON CREATE SET r.first_viewed_at = datetime()
       SET r.last_viewed_at = datetime(), r.view_count = COALESCE(r.view_count, 0) + 1`,
            { userId, tmdbId: String(series_id) }
        );

        return NextResponse.json({ tracked: true });
    } catch (err: any) {
        console.error("viewed route error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    } finally {
        if (session) {
            try { await session.close(); } catch { /* ignore */ }
        }
    }
}
