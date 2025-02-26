import React, { useState } from 'react';
import EditSong from './EditSong';

function SongDetails({ song, onRemoveSong, onEditSong }) {
  const [editingSong, setEditingSong] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  if (!song) return null;

  const handleEditClick = () => {
    setEditingSong(song);
  };

  const handleEditSave = (updatedSong) => {
    onEditSong(updatedSong);
    setEditingSong(null);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDeleteClick = () => {
    console.log('Delete button clicked, song:', song);
    onRemoveSong(song);
  };

  return (
    <div className="song-details-container">
      {editingSong ? (
        <EditSong 
          song={editingSong} 
          onSave={handleEditSave} 
          onCancel={() => setEditingSong(null)} 
        />
      ) : (
        <>
          <div className="song-header">
            <h1>{song.title}</h1>
            <p>Artist: {song.artist || 'Unknown'}</p>
          </div>
          
          <div className={`song-content ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="lyrics-container">
              <div className="lyrics-header">
                <h3>Lyrics</h3>
                <button 
                  className="fullscreen-btn" 
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
              </div>
              <pre>{song.lyrics}</pre>
            </div>
            
            {song.chords && (
              <div className="chords-container">
                <h3>Chords</h3>
                <pre>{song.chords}</pre>
              </div>
            )}
          </div>
          
          <div className="song-actions">
            <button className="edit-btn" onClick={handleEditClick}>
              Edit Song
            </button>
            <button className="delete-btn" onClick={handleDeleteClick}>
              Delete Song
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SongDetails;