import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaTimes,
  FaUserCog,
  FaUserShield,
  FaSearch,
  FaSpinner,
} from "react-icons/fa";
import "./AdminStyles.css";

function UserManagementModal({ show, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingUser, setProcessingUser] = useState(null);

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

      // Update local state
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );

      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    } finally {
      setProcessingUser(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-container user-management-modal">
        <div className="modal-header">
          <h2>
            <FaUserShield /> User Management
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-toolbar">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search-input"
              autoFocus
            />
            {searchTerm && (
              <button
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <div className="user-count">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <FaSpinner className="spinner" />
              <p>Loading users...</p>
            </div>
          ) : (
            <>
              {filteredUsers.length > 0 ? (
                <div className="table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user._id}>
                          <td className="username-cell">{user.username}</td>
                          <td>{user.email}</td>
                          <td>
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
                          </td>
                          <td>
                            {user.role === "reader" ? (
                              <button
                                onClick={() =>
                                  changeUserRole(user._id, "admin")
                                }
                                className="role-button"
                                disabled={processingUser === user._id}
                              >
                                {processingUser === user._id ? (
                                  <FaSpinner className="button-spinner" />
                                ) : (
                                  "Make Admin"
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  changeUserRole(user._id, "reader")
                                }
                                className="role-button reader-button"
                                disabled={processingUser === user._id}
                              >
                                {processingUser === user._id ? (
                                  <FaSpinner className="button-spinner" />
                                ) : (
                                  "Make Reader"
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  {searchTerm
                    ? `No users found matching "${searchTerm}"`
                    : "No users found"}
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
