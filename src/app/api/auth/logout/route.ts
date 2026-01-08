// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  // Clear cookie
  res.cookies.set("token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return res;
}
