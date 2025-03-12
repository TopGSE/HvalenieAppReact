const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Add a method to generate a refresh token
userSchema.methods.generateRefreshToken = function () {
  const token = require('crypto').randomBytes(40).toString('hex');
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days expiry
  
  this.refreshTokens.push({ token, expires });
  return { token, expires };
};

// Method to remove expired tokens
userSchema.methods.removeExpiredRefreshTokens = function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expires > now);
};

const User = mongoose.model('User', userSchema);

module.exports = User;