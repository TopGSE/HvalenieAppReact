require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes.cjs'); // Import auth routes
const adminMiddleware = require('./src/middleware/adminMiddleware.cjs');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User.cjs');
const authMiddleware = require('./src/middleware/authMiddleware.cjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/church-songs')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  lyrics: String,
  chords: String,
  category: { type: String, default: 'other' },
  createdAt: { type: Date, default: Date.now } // Add this line
});

const Song = mongoose.model('Song', songSchema);

// Public song routes (accessible to all)
app.get('/songs', async (req, res) => {
  try {
    console.log('GET /songs request received');
    
    // First check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, readyState:', mongoose.connection.readyState);
      return res.status(500).json({ 
        message: 'Database connection issue', 
        readyState: mongoose.connection.readyState 
      });
    }
    
    // Get all songs with proper error handling
    const songs = await Song.find({}).lean();
    
    // If no songs found, log it but still return empty array
    if (songs.length === 0) {
      console.log('No songs found in database');
    }
    
    res.json(songs);
  } catch (err) {
    console.error('Error retrieving songs:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id).lean();
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(song);
  } catch (err) {
    console.error('Error retrieving song:', err);
    res.status(500).json({ message: err.message });
  }
});

// Protected song routes (admin only)
app.post('/songs', adminMiddleware, async (req, res) => {
  const song = new Song(req.body);
  try {
    const newSong = await song.save();
    res.status(201).json(newSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/songs/:id', adminMiddleware, async (req, res) => {
  try {
    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(updatedSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/songs/:id', adminMiddleware, async (req, res) => {
  try {
    const deletedSong = await Song.findByIdAndDelete(req.params.id);
    if (!deletedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add this route to check database status
app.get('/api/debug/songs-count', async (req, res) => {
  try {
    const count = await Song.countDocuments();
    res.json({ count, message: `Database contains ${count} songs` });
  } catch (err) {
    console.error('Error checking song count:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add test data creation route
app.get('/api/debug/create-test-data', async (req, res) => {
  try {
    // Create a few test songs
    const testSongs = [
      {
        title: 'Test Song 1',
        artist: 'Test Artist',
        lyrics: 'These are test lyrics\nFor song number one',
        chords: 'G D Em C',
        category: 'worship'
      },
      {
        title: 'Test Song 2',
        artist: 'Another Artist',
        lyrics: 'Second song lyrics\nJust for testing',
        chords: 'Am F C G',
        category: 'praise'
      },
      {
        title: 'Test Song 3',
        artist: 'Third Artist',
        lyrics: 'Third set of lyrics\nFor testing purposes',
        category: 'other'
      }
    ];
    
    // Insert the test songs
    const result = await Song.insertMany(testSongs);
    res.json({ 
      message: `Created ${result.length} test songs successfully`, 
      songs: result 
    });
  } catch (err) {
    console.error('Error creating test data:', err);
    res.status(500).json({ message: err.message });
  }
});

// Use authentication routes
app.use('/auth', authRoutes);

// Forgot password endpoint
app.post('/auth/forgot-password', async (req, res) => {
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
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
    
    // Construct the reset URL (frontend URL)
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});