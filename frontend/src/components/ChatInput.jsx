import React, { useState, useRef } from 'react';
import FileUploadModal from './media/FileUploadModal';

const ChatInput = ({ onSend, onTyping }) => {
  const [message, setMessage] = useState('');
  const [showFileModal, setShowFileModal] = useState(false);
  const inputRef = useRef();

  const handleSend = () => {
    if (message.trim()) {
      onSend(message, 'text');
      setMessage('');
      onTyping(false);
    }
  };

  const handleFileSend = (files) => {
    files.forEach(file => {
      const type = file.type.split('/')[0]; // image, video, audio, etc.
      onSend(file, type === 'image' ? 'image' : 'file', file);
    });
  };

  return (
    <div className="chat-input-container">
      {showFileModal && (
        <FileUploadModal
          onClose={() => setShowFileModal(false)}
          onSend={handleFileSend}
        />
      )}
      
      <button 
        className="attach-btn"
        onClick={() => setShowFileModal(true)}
      >
        <FaPaperclip />
      </button>
      
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          onTyping(!!e.target.value);
        }}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Type a message..."
      />
      
      <button 
        className="send-btn"
        onClick={handleSend}
        disabled={!message.trim()}
      >
        <FaPaperPlane />
      </button>
    </div>
  );
};

export default ChatInput;