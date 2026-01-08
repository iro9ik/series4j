// src/app/api/favorites/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getNeo4jSession } from "@/lib/neo4j";

/** Safe token read (header or cookie) */
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
  if (!token) throw new Error("Unauthorized");
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    return payload.userId;
  } catch (err) {
    throw new Error("Invalid token");
  }
}

/** Always return JSON; robust logging; sync to Neo4j */
export async function GET(req: Request) {
  let session = null;
  try {
    const userId = await getUserIdFromToken(req);
    session = getNeo4jSession();

    // Return format must match what frontend expects: array of object with series_id
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:LIKES_SERIES]->(s:Series) 
       RETURN s.tmdbId AS series_id`,
      { userId }
    );

    const rows = result.records.map(r => ({ series_id: r.get("series_id") }));
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("favorites GET error:", err);
    return NextResponse.json({ error: err?.message || "Unauthorized" }, { status: 401 });
  } finally {
    if (session) await session.close();
  }
}

export async function POST(req: Request) {
  let session = null;
  console.log("[API] favorites POST (Neo4j only)");
  try {
    const userId = await getUserIdFromToken(req);
    const payload = await req.json();
    const series_id = payload?.series_id;

    if (!series_id) {
      return NextResponse.json({ error: "series_id is required" }, { status: 400 });
    }

    session = getNeo4jSession();

    // Check if relationship exists
    const check = await session.run(
      `MATCH (u:User {id: $userId})-[r:LIKES_SERIES]->(s:Series {tmdbId: $tmdbId}) RETURN r`,
      { userId, tmdbId: String(series_id) }
    );

    const exists = check.records.length > 0;

    if (exists) {
      // Toggle OFF
      await session.run(
        `MATCH (u:User {id: $userId})-[r:LIKES_SERIES]->(s:Series {tmdbId: $tmdbId}) DELETE r`,
        { userId, tmdbId: String(series_id) }
      );
      console.log("[API] favorites: removed relationship");
      return NextResponse.json({ favorite: false });
    } else {
      // Toggle ON
      await session.run(
        `MERGE (u:User {id: $userId})
             MERGE (s:Series {tmdbId: $tmdbId})
             MERGE (u)-[:LIKES_SERIES]->(s)`,
        { userId, tmdbId: String(series_id) }
      );
      console.log("[API] favorites: added relationship");
      return NextResponse.json({ favorite: true });
    }

  } catch (err: any) {
    console.error("favorites POST error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  } finally {
    if (session) await session.close();
  }
}
