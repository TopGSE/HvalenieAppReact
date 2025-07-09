const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: String,
  lyrics: String,
  chords: String,
  category: { type: String, default: 'other' },
  createdAt: { type: Date, default: Date.now }
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;