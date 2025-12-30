import { db } from "@/lib/db";

export async function GET() {
  try {
    const userId = "mock-user-id"; // replace with real auth later

    const result = await db.query(
      "SELECT series_id FROM favorites WHERE user_id = $1",
      [userId]
    );

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Failed to fetch favorites" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
