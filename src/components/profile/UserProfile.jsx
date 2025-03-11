import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../App';
import AvatarEditor from 'react-avatar-editor';
import { Scrollbars } from 'react-custom-scrollbars-2';
import './UserProfile.css';

function UserProfile() {
  const { username, handleLogout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [preview, setPreview] = useState(null);
  const [src, setSrc] = useState(null);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmail(response.data.email);
        setPreview(response.data.profilePhoto); // Assuming profilePhoto is a URL
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load user profile');
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const canvas = editor.getImageScaledToCanvas().toDataURL();
      await axios.put('http://localhost:5000/auth/profile', 
        { email, password, newPassword, profilePhoto: canvas },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      handleLogout();
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 716800) {
      const reader = new FileReader();
      reader.onload = () => {
        setSrc(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert("File is too big!");
    }
  };

  return (
    <Scrollbars style={{ height: '100vh' }}>
      <div className="user-profile-container">
        <h2>User Profile</h2>
        <div className="avatar-upload">
          <input type="file" onChange={handleFileChange} />
          {src && (
            <AvatarEditor
              ref={(ref) => setEditor(ref)}
              image={src}
              width={250}
              height={250}
              border={50}
              borderRadius={125}
              scale={1.2}
            />
          )}
          {preview && (
            <div className="avatar-preview">
              <img src={preview} alt="Profile Preview" />
            </div>
          )}
        </div>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="section-divider"></div>
          
          <div className="form-group">
            <label htmlFor="password">Current Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button type="submit">Update Profile</button>
        </form>
        <button className="delete-account-button" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>
    </Scrollbars>
  );
}

export default UserProfile;