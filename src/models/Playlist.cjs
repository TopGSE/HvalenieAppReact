const mongoose = require('mongoose');

// Use this pattern to prevent duplicate model registration
let Playlist;
try {
  // First try to get the existing model
  Playlist = mongoose.model('Playlist');
} catch (e) {
  // If it doesn't exist, create it
  const playlistSchema = new mongoose.Schema({
    name: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    songIds: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Song' 
    }],
    sharedFrom: { 
      type: String 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    }
  });
  
  Playlist = mongoose.model('Playlist', playlistSchema);
}

module.exports = Playlist;