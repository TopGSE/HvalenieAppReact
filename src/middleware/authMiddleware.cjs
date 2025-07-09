const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

module.exports = (req, res, next) => {
  // Add detailed logging
  console.log('Auth Middleware Called:', req.method, req.path);
  console.log('Headers:', JSON.stringify(req.headers));

  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('No Authorization header found');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Check if the Authorization header has the right format
  if (!authHeader.startsWith('Bearer ')) {
    console.log('Invalid Authorization header format');
    return res.status(401).json({ message: 'Invalid token format' });
  }

  // Extract the token without the 'Bearer ' prefix
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    console.log('No token found in Authorization header');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach the user information to the request
    req.user = decoded;
    
    console.log('Token verified successfully. User ID:', decoded.userId);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};