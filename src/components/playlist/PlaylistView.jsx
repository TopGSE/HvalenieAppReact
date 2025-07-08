import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './PlaylistView.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  // Existing states
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  
  // Updated share states
  const [showShareModal, setShowShareModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [shareStep, setShareStep] = useState(1); // 1: select users, 2: share options

  const songRefs = useRef({});

  // Fetch users from database
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await axios.get(`${API_URL}/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Filter out current user
      const filteredUsers = response.data.filter(user => 
        user._id !== currentUser.id && user._id !== currentUser._id
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Handle user selection
  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Share functionality
  const handleShare = async () => {
    setShowShareModal(true);
    setShareStep(1);
    setSelectedUsers([]);
    setUserSearchTerm('');
    await fetchUsers();
  };

  // Send playlist share
  const handleSendShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user to share with');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const shareData = {
        playlistId: playlist.id,
        playlistName: playlist.name,
        recipientIds: selectedUsers,
        message: `${currentUser.username} shared a playlist with you: "${playlist.name}"`,
        playlistData: {
          name: playlist.name,
          description: playlist.description || '',
          songIds: playlist.songIds || [],
          songs: songs
            .filter(song => playlist.songIds && playlist.songIds.includes(song._id))
            .map(song => ({
              title: song.title,
              artist: song.artist || '',
              category: song.category || '',
              _id: song._id
            }))
        }
      };

      await axios.post(`${API_URL}/playlists/share`, shareData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      toast.success(`Playlist shared with ${selectedUsers.length} user(s)!`);
      setShowShareModal(false);
      setShareStep(1);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sharing playlist:', error);
      toast.error('Failed to share playlist');
    }
  };

  // Copy playlist link
  const copyPlaylistLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?playlist=${encodeURIComponent(playlist.name)}`;
      await navigator.clipboard.writeText(url);
      toast.success('Playlist link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Failed to copy link');
    }
  };

  // Copy playlist details as text
  const copyPlaylistDetails = async () => {
    const playlistData = {
      name: playlist.name,
      description: playlist.description || '',
      songCount: playlist.songIds?.length || 0,
      songs: songs
        .filter(song => playlist.songIds && playlist.songIds.includes(song._id))
        .map(song => ({
          title: song.title,
          artist: song.artist || '',
          category: song.category || ''
        }))
    };

    const shareText = `🎵 ${playlistData.name}\n\n${playlistData.description ? `${playlistData.description}\n\n` : ''}📋 ${playlistData.songCount} songs:\n${playlistData.songs.map((song, index) => `${index + 1}. ${song.title}${song.artist ? ` - ${song.artist}` : ''}`).join('\n')}\n\nShared from Hvalenie App`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Playlist details copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
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
          return 0;
      }
    });
    
  const handleFavoriteToggle = (e, songId) => {
    e.stopPropagation();
    toggleFavorite(songId);
  };
  
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
          {playlist.description && (
            <p className="playlist-description">{playlist.description}</p>
          )}
        </div>
        
        <div className="playlist-actions">
          <button 
            className="share-playlist-btn" 
            onClick={handleShare}
            title="Share this playlist"
          >
            <span className="btn-icon">📤</span>
            <span className="btn-text">Share</span>
          </button>
          
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal-content" onClick={e => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>
                {shareStep === 1 ? 'Who would you like to share this playlist with?' : 'Share Options'}
              </h3>
              <button 
                className="close-share-modal"
                onClick={() => setShowShareModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="share-modal-body">
              {shareStep === 1 ? (
                <>
                  <p>Select users to share "<strong>{playlist.name}</strong>" with:</p>
                  
                  {/* User Search */}
                  <div className="user-search">
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="user-search-input"
                    />
                  </div>

                  {/* Users List */}
                  <div className="users-container">
                    {isLoadingUsers ? (
                      <div className="loading-users">
                        <div className="spinner"></div>
                        <p>Loading users...</p>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="no-users">
                        <p>No users found</p>
                      </div>
                    ) : (
                      <div className="users-list">
                        {filteredUsers.map(user => (
                          <div
                            key={user._id}
                            className={`user-item ${selectedUsers.includes(user._id) ? 'selected' : ''}`}
                            onClick={() => handleUserToggle(user._id)}
                          >
                            <div className="user-info">
                              <div className="user-avatar">
                                {user.profilePhoto ? (
                                  <img src={user.profilePhoto} alt={user.username} />
                                ) : (
                                  <span>{user.username.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="user-details">
                                <h4>{user.username}</h4>
                                <p>{user.email}</p>
                              </div>
                            </div>
                            <div className="user-checkbox">
                              {selectedUsers.includes(user._id) ? '✓' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Users Summary */}
                  {selectedUsers.length > 0 && (
                    <div className="selected-users-summary">
                      <p>Selected {selectedUsers.length} user(s)</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="share-actions">
                    <button 
                      className="cancel-share-btn"
                      onClick={() => setShowShareModal(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="continue-share-btn"
                      onClick={() => setShareStep(2)}
                      disabled={selectedUsers.length === 0}
                    >
                      Continue ({selectedUsers.length})
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>How would you like to share this playlist?</p>
                  
                  <div className="share-options">
                    <button 
                      className="share-option-btn send-to-users-btn"
                      onClick={handleSendShare}
                    >
                      <span className="share-icon">👥</span>
                      <span>Send to Selected Users</span>
                    </button>
                    
                    <button 
                      className="share-option-btn copy-link-btn"
                      onClick={() => {
                        copyPlaylistLink();
                        setShowShareModal(false);
                      }}
                    >
                      <span className="share-icon">🔗</span>
                      <span>Copy Link</span>
                    </button>
                    
                    <button 
                      className="share-option-btn copy-text-btn"
                      onClick={() => {
                        copyPlaylistDetails();
                        setShowShareModal(false);
                      }}
                    >
                      <span className="share-icon">📋</span>
                      <span>Copy Details</span>
                    </button>
                  </div>

                  <div className="share-actions">
                    <button 
                      className="back-share-btn"
                      onClick={() => setShareStep(1)}
                    >
                      ← Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistView;