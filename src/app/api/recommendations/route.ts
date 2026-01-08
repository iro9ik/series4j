// src/app/api/recommendations/route.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getNeo4jSession } from "@/lib/neo4j";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;

type Neo4jRecord = any;

/** Safe error formatter */
function formatError(e: any): string {
  try {
    if (e == null) return String(e);
    if (typeof e === "string") return e;
    if (e instanceof Error) return `${e.message}\n${e.stack ?? ""}`;
    const obj: any = {};
    Object.getOwnPropertyNames(e).forEach((k) => {
      try { obj[k] = (e as any)[k]; } catch { obj[k] = "[unavailable]"; }
    });
    return JSON.stringify(obj, null, 2);
  } catch {
    return "<unprintable error>";
  }
}

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
  if (v && typeof v.toNumber === "function") return v.toNumber();
  return v;
}

function formatSeriesFromTmdb(s: any) {
  return {
    tmdbId: s?.id,
    name: s?.name,
    poster_path: s?.poster_path,
    first_air_date: s?.first_air_date,
    overview: s?.overview,
  };
}

/** Typed TMDB helpers */
let tmdbGenreMap: Record<string, number> | null = null;

async function ensureTmdbGenreMap(): Promise<Record<string, number>> {
  if (tmdbGenreMap) return tmdbGenreMap;
  if (!TMDB_KEY) throw new Error("TMDB_API_KEY missing");
  const res = await fetch(`${TMDB_BASE}/genre/tv/list?api_key=${TMDB_KEY}&language=en-US`);
  if (!res.ok) throw new Error("Failed to fetch TMDB genres");
  const json = await res.json();
  tmdbGenreMap = {};
  for (const g of json.genres || []) {
    tmdbGenreMap[g.name.toLowerCase()] = g.id;
  }
  return tmdbGenreMap;
}

function lookupGenreId(genreMap: Record<string, number>, name?: string): number | undefined {
  if (!name) return undefined;
  const raw = String(name).trim().toLowerCase();
  if (genreMap[raw]) return genreMap[raw];

  const normalize = (s: string) => s.replace(/[^a-z]/g, "");
  const alt = normalize(raw);

  for (const key of Object.keys(genreMap)) {
    const kAlt = normalize(key);
    if (!kAlt) continue;
    if (kAlt === alt) return genreMap[key];
    if (kAlt.includes(alt) || alt.includes(kAlt)) return genreMap[key];
  }

  if (raw.includes("sci") && (genreMap["science fiction"] || genreMap["sci-fi"])) {
    return genreMap["science fiction"] || genreMap["sci-fi"];
  }
  return undefined;
}

