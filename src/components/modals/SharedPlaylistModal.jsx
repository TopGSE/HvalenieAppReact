import React from "react";
import { toast } from "react-toastify";
import "./SharedPlaylistModal.css";

// Add this helper function at the beginning of your component
function extractValidPlaylistData(notification) {
  // Default empty playlist structure
  const defaultPlaylist = {
    name: "Shared Playlist",
    description: "",
    songIds: [],
    songs: [],
  };

  // If no notification or playlistData, return the default
  if (!notification) {
    console.log("No notification found");
    return defaultPlaylist;
  }

  // Log the entire notification to see its structure
  console.log("Full notification object:", JSON.stringify(notification, null, 2));

  // Check if there's playlistData object
  if (!notification.playlistData) {
    console.log("No playlistData found in notification");
    return {
      name: notification.playlistName || defaultPlaylist.name,
      description: defaultPlaylist.description,
      songIds: [],
      songs: [],
    };
  }

  // Log what we have in the notification
  console.log("Notification playlistData:", notification.playlistData);

  // Extract data directly from notification
  let songIds = notification.playlistData.songIds || [];
  let songs = notification.playlistData.songs || [];

  // Make sure both are arrays
  if (!Array.isArray(songIds)) songIds = [];
  if (!Array.isArray(songs)) songs = [];

  console.log(`Found ${songIds.length} songIds and ${songs.length} songs in notification`);

  // If we have songs but no songIds, extract songIds from songs
  if (songs.length > 0 && songIds.length === 0) {
    songIds = songs.map(song => song._id).filter(id => id);
    console.log(`Extracted ${songIds.length} songIds from songs`);
  }

  // Return complete data with fallbacks
  return {
    name: notification.playlistData.name || notification.playlistName || defaultPlaylist.name,
    description: notification.playlistData.description || defaultPlaylist.description,
    songIds: songIds,
    songs: songs,
  };
}

function SharedPlaylistModal({
  show,
  onClose,
  notification,
  onAccept,
  onDecline,
}) {
  if (!show || !notification) return null;

  // Extract playlist data safely
  const playlistData = extractValidPlaylistData(notification);

  // Format the song list safely
  const songsList = playlistData.songs.map((song, index) => (
    <li key={song._id || `song-${index}`} className="shared-playlist-song">
      <span className="song-number">{index + 1}.</span>
      <div className="song-info">
        <div className="song-title">{song.title || "Untitled Song"}</div>
        {song.artist && <div className="song-artist">{song.artist}</div>}
        {song.category && (
          <span className="song-category">{song.category}</span>
        )}
      </div>
    </li>
  ));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content shared-playlist-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Shared Playlist</h2>
          <button className="close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="playlist-info-section">
            <h3 className="playlist-name">{playlistData.name}</h3>

            {playlistData.description && (
              <p className="playlist-description">{playlistData.description}</p>
            )}

            <div className="shared-by">
              Shared by:{" "}
              <strong>{notification.fromUserName || "Another user"}</strong>
            </div>

            <div className="song-count">
              {playlistData.songs.length || 0} songs
            </div>
          </div>

          <div className="songs-section">
            <h4>Songs in this playlist:</h4>
            {playlistData.songs.length > 0 ? (
              <ul className="shared-songs-list">{songsList}</ul>
            ) : (
              <p className="no-songs">This playlist has no songs.</p>
            )}
          </div>

          <div className="acceptance-question">
            <p>Do you want to accept this playlist?</p>
            <p className="note">
              Accepting will add this playlist to your collection.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="decline-btn"
            onClick={() => {
              onDecline(notification._id);
              onClose();
            }}
          >
            Decline
          </button>
          <button
            className="accept-btn"
            onClick={() => {
              onAccept(notification._id, playlistData);
              onClose();
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default SharedPlaylistModal;
