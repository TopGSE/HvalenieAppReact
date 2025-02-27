const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Improved MongoDB connection
mongoose.connect('mongodb://localhost:27017/church-songs')
  .then(() => {
    console.log('Connected to MongoDB successfully');
    // List all collections to verify database structure
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error('Error listing collections:', err);
      } else {
        console.log('Available collections:', collections.map(c => c.name));
      }
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Don't exit the process, but log the error
  });

// Add a check for disconnections
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  lyrics: String,
  chords: String,
  category: { type: String, default: 'other' },
  createdAt: { type: Date, default: Date.now } // Add this line
});

const Song = mongoose.model('Song', songSchema);

// Enhanced GET /songs route
app.get('/songs', async (req, res) => {
  try {
    console.log('GET /songs request received');
    
    // First check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, readyState:', mongoose.connection.readyState);
      return res.status(500).json({ 
        message: 'Database connection issue', 
        readyState: mongoose.connection.readyState 
      });
    }
    
    // Get all songs with proper error handling
    const songs = await Song.find({}).lean();
    console.log(`Found ${songs.length} songs in database`);
    
    // If no songs found, log it but still return empty array
    if (songs.length === 0) {
      console.log('No songs found in database');
    }
    
    res.json(songs);
  } catch (err) {
    console.error('Error retrieving songs:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/songs', async (req, res) => {
  const song = new Song(req.body);
  try {
    const newSong = await song.save();
    res.status(201).json(newSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/songs/:id', async (req, res) => {
  try {
    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json(updatedSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/songs/:id', async (req, res) => {
  try {
    const deletedSong = await Song.findByIdAndDelete(req.params.id);
    if (!deletedSong) {
      return res.status(404).json({ message: 'Song not found' });
    }
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add this route to check database status
app.get('/api/debug/songs-count', async (req, res) => {
  try {
    const count = await Song.countDocuments();
    console.log(`Database contains ${count} songs`);
    res.json({ count, message: `Database contains ${count} songs` });
  } catch (err) {
    console.error('Error checking song count:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add test data creation route
app.get('/api/debug/create-test-data', async (req, res) => {
  try {
    // Create a few test songs
    const testSongs = [
      {
        title: 'Test Song 1',
        artist: 'Test Artist',
        lyrics: 'These are test lyrics\nFor song number one',
        chords: 'G D Em C',
        category: 'worship'
      },
      {
        title: 'Test Song 2',
        artist: 'Another Artist',
        lyrics: 'Second song lyrics\nJust for testing',
        chords: 'Am F C G',
        category: 'praise'
      },
      {
        title: 'Test Song 3',
        artist: 'Third Artist',
        lyrics: 'Third set of lyrics\nFor testing purposes',
        category: 'other'
      }
    ];
    
    // Insert the test songs
    const result = await Song.insertMany(testSongs);
    console.log(`Created ${result.length} test songs`);
    res.json({ 
      message: `Created ${result.length} test songs successfully`, 
      songs: result 
    });
  } catch (err) {
    console.error('Error creating test data:', err);
    res.status(500).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});