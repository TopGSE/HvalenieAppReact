import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./NavBar.css";
import { useAuth } from "../../App"; // Import the auth context

function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, username, userRole, handleLogout } = useAuth(); // Added username here
  const navigate = useNavigate();

  // Add these debug logs
  console.log("NavBar - userRole:", userRole);
  console.log("NavBar - isAdmin:", userRole === "admin");

  // Check if user is admin
  const isAdmin = userRole === "admin";

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Toggle body scroll when menu is open
    if (!mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  };

  const handleMenuItemClick = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
  };

  const handleLogoutClick = () => {
    handleLogout(); // Call the logout function from context
    setMobileMenuOpen(false);
    document.body.style.overflow = "";
    navigate("/login"); // Navigate to login page
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/" onClick={handleMenuItemClick}>
            Hvalenie Emanuil
          </Link>
        </div>

        {/* Hamburger menu icon for mobile */}
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

        {/* Navigation links */}
        <div className={`navbar-menu ${mobileMenuOpen ? "open" : ""}`}>
          <ul className="navbar-links">
            {isLoggedIn ? (
              // Links for logged-in users
              <>
                <li>
                  <Link to="/home" onClick={handleMenuItemClick}>
                    Home
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/add-song" onClick={handleMenuItemClick}>
                      Add Song
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/profile" onClick={handleMenuItemClick}>
                    Profile
                  </Link>
                </li>
                <li>
                  <button className="logout-button" onClick={handleLogoutClick}>
                    Logout {username ? `(${username})` : ""}
                  </button>
                </li>
              </>
            ) : (
              // Links for non-logged-in users
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

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div className="menu-overlay" onClick={toggleMobileMenu}></div>
      )}
    </>
  );
}

export default NavBar;
