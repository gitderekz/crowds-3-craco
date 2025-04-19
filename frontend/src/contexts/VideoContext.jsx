// VideoContext.jsx
import { createContext, useContext } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm-sdk';

const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const APP_ID = "0e5039dc5bf6470ab61d0942c8085ab2";
  
  // Similar state management as your current implementation
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [rtmClient, setRtmClient] = useState(null);
  const [channel, setChannel] = useState(null);
  
  // All your existing functions (handleUserPublished, toggleMic, etc.)
  // would be adapted as context methods
  
  return (
    <VideoContext.Provider value={{
      joinRoomInit,
      joinStream,
      toggleMic,
      toggleCamera,
      toggleScreen,
      leaveStream,
      // other functions...
    }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => useContext(VideoContext);