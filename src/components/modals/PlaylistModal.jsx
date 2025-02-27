import React, { useState, useEffect } from 'react';
import './PlaylistModal.css';

function PlaylistModal({ show, onClose, onSave, playlist }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when modal opens or playlist changes
  useEffect(() => {
    if (show) {
      if (playlist) {
        setName(playlist.name || '');
        setDescription(playlist.description || '');
      } else {
        // Reset form for new playlist
        setName('');
        setDescription('');
      }
    }
  }, [show, playlist]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert("Playlist name is required");
      return;
    }
    
    const playlistData = {
      name: name.trim(),
      description: description.trim()
    };
    
    if (playlist && playlist.id) {
      // If editing, keep the ID
      playlistData.id = playlist.id;
    }
    
    // Call the onSave handler with playlist data
    onSave(playlistData);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content playlist-modal" onClick={e => e.stopPropagation()}>
        <h2>{playlist ? 'Edit Playlist' : 'Create New Playlist'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="playlist-name">Name</label>
            <input
              id="playlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name"
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="playlist-description">Description (optional)</label>
            <textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this playlist"
            />
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={!name.trim()}
            >
              {playlist ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlaylistModal;