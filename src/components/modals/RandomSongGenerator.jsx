import React, { useState, useEffect } from "react";
import "./RandomSongGenerator.css";

function RandomSongGenerator({ show, onClose, songs, onCreatePlaylist }) {
  const [randomSongs, setRandomSongs] = useState([]);
  const [playlistName, setPlaylistName] = useState("Random Worship Set");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (show) {
      generateRandomSongs();
    }
  }, [show, songs]);

  const generateRandomSongs = () => {
    setIsLoading(true);

    // Filter songs by category
    const praiseSongs = songs.filter((song) => song.category === "praise");
    const worshipSongs = songs.filter((song) => song.category === "worship");

    // Select 3 random songs from each category
    const randomPraise = getRandomItems(praiseSongs, 3);
    const randomWorship = getRandomItems(worshipSongs, 3);

    // Combine the random selections
    setRandomSongs([...randomPraise, ...randomWorship]);
    setIsLoading(false);
  };

  const getRandomItems = (array, count) => {
    // Create a copy of the array to avoid modifying the original
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    // Return the first 'count' items or all if there are fewer than 'count'
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  const handleCreatePlaylist = () => {
    const songIds = randomSongs.map((song) => song._id);
    const date = new Date();
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const playlistData = {
      name: playlistName,
      description: `Random worship set generated on ${formattedDate} - 3 praise and 3 worship songs`,
      songIds: songIds,
    };

    onCreatePlaylist(playlistData);
    onClose();
  };

  const handleRegenerateSongs = () => {
    generateRandomSongs();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content random-songs-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Random Worship Set Generator</h2>
          <button className="close-modal" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="random-songs-content">
          {isLoading ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>Generating random songs...</p>
            </div>
          ) : (
            <>
              <div className="song-categories">
                <div className="song-category">
                  <h3>Praise Songs</h3>
                  <ul className="random-song-list">
                    {randomSongs
                      .filter((song) => song.category === "praise")
                      .map((song) => (
                        <li key={song._id} className="random-song-item">
                          <div className="song-title">{song.title}</div>
                          {song.artist && (
                            <div className="song-artist">{song.artist}</div>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="song-category">
                  <h3>Worship Songs</h3>
                  <ul className="random-song-list">
                    {randomSongs
                      .filter((song) => song.category === "worship")
                      .map((song) => (
                        <li key={song._id} className="random-song-item">
                          <div className="song-title">{song.title}</div>
                          {song.artist && (
                            <div className="song-artist">{song.artist}</div>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <div className="playlist-form">
                <div className="form-group">
                  <label htmlFor="playlist-name">Playlist Name</label>
                  <input
                    type="text"
                    id="playlist-name"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="regenerate-button"
                  onClick={handleRegenerateSongs}
                >
                  <span className="refresh-icon">🔄</span>
                  Generate New Set
                </button>
                <button
                  className="create-playlist-button"
                  onClick={handleCreatePlaylist}
                  disabled={randomSongs.length === 0}
                >
                  Create Playlist
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RandomSongGenerator;
