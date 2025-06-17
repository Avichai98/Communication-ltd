import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

// Secure version - Protected against SQL Injection and XSS
export async function GET() {
  try {
    // Use await with cookies() since it returns a Promise
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get session from database - using parameterized query
    const sessions = await db.secureQuery(`SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()`, [sessionId])

    if (sessions.length === 0) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get customers - using parameterized query
    const customers = await db.secureQuery(`SELECT * FROM customers ORDER BY created_at DESC LIMIT 10`)

    return NextResponse.json({ customers }, { status: 200 })
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Use await with cookies() since it returns a Promise
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get session from database - using parameterized query
    const sessions = await db.secureQuery(`SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()`, [sessionId])

    if (sessions.length === 0) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, email, phone } = await request.json()

     // Input validation
    if (!name || !email || !phone) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }
    
    // Insert customer - using parameterized query to prevent SQL injection
     // No need to manually encode HTML - React will handle XSS protection when displaying
    await db.secureQuery(
      `INSERT INTO customers (name, email, phone) 
      VALUES (?, ?, ?)`,
      [name, email, phone],
    )

    return NextResponse.json({ message: "Customer added successfully" }, { status: 201 })
  } catch (error) {
    console.error("Add customer error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}

// Helper function to encode HTML and prevent XSS
function encodeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
