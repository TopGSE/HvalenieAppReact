import React from 'react';
import './SongTooltip.css';

function SongTooltip({ song }) {
  if (!song) return null;
  
  // Get a preview of the lyrics (first ~100 characters)
  const lyricsPreview = song.lyrics ? 
    (song.lyrics.length > 100 ? `${song.lyrics.substring(0, 100).trim()}...` : song.lyrics) :
    'No lyrics available';
  
  return (
    <div className="song-tooltip">
      <div className="song-tooltip-header">
        <h4>{song.title}</h4>
        {song.artist && <div className="song-tooltip-artist">{song.artist}</div>}
      </div>
      
      <div className="song-tooltip-preview">
        <pre className="song-tooltip-lyrics">{lyricsPreview}</pre>
      </div>
      
      <div className="song-tooltip-footer">
        {song.category && <span className="song-tooltip-category">{song.category}</span>}
        <span className="song-tooltip-hint">Click to view full song</span>
      </div>
    </div>
  );
}

export default SongTooltip;