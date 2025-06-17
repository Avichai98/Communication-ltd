import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"
import { incrementLoginAttempt, checkLoginAttempts, resetLoginAttempts } from "@/lib/login-attempts"

// Secure version - Protected against SQL Injection
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    console.log(`Secure login attempt with username: ${username}`)

    // Check login attempts
    const attemptsCheck = await checkLoginAttempts(username)
    if (!attemptsCheck.allowed) {
      return NextResponse.json({ message: attemptsCheck.message }, { status: 429 })
    }

    // Get user from database - using parameterized query
    const users = await db.secureQuery(`SELECT * FROM users WHERE username = ?`, [username])

    if (users.length === 0) {
      await incrementLoginAttempt(username)
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash, user.salt)

    if (!isValid) {
      await incrementLoginAttempt(username)
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(username)

    // Create session
    const sessionId = await createSession(user.id)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })

    return NextResponse.json({ message: "Login successful" }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}
