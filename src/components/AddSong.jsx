import { useState } from "react";
import { toast } from "react-toastify";
import {
  FaMusic,
  FaPlusCircle,
  FaGuitar,
  FaFolder,
  FaFileAlt,
  FaSpinner,
} from "react-icons/fa";
import "./AddSong.css";

function AddSong({ onAddSong }) {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [chords, setChords] = useState("");
  const [category, setCategory] = useState("praise");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a song title");
      return;
    }

    if (!lyrics.trim()) {
      toast.error("Please enter song lyrics");
      return;
    }

    setIsSubmitting(true);

    try {
      onAddSong({
        title,
        lyrics,
        chords,
        category,
      });

      // Reset form
      setTitle("");
      setLyrics("");
      setChords("");
      setCategory("praise");
    } catch (error) {
      console.error("Error adding song:", error);
      toast.error("Failed to add song");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to display category names in Bulgarian
  const getCategoryName = (categoryValue) => {
    const categories = {
      praise: "Хваление",
      worship: "Поклонение",
      christmas: "Рождество",
      easter: "Възкресение",
    };
    return categories[categoryValue] || categoryValue;
  };

  // Get visual indicator for current category
  const getCategoryIndicator = () => {
    const indicators = {
      praise: { color: "#4caf50", icon: "music" },
      worship: { color: "#2196f3", icon: "pray" },
      christmas: { color: "#f44336", icon: "tree" },
      easter: { color: "#ff9800", icon: "sun" },
    };
    return indicators[category] || { color: "#9c27b0", icon: "music" };
  };

  const categoryColor = getCategoryIndicator().color;

  return (
    <div className="modern-add-song-container">
      <div className="add-song-header">
        <h2>
          <FaPlusCircle /> Add New Song
        </h2>
        <div
          className="category-indicator"
          style={{ backgroundColor: categoryColor }}
        >
          {getCategoryName(category)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="modern-add-song-form">
        <div className="form-row">
          <div className="input-group">
            <label htmlFor="title">
              <FaMusic /> Song Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter song title"
              className="modern-input"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="category">
              <FaFolder /> Category
            </label>
            <div className="select-wrapper">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="modern-select"
                required
              >
                <option value="praise">Хваление</option>
                <option value="worship">Поклонение</option>
                <option value="christmas">Рождество</option>
                <option value="easter">Възкресение</option>
              </select>
            </div>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="lyrics">
            <FaFileAlt /> Lyrics
          </label>
          <textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Enter song lyrics"
            className="modern-textarea"
            required
            rows={8}
          />
          <div className="field-helper">
            Enter each line as it should appear in the song
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="chords">
            <FaGuitar /> Chords{" "}
            <span className="optional-label">(Optional)</span>
          </label>
          <textarea
            id="chords"
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            placeholder="Enter song chords"
            className="modern-textarea"
            rows={5}
          />
          <div className="field-helper">Add chord notations if available</div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className={`modern-submit-button ${isSubmitting ? "loading" : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="spinner-icon" /> Adding Song...
              </>
            ) : (
              <>
                <FaPlusCircle /> Add Song
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddSong;
