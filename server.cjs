require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes.cjs');
const adminMiddleware = require('./src/middleware/adminMiddleware.cjs');
const User = require('./src/models/User.cjs');
const authMiddleware = require('./src/middleware/authMiddleware.cjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const playlistRoutes = require('./src/routes/playlistRoutes.cjs');
const playlistApiRoutes = require('./src/routes/playlistApiRoutes.cjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable detailed logging in production to debug route issues
const logRequestDetails = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
};

app.use(logRequestDetails);

// Update CORS settings for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://hvalenieapp-89e57e2c3558.herokuapp.com', 
        'https://hvalenieapp.herokuapp.com',
        'https://hvalenie-app-78cc997f9b98.herokuapp.com',
        '*' // Temporarily allow all origins while debugging
      ] 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, 
  socketTimeoutMS: 45000,
  family: 4 
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define songSchema and Song model
let Song;
try {
  // First try to get the existing model
  Song = mongoose.model('Song');
} catch (e) {
  // If it doesn't exist, create it
  const songSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: String,
    lyrics: String,
    chords: String,
    category: { type: String, default: 'other' },
    createdAt: { type: Date, default: Date.now }
  });
  Song = mongoose.model('Song', songSchema);
}

// CRITICAL: Mount auth routes with explicit route registration
// This will ensure routes are correctly mounted and available
app.use('/auth', authRoutes);
console.log('Auth routes mounted at /auth');

// Test route to verify the server is responding
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// Explicitly add the profile route as a backup in case the router mounting isn't working
app.get('/auth/profile-direct', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user profile (direct):', err);
    res.status(500).json({ message: err.message });
  }
});

// Mount playlist routes
app.use('/playlists', authMiddleware, playlistRoutes);
app.use('/api/playlists', authMiddleware, playlistApiRoutes);

// Public song routes
app.get('/songs', async (req, res) => {
  try {
    console.log('GET /songs request received');
    
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, readyState:', mongoose.connection.readyState);
      return res.status(500).json({ 
        message: 'Database connection issue', 
        readyState: mongoose.connection.readyState 
      });
    }
    
    const songs = await Song.find({}).lean();
    
    if (songs.length === 0) {
      console.log('No songs found in database');
    }
    
    res.json(songs);
  } catch (err) {
    console.error('Error retrieving songs:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a debug endpoint to check if auth routes are mounted properly
app.get('/debug/routes', (req, res) => {
  const routePaths = [];
  
  // Helper function to extract routes
  function extractRoutes(layer) {
    if (layer.route) {
      const path = layer.route.path;
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      routePaths.push(`${methods.join(',')} ${path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      const prefix = layer.regexp.toString().match(/^\/\^\\(\/?[^\\]+)/);
      const mountPath = prefix ? prefix[1] : '';
      layer.handle.stack.forEach(stackItem => {
        if (stackItem.route) {
          const subPath = stackItem.route.path;
          const methods = Object.keys(stackItem.route.methods).map(m => m.toUpperCase());
          routePaths.push(`${methods.join(',')} ${mountPath}${subPath}`);
        }
      });
    }
  }
  
  // Extract routes from app._router
  app._router.stack.forEach(extractRoutes);
  
  res.json({
    routes: routePaths,
    authRoutesMounted: routePaths.some(r => r.includes('/auth')),
    total: routePaths.length
  });
});

// Add the rest of your song routes
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

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // IMPORTANT: Serve static files BEFORE defining the catch-all route
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // CRITICAL: Make sure the catch-all route doesn't override API routes
  app.get('*', (req, res, next) => {
    // Skip API routes - explicitly check if the path starts with these prefixes
    if (
      req.path.startsWith('/auth/') || 
      req.path.startsWith('/songs') || 
      req.path.startsWith('/playlists/') || 
      req.path.startsWith('/debug/')
    ) {
      console.log(`Skipping catch-all for API route: ${req.path}`);
      return next();  // Important: call next() to let the request continue
    }
    
    console.log(`Serving index.html for path: ${req.path}`);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling middleware - must be defined last
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'production' ? 'See server logs' : err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});