// src/app/api/favorites/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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
  try {
    const userId = await getUserIdFromToken(req);
    const result = await db.query("SELECT series_id FROM favorites WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    console.error("favorites GET error:", err);
    return NextResponse.json({ error: err?.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  let session: any = null;
  try {
    const userId = await getUserIdFromToken(req);
    const payload = await req.json();
    const series_id = payload?.series_id;
    if (!series_id) return NextResponse.json({ error: "series_id is required" }, { status: 400 });

    // Check if exists
    const exists = await db.query("SELECT id FROM favorites WHERE user_id=$1 AND series_id=$2", [userId, series_id]);

    if (exists.rowCount != null && exists.rowCount > 0) {
      // remove
      await db.query("DELETE FROM favorites WHERE user_id=$1 AND series_id=$2", [userId, series_id]);

      // remove relationship in neo4j
      try {
        session = getNeo4jSession();
        await session.run(
          `MATCH (u:User {id: $userId})-[r:LIKES_SERIES]->(s:Series {tmdbId: $tmdbId}) DELETE r`,
          { userId, tmdbId: String(series_id) }
        );
      } catch (e) {
        console.error("favorites: failed to remove LIKES_SERIES:", e);
      } finally {
        if (session) { await session.close(); session = null; }
      }

      return NextResponse.json({ favorite: false });
    } else {
      // insert
      await db.query("INSERT INTO favorites(user_id, series_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, series_id]);

      // create relationship in neo4j
      try {
        session = getNeo4jSession();
        await session.run(
          `MERGE (u:User {id: $userId})
           MERGE (s:Series {tmdbId: $tmdbId})
           MERGE (u)-[:LIKES_SERIES]->(s)`,
          { userId, tmdbId: String(series_id) }
        );
      } catch (e) {
        console.error("favorites: failed to MERGE LIKES_SERIES:", e);
      } finally {
        if (session) { await session.close(); session = null; }
      }

      return NextResponse.json({ favorite: true });
    }
  } catch (err: any) {
    console.error("favorites POST error:", err);
    const msg = err?.message || "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (session) {
      try { await session.close(); } catch { /* ignore */ }
    }
  }
}
