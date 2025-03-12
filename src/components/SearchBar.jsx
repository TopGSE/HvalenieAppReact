import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

function SearchBar({ onSearch, totalResults }) {
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef(null);

  // Handle search text change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    onSearch(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchText("");
    onSearch("");
    searchInputRef.current.focus();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Escape key clears search
    if (e.key === "Escape") {
      clearSearch();
    }
    // Ctrl+F or Cmd+F focuses search
    if ((e.ctrlKey || e.metaKey) && e.key === "f") {
      e.preventDefault();
      searchInputRef.current.focus();
    }
  };

  // Add global keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className={`search-bar ${isFocused ? "focused" : ""}`}>
      <FaSearch className="search-icon" />
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search for a song..."
        value={searchText}
        onChange={handleSearchChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Search songs"
      />
      {searchText && (
        <button
          className="clear-search-btn"
          onClick={clearSearch}
          aria-label="Clear search"
        >
          <FaTimes />
        </button>
      )}
      {searchText && typeof totalResults !== "undefined" && (
        <div className="search-results-count">
          {totalResults} result{totalResults !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
