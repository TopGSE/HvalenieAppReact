import { Scrollbar } from 'react-scrollbars-custom';
import SongTooltip from './SongTooltip';
import { useState } from 'react';

function SongList({ songs, onSelectSong, selectedSongId, favorites, toggleFavorite }) {
  const [hoveredSongId, setHoveredSongId] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  if (songs.length === 0) {
    return <div className="empty-songs">No songs found</div>;
  }

  const handleSongHover = (songId, e) => {
    setHoveredSongId(songId);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top,
      left: rect.left + (rect.width / 2)
    });
  };

  return (
    <div className="song-list">
      {songs.map((song) => (
        <div 
          key={song._id} 
          className={`song-item ${selectedSongId === song._id ? 'selected' : ''}`}
          onClick={() => onSelectSong(song)}
          onMouseEnter={(e) => handleSongHover(song._id, e)}
          onMouseLeave={() => setHoveredSongId(null)}
        >
          <h3>{song.title}</h3>
          {hoveredSongId === song._id && (
            <div 
              className="tooltip-container"
              style={{
                position: 'fixed',
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                zIndex: 1000
              }}
            >
              <SongTooltip song={song} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default SongList;