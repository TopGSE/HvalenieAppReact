// API URL configuration
let API_URL = '';

if (import.meta.env.VITE_API_URL) {
  // Use environment variable if provided
  API_URL = import.meta.env.VITE_API_URL;
} else {
  // Otherwise detect if we're in production
  const isProduction = import.meta.env.PROD;
  if (!isProduction) {
    // Only in development, use localhost
    API_URL = "http://localhost:5000";
  }
  // In production, API_URL remains empty string for relative URLs
}

console.log(`Using API URL: ${API_URL || '[relative URLs in production]'}`);

export default API_URL;