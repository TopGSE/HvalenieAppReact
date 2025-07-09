const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // Make sure to require crypto

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'reader'], default: 'reader' },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  profilePhoto: { type: String }, // Added profile photo field
  refreshTokens: [refreshTokenSchema] // Array to store multiple refresh tokens (for multiple devices)
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  // Do NOT hash here if already hashed in the route
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add a method to generate a refresh token
userSchema.methods.generateRefreshToken = function() {
  // Generate a random token
  const token = crypto.randomBytes(40).toString('hex');
  
  // Set expiration to 3 hours from now
  const expires = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours in milliseconds
  
  // Add to user's refreshTokens array
  this.refreshTokens.push({
    token,
    expires
  });
  
  // Return the token object
  return { token, expires };
};

// Method to remove expired tokens
userSchema.methods.removeExpiredRefreshTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(token => token.expires > now);
};

const User = mongoose.model('User', userSchema);

module.exports = User;