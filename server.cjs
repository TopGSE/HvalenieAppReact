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

const app = express();
const PORT = process.env.PORT || 5000;

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
const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  lyrics: String,
  chords: String,
  category: { type: String, default: 'other' },
  createdAt: { type: Date, default: Date.now }
});

const Song = mongoose.model('Song', songSchema);

// IMPORTANT: Mount auth routes BEFORE defining other routes
// This fixes the 404 error for /auth/profile
app.use('/auth', authRoutes);

// Mount playlist routes
app.use('/playlists', authMiddleware, playlistRoutes);

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
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/auth/') || 
        req.path.startsWith('/songs') || 
        req.path.startsWith('/playlists') || 
        req.path.startsWith('/debug/')) {
      return;
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});