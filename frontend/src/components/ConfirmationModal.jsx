// src/components/ConfirmationModal.js

import React from 'react';
// import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onConfirm, onCancel, theme }) => {
  return (
    <div className={`confirmation-modal-overlay ${theme === 'dark' ? 'dark' : ''}`}>
      <div className={`confirmation-modal ${theme === 'dark' ? 'dark' : ''}`}>
        <p>{message}</p>
        <div className="modal-buttons">
          <button onClick={onConfirm} className="confirm-btn">Confirm</button>
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
