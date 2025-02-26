import { useState } from 'react';
import { toast } from 'react-toastify';

function AddSong({ onAddSong }) {
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [chords, setChords] = useState('');
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
      onAddSong({ title, lyrics, chords });
      
      // Reset form
      setTitle('');
      setLyrics('');
      setChords('');
      
    } catch (error) {
      console.error('Error adding song:', error);
      toast.error('Failed to add song');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-song-form-container">
      <form onSubmit={handleSubmit}>
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