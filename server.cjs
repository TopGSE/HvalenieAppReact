const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/church-songs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected...'))
.catch(err => console.error('MongoDB Connection Error:', err));

const songSchema = new mongoose.Schema({
  title: String,
  lyrics: String,
  chords: String,
});

const Song = mongoose.model('Song', songSchema);

app.get('/songs', async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/songs', async (req, res) => {
  try {
    const newSong = new Song(req.body);
    await newSong.save();
    res.json(newSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Make sure this route comes BEFORE the /songs/:id route
app.delete('/songs/title/:title', async (req, res) => {
  try {
    const { title } = req.params;
    console.log(`Attempting to delete song with title: ${title}`);
    const deletedSong = await Song.findOneAndDelete({ title: title });
    
    if (!deletedSong) {
      console.log('Song not found');
      return res.status(404).json({ message: 'Song not found' });
    }
    
    console.log('Song deleted successfully');
    res.json({ message: 'Song deleted' });
  } catch (err) {
    console.error('Error deleting song:', err);
    res.status(500).json({ message: err.message });
  }
});

// This route should come after the more specific route
app.delete('/songs/:id', async (req, res) => {
  try {
    const updatedSong = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSong) return res.status(404).json({ message: 'Song not found' });
    res.json(updatedSong);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});