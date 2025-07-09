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

// Define the share route
router.post('/share', async function(req, res) {
  try {
    console.log("Received share request");
    
    const { recipientIds, playlistId, playlistName, message, playlistData } = req.body;
    const senderId = req.user ? req.user.userId || req.user._id : null;
    
    // Validate the input
    if (!senderId) {
      console.log("Missing sender ID");
      return res.status(400).json({ message: 'Sender ID is required' });
    }
    
    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      console.log("Invalid recipients");
      return res.status(400).json({ message: 'Valid recipient IDs are required' });
    }
    
    if (!playlistData) {
      console.log("Missing playlist data");
      return res.status(400).json({ message: 'Playlist data is required' });
    }
    
    // Get sender details to include in notification
    const sender = await User.findById(senderId).select('username');
    const senderUsername = sender ? sender.username : 'Unknown user';
    
    // Enhanced logging for debugging
    console.log('Received playlist data for sharing:', {
      playlistId,
      playlistName,
      songCount: playlistData?.songs?.length || 0,
      songIdCount: playlistData?.songIds?.length || 0,
      recipientCount: recipientIds.length
    });
    
    // Sanitize the song data to avoid large objects
    let songIds = Array.isArray(playlistData.songIds) ? [...playlistData.songIds] : [];
    let songs = Array.isArray(playlistData.songs) ? [...playlistData.songs] : [];
    
    // If songs exist but songIds don't, extract IDs from songs
    if (songs.length > 0 && songIds.length === 0) {
      songIds = songs.map(song => song._id).filter(Boolean);
      console.log(`Extracted ${songIds.length} songIds from songs`);
    }
    
    // Create a simplified version of the song objects with only essential data
    const simplifiedSongs = songs.map(song => ({
      _id: song._id,
      title: song.title || 'Untitled Song',
      artist: song.artist || '',
      category: song.category || 'other'
    }));
    
    // Create notifications for each recipient
    const notifications = recipientIds.map(recipientId => ({
      type: 'playlist_share',
      fromUserId: senderId,
      fromUserName: senderUsername,
      toUserId: recipientId,
      playlistId: playlistId || 'shared-' + Date.now(), // Provide a default ID if none provided
      playlistName: playlistName || 'Shared Playlist',
      message: message || `${senderUsername} shared a playlist with you: "${playlistName || 'Shared Playlist'}"`,
      playlistData: {
        name: playlistData.name || 'Shared Playlist',
        description: playlistData.description || '',
        songIds: songIds,
        songs: simplifiedSongs
      },
      read: false,
      createdAt: new Date()
    }));
    
    console.log(`Creating ${notifications.length} notifications`);
    
    // Save all notifications to the database
    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} notifications successfully`);
    
    res.json({ 
      success: true, 
      message: 'Playlist shared successfully',
      recipients: recipientIds.length,
      playlistName: playlistName || 'Shared Playlist'
    });
  } catch (error) {
    console.error('Error sharing playlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;