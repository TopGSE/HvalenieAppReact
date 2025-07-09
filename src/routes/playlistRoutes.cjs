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
    
    // Enhanced logging for debugging
    console.log('Received playlist data for sharing:', {
      playlistId,
      playlistName,
      songCount: playlistData?.songs?.length || 0,
      songIdCount: playlistData?.songIds?.length || 0
    });
    
    // Create notifications for each recipient
    if (recipientIds && recipientIds.length > 0) {
      // Make sure songs are properly included
      let songIds = playlistData.songIds || [];
      let songs = playlistData.songs || [];
      
      // If songs exist but songIds don't, extract IDs from songs
      if (songs.length > 0 && songIds.length === 0) {
        songIds = songs.map(song => song._id).filter(Boolean);
      }
      
      // If songIds exist but songs don't, make sure we send just the IDs
      if (songIds.length > 0 && songs.length === 0) {
        console.log(`Warning: Playlist has ${songIds.length} songIds but no song details`);
      }
      
      const notifications = recipientIds.map(recipientId => ({
        type: 'playlist_share',
        fromUserId: senderId,
        fromUserName: senderUsername,
        toUserId: recipientId,
        playlistId: playlistId,
        playlistName: playlistName,
        message: message || `${senderUsername} shared a playlist with you: "${playlistName}"`,
        // Make sure to include the full playlist data with songs
        playlistData: {
          name: playlistData.name,
          description: playlistData.description || '',
          songIds: songIds,
          songs: songs
        },
        read: false
      }));
      
      // Save all notifications to the database
      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications with ${songs.length} songs and ${songIds.length} songIds`);
    }
    
    res.json({ 
      success: true, 
      message: 'Playlist shared successfully',
      recipients: recipientIds ? recipientIds.length : 0,
      playlistName: playlistName,
      songCount: playlistData?.songs?.length || 0
    });
  } catch (error) {
    console.error('Error sharing playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;