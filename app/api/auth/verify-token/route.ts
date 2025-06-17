import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json()

    // Get user by email
    const users = await db.query(`SELECT * FROM users WHERE email = ?`, [email])

    if (users.length === 0) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 })
    }

    const user = users[0]

    // Check if token exists and is valid
    const resets = await db.query(
      `SELECT * FROM password_resets 
       WHERE user_id = ? AND token = ? AND expires_at > NOW()`,
      [user.id, token],
    )

    if (resets.length === 0) {
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 })
    }

    return NextResponse.json({ message: "Token verified" }, { status: 200 })
  } catch (error) {
    console.error("Verify token error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
