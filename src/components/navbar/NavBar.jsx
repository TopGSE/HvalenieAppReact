import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";
import { useAuth } from "../../App"; // Import the auth context
import { FaUser, FaChartBar } from "react-icons/fa"; // Added FaChartBar for statistics icon

function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, username, userRole, user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  const isAdmin = userRole === "admin";

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
