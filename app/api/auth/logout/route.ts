import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // Use await with cookies() since it returns a Promise
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (sessionId) {
      // Delete session from database
      await db.query(`DELETE FROM sessions WHERE id = ?`, [sessionId])

      // Clear session cookie
      cookieStore.delete("session_id")
    }

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