async function fetchTmdbDiscoverByGenre(genreId: number, count = 8): Promise<any[]> {
  if (!TMDB_KEY) return [];
  const res = await fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=${genreId}&sort_by=popularity.desc&language=en-US&page=1`);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results || []).slice(0, count).map(formatSeriesFromTmdb);
}

async function fetchTmdbDetailsByTmdbId(tmdbId: string | number) {
  if (!TMDB_KEY) return null;
  const res = await fetch(`${TMDB_BASE}/tv/${tmdbId}?api_key=${TMDB_KEY}&language=en-US`);
  if (!res.ok) return null;
  const json = await res.json();
  return formatSeriesFromTmdb(json);
}

export async function GET(req: Request) {
  let session: any = null;
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.JWT_SECRET) {
      console.error("recommendations: JWT_SECRET not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("recommendations: token verify failed:", formatError(err));
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload?.userId;
    if (!userId) {
      console.warn("recommendations: token payload missing userId");
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    session = getNeo4jSession();
    if (!session) {
      console.error("recommendations: getNeo4jSession returned falsy");
      return NextResponse.json({ error: "DB connection error" }, { status: 500 });
    }

    // Sequential queries with improved scoring logic
    // Scoring: FAVORITED (10) > VIEWED (5) > Genre match (3) > Popularity fallback

    // Query 1: Find series based on user's genres (they LIKED) that they haven't interacted with
    // Plus boost from series properties like popularity
    const forYouCypher = `
      MATCH (u:User {id: $userId})-[:LIKES]->(g:Genre)<-[:HAS_GENRE]-(s:Series)
      WHERE NOT (u)-[:LIKES_SERIES]->(s) AND NOT (u)-[:VIEWED]->(s)
      WITH s, count(DISTINCT g) AS genreMatches
      RETURN s AS series, 
             genreMatches * 3 + COALESCE(s.popularity, 0) / 100 AS score
      ORDER BY score DESC, s.name ASC
      LIMIT 20
    `;

    // Query 2: Simplified collaborative filtering - find series that similar users have FAVORITED
    // Similar users = users who share genres with current user
    const similarCypher = `
      MATCH (u:User {id: $userId})-[:LIKES]->(g:Genre)<-[:LIKES]-(other:User)
      WHERE other.id <> $userId
      WITH u, other, count(DISTINCT g) AS sharedGenres
      WHERE sharedGenres >= 1
      MATCH (other)-[:LIKES_SERIES]->(s:Series)
      WHERE NOT (u)-[:LIKES_SERIES]->(s)
      WITH s, sum(sharedGenres) AS score
      RETURN s AS series, score
      ORDER BY score DESC, s.name ASC
      LIMIT 20
    `;


    // Query 3: Get user's favorited series to exclude from recommendations
    const userFavoritesCypher = `
      MATCH (u:User {id: $userId})-[:LIKES_SERIES]->(s:Series)
      RETURN s.tmdbId AS tmdbId
    `;

    // Query 4: Get user's viewed series for context
    const userViewedCypher = `
      MATCH (u:User {id: $userId})-[:VIEWED]->(s:Series)
      RETURN s.tmdbId AS tmdbId, s.name AS name
      ORDER BY s.name
      LIMIT 50
    `;

    const genresQ = `MATCH (u:User {id:$userId})-[:LIKES]->(g:Genre) RETURN g.name AS name`;

    let forYouRes: any, similarRes: any, userGenresRes: any;

    try {

      forYouRes = await session.run(forYouCypher, { userId });
      console.info("recommendations: forYou count:", forYouRes?.records?.length ?? 0);
    } catch (qerr) {
      console.error("recommendations: forYou failed:", formatError(qerr));
      throw new Error("Database query failed (forYou)");
    }

    try {
      similarRes = await session.run(similarCypher, { userId });
      console.info("recommendations: similar count:", similarRes?.records?.length ?? 0);
    } catch (qerr) {
      console.error("recommendations: similar failed:", formatError(qerr));
      throw new Error("Database query failed (similar)");
    }

    try {
      userGenresRes = await session.run(genresQ, { userId });
      console.info("recommendations: userGenres count:", userGenresRes?.records?.length ?? 0);
    } catch (qerr) {
      console.error("recommendations: userGenres failed:", formatError(qerr));
      throw new Error("Database query failed (genres read)");
    }

    async function mapNeo4jRecords(records: Neo4jRecord[]) {
      const items: any[] = [];
      for (const r of records) {
        const node = r.get("series");
        const props = node?.properties ?? node;
        if ((props.poster_path && props.poster_path !== null) || !props.tmdbId) {
          items.push({ ...props, score: neo4jValueToJs(r.get("score")) });
        } else {
          const details = await fetchTmdbDetailsByTmdbId(props.tmdbId);
          items.push({ ...(details || {}), score: neo4jValueToJs(r.get("score")), tmdbId: props.tmdbId });
        }
      }
      return items;
    }

    const forYou = await mapNeo4jRecords(forYouRes.records);
    const similarTastes = await mapNeo4jRecords(similarRes.records);
    const userGenres = (userGenresRes.records || []).map((r: any) => r.get("name")).filter(Boolean);

    // Build per-genre sections (max 4)
    const perGenreSections: Array<{ genre: string; title: string; items: any[] }> = [];
    try {
      const genreMap = await ensureTmdbGenreMap();
      const chosen = userGenres.slice(0, 4);
      const titleMap: Record<string, string> = {
        "sci-fi": "Sci-Fi to enjoy",
        "science fiction": "Sci-Fi to enjoy",
        "action": "Non-stop Action",
        "anime": "Animes on top",
        "comedy": "Laugh-out-loud comedies",
        "drama": "Dramatic picks",
        "horror": "Horror highlights",
        "fantasy": "Fantasy adventures"
      };

      for (const gname of chosen) {
        const id = lookupGenreId(genreMap, gname);
        const title = titleMap[gname.toLowerCase()] || `Top ${gname} picks`;
        if (!id) {
          perGenreSections.push({ genre: gname, title, items: [] });
        } else {
          const items = await fetchTmdbDiscoverByGenre(id, 8);
          perGenreSections.push({ genre: gname, title, items });
        }
      }
    } catch (err) {
      console.error("recommendations: building perGenreSections failed", formatError(err));
    }

    // Fallback TMDB combined discover if forYou empty
    let forYouFinal = forYou;
    if ((!forYouFinal || forYouFinal.length === 0) && userGenres.length > 0) {
      try {
        const genreMap = await ensureTmdbGenreMap();
        const ids = userGenres
          .map((g: string | undefined) => lookupGenreId(genreMap, g))
          .filter((id: any): id is number => typeof id === "number");
        console.info("recommendations: fallback ids:", ids);
        if (ids.length > 0 && TMDB_KEY) {
          const joined = ids.join(",");
          const r = await fetch(`${TMDB_BASE}/discover/tv?api_key=${TMDB_KEY}&with_genres=${joined}&sort_by=popularity.desc&language=en-US&page=1`);
          if (r.ok) {
            const j = await r.json();
            forYouFinal = (j.results || []).slice(0, 12).map(formatSeriesFromTmdb);
          }
        }
      } catch (err) {
        console.error("recommendations: fallback TMDB discover failed", formatError(err));
      }
    }

    return NextResponse.json({
      forYou: forYouFinal || [],
      similarTastes: similarTastes || [],
      perGenreSections,
      userGenres
    });
  } catch (err: any) {
    console.error("recommendations: unexpected error:", formatError(err));
    const message = process.env.NODE_ENV === "production" ? "Server error" : (err?.message || String(err));
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (session) {
      try {
        await session.close();
        console.info("recommendations: session closed");
      } catch (closeErr) {
        console.error("recommendations: failed to close session:", formatError(closeErr));
      }
    }
  }
}
