// src/app/api/user/genres/route.ts
import { NextResponse } from "next/server";
import { getNeo4jSession } from "@/lib/neo4j";
import jwt from "jsonwebtoken";

function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  let token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) {
    const cookie = req.headers.get("cookie") || "";
    for (const part of cookie.split(";")) {
      const [k, v] = part.trim().split("=");
      if (k === "token") token = decodeURIComponent(v || "");
    }
  }
  return token;
}

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      console.error("Invalid token in GET /api/user/genres:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const session = getNeo4jSession();
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:LIKES]->(g:Genre)
       RETURN g.name as name`,
      { userId: payload.userId }
    );

    session.close();

    const genres = result.records.map((r) => r.get("name"));
    return NextResponse.json({ genres });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      console.error("Invalid token in POST /api/user/genres:", err);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { genres } = await req.json();
    if (!Array.isArray(genres)) {
      return NextResponse.json({ error: "Invalid genres payload" }, { status: 400 });
    }

    const session = getNeo4jSession();

    // Create relationships for user
    for (const genre of genres) {
      await session.run(
        `MERGE (u:User {id: $userId})
         MERGE (g:Genre {name: $genre})
         MERGE (u)-[:LIKES]->(g)`,
        { userId: payload.userId, genre }
      );
    }

    session.close();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
