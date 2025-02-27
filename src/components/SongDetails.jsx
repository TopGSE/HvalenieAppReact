import React, { useState, useRef, useEffect } from 'react';
import EditSong from './EditSong';
import './SongDetails.css';

function SongDetails({ 
  song, 
  onRemoveSong, 
  onEditSong, 
  playlists = [],
  onAddToPlaylist,
  onCreatePlaylist,
  songSourcePlaylist,
  setCurrentPlaylist
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPlaylistDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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

  // Check if song exists in playlist
  const isSongInPlaylist = (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist && playlist.songIds && playlist.songIds.includes(song._id);
  };

  if (!song) return null;

  return (
    <div className="song-details-container">
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
      
      {songSourcePlaylist && (
        <button 
          className="back-to-playlist-btn"
          onClick={() => setCurrentPlaylist(songSourcePlaylist)}
        >
          ← Back to Playlist
        </button>
      )}
      
      <div className="song-actions">
        <button onClick={handlePrint} className="print-btn">🖨️ Print</button>
        <button onClick={() => onEditSong(song)} className="edit-btn">✏️ Edit</button>
        
        {/* Add to playlist dropdown */}
        <div className="playlist-dropdown-container" ref={dropdownRef}>
          <button 
            onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)} 
            className="playlist-btn"
          >
            📋 Add to Playlist
          </button>
          
          {showPlaylistDropdown && (
            <div className="playlist-dropdown">
              {playlists && playlists.length > 0 ? (
                <ul>
                  {playlists.map(playlist => (
                    <li key={playlist.id}>
                      <button 
                        onClick={() => {
                          onAddToPlaylist(playlist.id, song._id);
                          setShowPlaylistDropdown(false);
                        }}
                        className={isSongInPlaylist(playlist.id) ? 'already-added' : ''}
                        disabled={isSongInPlaylist(playlist.id)}
                      >
                        {playlist.name}
                        {isSongInPlaylist(playlist.id) && <span className="added-icon">✓</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="playlist-dropdown-empty">
                  No playlists available
                </div>
              )}
              <div className="playlist-dropdown-footer">
                <button 
                  onClick={() => {
                    setShowPlaylistDropdown(false);
                    onCreatePlaylist();
                  }}
                  className="create-playlist-btn"
                >
                  + Create New Playlist
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button onClick={() => onRemoveSong(song)} className="delete-btn">🗑️ Delete</button>
      </div>
    </div>
  );
}

export default SongDetails;