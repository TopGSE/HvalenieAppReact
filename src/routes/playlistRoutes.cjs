const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware.cjs');

// Define a simple test route
router.get('/test', function(req, res) {
  res.json({ message: 'Playlist routes working' });
});

// Define the share route with explicit function declaration
router.post('/share', authMiddleware, function(req, res) {
  try {
    const { recipientIds } = req.body;
    
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