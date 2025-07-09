const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification.cjs');
const User = require('../models/User.cjs');
const mongoose = require('mongoose');

// Try to import Song model but handle case where it's not available
let Song;
try {
  Song = require('../models/Song.cjs');
} catch (err) {
  console.warn('Song model not available, song data enrichment will be skipped');
  Song = null;
}

// Define a simple test route
router.get('/test', function(req, res) {
  res.json({ message: 'Playlist routes working' });
});

// Update the share route to work with database playlists

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
      
      // Get full song details if possible
      let fullSongDetails = [];
      if (Song && songIds && songIds.length > 0) {
        try {
          // Fetch full song details from database
          fullSongDetails = await Song.find({ _id: { $in: songIds } })
            .select('_id title artist category lyrics chords')
            .lean();
          
          console.log(`Retrieved ${fullSongDetails.length} full song details from database`);
          
          if (fullSongDetails.length < songIds.length) {
            console.warn(`Only found ${fullSongDetails.length} songs out of ${songIds.length} requested`);
          }
        } catch (err) {
          console.error('Error fetching song details:', err);
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
        playlistData: {
          name: playlistData.name,
          description: playlistData.description || '',
          songIds: songIds,
          songs: songsToShare
        },
        read: false,
        createdAt: new Date()
      }));
      
      console.log(`Creating ${notifications.length} notifications with:`, {
        songCount: songsToShare.length,
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