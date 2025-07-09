const mongoose = require('mongoose');

// Use this pattern to prevent duplicate model registration
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

module.exports = Song;