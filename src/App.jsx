import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import SearchBar from './components/SearchBar';
import SongList from './components/SongList';
import SongDetails from './components/SongDetails';
import AddSong from './components/AddSong';
import NavBar from './components/NavBar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [selectedSong, setSelectedSong] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/songs')
      .then(response => setSongs(response.data))
      .catch(error => console.error('Error fetching songs:', error));
  }, []);

  const handleAddSong = (newSong) => {
    axios.post('http://localhost:5000/songs', newSong)
      .then(response => {
        setSongs([...songs, response.data]);
        toast.success('Song added successfully!');
      })
      .catch(error => {
        console.error('Error adding song:', error);
        toast.error('Failed to add song.');
      });
  };

  const handleRemoveSong = (id) => {
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
    axios.put(`http://localhost:5000/songs/${updatedSong._id}`, updatedSong)
      .then(response => {
        const updatedSongs = songs.map(song =>
          song._id === updatedSong._id ? response.data : song
        );
        setSongs(updatedSongs);
        setSelectedSong(response.data);
        toast.success('Song edited successfully!');
      })
      .catch(error => {
        console.error('Error editing song:', error);
        toast.error('Failed to edit song.');
      });
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <NavBar setCurrentView={setCurrentView} />
      
      {currentView === 'home' && (
        <div className="main-layout">
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <h2>Songs</h2>
              <SearchBar onSearch={setSearchTerm} />
              <button 
                className="toggle-sidebar"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed ? '>' : '<'}
              </button>
            </div>
            <div className="sidebar-content">
              <SongList 
                songs={filteredSongs} 
                onSelectSong={setSelectedSong} 
                selectedSongId={selectedSong?._id}
              />
            </div>
          </aside>
          
          <main className="content-area">
            {selectedSong ? (
              <SongDetails
                song={selectedSong}
                onRemoveSong={handleRemoveSong}
                onEditSong={handleEditSong}
              />
            ) : (
              <div className="empty-state">
                <h2>Select a song to view details</h2>
                <p>Choose a song from the list on the left</p>
              </div>
            )}
          </main>
        </div>
      )}
      
      {currentView === 'add-song' && (
        <div className="add-song-page">
          <div className="add-song-header">
            <h1>Add New Song</h1>
            <p>Create a new song to add to your collection</p>
          </div>
          <AddSong onAddSong={handleAddSong} />
        </div>
      )}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;