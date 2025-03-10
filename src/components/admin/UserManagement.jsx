import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../App';
import { Navigate } from 'react-router-dom';
import './AdminStyles.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, userRole } = useAuth();
  
  useEffect(() => {
    if (isLoggedIn && userRole === 'admin') {
      fetchUsers();
    }
  }, [isLoggedIn, userRole]);
  
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };
  
  const changeUserRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/auth/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };
  
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }
  
  if (userRole !== 'admin') {
    return (
      <div className="unauthorized-container">
        <h2>Unauthorized Access</h2>
        <p>You need administrator privileges to view this page.</p>
      </div>
    );
  }
  
  return (
    <div className="admin-container">
      <h2>User Management</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
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
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.role === 'reader' ? (
                    <button 
                      onClick={() => changeUserRole(user._id, 'admin')}
                      className="role-button"
                    >
                      Make Admin
                    </button>
                  ) : (
                    <button 
                      onClick={() => changeUserRole(user._id, 'reader')}
                      className="role-button"
                    >
                      Make Reader
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserManagement;