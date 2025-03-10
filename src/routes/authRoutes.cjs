const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');

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

router.post('/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Include role in the token payload
    const token = jwt.sign({ 
      userId: user._id,
      role: user.role 
    }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ 
      token, 
      username: user.username,
      role: user.role 
    });
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

module.exports = router;