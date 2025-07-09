import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";
import { useAuth } from "../../App";
import { FaUser, FaChartBar, FaBell } from "react-icons/fa";
import axios from "axios";

// Import API_URL correctly
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn, username, userRole, user } = useAuth();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

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

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // If not read, mark it as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Handle different notification types
    if (notification.type === "playlist_share") {
      // Find the shared playlist
      const storedPlaylists = localStorage.getItem("playlists");
      if (storedPlaylists) {
        const playlists = JSON.parse(storedPlaylists);
        const playlist = playlists.find((p) => p.id === notification.playlistId);
        if (playlist) {
          navigate("/home"); // Navigate to home where playlists are displayed
        }
      }

      setShowNotifications(false);
    }
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
                        {unreadCount > 0 && (
                          <span className="unread-count">
                            {unreadCount} new
                          </span>
                        )}
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
                              onClick={() => handleNotificationClick(notification)}
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
    </>
  );
}

export default NavBar;
