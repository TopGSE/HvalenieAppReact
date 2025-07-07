const API_URL = process.env.NODE_ENV === 'production' 
  ? '' // In production, use relative URLs
  : 'http://localhost:5000';

export default API_URL;