// src/app/api/mylist/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

async function getUserIdFromToken(req: Request) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  if (!token) throw new Error("Unauthorized");
  const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
  return payload.userId;
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
