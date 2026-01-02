/**
 * Admin Authentication Utilities
 * Simple password-based admin authentication with session token management
 *
 * Session storage: In-memory Set (resets on server restart)
 * Security: HTTP-only, Secure, SameSite cookies
 */

// In-memory session store (resets on server restart)
const validSessions = new Set<string>();

/**
 * Validate admin password against environment variable
 */
export function validateAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set");
    return false;
  }

  return password === adminPassword;
}

/**
 * Create new admin session
 * Generates a random session token and stores it in the valid sessions Set
 */
export function createAdminSession(): string {
  const token = crypto.randomUUID();
  validSessions.add(token);
  return token;
}

/**
 * Clear admin session
 * Removes the session token from the valid sessions Set
 */
export function clearAdminSession(token: string): void {
  validSessions.delete(token);
}

/**
 * Check if a session token is valid
 */
export function isAdminAuthenticated(token: string | undefined): boolean {
  if (!token) return false;
  return validSessions.has(token);
}

/**
 * Get all valid session tokens (for debugging/admin purposes)
 */
export function getActiveSessions(): number {
  return validSessions.size;
}
