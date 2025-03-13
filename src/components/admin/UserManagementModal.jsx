import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaUserCog,
  FaUserShield,
  FaSearch,
  FaSpinner,
  FaSortAlphaDown,
  FaFilter,
  FaEllipsisV,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./AdminStyles.css";

function UserManagementModal({ show, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingUser, setProcessingUser] = useState(null);
  const [sortBy, setSortBy] = useState("username");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    if (show) {
      fetchUsers();
    }
  }, [show]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5000/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    try {
      setProcessingUser(userId);
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/auth/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(`User role updated successfully to ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    } finally {
      setProcessingUser(null);
    }
  };

  // Filter users based on search term and role filter
  let filteredUsers = users.filter(
    (user) =>
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterRole === "all" || user.role === filterRole)
  );

  // Sort users based on selected sort option
  filteredUsers = filteredUsers.sort((a, b) => {
    if (sortBy === "username") {
      return a.username.localeCompare(b.username);
    } else if (sortBy === "email") {
      return a.email.localeCompare(b.email);
    } else if (sortBy === "role") {
      return a.role.localeCompare(b.role);
    }
    return 0;
  });

  if (!show) return null;

  return (
    <div
      className="user-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="user-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="user-modal-header">
          <h2>
            <FaUserShield /> User Management
          </h2>
          <button className="user-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="user-modal-toolbar">
          <div className="user-search-container">
            <FaSearch className="user-search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search-input"
              autoFocus
            />
            {searchTerm && (
              <button
                className="user-search-clear"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          <div className="user-filter-controls">
            <div className="user-filter-dropdown">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="user-filter-select"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="reader">Readers</option>
              </select>
              <FaFilter className="user-filter-icon" />
            </div>

            <div className="user-sort-dropdown">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="user-sort-select"
              >
                <option value="username">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="role">Sort by Role</option>
              </select>
              <FaSortAlphaDown className="user-sort-icon" />
            </div>
          </div>
        </div>

        <div className="user-modal-stats">
          <div className="user-count-badge">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}{" "}
            found
          </div>
          <div className="user-role-breakdown">
            <span className="role-count admin">
              <FaUserShield /> {users.filter((u) => u.role === "admin").length}{" "}
              Admin(s)
            </span>
            <span className="role-count reader">
              <FaUserCog /> {users.filter((u) => u.role === "reader").length}{" "}
              Reader(s)
            </span>
          </div>
        </div>

        <div className="user-modal-content">
          {loading ? (
            <div className="user-loading-container">
              <div className="user-loading-spinner">
                <FaSpinner />
              </div>
              <p>Loading users...</p>
            </div>
          ) : (
            <>
              {filteredUsers.length > 0 ? (
                <div className="user-grid">
                  {filteredUsers.map((user) => (
                    <div key={user._id} className="user-card">
                      <div className="user-card-header">
                        <div className="user-avatar">
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="user-info">
                          <h3 className="user-name">{user.username}</h3>
                          <p className="user-email">{user.email}</p>
                        </div>
                        <div className="user-role-tag">
                          <span className={`role-badge ${user.role}`}>
                            {user.role === "admin" ? (
                              <>
                                <FaUserShield /> Admin
                              </>
                            ) : (
                              <>
                                <FaUserCog /> Reader
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="user-card-actions">
                        {user.role === "reader" ? (
                          <button
                            onClick={() => changeUserRole(user._id, "admin")}
                            className="user-role-button promote"
                            disabled={processingUser === user._id}
                          >
                            {processingUser === user._id ? (
                              <>
                                <FaSpinner className="button-spinner" />{" "}
                                Processing...
                              </>
                            ) : (
                              <>Make Admin</>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => changeUserRole(user._id, "reader")}
                            className="user-role-button demote"
                            disabled={processingUser === user._id}
                          >
                            {processingUser === user._id ? (
                              <>
                                <FaSpinner className="button-spinner" />{" "}
                                Processing...
                              </>
                            ) : (
                              <>Make Reader</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="user-empty-state">
                  <FaExclamationTriangle />
                  {searchTerm
                    ? `No users found matching "${searchTerm}"`
                    : "No users found"}
                  <button className="user-refresh-button" onClick={fetchUsers}>
                    Refresh
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagementModal;
