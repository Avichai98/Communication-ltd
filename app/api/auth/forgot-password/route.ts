import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateResetToken, sendResetEmail } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log(`Forgot password request for email: ${email}`)

    // Check if user exists
    const users = await db.query(`SELECT * FROM users WHERE email = ?`, [email])

    if (users.length === 0) {
      // Don't reveal that the email doesn't exist for security
      console.log(`Email not found: ${email}`)
      return NextResponse.json({ message: "If your email exists, a reset token has been sent" }, { status: 200 })
    }

    const user = users[0]
    console.log(`User found with ID: ${user.id}`)

    try {
      // Generate reset token using SHA-1
      const token = await generateResetToken(user.id)
      console.log(`Generated token: ${token}`)

      // Store token in database
      await db.query(
        `INSERT INTO password_resets (user_id, token, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
         ON DUPLICATE KEY UPDATE token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)`,
        [user.id, token, token],
      )
      console.log(`Token stored in database for user ID: ${user.id}`)

      // Send email with token
      await sendResetEmail(email, token)
      console.log(`Reset email sent to: ${email}`)

      return NextResponse.json({ message: "If your email exists, a reset token has been sent" }, { status: 200 })
    } catch (error) {
      console.error("Error in token generation or email sending:", error)
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack)
      }
      throw error
    }
  } catch (error) {
    console.error("Forgot password error:", error)
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
