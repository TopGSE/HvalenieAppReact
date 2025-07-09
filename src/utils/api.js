// API URL configuration
let API_URL = import.meta.env.VITE_API_URL;

// If no API URL is set in environment variables, detect if we're in production
if (!API_URL) {
  const isProduction = import.meta.env.PROD;
  API_URL = isProduction 
    ? "" // Empty string for relative URLs in production (same domain)
    : "http://localhost:5000";
  
  console.log(`Using ${isProduction ? 'production' : 'development'} API URL: ${API_URL}`);
}

export default API_URL;