import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import SearchBar from './components/SearchBar';
import SongList from './components/SongList';
import SongDetails from './components/SongDetails';
import AddSong from './components/AddSong';
import NavBar from './components/NavBar';
import ConfirmModal from './components/ConfirmModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Add these imports at the top
import EditSong from './components/EditSong';

function App() {
  const [songs, setSongs] = useState(() => {
    const savedSongs = localStorage.getItem('songs');
    return savedSongs ? JSON.parse(savedSongs) : [];
  });
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('searchTerm') || '';
  });
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('currentView') || 'home';
  });
  const [selectedSong, setSelectedSong] = useState(() => {
    const saved = localStorage.getItem('selectedSong');
    return saved ? JSON.parse(saved) : null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('sortOrder') || 'asc';
  });
  const [filterBy, setFilterBy] = useState(() => {
    return localStorage.getItem('filterBy') || 'all';
  });
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const [error, setError] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem('recentlyViewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('songFavorites');
    return savedFavorites ? JSON.parse(savedFavorites) : [];
  });
  // Add this state for edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Updated useEffect for loading songs with better error handling
  useEffect(() => {
    const loadSongs = () => {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting to fetch songs from server...');
      
      axios.get('http://localhost:5000/songs')
        .then(response => {
          console.log(`Fetched ${response.data.length} songs successfully`);
          
          // Check if we got an empty array
          if (response.data.length === 0) {
            console.warn('Server returned an empty array of songs');
            toast.info('No songs found on the server. Try adding some songs!');
          }
          
          setSongs(response.data);
          localStorage.setItem('songs', JSON.stringify(response.data));
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching songs:', error);
          const cachedSongs = localStorage.getItem('songs');
          setIsLoading(false);
          
          if (cachedSongs && JSON.parse(cachedSongs).length > 0) {
            console.log('Using cached songs from localStorage');
            setSongs(JSON.parse(cachedSongs));
            toast.warning('Using cached data. Server connection failed.');
          } else {
            console.log('No cached songs available');
            setError(error);
            toast.error('Could not load songs. Server may be offline.');
          }
        });
    };
    
    loadSongs();
  }, []);

  // Add this function to your component for manual reloading
  const handleReloadSongs = () => {
    console.log('Manual reload triggered');
    setIsLoading(true);
    setError(null);
    
    axios.get('http://localhost:5000/songs')
      .then(response => {
        console.log(`Reloaded ${response.data.length} songs successfully`);
        setSongs(response.data);
        localStorage.setItem('songs', JSON.stringify(response.data));
        setIsLoading(false);
        toast.success('Songs reloaded successfully!');
      })
      .catch(error => {
        console.error('Error reloading songs:', error);
        setIsLoading(false);
        setError(error);
        toast.error('Failed to reload songs from server');
      });
  };

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('songFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('searchTerm', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);

  useEffect(() => {
    if (selectedSong) {
      localStorage.setItem('selectedSong', JSON.stringify(selectedSong));
    } else {
      localStorage.removeItem('selectedSong');
    }
  }, [selectedSong]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('sortOrder', sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem('filterBy', filterBy);
  }, [filterBy]);

  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem('songs', JSON.stringify(songs));
  }, [songs]);

  // Add this useEffect at the beginning of your component
  useEffect(() => {
    // Function to ensure stored references remain valid after a page reload
    const validateStoredReferences = () => {
      // Make sure selectedSong exists in the current songs array
      if (selectedSong) {
        const songExists = songs.some(song => song._id === selectedSong._id);
        if (!songExists) {
          // If song no longer exists, clear the selection
          setSelectedSong(null);
          localStorage.removeItem('selectedSong');
        }
      }
      
      // Filter recentlyViewed to include only existing songs
      if (recentlyViewed.length > 0) {
        const validRecentSongs = recentlyViewed.filter(recentSong => 
          songs.some(song => song._id === recentSong._id)
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
    setIsLoading(true); // Optional: Show loading state
    
    axios.post('http://localhost:5000/songs', newSong)
      .then(response => {
        // Update the songs array with the new song
        setSongs([...songs, response.data]);
        
        // Show success message
        toast.success('Song added successfully!');
        
        // Redirect to home view
        setCurrentView('home');
        
        // Optionally, select the newly added song to show it
        setSelectedSong(response.data);
        
        // Update recently viewed to include the new song
        setRecentlyViewed(prev => {
          const filtered = prev.filter(s => s._id !== response.data._id);
          return [response.data, ...filtered].slice(0, 5); // Keep 5 most recent
        });
        
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error adding song:', error);
        toast.error('Failed to add song.');
        setIsLoading(false);
      });
  };

  // Update the handleRemoveSong function to use ID instead of title
  const handleRemoveSong = (id) => {
    if (!id) {
      console.error('Cannot remove song: id is undefined');
      toast.error('Failed to remove song: missing id');
      return;
    }
    
    console.log(`Removing song with id: ${id}`);
    
    axios.delete(`http://localhost:5000/songs/${id}`)
      .then(() => {
        setSongs(songs.filter(song => song._id !== id));
        setSelectedSong(null);
        toast.success('Song removed successfully!');
      })
      .catch(error => {
        console.error('Error removing song:', error);
        toast.error('Failed to remove song.');
      });
  };

  const handleEditSong = (updatedSong) => {
    console.log('Editing song:', updatedSong);
    
    if (!updatedSong || !updatedSong._id) {
      console.error('Invalid song data or missing ID');
      toast.error('Cannot edit song: missing or invalid data');
      return;
    }
    
    // Make sure the URL is correct
    const url = `http://localhost:5000/songs/${updatedSong._id}`;
    console.log(`Sending PUT request to: ${url}`);
    
    axios.put(url, updatedSong)
      .then(response => {
        console.log('Edit successful, response:', response.data);
        const updatedSongs = songs.map(song =>
          song._id === updatedSong._id ? response.data : song
        );
        setSongs(updatedSongs);
        setSelectedSong(response.data);
        setIsEditing(false);
        toast.success('Song edited successfully!');
      })
      .catch(error => {
        console.error('Error editing song:', error);
        // Show more detailed error information
        if (error.response) {
          console.error('Response error data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
        toast.error(`Failed to edit song: ${error.message}`);
      });
  };

  const filteredSongs = songs
  .filter((song) => {
    // First apply the text search
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Then apply category filter if needed
    if (filterBy !== 'all') {
      return matchesSearch && song.category === filterBy;
    }
    
    return matchesSearch;
  })
  .sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.title.localeCompare(b.title);
    } else if (sortOrder === 'desc') {
      return b.title.localeCompare(a.title);
    } else if (sortOrder === 'recent') {
      // Sort by _id in reverse order (newest first)
      // MongoDB ObjectIDs contain a timestamp in their first bytes
      return b._id.localeCompare(a._id);
    }
    return 0;
  });

  const handleDeleteClick = (song) => {
    console.log(`Preparing to delete song:`, song);
    if (!song || !song.title) {
      console.error('Invalid song object or missing title property:', song);
      toast.error('Cannot delete song: invalid song data');
      return;
    }
    setSongToDelete(song);
    setShowConfirmModal(true);
  };

  // Update the handleConfirmDelete function
  const handleConfirmDelete = () => {
    if (songToDelete && songToDelete._id) {
      console.log(`Confirmed deletion for song: ${songToDelete.title} with ID: ${songToDelete._id}`);
      handleRemoveSong(songToDelete._id);
      setShowConfirmModal(false);
      setSongToDelete(null);
    } else {
      console.error('Cannot delete: songToDelete is undefined or missing ID');
      toast.error('Failed to delete song: missing song data');
      setShowConfirmModal(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('Cancelled deletion');
    setShowConfirmModal(false);
    setSongToDelete(null);
  };

  const retryFetch = () => {
    setError(null);
    axios.get('http://localhost:5000/songs')
      .then(response => {
        setSongs(response.data);
      })
      .catch(error => {
        console.error('Error fetching songs:', error);
        setError(error);
      });
  };

  // Update the song selection function
  const handleSelectSong = (song) => {
    setSelectedSong(song);
    
    // Add to recently viewed and remove duplicates
    setRecentlyViewed(prev => {
      const filtered = prev.filter(s => s._id !== song._id);
      return [song, ...filtered].slice(0, 5); // Keep 5 most recent
    });
  };

  const toggleFavorite = (songId) => {
    if (favorites.includes(songId)) {
      setFavorites(favorites.filter(id => id !== songId));
    } else {
      setFavorites([...favorites, songId]);
    }
  };

  // Add this function to your App component
  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
    localStorage.removeItem('recentlyViewed');
    toast.info('Recently viewed songs cleared');
  };

  // Add this function to your App component
  const clearStoredState = () => {
    localStorage.removeItem('selectedSong');
    localStorage.removeItem('searchTerm');
    localStorage.removeItem('recentlyViewed');
    localStorage.removeItem('sortOrder');
    localStorage.removeItem('filterBy');
    
    // Reset states
    setSelectedSong(null);
    setSearchTerm('');
    setRecentlyViewed([]);
    setSortOrder('asc');
    setFilterBy('all');
    
    toast.info('Application state reset successfully');
  };

  // Add startEditMode function
  const startEditMode = (song) => {
    setIsEditing(true);
  };
  
  // Add cancelEditMode function
  const cancelEditMode = () => {
    setIsEditing(false);
  };

  return (
    <div className="app-container">
      <NavBar 
        setCurrentView={setCurrentView}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      />
      
      {currentView === 'home' && (
        <div className="main-layout">
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <div className="sidebar-header-top">
                <h2>Песни ({songs.length})</h2>
                <button 
                  className="reload-button" 
                  onClick={handleReloadSongs}
                  title="Reload songs from server"
                >
                  🔄
                </button>
              </div>
              <SearchBar onSearch={setSearchTerm} />
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
              <button 
                className="toggle-sidebar"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? '>' : '<'}
              </button>
            </div>
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
                  {recentlyViewed.map(song => (
                    <div 
                      key={song._id} 
                      className="recent-song-item"
                      onClick={() => setSelectedSong(song)}
                      title={song.title} /* Add title for tooltip on hover */
                    >
                      {song.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="sidebar-content">
              {isLoading && <div className="loading-spinner">Loading...</div>}
              {error && (
                <div className="error-container">
                  <h3>Something went wrong</h3>
                  <p>{error.message || 'Unable to load songs'}</p>
                  <button className="retry-button" onClick={retryFetch}>Try Again</button>
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
                  <button className="add-song-button" onClick={() => setCurrentView('add-song')}>
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
          </aside>
          
          <main className="content-area">
            {selectedSong ? (
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
                  onEditSong={startEditMode} // Changed to start edit mode
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
      )}
      
      {currentView === 'add-song' && (
        <div className="add-song-page">
          <div className="add-song-header">
            <h1>Добави нова песен</h1>
            <p>Добави нова песен към списъка</p>
          </div>
          <AddSong onAddSong={handleAddSong} />
        </div>
      )}
      
      <ToastContainer position="bottom-right" />
      <ConfirmModal 
        show={showConfirmModal} 
        onClose={handleCancelDelete} 
        onConfirm={handleConfirmDelete} 
        songTitle={songToDelete ? songToDelete.title : ''}
      />
    </div>
  );
}

export default App;