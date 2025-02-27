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
  // Move ALL state hooks to the component top level (React rules)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [activeTab, setActiveTab] = useState('lyrics');
  const [searchTerm, setSearchTerm] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState(null);
  const [errorPlaylistId, setErrorPlaylistId] = useState(null);
  const [fontSize, setFontSize] = useState(() => {
    // Get saved font size from localStorage or use default
    return parseInt(localStorage.getItem('lyrics-font-size') || '16');
  });
  
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

  // Add this useEffect to dynamically position the dropdown
  useEffect(() => {
    if (showPlaylistDropdown && dropdownRef.current) {
      const dropdown = dropdownRef.current.querySelector('.playlist-dropdown');
      if (dropdown) {
        // Check if dropdown would go offscreen at the bottom
        const rect = dropdown.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        if (rect.bottom > viewportHeight) {
          // If it would go off the bottom, position it above the button
          dropdown.style.bottom = 'calc(100% + 10px)';
          dropdown.style.top = 'auto';
        } else {
          // Otherwise position it below the button
          dropdown.style.top = 'calc(100% + 10px)';
          dropdown.style.bottom = 'auto';
        }
      }
    }
  }, [showPlaylistDropdown]);

  useEffect(() => {
    localStorage.setItem('lyrics-font-size', fontSize.toString());
  }, [fontSize]);

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

  // Handle adding song to playlist
  const handleAddToPlaylist = async (playlistId) => {
    setAddingToPlaylist(playlistId);
    setErrorPlaylistId(null);
    
    try {
      await onAddToPlaylist(playlistId, song._id);
      // Show success briefly before closing dropdown
      setTimeout(() => {
        setAddingToPlaylist(null);
        setShowPlaylistDropdown(false);
      }, 800);
    } catch (error) {
      console.error("Error adding to playlist:", error);
      setAddingToPlaylist(null);
      setErrorPlaylistId(playlistId);
    }
  };

  const adjustFontSize = (change) => {
    // Limit size between 12 and 24
    const newSize = Math.max(12, Math.min(24, fontSize + change));
    setFontSize(newSize);
  };

  if (!song) return null;

  // Filter and sort playlists
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Sort playlists alphabetically
  const sortedPlaylists = [...filteredPlaylists].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });

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
              {/* Add font size controls */}
              <div className="font-size-controls">
                <button 
                  className="icon-button font-size-button"
                  title="Decrease font size"
                  onClick={() => adjustFontSize(-1)}
                  disabled={fontSize <= 12}
                >
                  A<span className="font-sm">-</span>
                </button>
                <span className="font-size-value">{fontSize}px</span>
                <button 
                  className="icon-button font-size-button"
                  title="Increase font size"
                  onClick={() => adjustFontSize(1)}
                  disabled={fontSize >= 24}
                >
                  A<span className="font-sm">+</span>
                </button>
              </div>
              
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
              
              {/* Add font size controls for fullscreen mode too */}
              <div className="font-size-controls">
                <button 
                  className="icon-button font-size-button"
                  title="Decrease font size"
                  onClick={() => adjustFontSize(-1)}
                  disabled={fontSize <= 12}
                >
                  A<span className="font-sm">-</span>
                </button>
                <span className="font-size-value">{fontSize}px</span>
                <button 
                  className="icon-button font-size-button"
                  title="Increase font size"
                  onClick={() => adjustFontSize(1)}
                  disabled={fontSize >= 24}
                >
                  A<span className="font-sm">+</span>
                </button>
              </div>
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
              <pre 
                className="lyrics-text"
                style={{ fontSize: `${fontSize}px` }}
              >
                {song.lyrics}
              </pre>
            </div>
          )}
          
          {(activeTab === 'chords' || activeTab === 'both') && song.chords && (
            <div className="chords-section">
              {!isFullscreen && <h3>Chords</h3>}
              <pre 
                className="chords-text"
                style={{ fontSize: `${fontSize}px` }}
              >
                {song.chords}
              </pre>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPlaylistDropdown(!showPlaylistDropdown);
                  }}
                  className={`action-button playlist-button ${showPlaylistDropdown ? 'active' : ''}`}
                >
                  <span className="action-icon">📋</span>
                  <span>Add to Playlist</span>
                  {showPlaylistDropdown ? <span className="dropdown-indicator">▲</span> : <span className="dropdown-indicator">▼</span>}
                </button>
                
                {showPlaylistDropdown && (
                  <div className="playlist-dropdown modern">
                    <div className="playlist-dropdown-header">
                      <h4>Add to playlist</h4>
                      {/* Always show search if there are any playlists */}
                      {playlists.length > 0 && (
                        <div className="playlist-search">
                          <input
                            type="text"
                            placeholder="Search playlists..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                          {searchTerm && (
                            <button 
                              className="clear-search" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSearchTerm('');
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {sortedPlaylists.length > 0 ? (
                      <ul className="playlist-list">
                        {sortedPlaylists.map(playlist => (
                          <li key={playlist.id}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSongInPlaylist(playlist.id)) {
                                  handleAddToPlaylist(playlist.id);
                                }
                              }}
                              className={`
                                ${isSongInPlaylist(playlist.id) ? 'already-added' : ''}
                                ${addingToPlaylist === playlist.id ? 'adding' : ''}
                                ${errorPlaylistId === playlist.id ? 'error' : ''}
                              `}
                              disabled={isSongInPlaylist(playlist.id) || addingToPlaylist}
                            >
                              <span className="playlist-name">{playlist.name}</span>
                              <span className="playlist-count">{playlist.songIds?.length || 0} songs</span>
                              <span className="playlist-status">
                                {addingToPlaylist === playlist.id ? (
                                  <span className="loading-spinner"></span>
                                ) : errorPlaylistId === playlist.id ? (
                                  "!"
                                ) : isSongInPlaylist(playlist.id) ? (
                                  "✓"
                                ) : (
                                  "+"
                                )}
                              </span>
                            </button>
                            {errorPlaylistId === playlist.id && (
                              <div className="error-message">Failed to add song</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : searchTerm ? (
                      <div className="empty-playlists">
                        <p>No playlists match your search</p>
                      </div>
                    ) : (
                      <div className="empty-playlists">
                        <p>No playlists available</p>
                        <p className="create-playlist-hint">Create your first playlist below</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
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