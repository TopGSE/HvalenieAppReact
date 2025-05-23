import { useState, useEffect, createContext, useContext } from "react";
import axios from "axios";
import "./App.css";
import SearchBar from "./components/SearchBar";
import SongList from "./components/song/SongList";
import SongDetails from "./components/song/SongDetails";
import AddSong from "./components/AddSong";
import NavBar from "./components/navbar/NavBar";
import ConfirmModal from "./components/modals/ConfirmModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditSong from "./components/song/EditSong";
import PlaylistView from "./components/playlist/PlaylistView";
import PlaylistModal from "./components/modals/PlaylistModal";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import UserProfile from "./components/profile/UserProfile";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import Statistics from "./components/admin/Statistics";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { setupTokenRefresh } from "./utils/authUtils";
import RandomSongGenerator from "./components/modals/RandomSongGenerator";

// Modify the AuthContext section
export const AuthContext = createContext(null);

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Create a wrapper component that will use useLocation
function AppContent({
  isLoggedIn,
  username,
  userRole,
  handleLogin,
  handleLogout,
  songs,
  searchTerm,
  setSearchTerm,
  currentView,
  setCurrentView,
  selectedSong,
  setSelectedSong,
  sidebarCollapsed,
  setSidebarCollapsed,
  showConfirmModal,
  setShowConfirmModal,
  songToDelete,
  setSongToDelete,
  isLoading,
  sortOrder,
  setSortOrder,
  filterBy,
  setFilterBy,
  error,
  recentlyViewed,
  setRecentlyViewed,
  favorites,
  toggleFavorite,
  isEditing,
  setIsEditing,
  playlists,
  setPlaylists,
  currentPlaylist,
  setCurrentPlaylist,
  playlistToEdit,
  setPlaylistToEdit,
  showPlaylistModal,
  setShowPlaylistModal,
  songSourcePlaylist,
  setSongSourcePlaylist,
  handleReloadSongs,
  retryFetch,
  handleSelectSong,
  clearRecentlyViewed,
  startEditMode,
  handleEditSong,
  cancelEditMode,
  filteredSongs,
  handleDeleteClick,
  handleCancelDelete,
  handleConfirmDelete,
  handleDeletePlaylist,
  removeSongFromPlaylist,
  handleSavePlaylist,
  addSongToPlaylist,
  handleAddSong, // Add this line here
}) {
  const location = useLocation();
  const navigate = useNavigate(); // Add this line to get the navigate function

  const [showRandomSongGenerator, setShowRandomSongGenerator] = useState(false); // Add this state

  console.log("AppContent - userRole:", userRole); // Debug log to see the role
  console.log("AppContent - isAdmin check:", userRole === "admin");

  useEffect(() => {
    // Redirect to login page if not logged in and not already on login or register
    if (
      !isLoggedIn &&
      location.pathname !== "/login" &&
      location.pathname !== "/register"
    ) {
      console.log("Redirecting to /login");
      // The navigation will be handled by the <Navigate> component in the Routes.
    }
  }, [isLoggedIn, location]);

  return (
    <div className="app-container">
      <NavBar setCurrentView={setCurrentView} />
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/home" : "/login"} />}
        />
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/home" /> : <Login />}
        />
        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/home" /> : <Register />}
        />
        <Route
          path="/forgot-password"
          element={isLoggedIn ? <Navigate to="/home" /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password/:token"
          element={isLoggedIn ? <Navigate to="/home" /> : <ResetPassword />}
        />
        <Route
          path="/home"
          element={
            isLoggedIn ? (
              <div className="main-layout">
                <aside
                  className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
                >
                  <div className="sidebar-header">
                    <div className="sidebar-header-top">
                      <div className="songs-count-container">
                        <h2>Песни ({songs.length})</h2>
                        <button
                          className="reload-button"
                          onClick={handleReloadSongs}
                          title="Reload songs from server"
                        >
                          🔄
                        </button>
                      </div>
                    </div>

                    <div className="search-container">
                      <SearchBar
                        onSearch={setSearchTerm}
                        totalResults={filteredSongs.length}
                      />
                      <button
                        className="toggle-sidebar"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      >
                        {sidebarCollapsed ? ">" : "<"}
                      </button>
                    </div>

                    <div className="sort-filter-controls">
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="sort-select"
                      >
                        <option value="asc">A-Z</option>
                        <option value="desc">Z-A</option>
                        <option value="recent">Recently Added</option>
                      </select>

                      <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="filter-select"
                      >
                        <option value="all">Всички Песни</option>
                        <option value="praise">Хваление</option>
                        <option value="worship">Поклонение</option>
                        <option value="christmas">Рождество</option>
                        <option value="easter">Възкресение</option>
                      </select>
                    </div>
                  </div>

                  {/* Recently viewed songs section */}
                  {recentlyViewed.length > 0 && !sidebarCollapsed && (
                    <div className="recent-songs">
                      <div className="recent-songs-header">
                        <h3>Скорошни Избрани</h3>
                        <button
                          onClick={clearRecentlyViewed}
                          className="clear-recent-btn"
                          title="Clear recently viewed"
                        >
                          х
                        </button>
                      </div>
                      <div className="recent-songs-list">
                        {recentlyViewed.map((song) => (
                          <div
                            key={song._id}
                            className="recent-song-item"
                            onClick={() => setSelectedSong(song)}
                            title={song.title}
                          >
                            {song.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="sidebar-content">
                    {isLoading && (
                      <div className="loading-spinner">Loading...</div>
                    )}
                    {error && (
                      <div className="error-container">
                        <h3>Something went wrong</h3>
                        <p>{error.message || "Unable to load songs"}</p>
                        <button className="retry-button" onClick={retryFetch}>
                          Try Again
                        </button>
                      </div>
                    )}
                    {!isLoading && !error && filteredSongs.length === 0 && (
                      <div className="empty-state-list">
                        <div className="empty-icon">📝</div>
                        <h3>Няма такава песен</h3>
                        {searchTerm ? (
                          <p>Пробвайте да потърсите отново</p>
                        ) : (
                          <p>Добавете първата ви песен</p>
                        )}
                        <button
                          className="add-song-button"
                          onClick={() => setCurrentView("add-song")}
                        >
                          Add a Song
                        </button>
                      </div>
                    )}
                    <SongList
                      songs={filteredSongs}
                      onSelectSong={handleSelectSong}
                      selectedSongId={selectedSong?._id}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                    />
                  </div>

                  {/* Playlists section */}
                  <div className="playlists-section">
                    {/* Fixed Playlists Header section */}
                    <div className="playlists-header">
                      <h3>Playlists</h3>
                      <div className="playlist-header-buttons">
                        <button
                          onClick={() => setShowRandomSongGenerator(true)}
                          className="generate-playlist-btn"
                          title="Generate random worship set"
                        >
                          🎲
                        </button>
                        <button
                          onClick={() => {
                            setPlaylistToEdit(null);
                            setShowPlaylistModal(true);
                          }}
                          className="add-playlist-btn"
                          title="Create new playlist"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="playlists-list">
                      {playlists.length === 0 ? (
                        <div className="no-playlists">
                          <p>No playlists yet</p>
                        </div>
                      ) : (
                        playlists
                          .filter((playlist) => {
                            // Get current user ID
                            const userData = JSON.parse(
                              localStorage.getItem("user") || "{}"
                            );
                            const userId = userData.id || userData._id;

                            // Only show playlists for current user or playlists without userId (for backward compatibility)
                            return (
                              !playlist.userId || playlist.userId === userId
                            );
                          })
                          .map((playlist) => (
                            <div
                              key={playlist.id}
                              className={`playlist-item ${
                                currentPlaylist?.id === playlist.id
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => {
                                setCurrentPlaylist(playlist);
                                setSelectedSong(null);
                              }}
                            >
                              <div className="playlist-item-name">
                                {playlist.name}
                              </div>
                              <div className="playlist-item-count">
                                {playlist.songIds?.length || 0}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </aside>

                <main className="content-area">
                  {currentPlaylist ? (
                    <PlaylistView
                      playlist={currentPlaylist}
                      songs={songs}
                      onSelectSong={(song) =>
                        handleSelectSong(song, currentPlaylist)
                      }
                      selectedSongId={selectedSong?._id}
                      onEditPlaylist={(playlist) => {
                        setPlaylistToEdit(playlist);
                        setShowPlaylistModal(true);
                      }}
                      onDeletePlaylist={handleDeletePlaylist}
                      onRemoveSongFromPlaylist={removeSongFromPlaylist}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                    />
                  ) : selectedSong ? (
                    isEditing ? (
                      <EditSong
                        song={selectedSong}
                        onSaveEdit={handleEditSong}
                        onCancel={cancelEditMode}
                      />
                    ) : (
                      <SongDetails
                        song={selectedSong}
                        onRemoveSong={handleDeleteClick}
                        onEditSong={startEditMode}
                        playlists={playlists}
                        onAddToPlaylist={addSongToPlaylist}
                        onCreatePlaylist={() => {
                          setPlaylistToEdit(null);
                          setShowPlaylistModal(true);
                        }}
                        songSourcePlaylist={songSourcePlaylist}
                        setCurrentPlaylist={setCurrentPlaylist}
                      />
                    )
                  ) : (
                    <div className="empty-state">
                      <h2>Изберете песен за повече подробности.</h2>
                      <p>Изберете песен от списъка отляво.</p>
                    </div>
                  )}
                </main>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/add-song"
          element={
            isLoggedIn && userRole === "admin" ? (
              <div className="add-song-page">
                <AddSong onAddSong={handleAddSong} />
              </div>
            ) : isLoggedIn ? (
              <div className="unauthorized-page">
                <h2>Unauthorized Access</h2>
                <p>You need administrator privileges to add songs.</p>
                <p>Your current role: {userRole || "none"}</p>
                <button onClick={() => navigate("/home")}>
                  Return to Home
                </button>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? (
              <UserProfile handleSavePlaylist={handleSavePlaylist} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/statistics"
          element={
            isLoggedIn && userRole === "admin" ? (
              <Statistics />
            ) : isLoggedIn ? (
              <div className="unauthorized-page">
                <h2>Unauthorized Access</h2>
                <p>You need administrator privileges to view statistics.</p>
                <p>Your current role: {userRole || "none"}</p>
                <button onClick={() => navigate("/home")}>
                  Return to Home
                </button>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
      <ToastContainer position="bottom-right" />
      <ConfirmModal
        show={showConfirmModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        songTitle={songToDelete ? songToDelete.title : ""}
      />
      <PlaylistModal
        show={showPlaylistModal}
        onClose={() => {
          setShowPlaylistModal(false);
          setPlaylistToEdit(null);
        }}
        onSave={handleSavePlaylist}
        playlist={playlistToEdit}
      />
      <RandomSongGenerator
        show={showRandomSongGenerator}
        onClose={() => setShowRandomSongGenerator(false)}
        songs={songs}
        onCreatePlaylist={handleSavePlaylist}
      />
    </div>
  );
}

function App() {
  // All your state and functions here
  const [songs, setSongs] = useState(() => {
    const savedSongs = localStorage.getItem("songs");
    return savedSongs ? JSON.parse(savedSongs) : [];
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem("searchTerm") || "";
  });
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem("currentView") || "home";
  });
  const [selectedSong, setSelectedSong] = useState(() => {
    const saved = localStorage.getItem("selectedSong");
    return saved ? JSON.parse(saved) : null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem("sortOrder") || "asc";
  });
  const [filterBy, setFilterBy] = useState(() => {
    return localStorage.getItem("filterBy") || "all";
  });
  const [error, setError] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem("recentlyViewed");
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem("songFavorites");
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });
  // Add this state for edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Add these states to your App component
  const [playlists, setPlaylists] = useState(() => {
    const savedPlaylists = localStorage.getItem("playlists");
    return savedPlaylists ? JSON.parse(savedPlaylists) : [];
  });
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [playlistToEdit, setPlaylistToEdit] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songSourcePlaylist, setSongSourcePlaylist] = useState(null);

  // Authentication state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));

  // Login handler
  const handleLogin = (username, role, userData = null) => {
    setIsLoggedIn(true);
    setUsername(username);
    setUserRole(role);

    if (userData) {
      setUser(userData); // Set user data if provided directly
    } else {
      // Fetch fresh user data after login
      const token = localStorage.getItem("token");
      if (token) {
        axios
          .get("http://localhost:5000/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((response) => {
            const userData = response.data;
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          })
          .catch((error) => {
            console.error("Error fetching user profile:", error);
          });
      }
    }

    // Run the playlist migration after login
    migrateUserPlaylists();
  };

  // Logout handler
  const handleLogout = (deletedUserId) => {
    // Clear all user data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user"); // Important: Also clear the user object

    // Reset all user-related state
    setToken(null);
    setIsLoggedIn(false);
    setUsername(null);
    setUserRole(null);
    setUser(null); // Also reset the user object in state

    // If a userId was provided (account deletion), clean up associated playlists
    if (deletedUserId) {
      const storedPlaylists = localStorage.getItem("playlists");
      if (storedPlaylists) {
        const parsedPlaylists = JSON.parse(storedPlaylists);
        const filteredPlaylists = parsedPlaylists.filter(
          (playlist) => playlist.userId !== deletedUserId
        );

        localStorage.setItem("playlists", JSON.stringify(filteredPlaylists));
        setPlaylists(filteredPlaylists);
      }
    }

    // Other logout actions you might have...
  };

  // Updated useEffect for loading songs with better error handling
  useEffect(() => {
    const loadSongs = () => {
      setIsLoading(true);
      setError(null);

      axios
        .get("http://localhost:5000/songs")
        .then((response) => {
          // Check if we got an empty array
          if (response.data.length === 0) {
            console.warn("Server returned an empty array of songs");
            toast.info("No songs found on the server. Try adding some songs!");
          }

          setSongs(response.data);
          localStorage.setItem("songs", JSON.stringify(response.data));
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching songs:", error);
          const cachedSongs = localStorage.getItem("songs");
          setIsLoading(false);

          if (cachedSongs && JSON.parse(cachedSongs).length > 0) {
            console.log("Using cached songs from localStorage");
            setSongs(JSON.parse(cachedSongs));
            toast.warning("Using cached data. Server connection failed.");
          } else {
            console.log("No cached songs available");
            setError(error);
            toast.error("Could not load songs. Server may be offline.");
          }
        });
    };

    if (isLoggedIn) {
      loadSongs();
    }
  }, [isLoggedIn]);

  // Add this function to your component for manual reloading
  const handleReloadSongs = () => {
    setIsLoading(true);
    setError(null);

    axios
      .get("http://localhost:5000/songs")
      .then((response) => {
        setSongs(response.data);
        localStorage.setItem("songs", JSON.stringify(response.data));
        setIsLoading(false);
        toast.success("Songs reloaded successfully!");
      })
      .catch((error) => {
        console.error("Error reloading songs:", error);
        setIsLoading(false);
        setError(error);
        toast.error("Failed to reload songs from server");
      });
  };

  useEffect(() => {
    localStorage.setItem("songFavorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("searchTerm", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem("currentView", currentView);
  }, [currentView]);

  useEffect(() => {
    if (selectedSong) {
      localStorage.setItem("selectedSong", JSON.stringify(selectedSong));
    } else {
      localStorage.removeItem("selectedSong");
    }
  }, [selectedSong]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("sortOrder", sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem("filterBy", filterBy);
  }, [filterBy]);

  useEffect(() => {
    localStorage.setItem("recentlyViewed", JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem("songs", JSON.stringify(songs));
  }, [songs]);

  // Effect to save playlists to localStorage
  useEffect(() => {
    localStorage.setItem("playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Add this useEffect at the beginning of your component
  useEffect(() => {
    // Function to ensure stored references remain valid after a page reload
    const validateStoredReferences = () => {
      // Make sure selectedSong exists in the current songs array
      if (selectedSong) {
        const songExists = songs.some((song) => song._id === selectedSong._id);
        if (!songExists) {
          // If song no longer exists, clear the selection
          setSelectedSong(null);
          localStorage.removeItem("selectedSong");
        }
      }

      // Filter recentlyViewed to include only existing songs
      if (recentlyViewed.length > 0) {
        const validRecentSongs = recentlyViewed.filter((recentSong) =>
          songs.some((song) => song._id === recentSong._id)
        );

        if (validRecentSongs.length !== recentlyViewed.length) {
          setRecentlyViewed(validRecentSongs);
        }
      }
    };

    // Only run this once songs are loaded
    if (songs.length > 0) {
      validateStoredReferences();
    }
  }, [songs]);

  const handleAddSong = (newSong) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    setIsLoading(true);

    axios
      .post("http://localhost:5000/songs", newSong, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        // Update the songs array with the new song
        setSongs([...songs, response.data]);

        // Show success message
        toast.success("Song added successfully!");

        // Redirect to home view
        setCurrentView("home");

        // Optionally, select the newly added song to show it
        setSelectedSong(response.data);

        // Update recently viewed to include the new song
        setRecentlyViewed((prev) => {
          const filtered = prev.filter((s) => s._id !== response.data._id);
          return [response.data, ...filtered].slice(0, 5); // Keep 5 most recent
        });

        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error adding song:", error);
        toast.error("Failed to add song.");
        setIsLoading(false);
      });
  };

  // Update the handleRemoveSong function to use ID instead of title
  const handleRemoveSong = (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    axios
      .delete(`http://localhost:5000/songs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setSongs(songs.filter((song) => song._id !== id));
        setSelectedSong(null);
        toast.success("Song removed successfully!");
      })
      .catch((error) => {
        console.error("Error removing song:", error);
        toast.error("Failed to remove song.");
      });
  };

  const handleEditSong = (updatedSong) => {
    if (!updatedSong || !updatedSong._id) {
      console.error("Invalid song data or missing ID");
      toast.error("Cannot edit song: missing or invalid data");
      return;
    }

    // Get the token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    // Make sure the URL is correct
    const url = `http://localhost:5000/songs/${updatedSong._id}`;

    // Include the token in the Authorization header
    axios
      .put(url, updatedSong, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        const updatedSongs = songs.map((song) =>
          song._id === updatedSong._id ? response.data : song
        );
        setSongs(updatedSongs);
        setSelectedSong(response.data);
        setIsEditing(false);
        toast.success("Song edited successfully!");
      })
      .catch((error) => {
        console.error("Error editing song:", error);
        // Show more detailed error information
        if (error.response) {
          console.error("Response error data:", error.response.data);
          console.error("Response status:", error.response.status);
        }
        toast.error(`Failed to edit song: ${error.message}`);
      });
  };

  const filteredSongs = songs
    .filter((song) => {
      // First apply the text search
      const matchesSearch = song.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Then apply category filter if needed
      if (filterBy !== "all") {
        return matchesSearch && song.category === filterBy;
      }

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === "desc") {
        return b.title.localeCompare(a.title);
      } else if (sortOrder === "recent") {
        // Sort by _id in reverse order (newest first)
        // MongoDB ObjectIDs contain a timestamp in their first bytes
        return b._id.localeCompare(a._id);
      }
      return 0;
    });

  const handleDeleteClick = (song) => {
    if (!song || !song.title) {
      console.error("Invalid song object or missing title property:", song);
      toast.error("Cannot delete song: invalid song data");
      return;
    }
    setSongToDelete(song);
    setShowConfirmModal(true);
  };

  // Update the handleConfirmDelete function
  const handleConfirmDelete = () => {
    if (songToDelete && songToDelete._id) {
      handleRemoveSong(songToDelete._id);
      setShowConfirmModal(false);
      setSongToDelete(null);
    } else {
      console.error("Cannot delete: songToDelete is undefined or missing ID");
      toast.error("Failed to delete song: missing song data");
      setShowConfirmModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setSongToDelete(null);
  };

  const retryFetch = () => {
    setError(null);
    axios
      .get("http://localhost:5000/songs")
      .then((response) => {
        setSongs(response.data);
      })
      .catch((error) => {
        console.error("Error fetching songs:", error);
        setError(error);
      });
  };

  // Update the song selection function
  const handleSelectSong = (song, fromPlaylist = null) => {
    setSelectedSong(song);
    setSongSourcePlaylist(fromPlaylist); // Track which playlist we came from
    setCurrentPlaylist(null); // Clear current playlist to show song details

    // Add to recently viewed
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((s) => s._id !== song._id);
      return [song, ...filtered].slice(0, 5); // Keep 5 most recent
    });
  };

  const toggleFavorite = (songId) => {
    if (favorites.includes(songId)) {
      setFavorites(favorites.filter((id) => id !== songId));
    } else {
      setFavorites([...favorites, songId]);
    }
  };

  // Add this function to your App component
  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem("recentlyViewed");
    toast.info("Recently viewed songs cleared");
  };

  // Add this function to your App component
  const clearStoredState = () => {
    localStorage.removeItem("selectedSong");
    localStorage.removeItem("searchTerm");
    localStorage.removeItem("recentlyViewed");
    localStorage.removeItem("sortOrder");
    localStorage.removeItem("filterBy");

    // Reset states
    setSelectedSong(null);
    setSearchTerm("");
    setRecentlyViewed([]);
    setSortOrder("asc");
    setFilterBy("all");

    toast.info("Application state reset successfully");
  };

  // Add startEditMode function
  const startEditMode = (song) => {
    setIsEditing(true);
  };

  // Add cancelEditMode function
  const cancelEditMode = () => {
    setIsEditing(false);
  };

  // Function to create or update a playlist
  const handleSavePlaylist = (playlistData) => {
    // Get current user ID from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.id || userData._id || null;

    if (playlistData.id) {
      // Update existing playlist - only if it belongs to current user
      const updatedPlaylists = playlists.map((p) =>
        p.id === playlistData.id && p.userId === userId
          ? {
              ...p,
              ...playlistData,
              userId, // Ensure userId is maintained
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      setPlaylists(updatedPlaylists);

      // If the updated playlist was the current one, update that too
      if (currentPlaylist && currentPlaylist.id === playlistData.id) {
        setCurrentPlaylist({
          ...currentPlaylist,
          ...playlistData,
          userId,
          updatedAt: new Date().toISOString(),
        });
      }
      toast.success("Playlist updated!");
    } else {
      // Create new playlist
      const newPlaylist = {
        ...playlistData,
        id: Date.now().toString(),
        userId, // Add the current user's ID
        songIds: playlistData.songIds || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPlaylists([...playlists, newPlaylist]);
      toast.success("Playlist created!");
    }
    setShowPlaylistModal(false);
    setPlaylistToEdit(null);
  };

  // Function to add a song to a playlist
  const addSongToPlaylist = (playlistId, songId) => {
    // Get current user ID
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.id || userData._id;

    // Check if song exists
    if (!songs.some((song) => song._id === songId)) {
      toast.error("Song not found");
      return;
    }

    // Check if playlist exists
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      toast.error("Playlist not found");
      return;
    }

    // Check playlist ownership
    if (playlist.userId && playlist.userId !== userId) {
      toast.error("You don't have permission to modify this playlist");
      return;
    }

    // Check if song is already in playlist
    if (playlist.songIds && playlist.songIds.includes(songId)) {
      toast.info(`Song is already in playlist "${playlist.name}"`);
      return;
    }

    // Create a new array of songIds or use existing one
    const songIds = playlist.songIds ? [...playlist.songIds, songId] : [songId];

    const updatedPlaylists = playlists.map((p) => {
      if (p.id === playlistId) {
        return {
          ...p,
          songIds: songIds,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setPlaylists(updatedPlaylists);

    // If this was the current playlist, update that too
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      setCurrentPlaylist({
        ...currentPlaylist,
        songIds: songIds,
        updatedAt: new Date().toISOString(),
      });
    }

    toast.success("Song added to playlist!");
  };

  // Function to remove a song from a playlist
  const removeSongFromPlaylist = (playlistId, songId) => {
    // Get current user ID
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.id || userData._id;

    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      toast.error("Playlist not found");
      return;
    }

    // Check playlist ownership
    if (playlist.userId && playlist.userId !== userId) {
      toast.error("You don't have permission to modify this playlist");
      return;
    }

    const updatedPlaylists = playlists.map((playlist) => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songIds: playlist.songIds.filter((id) => id !== songId),
          updatedAt: new Date().toISOString(),
        };
      }
      return playlist;
    });

    setPlaylists(updatedPlaylists);

    // If this was the current playlist, update that too
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      setCurrentPlaylist({
        ...currentPlaylist,
        songIds: currentPlaylist.songIds.filter((id) => id !== songId),
        updatedAt: new Date().toISOString(),
      });
    }

    toast.success("Song removed from playlist");
  };

  // Update the handleDeletePlaylist function to check for playlist ownership:

  const handleDeletePlaylist = (playlistId) => {
    // Get current user ID
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.id || userData._id;

    // Find the playlist
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) {
      toast.error("Playlist not found");
      return;
    }

    // Check playlist ownership
    if (playlist.userId && playlist.userId !== userId) {
      toast.error("You don't have permission to delete this playlist");
      return;
    }

    const updatedPlaylists = playlists.filter((p) => p.id !== playlistId);
    setPlaylists(updatedPlaylists);

    // If this was the current playlist, clear it
    if (currentPlaylist && currentPlaylist.id === playlistId) {
      setCurrentPlaylist(null);
    }

    toast.success("Playlist deleted");
  };

  useEffect(() => {
    // Set up token refresh mechanism
    setupTokenRefresh();

    // Check if user is already logged in (from previous session)
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const userRole = localStorage.getItem("userRole");

    if (token && username) {
      // Auto login from stored credentials
      handleLogin(username, userRole);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Inside your main App component, add this effect
  useEffect(() => {
    const handleUserUpdate = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    };

    window.addEventListener("storage:user-updated", handleUserUpdate);

    return () => {
      window.removeEventListener("storage:user-updated", handleUserUpdate);
    };
  }, []);

  // In your App.jsx where you initialize the user state
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Set initial logged in state
      setIsLoggedIn(true);

      // Load user data from localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      // Fetch fresh user data from server
      axios
        .get("http://localhost:5000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const userData = response.data;
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
        });
    }
  }, []);

  // Add this function to your App component:

  const migrateUserPlaylists = () => {
    // This should run once on app initialization
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.id || userData._id;

    // Skip if no user is logged in
    if (!userId) return;

    // Get all playlists from localStorage
    const storedPlaylists = localStorage.getItem("playlists");
    if (!storedPlaylists) return;

    let playlists = JSON.parse(storedPlaylists);

    // Add userId to any playlists without one (legacy playlists)
    let needsUpdate = false;
    playlists = playlists.map((playlist) => {
      if (!playlist.userId) {
        needsUpdate = true;
        return {
          ...playlist,
          userId,
        };
      }
      return playlist;
    });

    // Store updated playlists if needed
    if (needsUpdate) {
      localStorage.setItem("playlists", JSON.stringify(playlists));
      setPlaylists(playlists);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        token,
        username,
        userRole,
        handleLogin,
        handleLogout,
      }}
    >
      <Router>
        <AppContent
          // Pass all state and handlers as props
          isLoggedIn={isLoggedIn}
          username={username}
          userRole={userRole}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          songs={songs}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentView={currentView}
          setCurrentView={setCurrentView}
          selectedSong={selectedSong}
          setSelectedSong={setSelectedSong}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          showConfirmModal={showConfirmModal}
          setShowConfirmModal={setShowConfirmModal}
          songToDelete={songToDelete}
          setSongToDelete={setSongToDelete}
          isLoading={isLoading}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
          error={error}
          recentlyViewed={recentlyViewed}
          setRecentlyViewed={setRecentlyViewed}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          playlists={playlists}
          setPlaylists={setPlaylists}
          currentPlaylist={currentPlaylist}
          setCurrentPlaylist={setCurrentPlaylist}
          playlistToEdit={playlistToEdit}
          setPlaylistToEdit={setPlaylistToEdit}
          showPlaylistModal={showPlaylistModal}
          setShowPlaylistModal={setShowPlaylistModal}
          songSourcePlaylist={songSourcePlaylist}
          setSongSourcePlaylist={setSongSourcePlaylist}
          handleReloadSongs={handleReloadSongs}
          retryFetch={retryFetch}
          handleSelectSong={handleSelectSong}
          clearRecentlyViewed={clearRecentlyViewed}
          startEditMode={startEditMode}
          handleEditSong={handleEditSong}
          cancelEditMode={cancelEditMode}
          filteredSongs={filteredSongs}
          handleDeleteClick={handleDeleteClick}
          handleCancelDelete={handleCancelDelete}
          handleConfirmDelete={handleConfirmDelete}
          handleDeletePlaylist={handleDeletePlaylist}
          removeSongFromPlaylist={removeSongFromPlaylist}
          handleSavePlaylist={handleSavePlaylist}
          addSongToPlaylist={addSongToPlaylist}
          handleAddSong={handleAddSong} // Add this line to pass handleAddSong
        />
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
