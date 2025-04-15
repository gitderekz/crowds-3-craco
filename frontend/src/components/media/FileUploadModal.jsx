import React, { useState, useRef } from 'react';
import { FaTimes, FaPaperclip, FaCloudUploadAlt } from 'react-icons/fa';

const FileUploadModal = ({ onClose, onSend }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    setFiles(validFiles);
    
    // Generate previews
    const newPreviews = validFiles.map(file => ({
      name: file.name,
      type: file.type.split('/')[0],
      url: URL.createObjectURL(file)
    }));
    
    setPreviews(newPreviews);
  };

  const handleSend = () => {
    onSend(files);
    onClose();
  };

  return (
    <div className="file-upload-modal">
      <div className="modal-header">
        <h3>Upload Files</h3>
        <button onClick={onClose} className="close-btn">
          <FaTimes />
        </button>
      </div>
      
      <div className="file-drop-area" onClick={() => fileInputRef.current.click()}>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          style={{ display: 'none' }}
        />
        <FaCloudUploadAlt size={48} />
        <p>Click to browse or drag and drop files</p>
        <p className="file-size-info">Max 10MB per file</p>
      </div>
      
      {previews.length > 0 && (
        <div className="preview-container">
          {previews.map((preview, index) => (
            <div key={index} className="file-preview">
              {preview.type === 'image' ? (
                <img src={preview.url} alt={preview.name} />
              ) : (
                <div className="file-icon">
                  <FaPaperclip size={24} />
                </div>
              )}
              <span className="file-name">{preview.name}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="modal-footer">
        <button onClick={onClose} className="cancel-btn">
          Cancel
        </button>
        <button 
          onClick={handleSend} 
          className="send-btn"
          disabled={files.length === 0}
        >
          Send {files.length > 0 && `(${files.length})`}
        </button>
      </div>
    </div>
  );
};

export default FileUploadModal;