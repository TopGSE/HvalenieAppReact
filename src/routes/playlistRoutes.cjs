const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware.cjs');

// Define the route properly - using normal function syntax instead of arrow function
router.post('/share', authMiddleware, function(req, res) {
  try {
    const { playlistId, playlistName, recipientIds, message, playlistData } = req.body;
    const senderId = req.user.id || req.user._id;

    // For now, just return success
    // In a future implementation, you could create notifications or emails
    
    res.json({ 
      success: true, 
      message: 'Playlist shared successfully',
      recipients: recipientIds ? recipientIds.length : 0
    });
  } catch (error) {
    console.error('Error sharing playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;