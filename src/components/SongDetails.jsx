import React, { useState, useRef, useEffect } from 'react';
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
  const [renderKey, setRenderKey] = useState(0);
  const [activeTab, setActiveTab] = useState('lyrics');
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
    // Save current scroll position and document state
    const scrollPos = window.scrollY;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    
    // Prepare for printing
    document.body.style.overflow = 'visible';
    document.documentElement.style.overflow = 'visible';
    
    // Store any elements that might need to be hidden during print
    const elementsToHide = document.querySelectorAll('.no-print');
    elementsToHide.forEach(el => {
      el.dataset.originalDisplay = el.style.display;
      el.style.display = 'none';
    });
    
    // Print
    window.print();
    
    // Restore everything after print dialog closes (whether user prints or cancels)
    setTimeout(() => {
      // Restore hidden elements
      elementsToHide.forEach(el => {
        el.style.display = el.dataset.originalDisplay || '';
        delete el.dataset.originalDisplay;
      });
      
      // Restore scroll position and document state
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.scrollTo(0, scrollPos);
      
      setRenderKey(prev => prev + 1);
    }, 100);
  };

  // Check if song exists in playlist
  const isSongInPlaylist = (playlistId) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist && playlist.songIds && playlist.songIds.includes(song._id);
  };

  if (!song) return null;

  return (
    <div className="song-details-container" key={renderKey}>
      {/* Top action bar (only visible when not in fullscreen) */}
      {!isFullscreen && songSourcePlaylist && (
        <div className="back-nav no-print">
          <button 
            className="back-button"
            onClick={() => setCurrentPlaylist(songSourcePlaylist)}
          >
            <span className="back-icon">←</span>
            <span>Back to Playlist</span>
          </button>
        </div>
      )}
      
      <div className={`song-details-card ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Header Section */}
        <div className="song-header">
          <div className="song-title-section">
            <h1>{song.title}</h1>
            {song.artist && <h2>{song.artist}</h2>}
            {song.category && (
              <span className="song-category-badge">{song.category}</span>
            )}
          </div>

          {/* Quick action buttons */}
          {!isFullscreen && (
            <div className="quick-actions no-print">
              <button 
                className="icon-button favorite-button"
                title="Add to favorites"
                onClick={() => {/* Add favorite functionality */}}
              >
                ☆
              </button>
              <button 
                className="icon-button fullscreen-button"
                title="Fullscreen mode"
                onClick={toggleFullscreen}
              >
                ⛶
              </button>
              <button 
                className="icon-button print-button"
                title="Print song"
                onClick={handlePrint}
              >
                🖨️
              </button>
            </div>
          )}
          
          {/* Fullscreen mode only shows exit button */}
          {isFullscreen && (
            <div className="fullscreen-controls no-print">
              <button 
                className="exit-fullscreen-button"
                onClick={toggleFullscreen}
              >
                Exit Fullscreen
              </button>
            </div>
          )}
        </div>
        
        {/* Content tabs - only show if not in fullscreen mode */}
        {!isFullscreen && song.chords && (
          <div className="content-tabs no-print">
            <button 
              className={`tab-button ${activeTab === 'lyrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('lyrics')}
            >
              Lyrics
            </button>
            <button 
              className={`tab-button ${activeTab === 'chords' ? 'active' : ''}`}
              onClick={() => setActiveTab('chords')}
            >
              Chords
            </button>
            <button 
              className={`tab-button ${activeTab === 'both' ? 'active' : ''}`}
              onClick={() => setActiveTab('both')}
            >
              Both
            </button>
          </div>
        )}
        
        {/* Song Content */}
        <div className="song-content">
          {(activeTab === 'lyrics' || activeTab === 'both' || !song.chords) && (
            <div className="lyrics-section">
              {!isFullscreen && <h3>Lyrics</h3>}
              <pre className="lyrics-text">{song.lyrics}</pre>
            </div>
          )}
          
          {(activeTab === 'chords' || activeTab === 'both') && song.chords && (
            <div className="chords-section">
              {!isFullscreen && <h3>Chords</h3>}
              <pre className="chords-text">{song.chords}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar - only visible when not in fullscreen */}
      {!isFullscreen && (
        <div className="song-actions-bar no-print">
          <div className="action-buttons-container">
            <div className="left-actions">
              <button 
                onClick={() => onEditSong(song)} 
                className="action-button edit-button"
              >
                <span className="action-icon">✏️</span>
                <span>Edit</span>
              </button>
              
              <div className="playlist-dropdown-wrapper" ref={dropdownRef}>
                <button 
                  onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                  className="action-button playlist-button"
                >
                  <span className="action-icon">📋</span>
                  <span>Add to Playlist</span>
                </button>
                
                {showPlaylistDropdown && (
                  <div className="playlist-dropdown modern">
                    <h4>Add to playlist</h4>
                    
                    {playlists && playlists.length > 0 ? (
                      <ul className="playlist-list">
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
                              <span className="playlist-name">{playlist.name}</span>
                              <span className="playlist-status">
                                {isSongInPlaylist(playlist.id) ? '✓' : '+'}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-playlists">
                        <p>No playlists available</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => {
                        setShowPlaylistDropdown(false);
                        onCreatePlaylist();
                      }}
                      className="create-playlist-button"
                    >
                      <span>+ Create New Playlist</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="right-actions">
              <button 
                onClick={() => onRemoveSong(song)} 
                className="action-button delete-button"
              >
                <span className="action-icon">🗑️</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SongDetails;