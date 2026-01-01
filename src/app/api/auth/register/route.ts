// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { getNeo4jSession } from "@/lib/neo4j";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = (body.username ?? "").toString().trim();
    const password = (body.password ?? "").toString();
    const email = (body.email ?? "").toString().trim();

    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    const session = getNeo4jSession();

    // check existing username
    const exists = await session.run(
      `MATCH (u:User {username: $username}) RETURN u LIMIT 1`,
      { username }
    );
    if (exists.records.length > 0) {
      session.close();
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);

    await session.run(
      `CREATE (u:User {id: $id, username: $username, password_hash: $hash, email: $email, createdAt: datetime()})`,
      { id, username, hash, email }
    );
    session.close();

    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const token = jwt.sign({ userId: id, username }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const res = NextResponse.json({ user: { id, username, email } });
    // set httpOnly cookie
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });
    return res;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
