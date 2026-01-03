/**
 * Authentication utility functions
 * 
 * SECURITY NOTE: Auth bypass should ONLY be enabled via explicit DISABLE_AUTH flag.
 * Never automatically bypass auth based on NODE_ENV to prevent accidental security vulnerabilities.
 */

/**
 * Checks if authentication should be bypassed.
 * 
 * This should ONLY return true when explicitly set via DISABLE_AUTH environment variable.
 * Defaults to false for security.
 * 
 * @returns true if auth should be bypassed, false otherwise
 */
export function shouldBypassAuth(): boolean {
  // Only bypass auth if explicitly disabled via environment variable
  // Defaults to false (auth required) for security
  return process.env.DISABLE_AUTH === 'true';
}

/**
 * Validates authentication cookie.
 * 
 * @param cookie - Cookie header string
 * @returns true if authenticated, false otherwise
 */
export function checkAuth(cookie: string | undefined): boolean {
  if (!cookie) return false;
  // Only accept eventra_auth=1 value (strict pattern for security)
  return /(?:^|;\s*)eventra_auth\s*=\s*1(?:\s*;|$)/.test(cookie);
}

/**
 * Validates authentication and returns appropriate response if unauthorized.
 * 
 * @param cookie - Cookie header string
 * @returns NextResponse with 401 status if unauthorized, null if authorized
 */
export function validateAuth(cookie: string | undefined): { error: string; message: string; status: number } | null {
  // Bypass auth check if explicitly disabled (development/testing only)
  if (shouldBypassAuth()) {
    return null;
  }

  if (!checkAuth(cookie)) {
    return {
      error: 'Unauthorized',
      message: 'Lütfen giriş yapın',
      status: 401,
    };
  }

  return null;
}




