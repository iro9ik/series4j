// src/lib/auth.ts
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return auth.split(" ")[1];
  }
  const cookie = req.headers.get("cookie") || "";
  // simple parse
  for (const part of cookie.split(";")) {
    const [k, v] = part.trim().split("=");
    if (k === "token") return decodeURIComponent(v || "");
  }
  return null;
}

export function verifyToken(token: string) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set");
  return jwt.verify(token, process.env.JWT_SECRET);
}
