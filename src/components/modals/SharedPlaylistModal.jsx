import React from "react";
import { toast } from "react-toastify";
import "./SharedPlaylistModal.css";

function SharedPlaylistModal({
  show,
  onClose,
  notification,
  onAccept,
  onDecline,
}) {
  if (!show || !notification) return null;

  // Extract playlist data from the notification
  const { playlistData } = notification;

  // Format the song list
  const songsList = playlistData?.songs?.map((song, index) => (
    <li key={song._id} className="shared-playlist-song">
      <span className="song-number">{index + 1}.</span>
      <div className="song-info">
        <div className="song-title">{song.title}</div>
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
            <h3 className="playlist-name">
              {playlistData?.name || "Untitled Playlist"}
            </h3>

            {playlistData?.description && (
              <p className="playlist-description">{playlistData.description}</p>
            )}

            <div className="shared-by">
              Shared by:{" "}
              <strong>{notification.fromUserName || "Another user"}</strong>
            </div>

            <div className="song-count">
              {playlistData?.songs?.length || 0} songs
            </div>
          </div>

          <div className="songs-section">
            <h4>Songs in this playlist:</h4>
            {playlistData?.songs?.length > 0 ? (
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
