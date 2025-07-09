import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";
import { useAuth } from "../../App";
import {
  FaUser,
  FaChartBar,
  FaBell,
  FaTrash,
  FaTimesCircle,
} from "react-icons/fa";
import axios from "axios";
import API_URL from "../../utils/api";
import { toast } from "react-toastify";
import SharedPlaylistModal from "../modals/SharedPlaylistModal";

function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState(null);
  const { isLoggedIn, username, userRole, user } = useAuth();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // New state for shared playlist modal
  const [showSharedPlaylistModal, setShowSharedPlaylistModal] = useState(false);
  const [currentSharedNotification, setCurrentSharedNotification] =
    useState(null);

  // Check if user is admin
  const isAdmin = userRole === "admin";

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isLoggedIn) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/auth/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(response.data);
      setUnreadCount(response.data.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/auth/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Delete a single notification
  const deleteNotification = async (notificationId, event) => {
    // Stop event propagation to prevent opening the notification
    if (event) {
      event.stopPropagation();
    }

    try {
      setDeletingNotificationId(notificationId);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/auth/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      const updatedNotifications = notifications.filter(
        (n) => n._id !== notificationId
      );
      setNotifications(updatedNotifications);

      // Update unread count
      setUnreadCount(updatedNotifications.filter((n) => !n.read).length);

      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setDeletingNotificationId(null);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      setIsDeletingAll(true);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/auth/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update local state
      setNotifications([]);
      setUnreadCount(0);

      toast.success("All notifications cleared");
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // If not read, mark it as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Handle different notification types
    if (notification.type === "playlist_share") {
      // Show shared playlist acceptance modal
      setShowSharedPlaylistModal(true);
      setCurrentSharedNotification(notification);
      setShowNotifications(false);
    }
  };

  // Handle accepting a shared playlist
  const handleAcceptPlaylist = (notificationId, playlistData) => {
    try {
      console.log(
        "Accepting playlist with data:",
        JSON.stringify(playlistData, null, 2)
      );

      // Validate that playlistData exists and has the expected structure
      if (!playlistData) {
        toast.error("Invalid playlist data received");
        return;
      }

      // Get current playlists from localStorage
      const storedPlaylists = localStorage.getItem("playlists");
      let playlists = storedPlaylists ? JSON.parse(storedPlaylists) : [];

      // Get current user ID
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = userData.id || userData._id;

      // CRITICAL FIX: First, retrieve songs from localStorage
      const storedSongsStr = localStorage.getItem("songs");
      let availableSongs = storedSongsStr ? JSON.parse(storedSongsStr) : [];
      console.log(`User has ${availableSongs.length} songs in their library`);

      // IMPORTANT FIX: Check if playlistData contains proper songs array
      // Log the structure of playlistData to see what we're working with
      console.log("PlaylistData structure:", {
        hasSongIds: Array.isArray(playlistData.songIds),
        songIdsLength: playlistData.songIds ? playlistData.songIds.length : 0,
        hasSongs: Array.isArray(playlistData.songs),
        songsLength: playlistData.songs ? playlistData.songs.length : 0,
      });

      // Get both songIds and full songs data from notification
      let songIds = Array.isArray(playlistData.songIds)
        ? [...playlistData.songIds]
        : [];
      let sharedSongs = Array.isArray(playlistData.songs)
        ? [...playlistData.songs]
        : [];

      console.log("Initial data:", {
        songIds: songIds.length,
        sharedSongs: sharedSongs.length,
      });

      // If we don't have any songIds or songs, try to extract from notification directly
      if (songIds.length === 0 && sharedSongs.length === 0 && currentSharedNotification) {
        console.log("Trying to extract song data directly from notification");

        if (currentSharedNotification.playlistData) {
          if (Array.isArray(currentSharedNotification.playlistData.songIds)) {
            songIds = [...currentSharedNotification.playlistData.songIds];
            console.log(
              `Found ${songIds.length} song IDs directly in notification.playlistData`
            );
          }

          if (Array.isArray(currentSharedNotification.playlistData.songs)) {
            sharedSongs = [...currentSharedNotification.playlistData.songs];
            console.log(
              `Found ${sharedSongs.length} songs directly in notification.playlistData`
            );
          }
        }
      }

      // If we still have songIds but no songs, try to find them in available songs
      if (songIds.length > 0 && sharedSongs.length === 0) {
        console.log("Finding song details for songIds from user's library");
        sharedSongs = songIds
          .map((id) => {
            const song = availableSongs.find((s) => s._id === id);
            if (!song) {
              console.log(`Song ID ${id} not found in user's library`);
            }
            return song;
          })
          .filter(Boolean);

        console.log(`Found ${sharedSongs.length} songs from songIds in user's library`);
      }

      // If we have songs but no songIds, extract IDs from songs
      if (songIds.length === 0 && sharedSongs.length > 0) {
        console.log("Extracting songIds from shared songs");
        songIds = sharedSongs.map((song) => song._id).filter(Boolean);
        console.log(`Extracted ${songIds.length} song IDs from song objects`);
      }

      // Final check - if we still have no songs, we can't proceed
      if (songIds.length === 0) {
        console.warn("No songs found in shared playlist data");
        toast.error("The shared playlist doesn't contain any songs");
        return; // Don't create empty playlists
      }

      // CRITICAL FIX: Always add the shared songs to the user's library first
      const existingSongIds = new Set(availableSongs.map((song) => song._id));
      const newSongs = [];
      const validSongIds = []; // Track which song IDs are valid after processing

      // Process each song from the shared playlist
      for (const songId of songIds) {
        // Find the corresponding song object from the shared songs array
        const sharedSong = sharedSongs.find((song) => song._id === songId);

        // If we can't find the song data, try to create a placeholder
        if (!sharedSong) {
          console.warn(`No data found for song ID: ${songId}`);

          // Still add the ID to valid IDs if it's not in the user's library
          // The user might have the song locally but the shared data is missing details
          if (!existingSongIds.has(songId)) {
            const placeholderSong = {
              _id: songId,
              title: "Shared Song",
              artist: "",
              category: "other",
              lyrics: "",
              chords: "",
              createdAt: new Date().toISOString(),
            };

            newSongs.push(placeholderSong);
            existingSongIds.add(songId);
            validSongIds.push(songId);
            console.log(`Created placeholder for song ID: ${songId}`);
          } else {
            // If it exists in the user's library, it's valid
            validSongIds.push(songId);
          }

          continue;
        }

        // If song doesn't exist in user's library, add it
        if (!existingSongIds.has(songId)) {
          const newSong = {
            _id: songId,
            title: sharedSong.title || "Shared Song",
            artist: sharedSong.artist || "",
            category: sharedSong.category || "other",
            lyrics: sharedSong.lyrics || "",
            chords: sharedSong.chords || "",
            createdAt: new Date().toISOString(),
          };

          newSongs.push(newSong);
          existingSongIds.add(songId); // Add to set to prevent duplicates
        }

        // Add this song ID to valid song IDs list
        validSongIds.push(songId);
      }

      // Update local songs storage if new songs were added
      if (newSongs.length > 0) {
        console.log(
          `Adding ${newSongs.length} new songs from the shared playlist to local storage`
        );

        // Add the new songs to the user's local storage
        const updatedSongs = [...availableSongs, ...newSongs];
        localStorage.setItem("songs", JSON.stringify(updatedSongs));
      }

      // Create a new playlist object with the valid song IDs
      const newPlaylist = {
        id: Date.now().toString(),
        name: playlistData.name || "Shared Playlist",
        description: playlistData.description || "",
        songIds: validSongIds, // Use our validated list of song IDs
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sharedFrom: currentSharedNotification
          ? currentSharedNotification.fromUserName || "Another user"
          : "Another user",
      };

      console.log("Creating new playlist:", {
        name: newPlaylist.name,
        description: newPlaylist.description,
        songCount: validSongIds.length,
        songIds: validSongIds,
      });

      // Add to playlists
      playlists.push(newPlaylist);

      // Save back to localStorage
      localStorage.setItem("playlists", JSON.stringify(playlists));

      // Try to update app state through events
      try {
        window.dispatchEvent(new Event("playlistsUpdated"));
      } catch (e) {
        console.log("Could not dispatch event, but playlist was saved");
      }

      // Show success notification
      toast.success(
        `Playlist "${newPlaylist.name}" added to your collection with ${validSongIds.length} songs!`
      );

      // After accepting, delete the notification
      deleteNotification(notificationId);

      // Force a refresh to ensure UI is updated
      window.location.reload();
    } catch (error) {
      console.error("Error accepting playlist:", error);
      toast.error("Failed to add playlist to your collection");
    }
  };

  // Handle declining a shared playlist
  const handleDeclinePlaylist = (notificationId) => {
    // When declining, we also delete the notification
    deleteNotification(notificationId);
    toast.info("Playlist share declined");
  };

  // Fetch notifications when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();

      // Refresh notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Handle click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format notification time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Toggle body scroll when menu is open
    document.body.style.overflow = !mobileMenuOpen ? "hidden" : "";
  };

  const handleMenuItemClick = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  };

  // Handle clicks outside to close menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuOpen && e.target.classList.contains("menu-overlay")) {
        setMobileMenuOpen(false);
        document.body.style.overflow = "";
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/" onClick={handleMenuItemClick}>
            Hvalenie Emanuil
          </Link>
        </div>

        {/* Hamburger menu always visible in top-right */}
        <div className="hamburger-menu" onClick={toggleMobileMenu}>
          <span
            className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`}
          ></span>
          <span
            className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`}
          ></span>
          <span
            className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`}
          ></span>
        </div>

        <div className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`}>
          <ul className="navbar-links">
            {isLoggedIn ? (
              <>
                <li>
                  <Link to="/home" onClick={handleMenuItemClick}>
                    Home
                  </Link>
                </li>
                {isAdmin && (
                  <>
                    <li>
                      <Link to="/add-song" onClick={handleMenuItemClick}>
                        Add Song
                      </Link>
                    </li>
                    <li className="admin-nav-item">
                      <Link
                        to="/statistics"
                        onClick={handleMenuItemClick}
                        className="stats-link"
                      >
                        Statistics
                      </Link>
                    </li>
                  </>
                )}
                {/* Notification Bell */}
                <li className="notification-nav-item" ref={notificationRef}>
                  <button
                    className="notification-bell"
                    onClick={() => setShowNotifications(!showNotifications)}
                    aria-label="Notifications"
                  >
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="notification-badge">{unreadCount}</span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h3>Notifications</h3>
                        <div className="notification-actions">
                          {notifications.length > 0 && (
                            <button
                              className="clear-all-notifications"
                              onClick={clearAllNotifications}
                              disabled={isDeletingAll}
                            >
                              {isDeletingAll ? (
                                <span className="deleting-spinner"></span>
                              ) : (
                                <>Clear all</>
                              )}
                            </button>
                          )}
                          {unreadCount > 0 && (
                            <span className="unread-count">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="notification-list">
                        {isLoading ? (
                          <div className="notification-loading">
                            <div className="notification-spinner"></div>
                            <p>Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="no-notifications">
                            <p>No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`notification-item ${
                                !notification.read ? "unread" : ""
                              }`}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <div className="notification-content">
                                <div className="notification-icon">
                                  {notification.type === "playlist_share"
                                    ? "🎵"
                                    : "📣"}
                                </div>
                                <div className="notification-details">
                                  <p className="notification-message">
                                    {notification.message}
                                  </p>
                                  <span className="notification-time">
                                    {formatTime(notification.createdAt)}
                                  </span>
                                </div>
                                {!notification.read && (
                                  <div className="notification-dot"></div>
                                )}

                                <button
                                  className="delete-notification-btn"
                                  onClick={(e) =>
                                    deleteNotification(notification._id, e)
                                  }
                                  disabled={
                                    deletingNotificationId === notification._id
                                  }
                                >
                                  {deletingNotificationId ===
                                  notification._id ? (
                                    <span className="deleting-spinner small"></span>
                                  ) : (
                                    <FaTimesCircle />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {notifications.length > 0 && (
                        <div className="notification-footer">
                          <button
                            className="refresh-notifications"
                            onClick={fetchNotifications}
                          >
                            Refresh
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
                <li className="profile-nav-item">
                  <Link
                    to="/profile"
                    onClick={handleMenuItemClick}
                    className="profile-link"
                  >
                    {user && user.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={username || "Profile"}
                        className="navbar-profile-photo"
                      />
                    ) : (
                      <div className="navbar-profile-placeholder">
                        <FaUser />
                      </div>
                    )}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" onClick={handleMenuItemClick}>
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" onClick={handleMenuItemClick}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      {/* Improved overlay that becomes visible when menu is open */}
      <div
        className={`menu-overlay ${mobileMenuOpen ? "visible" : ""}`}
        onClick={toggleMobileMenu}
      ></div>

      {/* Add this new overlay for notifications */}
      {showNotifications && (
        <div
          className="notification-overlay visible"
          onClick={() => setShowNotifications(false)}
        ></div>
      )}

      {/* Shared Playlist Modal */}
      <SharedPlaylistModal
        show={showSharedPlaylistModal}
        onClose={() => setShowSharedPlaylistModal(false)}
        notification={currentSharedNotification}
        onAccept={handleAcceptPlaylist}
        onDecline={handleDeclinePlaylist}
      />
    </>
  );
}

export default NavBar;
