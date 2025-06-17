import { initializeDatabase } from "@/lib/db"

// This is a Server Component that will run only on the server
export async function DbInitializer() {
  try {
    // This code only runs on the server
    await initializeDatabase()
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Failed to initialize database:", error)
  }

  // Return null as this component doesn't render anything
  return null
}
