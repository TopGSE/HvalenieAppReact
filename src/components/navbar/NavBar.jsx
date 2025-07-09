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
      console.log("Accepting playlist with data:", JSON.stringify(playlistData, null, 2));
      
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
      
      // Extract songIds safely
      let songIds = [];
      
      // If we have songIds, use them
      if (playlistData.songIds && playlistData.songIds.length > 0) {
        console.log(`Using ${playlistData.songIds.length} songIds from playlistData`);
        songIds = [...playlistData.songIds];
      } 
      // Otherwise extract from songs if available
      else if (playlistData.songs && playlistData.songs.length > 0) {
        songIds = playlistData.songs.map(song => song._id).filter(id => id);
        console.log(`Extracted ${songIds.length} songIds from song objects`);
      }
      
      if (songIds.length === 0) {
        console.warn("No songs found in shared playlist data");
      }
      
      // Create a new playlist object
      const newPlaylist = {
        id: Date.now().toString(), // Generate a new unique ID
        name: playlistData.name || "Shared Playlist", // Use a default name if none provided
        description: playlistData.description || "",
        songIds: songIds, // Use the extracted songIds
        userId: userId, // CRITICAL: Assign to current user - ensure this is set correctly
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sharedFrom: notification.fromUserName || "Another user", // Track who shared it
      };
      
      // Log the new playlist for debugging
      console.log("Creating new playlist:", newPlaylist);
      
      // Add to playlists
      playlists.push(newPlaylist);
      
      // Save back to localStorage
      localStorage.setItem("playlists", JSON.stringify(playlists));
      
      // Also try to trigger any needed UI updates - this might be needed in some implementations
      // If you have a global state management like Redux, you might need to dispatch an action here
      
      // If there's an event system, emit a custom event to notify that playlists have changed
      try {
        window.dispatchEvent(new Event('playlistsUpdated'));
      } catch (e) {
        console.log("Could not dispatch event, but playlist was saved");
      }
      
      // Show success notification
      toast.success(`Playlist "${newPlaylist.name}" added to your collection with ${songIds.length} songs!`);
      
      // After accepting, delete the notification
      deleteNotification(notificationId);
      
      // Force a refresh if needed (only as a last resort)
      // Uncomment the next line if the playlists still don't show up
      // window.location.reload();
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
