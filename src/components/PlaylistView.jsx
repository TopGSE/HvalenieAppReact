import React, { useState, useRef } from 'react';
import './PlaylistView.css';

function PlaylistView({ 
  playlist, 
  songs, 
  onSelectSong, 
  selectedSongId,
  onEditPlaylist, 
  onDeletePlaylist,
  onRemoveSongFromPlaylist,
  favorites = [],
  toggleFavorite
}) {
  // Add these missing states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');

  const songRefs = useRef({});

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Filter songs by playlist's songIds
  const playlistSongs = songs.filter(song => 
    playlist.songIds && playlist.songIds.includes(song._id)
  );

  // Apply search and sorting
  const sortedPlaylistSongs = playlistSongs
    .filter(song => song.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch(sortOrder) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'artist':
          return (a.artist || '').localeCompare(b.artist || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0; // Original order
      }
    });
    
  // Handle favorite toggle with event stop propagation
  const handleFavoriteToggle = (e, songId) => {
    e.stopPropagation();
    toggleFavorite(songId);
  };
  
  // Handle remove song with event stop propagation
  const handleRemoveSong = (e, songId) => {
    e.stopPropagation();
    onRemoveSongFromPlaylist(playlist.id, songId);
  };

  return (
    <div className="playlist-view">
      <div className="playlist-header">
        <div className="playlist-info">
          <h3>{playlist.name}</h3>
          <p className="playlist-song-count">{playlist.songIds ? playlist.songIds.length : 0} songs</p>
        </div>
        
        <div className="playlist-actions">
          <button 
            className="edit-playlist-btn" 
            onClick={() => onEditPlaylist(playlist)}
          >
            <span className="btn-icon">✏️</span>
            <span className="btn-text">Edit</span>
          </button>
          
          {confirmDelete ? (
            <div className="confirm-delete">
              <span>Are you sure?</span>
              <button 
                className="confirm-yes" 
                onClick={() => onDeletePlaylist(playlist.id)}
              >
                Yes
              </button>
              <button 
                className="confirm-no" 
                onClick={() => setConfirmDelete(false)}
              >
                No
              </button>
            </div>
          ) : (
            <button 
              className="delete-playlist-btn" 
              onClick={() => setConfirmDelete(true)}
            >
              <span className="btn-icon">🗑️</span>
              <span className="btn-text">Delete</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="playlist-tools">
        <div className="playlist-search">
          <input
            type="text"
            placeholder="Search in this playlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="playlist-search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="playlist-sort">
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="default">Original Order</option>
            <option value="title">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="artist">Artist</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>
      
      {sortedPlaylistSongs.length === 0 ? (
        <div className="empty-playlist">
          {searchTerm ? (
            <>
              <div className="empty-icon">🔍</div>
              <h3>No matching songs found</h3>
              <p>Try a different search term or clear the search.</p>
            </>
          ) : (
            <>
              <div className="empty-icon">🎵</div>
              <h3>This playlist is empty</h3>
              <p>Add songs to this playlist by selecting a song and using the "Add to Playlist" option.</p>
            </>
          )}
        </div>
      ) : (
        <div className="playlist-songs">
          {sortedPlaylistSongs.map((song, index) => (
            <div 
              key={song._id}
              ref={el => songRefs.current[song._id] = el}
              className={`playlist-song-item ${selectedSongId === song._id ? 'selected' : ''}`}
              onClick={() => onSelectSong(song)}
              style={{animationDelay: `${index * 0.05}s`}}
            >
              <div className="song-info">
                <div className="song-number">{index + 1}</div>
                <div className="song-details">
                  <h3>{song.title}</h3>
                  {song.artist && <p className="song-artist">{song.artist}</p>}
                  {song.category && <span className="song-category">{song.category}</span>}
                </div>
              </div>
              
              <div className="song-actions">
                {toggleFavorite && (
                  <button 
                    className="favorite-btn"
                    onClick={(e) => handleFavoriteToggle(e, song._id)}
                    aria-label={favorites.includes(song._id) ? "Remove from favorites" : "Add to favorites"}
                  >
                    {favorites.includes(song._id) ? '★' : '☆'}
                  </button>
                )}
                
                <button
                  className="remove-btn"
                  onClick={(e) => handleRemoveSong(e, song._id)}
                  aria-label="Remove from playlist"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlaylistView;