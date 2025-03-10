import { useState } from 'react';
import { toast } from 'react-toastify';
import './AddSong.css'; // Import the CSS file

function AddSong({ onAddSong }) {
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [chords, setChords] = useState('');
  const [category, setCategory] = useState('praise'); // Add category state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a song title');
      return;
    }
    
    if (!lyrics.trim()) {
      toast.error('Please enter song lyrics');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      onAddSong({ 
        title, 
        lyrics, 
        chords,
        category // Include category in the song data
      });
      
      // Reset form
      setTitle('');
      setLyrics('');
      setChords('');
      setCategory('praise');
      
    } catch (error) {
      console.error('Error adding song:', error);
      toast.error('Failed to add song');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-song-form-container">
      <form onSubmit={handleSubmit} className="add-song-form">
        <div className="form-group">
          <label htmlFor="title">Song Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter song title"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="praise">Хваление</option>
            <option value="worship">Поклонение</option>
            <option value="christmas">Рождество</option>
            <option value="easter">Възкресение</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="lyrics">Lyrics</label>
          <textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Enter song lyrics"
            required
          />
          <small>Enter each line as it should appear in the song</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="chords">Chords (Optional)</label>
          <textarea
            id="chords"
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            placeholder="Enter song chords"
          />
          <small>Add chord notations if available</small>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding Song...' : 'Add Song'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddSong;