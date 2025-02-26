import { useState } from 'react';

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
        <div className="navbar-brand">
          <h1>Хваление Емануил</h1>
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
            <li onClick={() => handleMenuItemClick('home')}>Начало</li>
            <li onClick={() => handleMenuItemClick('add-song')}>Добави песен</li>
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