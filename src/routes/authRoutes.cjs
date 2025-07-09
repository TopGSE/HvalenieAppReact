const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const Notification = require('../models/Notification.cjs'); // Import Notification model
const authMiddleware = require('../middleware/authMiddleware.cjs');
const adminMiddleware = require('../middleware/adminMiddleware.cjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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
      
      // Log the expiration time for debugging
      console.log(`Refresh token created, expires: ${refreshTokenObj.expires}`);
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

// Ensure the profile route is correctly defined
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('Profile route called, user ID:', req.user.userId);
    
    // Make sure we're using the correct user ID field from the token
    const userId = req.user.userId || req.user._id;
    if (!userId) {
      console.error('No user ID found in token');
      return res.status(401).json({ message: 'Invalid token: missing user ID' });
    }
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`User found: ${user.username}`);
    res.json(user);
  } catch (err) {
    console.error('Error in /profile route:', err);
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

    // For logging purposes only (not needed for functionality)
    console.log(`User deleted: ${user.username} (${user._id})`);
    
    res.json({ 
      message: 'Account deleted successfully',
      userId: user._id // Return the deleted userId for client-side cleanup
    });
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
      { expiresIn: '1h' } // Keep the access token at 1 hour
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

// Add profile photo update endpoint
router.put('/profile/photo', authMiddleware, async (req, res) => {
  try {
    const { profilePhoto } = req.body;
    
    if (!profilePhoto) {
      return res.status(400).json({ message: 'No profile photo provided' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.profilePhoto = profilePhoto;
    await user.save();
    
    res.json({ 
      message: 'Profile photo updated successfully',
      profilePhoto: user.profilePhoto
    });
  } catch (err) {
    console.error('Error updating profile photo:', err);
    res.status(500).json({ message: 'Error updating profile photo' });
  }
});

// Add email update endpoint
router.put('/profile/email', authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and current password are required' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    user.email = email;
    await user.save();
    
    res.json({ message: 'Email updated successfully' });
  } catch (err) {
    console.error('Error updating email:', err);
    res.status(500).json({ message: err.message });
  }
});

// Change password endpoint
router.put('/profile/password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect.' });

    user.password = await bcrypt.hash(newPassword, 10); // <--- THIS IS CORRECT
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * Count users - admin only
 * @route GET /auth/users/count
 * @access Private (Admin)
 */
router.get("/users/count", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error counting users:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin route to get all user details
router.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Exclude password from returned data
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public route for sharing functionality
router.get('/users/share', authMiddleware, async (req, res) => {
  try {
    // Get current user ID from token
    const currentUserId = req.user.id || req.user._id;
    
    // Find all users except current user, exclude password
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('username email profilePhoto createdAt')
      .sort({ username: 1 });
      
    res.json(users);
  } catch (error) {
    console.error('Error fetching users for sharing:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this endpoint for getting all users - admin only
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Exclude password from returned data
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this endpoint for updating user role - admin only
router.put('/users/:userId/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validate role is either 'admin' or 'reader'
    if (role !== 'admin' && role !== 'reader') {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Find user and update role
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ message: 'User role updated', user: { ...user._doc, password: undefined } });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user notifications
router.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      toUserId: req.user.userId || req.user._id 
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if this notification belongs to the current user
    if (notification.toUserId.toString() !== (req.user.userId || req.user._id).toString()) {
      return res.status(403).json({ message: 'Not authorized to access this notification' });
    }
    
    notification.read = true;
    await notification.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a single notification
router.delete('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if this notification belongs to the current user
    if (notification.toUserId.toString() !== (req.user.userId || req.user._id).toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all notifications for a user
router.delete('/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    const result = await Notification.deleteMany({ toUserId: userId });
    
    res.json({ 
      success: true, 
      message: 'All notifications cleared',
      count: result.deletedCount
    });
  } catch (err) {
    console.error('Error clearing notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;