import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../App";
import AvatarEditor from "react-avatar-editor";
import { Scrollbars } from "react-custom-scrollbars-2";
import {
  FaCamera,
  FaEnvelope,
  FaLock,
  FaUser,
  FaCheck,
  FaTimes,
  FaPencilAlt,
} from "react-icons/fa";
import "./UserProfile.css";

function UserProfile() {
  const { user, handleLogout } = useAuth();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preview, setPreview] = useState(null);
  const [src, setSrc] = useState(null);
  const [editor, setEditor] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [isLoading, setIsLoading] = useState(false);

  // Section visibility states
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEmail(response.data.email);
        if (response.data.profilePhoto) {
          setPreview(response.data.profilePhoto);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load user profile");
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdatePhoto = async () => {
    if (!editor) {
      toast.error("Please select an image first");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const canvas = editor.getImageScaledToCanvas();

      // Compress image more aggressively
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

      await axios.put(
        "http://localhost:5000/auth/profile/photo",
        { profilePhoto: dataUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setPreview(dataUrl);
      toast.success("Profile photo updated successfully");
      setShowPhotoSection(false);
      setSrc(null);
    } catch (error) {
      console.error("Error updating profile photo:", error);
      toast.error(
        error.response?.data?.message || "Failed to update profile photo"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Current password is required to update email");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/auth/profile/email",
        { email, password: currentPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Email updated successfully");
      setCurrentPassword("");
      setShowEmailSection(false);
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error(error.response?.data?.message || "Failed to update email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/auth/profile/password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Show confirmation dialog
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        await axios.delete("http://localhost:5000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        handleLogout();
        toast.success("Account deleted successfully");
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size exceeds 2MB");
      return;
    }

    setSrc(URL.createObjectURL(file));
  };

  const handleScaleChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  return (
    <Scrollbars style={{ height: "100vh" }}>
      <div className="user-profile-container">
        <h2>User Profile</h2>

        {/* Profile Photo at the top */}
        <div
          className="profile-photo-top"
          onClick={() => setShowPhotoSection(true)}
        >
          {preview ? (
            <div className="avatar-container">
              <img src={preview} alt="Profile" className="avatar-image-large" />
              <div className="avatar-edit-overlay">
                <FaPencilAlt className="edit-icon" />
              </div>
            </div>
          ) : (
            <div className="avatar-container">
              <div className="avatar-placeholder-large">
                <FaUser />
              </div>
              <div className="avatar-edit-overlay">
                <FaPencilAlt className="edit-icon" />
              </div>
            </div>
          )}
        </div>

        {/* Photo Editor Dialog */}
        {showPhotoSection && (
          <div className="photo-editor-dialog">
            <div className="photo-editor-header">
              <h3>Update Profile Photo</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowPhotoSection(false);
                  setSrc(null);
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="photo-editor-container">
              {!src ? (
                <div className="file-input-container">
                  <label htmlFor="profile-photo" className="file-input-label">
                    <FaCamera className="file-input-icon" />
                    <span>Select Image</span>
                    <input
                      type="file"
                      id="profile-photo"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="avatar-editor-container">
                    <AvatarEditor
                      ref={setEditor}
                      image={src}
                      width={250}
                      height={250}
                      border={50}
                      borderRadius={125}
                      scale={scale}
                    />
                  </div>

                  <div className="zoom-control">
                    <span>Zoom:</span>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.01"
                      value={scale}
                      onChange={handleScaleChange}
                    />
                  </div>

                  <div className="photo-actions">
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => setSrc(null)}
                    >
                      Change Image
                    </button>
                    <button
                      type="button"
                      className="save-button"
                      onClick={handleUpdatePhoto}
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Save Photo"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Email Section */}
        <div className="profile-section">
          <div
            className="section-header"
            onClick={() => setShowEmailSection(!showEmailSection)}
          >
            <FaEnvelope className="section-icon" />
            <h3>Email Address</h3>
            <button type="button" className="toggle-button">
              {showEmailSection ? <FaTimes /> : "Change"}
            </button>
          </div>

          <div
            className={`section-content ${showEmailSection ? "expanded" : ""}`}
          >
            <p className="current-value">{email}</p>

            {showEmailSection && (
              <form onSubmit={handleUpdateEmail} className="update-form">
                <div className="form-group">
                  <label htmlFor="new-email">New Email Address</label>
                  <input
                    id="new-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="current-password-email">
                    Current Password
                  </label>
                  <input
                    id="current-password-email"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your password to confirm"
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowEmailSection(false);
                      setCurrentPassword("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Email"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Password Section */}
        <div className="profile-section">
          <div
            className="section-header"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <FaLock className="section-icon" />
            <h3>Password</h3>
            <button type="button" className="toggle-button">
              {showPasswordSection ? <FaTimes /> : "Change"}
            </button>
          </div>

          <div
            className={`section-content ${
              showPasswordSection ? "expanded" : ""
            }`}
          >
            {showPasswordSection && (
              <form onSubmit={handleUpdatePassword} className="update-form">
                <div className="form-group">
                  <label htmlFor="current-password">Current Password</label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="save-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="danger-zone">
          <h3>Danger Zone</h3>
          <button
            type="button"
            className="delete-account-button"
            onClick={handleDeleteAccount}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </Scrollbars>
  );
}

export default UserProfile;
