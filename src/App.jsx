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

function App() {
  const [songs, setSongs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [selectedSong, setSelectedSong] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [songToDelete, setSongToDelete] = useState(null);

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

  return (
    <div className="app-container">
      <NavBar setCurrentView={setCurrentView} />
      
      {currentView === 'home' && (
        <div className="main-layout">
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <h2>Песни ({songs.length})</h2>
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
                onRemoveSong={handleDeleteClick}
                onEditSong={handleEditSong}
              />
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
            <h1>Add New Song</h1>
            <p>Create a new song to add to your collection</p>
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