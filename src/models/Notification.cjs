const mongoose = require('mongoose');

let Notification;
try {
  // First try to get the existing model
  Notification = mongoose.model('Notification');
} catch (e) {
  // If it doesn't exist, create it
  const notificationSchema = new mongoose.Schema({
    type: { 
      type: String, 
      required: true 
    },
    fromUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    fromUserName: { 
      type: String 
    },
    toUserId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    playlistId: { 
      type: String, 
      default: function() {
        // Generate a default ID if none provided
        return 'shared-' + Date.now();
      }
    },
    playlistName: { 
      type: String 
    },
    message: { 
      type: String 
    },
    playlistData: { 
      type: Object 
    },
    read: { 
      type: Boolean, 
      default: false 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  });
  
  Notification = mongoose.model('Notification', notificationSchema);
}

module.exports = Notification;