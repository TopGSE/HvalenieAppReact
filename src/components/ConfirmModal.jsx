import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ show, onClose, onConfirm, songTitle }) {
  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete the song "{songTitle}"?</p>
        <div className="modal-actions">
          <button className="btn btn-cancel" onClick={onClose}>No</button>
          <button className="btn btn-confirm" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;