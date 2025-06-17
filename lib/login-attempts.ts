import { db } from "./db"
import { getPasswordConfig } from "./password-config"

// Check login attempts
export async function checkLoginAttempts(username: string): Promise<{ allowed: boolean; message: string }> {
  const config = getPasswordConfig()

  // Get login attempts
  const attempts = await db.query(`SELECT * FROM login_attempts WHERE username = ?`, [username])

  if (attempts.length > 0) {
    const attempt = attempts[0]

    // Check if max attempts reached
    if (attempt.attempts >= config.maxLoginAttempts) {
      // Check if it's been at least 30 minutes since last attempt
      const lastAttempt = new Date(attempt.last_attempt)
      const now = new Date()
      const diffMinutes = (now.getTime() - lastAttempt.getTime()) / (1000 * 60)

      if (diffMinutes < 30) {
        return {
          allowed: false,
          message: `Too many failed login attempts. Please try again later.`,
        }
      } else {
        // Reset attempts after 30 minutes
        await db.query(`UPDATE login_attempts SET attempts = 1, last_attempt = NOW() WHERE username = ?`, [username])
      }
    }
  }

  return { allowed: true, message: "Login allowed" }
}

// Increment login attempt
export async function incrementLoginAttempt(username: string): Promise<void> {
  // Check if username exists in login_attempts
  const attempts = await db.query(`SELECT * FROM login_attempts WHERE username = ?`, [username])

  if (attempts.length > 0) {
    // Increment attempts
    await db.query(`UPDATE login_attempts SET attempts = attempts + 1, last_attempt = NOW() WHERE username = ?`, [
      username,
    ])
  } else {
    // Create new entry
    await db.query(`INSERT INTO login_attempts (username, attempts, last_attempt) VALUES (?, 1, NOW())`, [username])
  }
}

// Reset login attempts
export async function resetLoginAttempts(username: string): Promise<void> {
  await db.query(`DELETE FROM login_attempts WHERE username = ?`, [username])
}
