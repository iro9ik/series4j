// src/app/api/recommendations/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getNeo4jSession } from "@/lib/neo4j";

/** Read token from Authorization header or httpOnly cookie 'token' */
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

function neo4jValueToJs(v: any) {
  // convert Neo4j Integer to number if needed
  if (v && typeof v.toNumber === "function") return v.toNumber();
  return v;
}

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = payload.userId;
    if (!userId) return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });

    const session = getNeo4jSession();

    // 1) For you: series that share genres with the user's selected genres
    const forYouCypher = `
      MATCH (u:User {id: $userId})-[:LIKES]->(g:Genre)<-[:HAS_GENRE]-(s:Series)
      WHERE NOT (u)-[:LIKES_SERIES]->(s)
      WITH s, count(DISTINCT g) AS score
      RETURN s AS series, score
      ORDER BY score DESC, s.name ASC
      LIMIT 12
    `;

    // 2) Similar tastes: series liked by other users who share genres with the user.
    // We find other users that share genres, then get series they like, and score by
    // the sum of shared genre counts (series preferred by more similar users rank higher).
    const similarCypher = `
      MATCH (u:User {id:$userId})-[:LIKES]->(g:Genre)<-[:LIKES]-(other:User)
      WHERE other.id <> $userId
      WITH other, count(DISTINCT g) AS sharedGenres
      WHERE sharedGenres >= 1
      MATCH (other)-[:LIKES_SERIES]->(s:Series)
      WHERE NOT (u)-[:LIKES_SERIES]->(s)
      WITH s, sum(sharedGenres) AS score
      RETURN s AS series, score
      ORDER BY score DESC, s.name ASC
      LIMIT 12
    `;

    // 3) Collaborative recommended genres (genres similar users like that the user does not)
    const recommendedGenresCypher = `
      MATCH (u:User {id:$userId})-[:LIKES]->(g:Genre)<-[:LIKES]-(other:User)-[:LIKES]->(rec:Genre)
      WHERE NOT (u)-[:LIKES]->(rec)
      RETURN rec.name AS genre, count(DISTINCT other) AS score
      ORDER BY score DESC
      LIMIT 8
    `;

    const [forYouRes, similarRes, genresRes] = await Promise.all([
      session.run(forYouCypher, { userId }),
      session.run(similarCypher, { userId }),
      session.run(recommendedGenresCypher, { userId }),
    ]);

    const mapSeriesRecord = (rec: any) => {
      const node = rec.get("series");
      const props = node?.properties ?? node;
      // convert numeric fields
      const out: any = {};
      for (const k of Object.keys(props || {})) {
        out[k] = neo4jValueToJs(props[k]);
      }
      const rawScore = rec.get("score");
      out.score = neo4jValueToJs(rawScore);
      // If you store tmdbId as number or string, it will be present in props (tmdbId)
      return out;
    };

    const forYou = forYouRes.records.map(mapSeriesRecord);
    const similarTastes = similarRes.records.map(mapSeriesRecord);
    const recommendedGenres = genresRes.records.map((r: any) => ({
      name: r.get("genre"),
      score: neo4jValueToJs(r.get("score")),
    }));

    await session.close();

    return NextResponse.json({ forYou, similarTastes, recommendedGenres });
  } catch (err: any) {
    console.error("recommendations error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
