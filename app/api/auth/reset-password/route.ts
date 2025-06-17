import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { validatePassword } from "@/lib/password-config"
import { checkPasswordHistory } from "@/lib/password-history"

export async function POST(request: Request) {
  try {
    const { email, token, password } = await request.json()
    console.log(`Reset password request for email: ${email}`)

    // Validate password against configuration
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      console.log(`Password validation failed: ${passwordValidation.message}`)
      return NextResponse.json({ message: passwordValidation.message }, { status: 400 })
    }

    // Get user by email
    const users = await db.query(`SELECT * FROM users WHERE email = ?`, [email])

    if (users.length === 0) {
      console.log(`User not found for email: ${email}`)
      return NextResponse.json({ message: "Invalid token" }, { status: 400 })
    }

    const user = users[0]
    console.log(`User found with ID: ${user.id}`)

    // Check if token exists and is valid
    const resets = await db.query(
      `SELECT * FROM password_resets 
       WHERE user_id = ? AND token = ? AND expires_at > NOW()`,
      [user.id, token],
    )

    if (resets.length === 0) {
      console.log(`Invalid or expired token for user ID: ${user.id}`)
      return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 })
    }

    console.log(`Valid token found for user ID: ${user.id}`)

    // Check password history
    try {
      const historyCheck = await checkPasswordHistory(user.id, password)
      if (!historyCheck.allowed) {
        console.log(`Password history check failed: ${historyCheck.message}`)
        return NextResponse.json({ message: historyCheck.message }, { status: 400 })
      }
      console.log(`Password history check passed`)
    } catch (error) {
      console.error("Error checking password history:", error)
      // Continue with password reset even if history check fails
    }

    // Hash new password
    const { hash, salt } = await hashPassword(password)
    console.log(`New password hashed`)

    // Update user password
    await db.query(`UPDATE users SET password_hash = ?, salt = ? WHERE id = ?`, [hash, salt, user.id])
    console.log(`User password updated`)

    // Add to password history
    try {
      await db.query(
        `INSERT INTO password_history (user_id, password_hash, salt) 
         VALUES (?, ?, ?)`,
        [user.id, hash, salt],
      )
      console.log(`Password added to history`)
    } catch (error) {
      console.error("Error adding to password history:", error)
      // Continue with password reset even if adding to history fails
    }

    // Delete reset token
    await db.query(`DELETE FROM password_resets WHERE user_id = ?`, [user.id])
    console.log(`Reset token deleted`)

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 })
  } catch (error) {
    console.error("Reset password error:", error)
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
