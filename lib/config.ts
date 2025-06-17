/**
 * Configuration utilities for the application
 */

/**
 * Get the base URL of the application based on the environment
 *
 * @returns The base URL of the application
 */
export function getAppUrl(): string {
  // First try the public URL (for production), then local URL (for development)
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

/**
 * Get the full URL for a specific path
 *
 * @param path - The path to append to the base URL
 * @returns The full URL
 */
export function getFullUrl(path: string): string {
  const baseUrl = getAppUrl()
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}
