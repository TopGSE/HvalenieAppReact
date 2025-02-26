import { useState } from 'react';

function EditSong({ song, onSave, onCancel }) {
  const [title, setTitle] = useState(song.title);
  const [lyrics, setLyrics] = useState(song.lyrics);
  const [chords, setChords] = useState(song.chords);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...song, title, lyrics, chords });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Lyrics"
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Chords"
        value={chords}
        onChange={(e) => setChords(e.target.value)}
        required
      />
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default EditSong;