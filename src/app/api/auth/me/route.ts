// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getNeo4jSession } from "@/lib/neo4j";
import jwt from "jsonwebtoken";

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

export async function GET(req: Request) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!process.env.JWT_SECRET) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    let payload: any;
    try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch (e) { return NextResponse.json({ error: "Invalid token" }, { status: 401 }); }

    const session = getNeo4jSession();
    const result = await session.run(`MATCH (u:User {id: $userId}) RETURN u.username as username, u.email as email`, { userId: payload.userId });
    session.close();

    if (!result.records || result.records.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const rec = result.records[0];
    return NextResponse.json({ id: payload.userId, username: rec.get("username"), email: rec.get("email") });
  } catch (err: any) {
    console.error("me error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
