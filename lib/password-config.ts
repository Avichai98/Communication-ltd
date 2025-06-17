/**
 * Password Configuration
 *
 * This module defines the password policy requirements and provides
 * functions to validate passwords against these requirements.
 */

// Default configuration
const defaultConfig = {
  minLength: 10, // Minimum password length
  requireUppercase: true, // Require at least one uppercase letter
  requireLowercase: true, // Require at least one lowercase letter
  requireNumbers: true, // Require at least one number
  requireSpecialChars: true, // Require at least one special character
  historyCount: 3, // Number of previous passwords to remember
  maxLoginAttempts: 3, // Maximum failed login attempts before lockout
  // Dictionary of common passwords to prevent
  dictionary: [
    "Password123!",    // Meets complexity rules but is extremely common and predictable
    "Welcome123@",     // Looks strong but often used as a default company password
    "Admin2024!",      // Typical for admin accounts; easy for attackers to guess
    "Qwerty123$",      // Based on keyboard layout; predictable and often used
    "LetMeIn123!",     // Phrase-like password that's surprisingly common in breaches
    "Summer2024#",     // Seasonal passwords are widely used and guessed
    "IloveYou1!",      // Emotional and guessable; found in many real-world leaks
    "Dragon123$",      // A fantasy-related word that appears frequently in password dumps
    "Football7@",      // Sports-based passwords are extremely popular globally
    "Monkey123!"       // Animal-based and seen in many leaked credentials
  ],
}

/**
 * Get password configuration
 * In a production environment, this would load from a secure configuration source
 */
export function getPasswordConfig() {
  try {
    // In a real application, this would read from a config file or database
    return defaultConfig
  } catch (error) {
    console.error("Error reading password config:", error)
    return defaultConfig
  }
}

/**
 * Validate a password against the password policy
 *
 * @param password - The password to validate
 * @returns Object containing validation result and message
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  const config = getPasswordConfig()

  // Check length
  if (password.length < config.minLength) {
    return {
      valid: false,
      message: `Password must be at least ${config.minLength} characters long`,
    }
  }

  // Check for uppercase letters
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    }
  }

  // Check for lowercase letters
  if (config.requireLowercase && !/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    }
  }

  // Check for numbers
  if (config.requireNumbers && !/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    }
  }

  // Check for special characters
  if (config.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character",
    }
  }

  // Check against dictionary
  if (config.dictionary.includes(password.toLowerCase())) {
    return {
      valid: false,
      message: "Password is too common and easily guessable",
    }
  }

  return { valid: true, message: "Password is valid" }
}
