/**
 * Password History Management
 *
 * This module handles checking if a new password has been used before
 * by the user, preventing password reuse.
 */

import { db } from "./db"
import { verifyPassword } from "./auth"
import { getPasswordConfig } from "./password-config"

/**
 * Check if a password has been used before by the user
 *
 * @param userId - The user's ID
 * @param newPassword - The new password to check
 * @returns Object containing whether the password is allowed and a message
 */
export async function checkPasswordHistory(
  userId: number,
  newPassword: string,
): Promise<{ allowed: boolean; message: string }> {
  const config = getPasswordConfig()

  // Get password history - using a number for LIMIT parameter
  // Convert the LIMIT parameter to a number to avoid MySQL prepared statement issues
  const historyLimit = Number(config.historyCount)

  // Get the user's password history
  const history = await db.query(
    `SELECT password_hash, salt FROM password_history 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ${historyLimit}`, // Use string interpolation for LIMIT
    [userId],
  )

  // Check against current password too
  const currentPassword = await db.query(`SELECT password_hash, salt FROM users WHERE id = ?`, [userId])

  if (currentPassword.length > 0) {
    const current = currentPassword[0]
    const isCurrentPassword = await verifyPassword(newPassword, current.password_hash, current.salt)

    if (isCurrentPassword) {
      return {
        allowed: false,
        message: "New password cannot be the same as your current password",
      }
    }
  }

  // Check against password history
  for (const entry of history) {
    const isInHistory = await verifyPassword(newPassword, entry.password_hash, entry.salt)

    if (isInHistory) {
      return {
        allowed: false,
        message: `Password has been used recently. Please choose a different password.`,
      }
    }
  }

  return { allowed: true, message: "Password is allowed" }
}
