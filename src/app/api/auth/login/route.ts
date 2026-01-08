// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { getNeo4jSession } from "@/lib/neo4j";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.username ?? body.email ?? "").toString().trim();
    const password = (body.password ?? "").toString();

    if (!identifier || !password) {
      return NextResponse.json({ error: "username/email and password required" }, { status: 400 });
    }

    const session = getNeo4jSession();
    // Try by username first, then email
    const result = await session.run(
      `MATCH (u:User) WHERE u.username = $id OR u.email = $id RETURN u.id as id, u.username as username, u.password_hash as password_hash LIMIT 1`,
      { id: identifier }
    );

    session.close();

    if (!result.records || result.records.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const rec = result.records[0];
    const userId = rec.get("id");
    const username = rec.get("username");
    const passwordHash = rec.get("password_hash");

    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const res = NextResponse.json({ user: { id: userId, username } });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });
    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
