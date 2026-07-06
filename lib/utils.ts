/**
 * Get the base URL for redirects based on environment
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  if (typeof window !== 'undefined') {
    // Client-side, use current origin
    return window.location.origin;
  }
  
  // Server-side, default to localhost for dev, or require NEXT_PUBLIC_APP_URL in prod
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // If no NEXT_PUBLIC_APP_URL in production, throw an error? Or default?
  // For now, let's just return localhost, but in real production, you should set NEXT_PUBLIC_APP_URL
  return 'http://localhost:3000';
}
