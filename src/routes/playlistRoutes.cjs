const express = require('express');
const router = express.Router();

// Define a simple test route
router.get('/test', function(req, res) {
  res.json({ message: 'Playlist routes working' });
});

// Define the share route with standard function syntax instead of arrow function
router.post('/share', function(req, res) {
  try {
    const { recipientIds, playlistName, message, playlistData } = req.body;
    
    // Here you would typically save the shared playlist in your database
    // or create notifications for recipients
    
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