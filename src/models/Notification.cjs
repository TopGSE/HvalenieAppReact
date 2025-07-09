const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['playlist_share', 'song_comment', 'new_follower'] // Add other types as needed
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playlistId: {
    type: String,
    required: function() {
      return this.type === 'playlist_share';
    }
  },
  playlistName: {
    type: String,
    required: function() {
      return this.type === 'playlist_share';
    }
  },
  message: String,
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;