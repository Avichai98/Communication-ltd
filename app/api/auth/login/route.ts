import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { verifyPassword, createSession } from "@/lib/auth"
import { incrementLoginAttempt, checkLoginAttempts } from "@/lib/login-attempts"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    console.log(`Login attempt with username: ${username}`)

    // Check login attempts
    const attemptsCheck = await checkLoginAttempts(username)
    if (!attemptsCheck.allowed) {
      return NextResponse.json({ message: attemptsCheck.message }, { status: 429 })
    }

    // Vulnerable to SQL injection - directly concatenating user input into the query
    const query = `SELECT * FROM users WHERE username = '${username}'`
    console.log(`Executing SQL query: ${query}`)

    // Get user from database
    let users = []
    try {
      users = await db.query(query)
    } catch (error) {
      console.error("Database error:", error)
      return NextResponse.json({ message: "Invalid username or password" }, { status: 401 })
    }

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

    // Create session
    const sessionId = await createSession(user.id)

    // Create response with cookie
    const response = NextResponse.json({ message: "Login successful" }, { status: 200 })

    // Set cookie using the cookies() API
    const cookieStore = await cookies()
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "An error occurred during login" }, { status: 500 })
  }
}
