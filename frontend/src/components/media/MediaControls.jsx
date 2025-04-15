import React, { useRef } from 'react';
import { FaImage, FaVideo, FaMusic, FaFile } from 'react-icons/fa';
import './MediaControls.css';
const MediaControls = ({ onFileChange, theme }) => {
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleButtonClick = (type) => {
    switch(type) {
      case 'image':
        imageInputRef.current.click();
        break;
      case 'video':
        videoInputRef.current.click();
        break;
      case 'audio':
        audioInputRef.current.click();
        break;
      default:
        fileInputRef.current.click();
    }
  };

  return (
    <div className="media-controls">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
        multiple
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
        accept="image/*"
        multiple
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
        accept="video/*"
        multiple
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={onFileChange}
        style={{ display: 'none' }}
        accept="audio/*"
        multiple
      />
      <div className="media-buttons">
        <button 
          className={`media-btn ${theme}`}
          onClick={() => handleButtonClick('image')}
          title="Upload images"
        >
          <FaImage />
        </button>
        <button 
          className={`media-btn ${theme}`}
          onClick={() => handleButtonClick('video')}
          title="Upload videos"
        >
          <FaVideo />
        </button>
        <button 
          className={`media-btn ${theme}`}
          onClick={() => handleButtonClick('audio')}
          title="Upload audio"
        >
          <FaMusic />
        </button>
        <button 
          className={`media-btn ${theme}`}
          onClick={() => handleButtonClick('file')}
          title="Upload files"
        >
          <FaFile />
        </button>
      </div>
    </div>
  );
};

export default MediaControls;