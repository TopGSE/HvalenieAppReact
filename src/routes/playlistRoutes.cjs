const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification.cjs');
const User = require('../models/User.cjs');
const mongoose = require('mongoose');
const Song = require('../models/Song.cjs'); // Import Song model

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
      // Ensure we have both songIds and songs
      let songIds = Array.isArray(playlistData.songIds) ? [...playlistData.songIds] : [];
      let songs = Array.isArray(playlistData.songs) ? [...playlistData.songs] : [];
      
      // If songs exist but songIds don't, extract IDs from songs
      if (songs.length > 0 && songIds.length === 0) {
        songIds = songs.map(song => song._id).filter(Boolean);
        console.log(`Extracted ${songIds.length} songIds from songs`);
      }
      
      // If songIds exist but songs don't, log a warning
      if (songIds.length > 0 && songs.length === 0) {
        console.log(`Warning: Playlist has ${songIds.length} songIds but no song details`);
      }
      
      // In the share route handler:
      // Before creating notifications, add this to get all song details
      // This ensures songs have complete information when shared
      let fullSongDetails = [];
      if (songIds && songIds.length > 0) {
        try {
          // Fetch full song details from database if possible
          fullSongDetails = await Song.find({ _id: { $in: songIds } })
            .select('_id title artist category')
            .lean();
          
          console.log(`Retrieved ${fullSongDetails.length} full song details from database`);
          
          // If we found fewer songs than expected, log a warning
          if (fullSongDetails.length < songIds.length) {
            console.warn(`Only found ${fullSongDetails.length} songs out of ${songIds.length} requested`);
          }
        } catch (err) {
          console.error('Error fetching song details:', err);
          // Continue with partial data - the songs array we already have
        }
      }
      
      // Use full song details if available, otherwise fall back to existing songs
      const songsToShare = fullSongDetails.length > 0 ? fullSongDetails : songs;
      
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
          songs: songsToShare
        },
        read: false,
        createdAt: new Date()
      }));
      
      // Log what we're storing in the notifications
      console.log(`Creating ${notifications.length} notifications with:`, {
        songCount: songs.length,
        songIdCount: songIds.length,
        playlistName: playlistData.name
      });
      
      // Save all notifications to the database
      await Notification.insertMany(notifications);
      console.log(`Created ${notifications.length} notifications successfully`);
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