warning: in the working copy of 'src/app/page.tsx', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/src/app/api/auth/login/route.ts b/src/app/api/auth/login/route.ts[m
[1mindex b4f7471..8a55ad9 100644[m
[1m--- a/src/app/api/auth/login/route.ts[m
[1m+++ b/src/app/api/auth/login/route.ts[m
[36m@@ -1,48 +1,57 @@[m
 // src/app/api/auth/login/route.ts[m
 import { NextResponse } from "next/server";[m
[31m-import { pool } from "@/lib/db";[m
[32m+[m[32mimport { getNeo4jSession } from "@/lib/neo4j";[m
 import bcrypt from "bcrypt";[m
 import jwt from "jsonwebtoken";[m
 [m
 export async function POST(req: Request) {[m
   try {[m
     const body = await req.json();[m
[31m-    // accept username or email (client will send { username, password })[m
[31m-    const identifier = body.username ?? body.email;[m
[31m-    const password = body.password;[m
[32m+[m[32m    const identifier = (body.username ?? body.email ?? "").toString().trim();[m
[32m+[m[32m    const password = (body.password ?? "").toString();[m
 [m
     if (!identifier || !password) {[m
[31m-      return NextResponse.json([m
[31m-        { error: "Username (or email) and password are required" },[m
[31m-        { status: 400 }[m
[31m-      );[m
[32m+[m[32m      return NextResponse.json({ error: "username/email and password required" }, { status: 400 });[m
     }[m
 [m
[31m-    // Find user by email OR username[m
[31m-    const query = "SELECT * FROM users WHERE email = $1 OR username = $1";[m
[31m-    const result = await pool.query(query, [identifier]);[m
[31m-    const user = result.rows[0];[m
[32m+[m[32m    const session = getNeo4jSession();[m
[32m+[m[32m    // Try by username first, then email[m
[32m+[m[32m    const result = await session.run([m
[32m+[m[32m      `MATCH (u:User) WHERE u.username = $id OR u.email = $id RETURN u.id as id, u.username as username, u.password_hash as password_hash LIMIT 1`,[m
[32m+[m[32m      { id: identifier }[m
[32m+[m[32m    );[m
[32m+[m
[32m+[m[32m    session.close();[m
 [m
[31m-    if (!user) {[m
[32m+[m[32m    if (!result.records || result.records.length === 0) {[m
       return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });[m
     }[m
 [m
[31m-    // Compare password[m
[31m-    const isMatch = await bcrypt.compare(password, user.password_hash);[m
[31m-    if (!isMatch) {[m
[31m-      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });[m
[32m+[m[32m    const rec = result.records[0];[m
[32m+[m[32m    const userId = rec.get("id");[m
[32m+[m[32m    const username = rec.get("username");[m
[32m+[m[32m    const passwordHash = rec.get("password_hash");[m
[32m+[m
[32m+[m[32m    const isMatch = await bcrypt.compare(password, passwordHash);[m
[32m+[m[32m    if (!isMatch) return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });[m
[32m+[m
[32m+[m[32m    if (!process.env.JWT_SECRET) {[m
[32m+[m[32m      console.error("JWT_SECRET missing");[m
[32m+[m[32m      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });[m
     }[m
 [m
[31m-    // Generate JWT[m
[31m-    const token = jwt.sign([m
[31m-      { userId: user.id, username: user.username, role: user.role },[m
[31m-      process.env.JWT_SECRET!,[m
[31m-      { expiresIn: "7d" }[m
[31m-    );[m
[32m+[m[32m    const token = jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: "7d" });[m
 [m
[31m-    return NextResponse.json({ token, user: { id: user.id, username: user.username, email: user.email } });[m
[32m+[m[32m    const res = NextResponse.json({ user: { id: userId, username } });[m
[32m+[m[32m    res.cookies.set("token", token, {[m
[32m+[m[32m      httpOnly: true,[m
[32m+[m[32m      secure: process.env.NODE_ENV === "production",[m
[32m+[m[32m      path: "/",[m
[32m+[m[32m      maxAge: 7 * 24 * 3600,[m
[32m+[m[32m    });[m
[32m+[m[32m    return res;[m
   } catch (err: any) {[m
[31m-    console.error("Login API error:", err.message);[m
[31m-    return NextResponse.json({ error: "Server error" }, { status: 500 });[m
[32m+[m[32m    console.error("Login error:", err);[m
[32m+[m[32m    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });[m
   }[m
 }[m
[1mdiff --git a/src/app/api/auth/register/route.ts b/src/app/api/auth/register/route.ts[m
[1mindex be07a15..d62a9b5 100644[m
[1m--- a/src/app/api/auth/register/route.ts[m
[1m+++ b/src/app/api/auth/register/route.ts[m
[36m@@ -1,40 +1,59 @@[m
[32m+[m[32m// src/app/api/auth/register/route.ts[m
 import { NextResponse } from "next/server";[m
[31m-import { pool } from "@/lib/db";[m
[32m+[m[32mimport { getNeo4jSession } from "@/lib/neo4j";[m
 import bcrypt from "bcrypt";[m
[32m+[m[32mimport jwt from "jsonwebtoken";[m
[32m+[m[32mimport crypto from "crypto";[m
 [m
 export async function POST(req: Request) {[m
   try {[m
[31m-    const { username, email, password } = await req.json();[m
[32m+[m[32m    const body = await req.json();[m
[32m+[m[32m    const username = (body.username ?? "").toString().trim();[m
[32m+[m[32m    const password = (body.password ?? "").toString();[m
[32m+[m[32m    const email = (body.email ?? "").toString().trim();[m
 [m
[31m-    if (!username || !email || !password) {[m
[31m-      return NextResponse.json([m
[31m-        { error: "Username, email, and password are required" },[m
[31m-        { status: 400 }[m
[31m-      );[m
[32m+[m[32m    if (!username || !password) {[m
[32m+[m[32m      return NextResponse.json({ error: "username and password required" }, { status: 400 });[m
     }[m
 [m
[31m-    // Hash password[m
[31m-    const hashedPassword = await bcrypt.hash(password, 10);[m
[32m+[m[32m    const session = getNeo4jSession();[m
 [m
[31m-    // Insert into PostgreSQL[m
[31m-    const query = `[m
[31m-      INSERT INTO users (username, email, password_hash, role)[m
[31m-      VALUES ($1, $2, $3, $4)[m
[31m-      RETURNING id, username, email, role, created_at[m
[31m-    `;[m
[32m+[m[32m    // check existing username[m
[32m+[m[32m    const exists = await session.run([m
[32m+[m[32m      `MATCH (u:User {username: $username}) RETURN u LIMIT 1`,[m
[32m+[m[32m      { username }[m
[32m+[m[32m    );[m
[32m+[m[32m    if (exists.records.length > 0) {[m
[32m+[m[32m      session.close();[m
[32m+[m[32m      return NextResponse.json({ error: "Username already taken" }, { status: 409 });[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    const id = crypto.randomUUID();[m
[32m+[m[32m    const hash = await bcrypt.hash(password, 10);[m
 [m
[31m-    const result = await pool.query(query, [[m
[31m-      username,[m
[31m-      email,[m
[31m-      hashedPassword,[m
[31m-      "user",[m
[31m-    ]);[m
[32m+[m[32m    await session.run([m
[32m+[m[32m      `CREATE (u:User {id: $id, username: $username, password_hash: $hash, email: $email, createdAt: datetime()})`,[m
[32m+[m[32m      { id, username, hash, email }[m
[32m+[m[32m    );[m
[32m+[m[32m    session.close();[m
[32m+[m
[32m+[m[32m    if (!process.env.JWT_SECRET) {[m
[32m+[m[32m      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });[m
[32m+[m[32m    }[m
 [m
[31m-    const user = result.rows[0];[m
[32m+[m[32m    const token = jwt.sign({ userId: id, username }, process.env.JWT_SECRET, { expiresIn: "7d" });[m
 [m
[31m-    return NextResponse.json({ user }, { status: 201 });[m
[32m+[m[32m    const res = NextResponse.json({ user: { id, username, email } });[m
[32m+[m[32m    // set httpOnly cookie[m
[32m+[m[32m    res.cookies.set("token", token, {[m
[32m+[m[32m      httpOnly: true,[m
[32m+[m[32m      secure: process.env.NODE_ENV === "production",[m
[32m+[m[32m      path: "/",[m
[32m+[m[32m      maxAge: 7 * 24 * 3600,[m
[32m+[m[32m    });[m
[32m+[m[32m    return res;[m
   } catch (