const express = require('express');
const router = express.Router();

// Define a simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Playlist routes working' });
});

// Define the share route with arrow function syntax
router.post('/share', (req, res) => {
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