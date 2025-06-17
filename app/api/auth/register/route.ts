import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { validatePassword } from "@/lib/password-config"

// Vulnerable version - SQL Injection possible
export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    // Validate password against configuration
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ message: passwordValidation.message }, { status: 400 })
    }

    // Vulnerable to SQL injection - directly concatenating user input into the query
    const query = `SELECT * FROM users WHERE username = '${username}' OR email = '${email}'`
    console.log(`Executing SQL query: ${query}`)

    // Check if user already exists
    const existingUser = await db.query(query)
    console.log(`Existing user found: ${existingUser}`)

    if (existingUser.length > 0) {
      return NextResponse.json({ message: "Username or email already exists" }, { status: 400 })
    }

    // Hash password with HMAC + Salt
    const { hash, salt } = await hashPassword(password)

    // Insert new user - also vulnerable to SQL injection
    const insertQuery = `INSERT INTO users (username, email, password_hash, salt) 
                         VALUES ('${username}', '${email}', '${hash}', '${salt}')`
    console.log(`Executing SQL query: ${insertQuery}`)

    await db.query(insertQuery)

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return NextResponse.json(
      {
        message: "An error occurred during registration",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
