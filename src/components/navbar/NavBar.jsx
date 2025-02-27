import React, { useState } from 'react';
import './NavBar.css';

function NavBar({ setCurrentView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Toggle body scroll when menu is open
    if (!mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const handleMenuItemClick = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <span>Hvalenie</span>
        </div>

        {/* Hamburger menu icon for mobile */}
        <div className="hamburger-menu" onClick={toggleMobileMenu}>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
        </div>

        {/* Navigation links */}
        <div className={`navbar-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <ul className="navbar-links">
            <li><button onClick={() => handleMenuItemClick('home')}>Home</button></li>
            <li><button onClick={() => handleMenuItemClick('add-song')}>Add Song</button></li>
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