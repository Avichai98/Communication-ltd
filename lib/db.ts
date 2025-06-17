// Add this check to prevent the module from loading in the browser
if (typeof window !== "undefined") {
  throw new Error("This module is server-side only")
}

import mysql from "mysql2/promise"

// Create a connection pool
let pool: mysql.Pool

// Initialize the pool
function getPool() {
  if (!pool) {
    console.log("Creating new database connection pool")

    // SSL configuration based on environment variable
    let sslConfig = {}

    if (process.env.DB_CA_CERT) {
      console.log("Using SSL certificate from environment variable")
      // Decode the Base64-encoded certificate
      const certBuffer = Buffer.from(process.env.DB_CA_CERT, "base64")

      sslConfig = {
        ssl: {
          ca: certBuffer,
        },
      }
    } else {
      console.log("No SSL certificate found in environment variables")
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      ...sslConfig,
    })

  }
  return pool
}

// Database helper functions
export const db = {
  // Vulnerable query function (for demonstration)
  async query(sql: string, params?: any[]) {
    try {
      const pool = getPool()
      if (params) {
        const [rows] = await pool.execute(sql, params)
        return rows as any[]
      } else {
        // Vulnerable to SQL injection when used without parameters
        const [rows] = await pool.query(sql)
        return rows as any[]
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  },

  // Secure query function (for fixed version)
  async secureQuery(sql: string, params: any[] = []) {
    try {
      const pool = getPool()
      const [rows] = await pool.execute(sql, params)
      return rows as any[]
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  },
}

// Update the initializeDatabase function to be more robust
export async function initializeDatabase() {
  try {
    console.log("Initializing database...")

    // Test connection first
    try {
      await db.query("SELECT 1")
      console.log("Database connection successful")
    } catch (error) {
      console.error("Database connection failed:", error)
      throw new Error("Failed to connect to database. Check your environment variables.")
    }

    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(1000) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Users table created or already exists")

    // Create sessions table
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id INT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log("Sessions table created or already exists")

    // Create password_resets table
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        user_id INT PRIMARY KEY,
        token VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log("Password resets table created or already exists")

    // Create password_history table
    await db.query(`
      CREATE TABLE IF NOT EXISTS password_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
    console.log("Password history table created or already exists")

    // Create login_attempts table
    await db.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        username VARCHAR(1000) PRIMARY KEY,
        attempts INT DEFAULT 1,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Login attempts table created or already exists")

    // Create customers table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(1000) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Customers table created or already exists")

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}
