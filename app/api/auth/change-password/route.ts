import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { validatePassword } from "@/lib/password-config"
import { checkPasswordHistory } from "@/lib/password-history"

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()
    console.log("Change password request received")

    // Get session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      console.log("No session ID found in cookies")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("Session ID found:", sessionId)

    // Get user from session
    const sessions = await db.query(
      `SELECT s.*, u.id as user_id, u.password_hash, u.salt 
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > NOW()`,
      [sessionId],
    )

    if (sessions.length === 0) {
      console.log("No valid session found in database")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const session = sessions[0]
    const userId = session.user_id
    console.log("User ID from session:", userId)

    // Verify current password
    const isValid = await verifyPassword(currentPassword, session.password_hash, session.salt)

    if (!isValid) {
      console.log("Current password verification failed")
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 })
    }

    console.log("Current password verified successfully")

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      console.log("New password validation failed:", passwordValidation.message)
      return NextResponse.json({ message: passwordValidation.message }, { status: 400 })
    }

    console.log("New password validation passed")

    // Check password history
    const historyCheck = await checkPasswordHistory(userId, newPassword)
    if (!historyCheck.allowed) {
      console.log("Password history check failed:", historyCheck.message)
      return NextResponse.json({ message: historyCheck.message }, { status: 400 })
    }

    console.log("Password history check passed")

    // Hash new password
    const { hash, salt } = await hashPassword(newPassword)

    // Update user password
    const oldPasswordHash = session.password_hash
    const oldSalt = session.salt

    await db.query(`UPDATE users SET password_hash = ?, salt = ? WHERE id = ?`, [hash, salt, userId])
    console.log("User password updated in database")

    // Add to password history
    await db.query(
      `INSERT INTO password_history (user_id, password_hash, salt) 
       VALUES (?, ?, ?)`,
      [userId, oldPasswordHash, oldSalt],
    )
    console.log("Password added to history")

    return NextResponse.json({ message: "Password changed successfully" }, { status: 200 })
  } catch (error) {
    console.error("Change password error:", error)
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack)
    }
    return NextResponse.json(
      {
        message: "An error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
