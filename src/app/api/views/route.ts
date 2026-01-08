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

export async function POST(req: Request) {
    let session = null;
    try {
        const token = getTokenFromRequest(req);
        if (!token) return NextResponse.json({ ignored: true });

        let userId: string;
        try {
            const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
            userId = payload.userId;
        } catch {
            return NextResponse.json({ ignored: true });
        }

        const { seriesId } = await req.json();
        if (!seriesId) return NextResponse.json({ error: "Missing seriesId" }, { status: 400 });

        session = getNeo4jSession();
        await session.run(
            `MATCH (u:User {id: $userId})
             MATCH (s:Series {tmdbId: $seriesId})
             MERGE (u)-[r:VIEWED]->(s)
             SET r.at = datetime()`,
            { userId, seriesId: String(seriesId) }
        );

        return NextResponse.json({ tracked: true });
    } catch (err) {
        console.error("View tracking error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    } finally {
        if (session) await session.close();
    }
}
