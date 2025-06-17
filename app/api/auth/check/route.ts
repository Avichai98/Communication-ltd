import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Use await with cookies() since it returns a Promise
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get session from database
    const sessions = await db.query(
      `SELECT s.*, u.username 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > NOW()`,
      [sessionId],
    )

    if (sessions.length === 0) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = sessions[0]

    return NextResponse.json(
      {
        user: {
          id: session.user_id,
          username: session.username,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
