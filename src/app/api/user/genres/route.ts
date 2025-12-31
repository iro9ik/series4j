// src/app/api/user/genres/route.ts
import { NextResponse } from "next/server";
import { getNeo4jSession } from "@/lib/neo4j";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

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
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    const { genres } = await req.json();

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
