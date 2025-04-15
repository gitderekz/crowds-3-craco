import React,{useState, useRef} from 'react';
import { FaTimes, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaFile } from 'react-icons/fa';
import './MediaPreview.css';

const MediaPreview = ({ mediaFiles, onRemove, uploadProgress }) => {
  const [playingAudio, setPlayingAudio] = useState(null);
  const [muted, setMuted] = useState(false);
  const audioRefs = useRef({});

  const togglePlay = (index) => {
    const audio = audioRefs.current[index];
    if (playingAudio === index) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      if (playingAudio !== null) {
        audioRefs.current[playingAudio].pause();
      }
      audio.play();
      setPlayingAudio(index);
    }
  };

  const toggleMute = () => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) audio.muted = !muted;
    });
    setMuted(!muted);
  };

  return (
    <div className="media-preview-container">
      <div className="media-preview-header">
        <span>Selected Media ({mediaFiles.length})</span>
        <button onClick={toggleMute} className="mute-toggle">
          {muted ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
      </div>
      <div className="media-preview-grid">
        {mediaFiles.map((file, index) => {
          const isAudio = file.type.startsWith('audio/');
          const isVideo = file.type.startsWith('video/');
          const isImage = file.type.startsWith('image/');

          return (
            <div key={index} className="media-preview-item">
              <button 
                className="remove-media-btn"
                onClick={() => onRemove(index)}
              >
                <FaTimes />
              </button>

              {isImage && (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Preview ${index}`}
                  className="media-preview-content"
                />
              )}

              {isVideo && (
                <video
                  controls
                  className="media-preview-content"
                >
                  <source src={URL.createObjectURL(file)} type={file.type} />
                </video>
              )}

              {isAudio && (
                <div className="audio-preview">
                  <audio
                    ref={el => audioRefs.current[index] = el}
                    src={URL.createObjectURL(file)}
                    onEnded={() => setPlayingAudio(null)}
                  />
                  <button 
                    className={`play-btn ${playingAudio === index ? 'playing' : ''}`}
                    onClick={() => togglePlay(index)}
                  >
                    {playingAudio === index ? <FaPause /> : <FaPlay />}
                  </button>
                  <span className="audio-name">{file.name}</span>
                </div>
              )}

              {!isImage && !isVideo && !isAudio && (
                <div className="file-preview">
                  <div className="file-icon">
                    <FaFile size={24} />
                  </div>
                  <span className="file-name">{file.name}</span>
                </div>
              )}

              {uploadProgress[file.name] > 0 && uploadProgress[file.name] < 100 && (
                <div className="upload-progress">
                  <div 
                    className="progress-bar"
                    style={{ width: `${uploadProgress[file.name]}%` }}
                  />
                  <span>{uploadProgress[file.name]}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MediaPreview;