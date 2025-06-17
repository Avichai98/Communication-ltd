import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

// Vulnerable version - SQL Injection and XSS possible
export async function GET() {
  try {
    // Use await with cookies() since it returns a Promise
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get session from database
    const sessions = await db.query(`SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()`, [sessionId])

    if (sessions.length === 0) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get customers
    const customers = await db.query(`SELECT * FROM customers ORDER BY created_at DESC LIMIT 10`)

    return NextResponse.json({ customers }, { status: 200 })
  } catch (error) {
    console.error("Get customers error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}

// Vulnerable version - SQL Injection and XSS possible
export async function POST(request: Request) {
  try {
    // Use await with cookies() since it returns a Promise
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get session from database
    const sessions = await db.query(`SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()`, [sessionId])

    if (sessions.length === 0) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, email, phone } = await request.json()

    // Insert customer - vulnerable to SQL injection by directly concatenating values
    const query = `INSERT INTO customers (name, email, phone) 
                 VALUES ('${name}', '${email}', '${phone}')`
    console.log(`Executing SQL query: ${query}`)

    await db.query(query)

    return NextResponse.json({ message: "Customer added successfully" }, { status: 201 })
  } catch (error) {
    console.error("Add customer error:", error)
    return NextResponse.json({ message: "An error occurred" }, { status: 500 })
  }
}
