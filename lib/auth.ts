/**
 * Authentication Module
 *
 * This module handles user authentication, password hashing,
 * session management, and password reset functionality.
 */

import crypto from "crypto"
import { db } from "./db"
import { sendEmail } from "./email"

/**
 * Generate a random salt for password hashing
 *
 * @param length - Length of the salt in bytes
 * @returns Hexadecimal string representation of the salt
 */
export function generateSalt(length = 16): string {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Hash a password using HMAC + Salt
 *
 * @param password - The plaintext password to hash
 * @returns Object containing the hash and salt
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt()
  const hash = crypto.createHmac("sha256", salt).update(password).digest("hex")
  return { hash, salt }
}

/**
 * Verify a password against a stored hash and salt
 *
 * @param password - The plaintext password to verify
 * @param storedHash - The stored hash to compare against
 * @param salt - The salt used for the stored hash
 * @returns Boolean indicating if the password is valid
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const hash = crypto.createHmac("sha256", salt).update(password).digest("hex")
  return hash === storedHash
}

/**
 * Generate a random session ID
 *
 * @returns Hexadecimal string representation of the session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Create a new session for a user
 *
 * @param userId - The user's ID
 * @returns The generated session ID
 */
export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId()

  // Set expiration to 24 hours from now
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  await db.query(
    `INSERT INTO sessions (id, user_id, expires_at) 
     VALUES (?, ?, ?)`,
    [sessionId, userId, expiresAt],
  )

  return sessionId
}

/**
 * Generate a reset token using SHA-1 (as required in project spec)
 *
 * @param userId - The user's ID
 * @returns The generated reset token
 */
export async function generateResetToken(userId: number): Promise<string> {
  const randomString = crypto.randomBytes(20).toString("hex")
  const timestamp = new Date().getTime().toString()
  const data = `${userId}-${randomString}-${timestamp}`

  // Use SHA-1 as required in the project spec
  return crypto.createHash("sha1").update(data).digest("hex")
}

/**
 * Send a password reset email to the user
 *
 * @param email - The user's email address
 * @param token - The reset token
 */
export async function sendResetEmail(email: string, token: string): Promise<void> {
  try {
    // Get the app URL from environment variables, with a fallback to the Vercel deployment URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    console.log(`Using app URL: ${appUrl}`)

    // Determine if we're in secure or insecure mode based on the email
    // This is a simple heuristic - in a real app, you'd track this in the database
    const mode = email.includes("secure") ? "secure" : "insecure"

    const resetUrl = `${appUrl}/${mode}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`

    const subject = "Password Reset - Communication_LTD"

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Communication_LTD account.</p>
        <p>Please use the following token to reset your password:</p>
        <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; margin: 15px 0; font-family: monospace; font-size: 18px;">
          ${token}
        </div>
        <p>Or click the button below to reset your password directly:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 15px 0;">Reset Password</a>
        <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
        <p>This token will expire in 1 hour.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">Communication_LTD - Your trusted internet provider</p>
      </div>
    `

    // Log for debugging
    console.log(`Sending reset token to ${email}: ${token}`)
    console.log(`Reset URL: ${resetUrl}`)

    // Send the actual email
    await sendEmail(email, subject, html)
  } catch (error) {
    console.error("Error sending reset email:", error)
    throw error
  }
}
