import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
<<<<<<< HEAD
import {
  FaTimes,
  FaUserCog,
  FaUserShield,
  FaSearch,
  FaSpinner,
} from "react-icons/fa";
=======
import { FaTimes, FaUserCog, FaUserShield, FaSearch, FaSpinner } from "react-icons/fa";
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
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
<<<<<<< HEAD
    (user) =>
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
=======
    user => 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
  );

  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-container user-management-modal">
        <div className="modal-header">
<<<<<<< HEAD
          <h2>
            <FaUserShield /> User Management
          </h2>
=======
          <h2>User Management</h2>
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
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
<<<<<<< HEAD
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search-input"
              autoFocus
            />
            {searchTerm && (
              <button
=======
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search-input"
            />
            {searchTerm && (
              <button 
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
                className="clear-search"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <div className="user-count">
<<<<<<< HEAD
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
=======
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
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
<<<<<<< HEAD
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
=======
                                onClick={() => changeUserRole(user._id, "admin")}
                                className="role-button"
                                disabled={processingUser === user._id}
                              >
                                {processingUser === user._id ? 
                                  <FaSpinner className="button-spinner" /> : 
                                  "Make Admin"
                                }
                              </button>
                            ) : (
                              <button
                                onClick={() => changeUserRole(user._id, "reader")}
                                className="role-button reader-button"
                                disabled={processingUser === user._id}
                              >
                                {processingUser === user._id ? 
                                  <FaSpinner className="button-spinner" /> : 
                                  "Make Reader"
                                }
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
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
<<<<<<< HEAD
                  {searchTerm
                    ? `No users found matching "${searchTerm}"`
                    : "No users found"}
=======
                  {searchTerm ? 
                    `No users found matching "${searchTerm}"` : 
                    "No users found"
                  }
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
                </div>
              )}
            </>
          )}
        </div>
<<<<<<< HEAD
=======

        <div className="modal-footer">
          <button onClick={onClose} className="close-modal-btn">
            Close
          </button>
        </div>
>>>>>>> 42cf276c15669b4c871574debad4a0dd932de515
      </div>
    </div>
  );
}

export default UserManagementModal;
