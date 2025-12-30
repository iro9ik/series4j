import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into PostgreSQL
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;

    const result = await pool.query(query, [
      username,
      email,
      hashedPassword,
      "user",
    ]);

    const user = result.rows[0];

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error("Register API error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
