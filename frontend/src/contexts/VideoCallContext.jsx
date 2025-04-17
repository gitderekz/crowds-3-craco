// src/contexts/VideoCallContext.jsx
import React, { createContext, useContext, useState } from 'react';

const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
  const [callTechnology, setCallTechnology] = useState('webrtc'); // 'webrtc' or 'agora'
  
  const toggleCallTechnology = () => {
    setCallTechnology(prev => prev === 'webrtc' ? 'agora' : 'webrtc');
  };

  return (
    <VideoCallContext.Provider value={{ callTechnology, toggleCallTechnology }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => useContext(VideoCallContext);