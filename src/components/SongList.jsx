import { Scrollbar } from 'react-scrollbars-custom';

function SongList({ songs, onSelectSong, selectedSongId, favorites, toggleFavorite }) {
  if (songs.length === 0) {
    return <div className="empty-songs">No songs found</div>;
  }

  return (
    <div className="song-list">
      {songs.map((song) => (
        <div 
          key={song._id} 
          className={`song-item ${selectedSongId === song._id ? 'selected' : ''}`}
          onClick={() => onSelectSong(song)}
        >
          <h3>{song.title}</h3>
        </div>
      ))}
    </div>
  );
}

export default SongList;