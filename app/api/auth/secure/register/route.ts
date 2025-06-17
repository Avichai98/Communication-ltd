import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { validatePassword } from "@/lib/password-config"

// Secure version - Protected against SQL Injection
export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validate password against configuration
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ message: passwordValidation.message }, { status: 400 })
    }

    // Check if user already exists - using parameterized query
    const existingUser = await db.secureQuery(`SELECT * FROM users WHERE username = ? OR email = ?`, [username, email])

    if (existingUser.length > 0) {
      return NextResponse.json({ message: "Username or email already exists" }, { status: 400 })
    }

    // Hash password with HMAC + Salt
    const { hash, salt } = await hashPassword(password)

    // Insert new user - using parameterized query
    await db.secureQuery(
      `INSERT INTO users (username, email, password_hash, salt) 
       VALUES (?, ?, ?, ?)`,
      [username, email, hash, salt],
    )

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}
