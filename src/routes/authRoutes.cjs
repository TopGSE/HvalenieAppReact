const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const authMiddleware = require('../middleware/authMiddleware.cjs');
const nodemailer = require('nodemailer'); // Ensure nodemailer is installed
const crypto = require('crypto');

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

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log(`Password reset requested for email: ${email}`);
  
  try {
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return res.status(200).json({ message: 'If your email exists in our system, you will receive reset instructions.' });
    }
    
    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store the reset token with the user
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    
    // Create email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email provider
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Use environment variables
        pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password' // Use environment variables
      }
    });
    
    // Construct the reset URL (frontend URL)
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: 'Password Reset - Hvalenie Emanuil',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>This link is valid for one hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
    
    res.status(200).json({
      message: 'Password reset instructions sent to your email'
    });
  } catch (err) {
    console.error('Error in forgot password flow:', err);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
});

// Verify reset token endpoint
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    res.json({ message: 'Token is valid' });
  } catch (err) {
    console.error('Error verifying reset token:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password endpoint
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password
    user.password = newPassword;
    
    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    
    await user.save();
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;