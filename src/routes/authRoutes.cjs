const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const authMiddleware = require('../middleware/authMiddleware.cjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

router.post('/register', async (req, res) => {
  console.log('Register request received:', req.body);
  const { username, email, password, role } = req.body;
  try {
    // Only allow role to be set if explicitly provided by an admin (you'd need to implement admin checks)
    // For now, default to 'reader' regardless of what's sent
    const user = new User({ username, email, password, role: 'reader' });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyValue)[0];
      res.status(400).json({ message: `The ${field} is already in use.` });
    } else {
      res.status(400).json({ message: err.message });
    }
  }
});

// Enhanced login endpoint that handles remember me
router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password, rememberMe } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Clean up expired refresh tokens
    user.removeExpiredRefreshTokens();
    
    // Generate access token
    const token = jwt.sign({ 
      userId: user._id,
      role: user.role 
    }, JWT_SECRET, { expiresIn: '1h' });
    
    // If remember me is checked, generate and store a refresh token
    let refreshToken = null;
    if (rememberMe) {
      const refreshTokenObj = user.generateRefreshToken();
      refreshToken = refreshTokenObj.token;
      await user.save();
    }
    
    // Response with or without refresh token
    const response = { 
      token, 
      username: user.username,
      role: user.role
    };
    
    if (refreshToken) {
      response.refreshToken = refreshToken;
    }
    
    res.json(response);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add an endpoint to make a user an admin (protected, only for development/initial setup)
router.post('/make-admin', async (req, res) => {
  const { userId, secretKey } = req.body;
  
  // Simple secret key check (replace with better security in production)
  if (secretKey !== 'your_secret_admin_key') {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = 'admin';
    await user.save();
    
    res.json({ message: 'User role updated to admin', username: user.username });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add the profile endpoint
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: err.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  const { email, password, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update email
    if (email) {
      user.email = email;
    }

    // Update password
    if (password && newPassword) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: err.message });
  }
});

router.delete('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add these new routes for token refresh and logout

// Refresh Token endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }
  
  try {
    // Find user with this refresh token
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Verify token hasn't expired
    const tokenDoc = user.refreshTokens.find(rt => rt.token === refreshToken);
    if (!tokenDoc || new Date() > tokenDoc.expires) {
      // Remove expired token
      user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
      await user.save();
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    // Generate a new access token
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    // Return new access token
    res.json({
      token: accessToken,
      username: user.username,
      role: user.role
    });
    
  } catch (err) {
    console.error('Error refreshing token:', err);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// Logout endpoint that invalidates refresh tokens
router.post('/logout', authMiddleware, async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    if (refreshToken) {
      // Find the user and remove this specific refresh token
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
        await user.save();
      }
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;