import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../App";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AdminStyles.css";
import { FaUsers, FaMusic, FaListAlt, FaChartBar } from "react-icons/fa";
import UserManagementModal from "./UserManagementModal";

function Statistics() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: "N/A",
    totalSongs: 0,
    totalPlaylists: 0,
    categoryCounts: {},
    userRoles: {},
  });
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, userRole } = useAuth();
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn && userRole === "admin") {
      fetchStatistics();
    }
  }, [isLoggedIn, userRole]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch songs
      const songsResponse = await axios.get("http://localhost:5000/songs");
      const songs = songsResponse.data;

      // Get playlists from localStorage
      const storedPlaylists = localStorage.getItem("playlists");
      const playlists = storedPlaylists ? JSON.parse(storedPlaylists) : [];

      // Fetch users count (admin only)
      let totalUsers = "N/A";
      try {
        const usersResponse = await axios.get(
          "http://localhost:5000/auth/users/count",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        totalUsers = usersResponse.data.count;
      } catch (userError) {
        console.error("Error fetching user count:", userError);
        // Don't show a toast error for this - it's not critical
        totalUsers = "N/A";
      }

      // Calculate category counts
      const categoryCounts = songs.reduce((acc, song) => {
        if (song.category) {
          acc[song.category] = (acc[song.category] || 0) + 1;
        }
        return acc;
      }, {});

      setStats({
        totalUsers,
        totalSongs: songs.length,
        totalPlaylists: playlists.length,
        categoryCounts,
<<<<<<< HEAD
        userRoles: {},
=======
        userRoles: {}, // Keep this empty for now
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (userRole !== "admin") {
    return (
      <div className="unauthorized-container">
        <h2>Unauthorized Access</h2>
        <p>You need administrator privileges to view this page.</p>
        <button
          onClick={() => navigate("/home")}
          className="return-home-button"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="statistics-header">
        <h2>
          <FaChartBar /> Application Statistics
        </h2>
        <button onClick={fetchStatistics} className="refresh-button">
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading statistics...</div>
      ) : (
        <div className="stats-grid">
          {/* Summary Cards */}
          <div
            className="stats-card clickable-card"
            onClick={() => setShowUserModal(true)}
<<<<<<< HEAD
            title="Click to manage users"
=======
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
          >
            <div className="stats-card-icon">
              <FaUsers />
            </div>
            <div className="stats-card-content">
              <h3>Total Users</h3>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="card-click-hint">Click to manage users</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">
              <FaMusic />
            </div>
            <div className="stats-card-content">
              <h3>Total Songs</h3>
              <div className="stat-value">{stats.totalSongs}</div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-icon">
              <FaListAlt />
            </div>
            <div className="stats-card-content">
              <h3>Total Playlists</h3>
              <div className="stat-value">{stats.totalPlaylists}</div>
            </div>
          </div>

          {/* Category Distribution */}
          {Object.keys(stats.categoryCounts).length > 0 && (
            <div className="stats-card wide-card">
              <h3>Songs by Category</h3>
              <div className="category-bars">
                {Object.entries(stats.categoryCounts).map(
                  ([category, count]) => (
                    <div className="category-item" key={category}>
                      <div className="category-label">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </div>
                      <div className="category-bar-container">
                        <div
                          className="category-bar"
                          style={{
                            width: `${(count / stats.totalSongs) * 100}%`,
                            backgroundColor: getCategoryColor(category),
                          }}
                        ></div>
                      </div>
                      <div className="category-count">{count}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Management Modal */}
      <UserManagementModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
      />
    </div>
  );
}

// Helper function for category colors
function getCategoryColor(category = "") {
  const colors = {
    praise: "#4caf50",
    worship: "#2196f3",
    christmas: "#f44336",
    easter: "#ff9800",
    default: "#9c27b0",
  };

  return colors[category.toLowerCase()] || colors.default;
}

export default Statistics;
