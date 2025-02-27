import { useState, useEffect } from 'react';
import './AddSong.css'; // This import should now work

function EditSong({ song, onSaveEdit, onCancel }) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [chords, setChords] = useState('');
  const [category, setCategory] = useState('worship');

  // Load song data when component mounts or song changes
  useEffect(() => {
    if (song) {
      setTitle(song.title || '');
      setArtist(song.artist || '');
      setLyrics(song.lyrics || '');
      setChords(song.chords || '');
      setCategory(song.category || 'worship');
    }
  }, [song]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updatedSong = {
      ...song, // Preserve the _id and other properties
      title,
      artist,
      lyrics,
      chords,
      category: category || 'worship' // Ensure category is never undefined
    };
    
    console.log('Submitting updated song:', updatedSong);
    onSaveEdit(updatedSong);
  };

  // Available categories
  const songCategories = [
    { value: 'worship', label: 'Поклонение' },
    { value: 'praise', label: 'Хваление' },
    { value: 'christmas', label: 'Рождество' },
    { value: 'easter', label: 'Възкресение' },
    { value: 'other', label: 'Друго' }
  ];

  return (
    <form className="add-song-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="edit-title">Заглавие</label>
        <input
          id="edit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="edit-artist">Изпълнител</label>
        <input
          id="edit-artist"
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="edit-category">Категория</label>
        <select
          id="edit-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          {songCategories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="edit-lyrics">Текст</label>
        <textarea
          id="edit-lyrics"
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={10}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="edit-chords">Акорди</label>
        <textarea
          id="edit-chords"
          value={chords}
          onChange={(e) => setChords(e.target.value)}
          rows={6}
        />
      </div>
      
      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          Отказ
        </button>
        <button type="submit" className="submit-btn">
          Запази промените
        </button>
      </div>
    </form>
  );
}

export default EditSong;