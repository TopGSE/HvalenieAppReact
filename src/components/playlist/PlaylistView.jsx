import React, { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast } from "react-toastify";
import axios from "axios";
import "./PlaylistView.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function PlaylistView({
  playlist,
  songs,
  onSelectSong,
  selectedSongId,
  onEditPlaylist,
  onDeletePlaylist,
  onRemoveSongFromPlaylist,
  favorites = [],
  toggleFavorite,
  onReorderSongs, // new prop
}) {
  // Existing states
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Kebab menu state
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setActionsOpen(false);
      }
    }
    if (actionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionsOpen]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default");

  // Updated share states
  const [showShareModal, setShowShareModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [shareStep, setShareStep] = useState(1); // 1: select users, 2: share options

  // --- Swipe-to-right delete animation state ---
  const [swipingSongId, setSwipingSongId] = useState(null);

  const songRefs = useRef({});

  // Fetch users from database
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem("token");

      // This is the key fix - use the correct URL
      // Don't use localhost in production!
      const baseUrl =
        window.location.hostname === "localhost" ? "http://localhost:5000" : "";

      const response = await axios.get(`${baseUrl}/auth/users/share`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Filter out current user just in case
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      const filteredUsers = response.data.filter(
        (user) => user._id !== currentUser.id && user._id !== currentUser._id
      );

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Show a more helpful error message
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to load users";
      toast.error(errorMsg);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Handle user selection
  const handleUserToggle = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
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
    setUserSearchTerm("");
    await fetchUsers();
  };

  // Send playlist share - Modified version
  const handleSendShare = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user to share with");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      // Get full song objects for each song ID in the playlist
      const playlistSongs = songs
        .filter(
          (song) => playlist.songIds && playlist.songIds.includes(song._id)
        )
        .map((song) => ({
          _id: song._id,
          title: song.title,
          artist: song.artist || "",
          category: song.category || "",
          // Only include essential data, not the full song content
        }));

      // Ensure we have song IDs from the playlist
      const songIds = playlistSongs.map((song) => song._id);

      // Check if we have valid data
      if (songIds.length === 0) {
        toast.error("This playlist is empty. Add songs before sharing.");
        return;
      }

      console.log(`Sharing playlist with ${playlistSongs.length} songs`);

      // Format the share data properly
      const shareData = {
        playlistId: playlist._id || playlist.id,
        playlistName: playlist.name,
        recipientIds: selectedUsers,
        message: `${
          currentUser.username || "Someone"
        } shared a playlist with you: "${playlist.name}"`,
        playlistData: {
          name: playlist.name,
          description: playlist.description || "",
          songIds: songIds, // Send the extracted song IDs explicitly
          songs: playlistSongs, // Send the song objects
        },
      };

      // Log the data we're sending to help debug
      console.log("Sending share data:", {
        ...shareData,
        songCount: shareData.playlistData.songs.length,
        songIdCount: shareData.playlistData.songIds.length,
      });

      // Make the request to the server
      const response = await axios.post(
        `${API_URL}/playlists/share`,
        shareData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Share response:", response.data);

      // Get usernames and avatars of recipients for a more personalized toast
      const recipientInfos = selectedUsers
        .map((userId) => {
          const user = users.find((u) => u._id === userId);
          return user
            ? { username: user.username, avatar: user.profilePhoto }
            : null;
        })
        .filter(Boolean);

      const recipientText =
        recipientInfos.length > 1
          ? `${recipientInfos
              .slice(0, -1)
              .map((u) => u.username)
              .join(", ")} and ${recipientInfos.slice(-1)[0].username}`
          : recipientInfos[0]?.username || "";

      toast.success(
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {recipientInfos.map((u, i) =>
            u.avatar ? (
              <img
                key={u.username + i}
                src={u.avatar}
                alt={u.username}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginRight: 2,
                }}
              />
            ) : (
              <span
                key={u.username + i}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#b2b2b2",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 14,
                  marginRight: 2,
                }}
              >
                {u.username.charAt(0).toUpperCase()}
              </span>
            )
          )}
          <span style={{ fontWeight: 500 }}>
            Playlist shared with {recipientText}!
          </span>
        </span>
      );
      setShowShareModal(false);
      setShareStep(1);
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error sharing playlist:", error);

      // More detailed error logging to help debug
      if (error.response) {
        console.error("Server response:", error.response.data);
        console.error("Status code:", error.response.status);
      }

      toast.error(
        "Failed to share playlist: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Copy playlist link
  const copyPlaylistLink = async () => {
    try {
      const url = `${window.location.origin}${
        window.location.pathname
      }?playlist=${encodeURIComponent(playlist.name)}`;
      await navigator.clipboard.writeText(url);
      toast.success("Playlist link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy link");
    }
  };

  // Copy playlist details as text
  const copyPlaylistDetails = async () => {
    const playlistData = {
      name: playlist.name,
      description: playlist.description || "",
      songCount: playlist.songIds?.length || 0,
      songs: songs
        .filter(
          (song) => playlist.songIds && playlist.songIds.includes(song._id)
        )
        .map((song) => ({
          title: song.title,
          artist: song.artist || "",
          category: song.category || "",
        })),
    };

    const shareText = `🎵 ${playlistData.name}\n\n${
      playlistData.description ? `${playlistData.description}\n\n` : ""
    }📋 ${playlistData.songCount} songs:\n${playlistData.songs
      .map(
        (song, index) =>
          `${index + 1}. ${song.title}${song.artist ? ` - ${song.artist}` : ""}`
      )
      .join("\n")}\n\nShared from Hvalenie App`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Playlist details copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Filter songs by playlist's songIds
  const playlistSongs = songs.filter(
    (song) => playlist.songIds && playlist.songIds.includes(song._id)
  );

  // Keep the original order of songIds for drag-and-drop
  const [orderedSongIds, setOrderedSongIds] = useState(playlist.songIds || []);

  useEffect(() => {
    setOrderedSongIds(playlist.songIds || []);
  }, [playlist.songIds]);

  // Apply search and sorting (except for drag mode, which uses orderedSongIds)
  let sortedPlaylistSongs = playlistSongs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (sortOrder !== "default") {
    sortedPlaylistSongs = [...sortedPlaylistSongs].sort((a, b) => {
      switch (sortOrder) {
        case "title":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "artist":
          return (a.artist || "").localeCompare(b.artist || "");
        case "category":
          return (a.category || "").localeCompare(b.category || "");
        default:
          return 0;
      }
    });
  } else {
    // Use drag-and-drop order
    sortedPlaylistSongs = orderedSongIds
      .map((id) => playlistSongs.find((s) => s._id === id))
      .filter(Boolean)
      .filter((song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }

  // Drag and drop handlers
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(orderedSongIds);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    setOrderedSongIds(newOrder);
    if (onReorderSongs) {
      onReorderSongs(newOrder);
    }
  };

  const handleFavoriteToggle = (e, songId) => {
    e.stopPropagation();
    toggleFavorite(songId);
  };

  // Animate and remove song
  const handleRemoveSong = (e, songId) => {
    e.stopPropagation();
    const playlistId = playlist._id || playlist.id;
    setSwipingSongId(songId);
    setTimeout(() => {
      onRemoveSongFromPlaylist(playlistId, songId);
      setSwipingSongId(null);
    }, 450); // match CSS animation duration
  };

  return (
    <div className="playlist-view">
      <div className="playlist-header">
        <div className="playlist-info">
          <h3>{playlist.name}</h3>
          <p className="playlist-song-count">
            {playlist.songIds ? playlist.songIds.length : 0} songs
          </p>
          {playlist.description && (
            <p className="playlist-description">{playlist.description}</p>
          )}
        </div>

        <div
          className="playlist-actions"
          ref={actionsRef}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            minHeight: 40,
          }}
        >
          <button
            className="playlist-actions-kebab"
            aria-label="Playlist actions"
            aria-haspopup="true"
            aria-expanded={actionsOpen}
            onClick={() => setActionsOpen((open) => !open)}
            style={{
              width: 40,
              height: 40,
              minWidth: 40,
              minHeight: 40,
              maxWidth: 40,
              maxHeight: 40,
              borderRadius: "50%",
              border: "none",
              background: actionsOpen ? "#f0f4fa" : "none",
              boxShadow: actionsOpen
                ? "0 2px 8px rgba(0,110,239,0.10)"
                : "none",
              transition: "background 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <span
              style={{
                fontSize: 24,
                lineHeight: 1,
                color: actionsOpen ? "#006eef" : "#888",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
              }}
            >
              ⋮
            </span>
          </button>
          {actionsOpen && (
            <div
              className="playlist-actions-dropdown"
              style={{
                position: "absolute",
                right: 0,
                top: 40,
                minWidth: 140,
                background: "#fff",
                border: "1px solid #e0e7ef",
                borderRadius: 10,
                boxShadow: "0 8px 32px rgba(0,110,239,0.13)",
                zIndex: 150,
                display: "flex",
                flexDirection: "column",
                padding: "6px 0",
                animation: "fadeIn 0.18s ease",
              }}
              role="menu"
            >
              <button
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 20px",
                  fontSize: 16,
                  color: "#222",
                  cursor: "pointer",
                  transition: "background 0.18s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f5faff")
                }
                onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                onClick={() => {
                  setActionsOpen(false);
                  handleShare();
                }}
                role="menuitem"
              >
                <span role="img" aria-label="Share" style={{ marginRight: 10 }}>
                  📤
                </span>
                Share
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 20px",
                  fontSize: 16,
                  color: "#222",
                  cursor: "pointer",
                  transition: "background 0.18s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f5faff")
                }
                onMouseOut={(e) => (e.currentTarget.style.background = "none")}
                onClick={() => {
                  setActionsOpen(false);
                  onEditPlaylist(playlist);
                }}
                role="menuitem"
              >
                <span role="img" aria-label="Edit" style={{ marginRight: 10 }}>
                  ✏️
                </span>
                Edit
              </button>
              <button
                className="delete"
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 20px",
                  fontSize: 16,
                  color: "#f44336",
                  cursor: "pointer",
                  transition: "background 0.18s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#ffebee";
                  e.currentTarget.style.color = "#b71c1c";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "#f44336";
                }}
                onClick={() => {
                  setActionsOpen(false);
                  setConfirmDelete(true);
                }}
                role="menuitem"
              >
                <span
                  role="img"
                  aria-label="Delete"
                  style={{ marginRight: 10 }}
                >
                  🗑️
                </span>
                Delete
              </button>
            </div>
          )}
          {confirmDelete && (
            <div
              className="confirm-delete"
              style={{
                position: "absolute",
                top: 54,
                right: 0,
                zIndex: 200,
                background: "#fff",
                border: "1px solid #e0e7ef",
                borderRadius: 10,
                boxShadow: "0 8px 32px rgba(0,110,239,0.13)",
                padding: "18px 24px 14px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 200,
              }}
            >
              <span style={{ fontWeight: 500, marginBottom: 12 }}>
                Are you sure?
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="confirm-yes"
                  style={{
                    background: "#f44336",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "7px 18px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 15,
                    boxShadow: "0 2px 8px rgba(244,67,54,0.08)",
                    transition: "background 0.18s",
                  }}
                  onClick={() => {
                    const playlistId = playlist._id || playlist.id;
                    onDeletePlaylist(playlistId);
                  }}
                >
                  Yes
                </button>
                <button
                  className="confirm-no"
                  style={{
                    background: "#f0f0f0",
                    color: "#333",
                    border: "none",
                    borderRadius: 6,
                    padding: "7px 18px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontSize: 15,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "background 0.18s",
                  }}
                  onClick={() => setConfirmDelete(false)}
                >
                  No
                </button>
              </div>
            </div>
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
            <button className="clear-search" onClick={() => setSearchTerm("")}>
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
              <p>
                Add songs to this playlist by selecting a song and using the
                "Add to Playlist" option.
              </p>
            </>
          )}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="playlist-songs-droppable">
            {(provided) => (
              <div
                className="playlist-songs"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {sortedPlaylistSongs.map((song, index) => (
                  <Draggable
                    key={song._id}
                    draggableId={song._id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`playlist-song-item ${
                          selectedSongId === song._id ? "selected" : ""
                        } ${snapshot.isDragging ? "dragging" : ""} ${
                          swipingSongId === song._id ? "swipe-delete" : ""
                        }`}
                        onClick={() => onSelectSong(song)}
                        style={{
                          ...provided.draggableProps.style,
                          animationDelay: `${index * 0.05}s`,
                        }}
                      >
                        <div className="song-info">
                          <div className="song-number">{index + 1}</div>
                          <div className="song-details">
                            <h3>{song.title}</h3>
                            {song.artist && (
                              <p className="song-artist">{song.artist}</p>
                            )}
                            {song.category && (
                              <span className="song-category">
                                {song.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="song-actions">
                          {toggleFavorite && (
                            <button
                              className="favorite-btn"
                              onClick={(e) => handleFavoriteToggle(e, song._id)}
                              aria-label={
                                favorites.includes(song._id)
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                            >
                              {favorites.includes(song._id) ? "★" : "☆"}
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="share-modal-overlay"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="share-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="share-modal-header">
              <h3>
                {shareStep === 1
                  ? "Who would you like to share this playlist with?"
                  : "Share Options"}
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
                  <p>
                    Select users to share "<strong>{playlist.name}</strong>"
                    with:
                  </p>

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
                        {filteredUsers.map((user) => (
                          <div
                            key={user._id}
                            className={`user-item ${
                              selectedUsers.includes(user._id) ? "selected" : ""
                            }`}
                            onClick={() => handleUserToggle(user._id)}
                          >
                            <div className="user-info">
                              <div className="user-avatar">
                                {user.profilePhoto ? (
                                  <img
                                    src={user.profilePhoto}
                                    alt={user.username}
                                  />
                                ) : (
                                  <span>
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="user-details">
                                <h4>{user.username}</h4>
                                <p>{user.email}</p>
                              </div>
                            </div>
                            <div className="user-checkbox">
                              {selectedUsers.includes(user._id) ? "✓" : ""}
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
