const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist.cjs');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Get all playlists for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Find playlists where the user is the owner
    const playlists = await Playlist.find({ userId }).sort({ updatedAt: -1 });
    
    res.json(playlists);
  } catch (error) {
    console.error('Error getting playlists:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific playlist by ID
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check if user has permission to access this playlist
    if (playlist.userId.toString() !== req.user.userId && 
        playlist.sharedWithUsers && 
        !playlist.sharedWithUsers.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(playlist);
  } catch (error) {
    console.error('Error getting playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new playlist
router.post('/', async (req, res) => {
  try {
    const { name, description, songIds } = req.body;
    const userId = req.user.userId;
    
    if (!name) {
      return res.status(400).json({ message: 'Playlist name is required' });
    }
    
    const newPlaylist = new Playlist({
      name,
      description: description || '',
      userId,
      songIds: songIds || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedPlaylist = await newPlaylist.save();
    res.status(201).json(savedPlaylist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a playlist
router.put('/:id', async (req, res) => {
  try {
    const { name, description, songIds } = req.body;
    const userId = req.user.userId;
    
    // Find the playlist
    const playlist = await Playlist.findById(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check ownership
    if (playlist.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this playlist' });
    }
    
    // Update the playlist
    playlist.name = name || playlist.name;
    playlist.description = description !== undefined ? description : playlist.description;
    playlist.songIds = songIds || playlist.songIds;
    playlist.updatedAt = new Date();
    
    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a playlist
router.delete('/:id', async (req, res) => {
  try {
    // Log the received ID for debugging
    console.log('Received delete request for playlist ID:', req.params.id);
    
    if (!req.params.id) {
      return res.status(400).json({ message: 'Playlist ID is required' });
    }

    const userId = req.user.userId;
    
    // Find the playlist first to check ownership
    const playlist = await Playlist.findById(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check ownership
    if (playlist.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this playlist' });
    }
    
    // Now delete it
    await Playlist.findByIdAndDelete(req.params.id);
    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a song to a playlist
router.post('/:id/songs', async (req, res) => {
  try {
    const { songId } = req.body;
    const userId = req.user.userId;

    if (!songId) {
      return res.status(400).json({ message: 'Song ID is required' });
    }

    // Validate playlistId and songId as ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid playlist ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(songId)) {
      return res.status(400).json({ message: 'Invalid song ID' });
    }

    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    if (playlist.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to modify this playlist' });
    }

    if (playlist.songIds.map(id => id.toString()).includes(songId)) {
      return res.status(400).json({ message: 'Song already in playlist' });
    }

    playlist.songIds.push(songId);
    playlist.updatedAt = new Date();

    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove a song from a playlist
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, songId } = req.params;
    
    // Find the playlist
    const playlist = await Playlist.findById(id);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    // Check ownership
    if (playlist.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to modify this playlist' });
    }
    
    // Remove the song ID from the playlist
    playlist.songIds = playlist.songIds.filter(sid => sid.toString() !== songId);
    playlist.updatedAt = new Date();
    
    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;