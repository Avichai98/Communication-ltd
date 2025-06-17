import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    await initializeDatabase()
    return NextResponse.json({ message: "Database initialized successfully" }, { status: 200 })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      { message: "Failed to initialize database", error: (error as Error).message },
      { status: 500 },
    )
  }
}
