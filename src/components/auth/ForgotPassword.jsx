import React, { useState } from "react";
import axios from "axios";
import API_URL from "../../utils/api";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import "./AuthForm.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setEmailSent(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to send reset email. Please try again."
      );
      if (error.response?.status === 404) {
        setErrors({ email: "No account found with this email address" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-form-container">
        <div className="auth-form-header">
          <h2>Forgot Password</h2>
          <p>{emailSent ? "Check your email" : "Enter your email address"}</p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleSubmit}>
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

            <button
              type="submit"
              className={`submit-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <p>
              If an account with that email exists, we've sent instructions to
              reset your password. Please check your inbox and spam folder.
            </p>
            <button
              className="submit-button"
              onClick={() => navigate("/login")}
            >
              Return to Login
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
