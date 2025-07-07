import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import "./AuthForm.css";
import API_URL from "../../utils/api";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!username) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });
      toast.success("Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );

      // Handle specific error cases
      if (error.response?.data?.message?.includes("email")) {
        setErrors({ email: "This email is already in use" });
      } else if (error.response?.data?.message?.includes("username")) {
        setErrors({ username: "This username is already taken" });
      } else {
        toast.error(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-form-header">
          <h2>Create Account</h2>
          <p>Sign up to join Hvalenie Emanuil</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaUser className="input-icon" />
              <input
                className={`icon-input ${errors.username ? "input-error" : ""}`}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>
            {errors.username && (
              <div className="error-message">{errors.username}</div>
            )}
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaEnvelope className="input-icon" />
              <input
                className={`icon-input ${errors.email ? "input-error" : ""}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
              />
            </div>
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                className={`icon-input ${errors.password ? "input-error" : ""}`}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("password")}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>

          <div className="form-group">
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                className={`icon-input ${
                  errors.confirmPassword ? "input-error" : ""
                }`}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("confirm")}
                tabIndex="-1"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="checkmark"></span>I agree to the{" "}
              <Link to="/terms">Terms of Service</Link>
            </label>
          </div>

          <button
            type="submit"
            className={`submit-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
