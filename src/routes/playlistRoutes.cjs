const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification.cjs');
const mongoose = require('mongoose');

// Define a simple test route
router.get('/test', function(req, res) {
  res.json({ message: 'Playlist routes working' });
});

// Define the share route with standard function syntax instead of arrow function
router.post('/share', function(req, res) {
  try {
    const { recipientIds, playlistId, playlistName, message, playlistData } = req.body;
    const senderId = req.user ? req.user.id || req.user._id : null;
    
    // Create notifications for each recipient
    if (recipientIds && recipientIds.length > 0 && senderId) {
      const notifications = recipientIds.map(recipientId => ({
        type: 'playlist_share',
        fromUserId: senderId,
        toUserId: recipientId,
        playlistId: playlistId,
        playlistName: playlistName,
        message: message || `A user shared a playlist with you: "${playlistName}"`,
        read: false
      }));
      
      // Save all notifications to the database
      Notification.insertMany(notifications)
        .then(() => {
          console.log(`Created ${notifications.length} notifications`);
        })
        .catch(err => {
          console.error('Error creating notifications:', err);
        });
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