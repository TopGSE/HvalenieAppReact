const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification.cjs');
const User = require('../models/User.cjs');
const mongoose = require('mongoose');

// Define a simple test route
router.get('/test', function(req, res) {
  res.json({ message: 'Playlist routes working' });
});

// Define the share route
router.post('/share', async function(req, res) {
  try {
    const { recipientIds, playlistId, playlistName, message, playlistData } = req.body;
    const senderId = req.user ? req.user.userId || req.user._id : null;
    
    if (!senderId) {
      return res.status(400).json({ message: 'Sender ID is required' });
    }
    
    // Get sender details to include in notification
    const sender = await User.findById(senderId).select('username');
    const senderUsername = sender ? sender.username : 'Unknown user';
    
    // Create notifications for each recipient
    if (recipientIds && recipientIds.length > 0) {
      const notifications = recipientIds.map(recipientId => ({
        type: 'playlist_share',
        fromUserId: senderId,
        fromUserName: senderUsername, // Add sender's username
        toUserId: recipientId,
        playlistId: playlistId,
        playlistName: playlistName,
        message: message || `${senderUsername} shared a playlist with you: "${playlistName}"`,
        playlistData: playlistData, // Include the actual playlist data
        read: false
      }));
      
      // Save all notifications to the database
      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications`);
    }
    
    res.json({ 
      success: true, 
      message: 'Playlist shared successfully',
      recipients: recipientIds ? recipientIds.length : 0,
      playlistName: playlistName
    });
  } catch (error) {
    console.error('Error sharing playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;