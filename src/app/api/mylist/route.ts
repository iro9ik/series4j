// src/app/api/mylist/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromToken(req);
    const result = await db.query("SELECT series_id FROM mylist WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    return NextResponse.json(result.rows);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromToken(req);
    const { series_id } = await req.json();
    if (!series_id) return NextResponse.json({ error: "series_id is required" }, { status: 400 });

    const exists = await db.query("SELECT id FROM mylist WHERE user_id=$1 AND series_id=$2", [userId, series_id]);
    if (exists.rowCount != null && exists.rowCount > 0) {
      await db.query("DELETE FROM mylist WHERE user_id=$1 AND series_id=$2", [userId, series_id]);
      return NextResponse.json({ inList: false });
    } else {
      await db.query("INSERT INTO mylist(user_id, series_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [userId, series_id]);
      return NextResponse.json({ inList: true });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
