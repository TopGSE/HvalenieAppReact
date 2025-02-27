import React, { useState } from 'react';
import EditSong from './EditSong';
import './SongDetails.css';

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

  const handlePrint = () => {
    const printContents = document.getElementById('printable-song').innerHTML;
    const originalContents = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div class="print-container">
        <h1>${song.title}</h1>
        ${song.artist ? `<p>By: ${song.artist}</p>` : ''}
        
        ${song.lyrics ? `<div class="print-lyrics"><h3>Lyrics</h3><pre>${song.lyrics}</pre></div>` : ''}
        ${song.chords ? `<div class="print-chords"><h3>Chords</h3><pre>${song.chords}</pre></div>` : ''}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContents;
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
          <div id="printable-song">
            <div className="song-header">
              <h1>{song.title}</h1>
              <p>Artist: {song.artist || 'Unknown'}</p>
            </div>
            
            <div className={`song-content ${isFullscreen ? 'fullscreen' : ''}`}>
              <div className="lyrics-container">
                <div className="lyrics-header">
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
          </div>
          
          <div className="song-actions">
            <button onClick={handlePrint} className="print-btn">🖨️ Принтирай</button>
            <button onClick={() => onEditSong(song)} className="edit-btn">✏️ Редактирай</button>
            <button onClick={() => onRemoveSong(song)} className="delete-btn">🗑️ Изтрий</button>
          </div>
        </>
      )}
    </div>
  );
}

export default SongDetails;