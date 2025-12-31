// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // accept username or email (client will send { username, password })
    const identifier = body.username ?? body.email;
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username (or email) and password are required" },
        { status: 400 }
      );
    }

    // Find user by email OR username
    const query = "SELECT * FROM users WHERE email = $1 OR username = $1";
    const result = await pool.query(query, [identifier]);
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err: any) {
    console.error("Login API error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
