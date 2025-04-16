
import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, FaUser, FaFile, 
  FaPhone, FaVideoSlash,FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import { ThemeContext, SocketContext, NotificationContext } from '../App';
import io from 'socket.io-client';
import useSound from '../hooks/useSound';
import VideoCall from '../components/media/VideoCall';
import useMediaUpload from '../hooks/useMediaUpload';
import MediaControls from '../components/media/MediaControls';
import MediaPreview from '../components/media/MediaPreview';

const PrivateChatScreen = ({ user, onClose, setIsAuthModalOpen }) => {
  const { theme, socket } = useContext(ThemeContext);
  const { setIncomingCall } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(user.online);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const messagesEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat');
  const socketRef = useRef();
  const { 
    playNotification, 
    playGroupChat, 
    playCall, 
    playError,
    playForeground,
    playSent
  } = useSound();
  const {
    mediaFiles,
    setMediaFiles,
    uploadProgress,
    uploadError,
    setUploadError,
    isUploading,
    handleFileChange,
    uploadMedia,
    clearFiles
  } = useMediaUpload();
  
  const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
  const roomId = [currentUserId, user.id].sort().join('-');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [failedMessages, setFailedMessages] = useState({});
  const token = localStorage.getItem('accessToken');
  const [pendingMessages, setPendingMessages] = useState([]);
  const [tempMessages, setTempMessages] = useState({});
  const tempMessagesRef = useRef({});
  const [ringtone, setRingtone] = useState(null);

  useEffect(()=>{
    if (!token) {
      // Redirect to login or handle missing token
      return;
    }
  })
  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection...'); // Add this
    socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
      withCredentials: true,
      transports: ['websocket']
    });

    // Add connection event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });
  
    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Join private chat room
    socketRef.current.emit('joinRoom', { 
      roomId, 
      userId: currentUserId 
    });

    // Load existing messages
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/messages/${roomId}`,
          {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
            }
          }
        );
        setMessages(response.data); // Axios automatically parses JSON
      } catch (error) {
        console.error('Error loading messages:', error);
        // Optional: Add error handling for 401/403/404
        if (error.response) {
          console.error('Server responded with:', error.response.status);
          if (error.response.status === 401) {
            // Handle unauthorized (e.g., redirect to login)
            onClose();
            setIsAuthModalOpen(true);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();

    // Socket event listeners
    const handleNewMessage = (message) => {
      console.log('SOCKET RECEIVE', message.tempId, tempMessagesRef.current, tempMessagesRef.current[message.tempId]);
      
      // Check if this is a response to our own message
      if (message.tempId && tempMessagesRef.current[message.tempId]) {
        // Replace the temporary message with the actual one from server
        setMessages(prev => prev.map(msg => 
          msg.tempId === message.tempId ? { ...message, isPending: false } : msg
        ));
        
        // Remove from temp storage
        delete tempMessagesRef.current[message.tempId];
        playSent();
        setTempMessages(prev => {
          const newTemp = {...prev};
          delete newTemp[message.tempId];
          return newTemp;
        });
      } 
      // If it's a new message from other user
      else if (message.senderId !== currentUserId) {
        setMessages(prev => [...prev, { ...message, isPending: false }]);
        // Play sound only for new messages from others, not for our own messages
        playNotification();
      }
      scrollToBottom();
    };

    socketRef.current.on('newMessage', handleNewMessage);

    socketRef.current.on('typing', ({ userId, isTyping }) => {
      if (userId === user.id) {
        setRemoteIsTyping(isTyping);
      }
    });

    socketRef.current.on('userStatus', ({ userId, online }) => {
      if (userId === user.id) {
        setIsOnline(online);
      }
    });

    return () => {
      console.log('Cleaning up socket...'); // Add this
      socketRef.current.off('newMessage', handleNewMessage);
      socketRef.current.disconnect();
    };
  }, [roomId, user.id, currentUserId,/* playNotification,playSent*/]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (typing) => {
    setIsTyping(typing);
    socketRef.current.emit('typing', { 
      roomId, 
      userId: currentUserId,
      isTyping: typing 
    });
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !mediaFiles.length) || isSending) return;
    
    setIsSending(true);
    const tempId = Date.now().toString();
    
    try {
      let mediaUrls = [];
      if (mediaFiles.length) {
        const type = mediaFiles[0].type.split('/')[0];
        const uploadResponse = await uploadMedia(roomId, type);
        if (uploadResponse) {
          mediaUrls = uploadResponse.urls;
        }
      }

      const newMessage = {
        content: message,
        type: mediaFiles.length ? mediaFiles[0].type.split('/')[0] : 'text',
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
        tempId: tempId,
        isPending: true,
        mediaUrls: mediaUrls.length ? mediaUrls : undefined
      };
  
      // Store temporary message in both state and ref
      tempMessagesRef.current[tempId] = newMessage;
      setTempMessages(prev => ({...prev, [tempId]: newMessage}));
    
      // Optimistic update
      setMessages(prev => [...prev, {
        ...newMessage,
        id: tempId,
        sender: 'You'
      }]);
      
      // Emit to server
      socketRef.current.emit('sendMessage', {
        roomId,
        message: {
          ...newMessage,
          tempId: tempId // Include tempId in the emitted message
        }
      });

      setMessage('');
      clearFiles();
      setIsTyping(false);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };
  
  // Update message rendering to handle media
  const renderMessageContent = (msg) => {
    // if (msg.mediaUrls?.length) {
    if (msg.mediaUrls?.length > 0 && (Array.isArray(msg.mediaUrls) || Array.isArray(JSON.parse(msg.mediaUrls)))) {
      const mediaUrl = Array.isArray(msg.mediaUrls)?msg.mediaUrls:JSON.parse(msg.mediaUrls);
      return (
        <div className="message-media">
          {mediaUrl.map((url, index) => {
            if (msg.type === 'image') {
              return <img key={index} src={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} alt={`Media ${index}`} className="message-media-item" />;
            } else if (msg.type === 'video') {
              return (
                <video key={index} controls className="message-media-item">
                  <source src={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} type={`video/${url.split('.').pop()}`} />
                </video>
              );
            } else if (msg.type === 'audio') {
              return (
                <audio key={index} controls className="message-media-item">
                  <source src={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} type={`audio/${url.split('.').pop()}`} />
                </audio>
              );
            } else {
              return (
                <a 
                  key={index} 
                  href={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="message-file"
                >
                  <FaFile /> Download File
                </a>
              );
            }
          })}
          {msg.content && <div className="message-text">{msg.content}</div>}
        </div>
      );
    }
    return <div className="message-content">{msg.content}</div>;
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Handle incoming calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (callData) => {
      if (callData.callerId === user.id) {
        // Stop any existing ringtone
        if (ringtone) {
          ringtone.pause();
          ringtone.currentTime = 0;
        }
        
        // Play new ringtone
        const newRingtone = new Audio('/sounds/ringtone.mp3');
        newRingtone.loop = true;
        newRingtone.play().catch(e => console.log('Ringtone play failed:', e));
        setRingtone(newRingtone);
        
        const confirmCall = window.confirm(`Incoming ${callData.callType} call from ${user.name}. Accept?`);
        if (confirmCall) {
          setCallType(callData.callType);
          setInCall(true);
          socket.emit('call-response', {
            response: 'accepted',
            callerId: callData.callerId,
            calleeId: currentUserId,
            roomId: callData.roomId
          });
        } else {
          socket.emit('call-response', {
            response: 'rejected',
            callerId: callData.callerId,
            calleeId: currentUserId,
            roomId: callData.roomId
          });
        }
        newRingtone.pause();
        setRingtone(null);
        setIncomingCall(null);
      }
    };

    socket.on('incoming-call', handleIncomingCall);

    return () => {
      if (ringtone) {
        ringtone.pause();
        setRingtone(null);
      }
      socket.off('incoming-call', handleIncomingCall);
    };
  }, [socket, user.id, currentUserId, ringtone, setIncomingCall]);

  const startCall = (type) => {
    setCallType(type);
    setInCall(true);
    
    // Notify the other user
    socket.emit('call-notification', {
      callType: type,
      callerId: currentUserId,
      calleeIds: [user.id],
      roomId: roomId
    });
  };

  const endCall = () => {
    setInCall(false);
    setCallType(null);
  };

  return (
    <div className={`private-chat-container ${theme}`}>
      {inCall && (
        <VideoCall 
          roomId={roomId}
          userId={currentUserId}
          otherUserIds={[user.id]}
          callType={callType}
          onEndCall={endCall}
        />
      )}

      <div className={`chat-header ${theme}`}>
        <div className="header-user-info">
          <h3>Chat with {user.name}</h3>
          <div className={`status ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'Online' : 'Offline'}
            {remoteIsTyping && isOnline && ' • Typing...'}
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`call-btn ${theme}`}
            onClick={() => startCall('video')}
          >
            <FaVideo />
          </button>
          <button 
            className={`call-btn ${theme}`}
            onClick={() => startCall('audio')}
          >
            <FaPhone />
          </button>
          <button onClick={onClose}>✕</button>
        </div>
      </div>
      
      {/* Mobile Tabs */}
      <div className={`mobile-tabs ${theme}`}>
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <FaPaperPlane /> Chat
        </button>
        <button 
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <FaUser /> Info
        </button>
      </div>

      <div className="chat-layout">
        {/* Messages Section */}
        <div className={`messages-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
          <div className="messages-container">
            {messages.map(msg => (
              <div 
                key={msg.id || msg.tempId} 
                className={`message ${parseInt(msg.senderId) === parseInt(currentUserId) ? 'sent' : 'received'} ${theme} ${msg.isPending ? 'pending' : ''}`}
              >
                {/* {parseInt(msg.senderId) !== parseInt(currentUserId) && (
                  <div className="sender-name">
                    {msg.sender.username || 'Unknown User'}
                  </div>
                )} */}
                
                {renderMessageContent(msg)}
                {/* <div className="message-content">{msg.content}</div> */}
                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {/* {msg.isPending && <FaSpinner className="spinner" />} */}
                  <span className="message-status">
                    {msg.isPending ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      <FaCheck className="check-icon" />
                    )}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {mediaFiles.length > 0 && (
            <MediaPreview 
              mediaFiles={mediaFiles}
              onRemove={(index) => {
                const newFiles = [...mediaFiles];
                newFiles.splice(index, 1);
                setMediaFiles(newFiles);
              }}
              uploadProgress={uploadProgress}
            />
          )}

          {uploadError && (
            <div className="upload-error">
              {uploadError}
              <button onClick={() => setUploadError(null)}>×</button>
            </div>
          )}

          <div className="message-input">
            <button 
              className={`emoji-btn ${theme}`}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <FaSmile />
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <EmojiPicker onEmojiClick={(e) => {
                  setMessage(m => m + e.emoji);
                  setShowEmojiPicker(false);
                }} />
              </div>
            )}
            <MediaControls 
              onFileChange={handleFileChange}
              theme={theme}
            />
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping(!!e.target.value);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              onFocus={() => handleTyping(true)}
              onBlur={() => handleTyping(false)}
              placeholder="Type a message..."
              className={theme}
            />
            <button 
              onClick={handleSendMessage} 
              className={`send-button ${theme}`}
              disabled={isSending || isUploading}
            >
              {isSending || isUploading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className={`user-info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
            <div className="receiver-avatar">
                {user?.avatar ? (
                <img className='user-avatar' src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user?.avatar??"/uploads/avatar/default-avatar.png"}`} alt={user.name} />
                ) : (
                <FaUser size={80} />
                )}
            </div>
            <h4>{user.name}</h4>
            <p className={`status ${user.online ? 'online' : 'offline'}`}>
                {user.online ? 'Online' : 'Offline'}
            </p>
            
            <div className="user-details">
                <div className="detail-item">
                <span className="detail-label">Last Seen:</span>
                <span className="detail-value">
                    {user.lastSeen || (user.online ? 'Now' : 'Unknown')}
                </span>
                </div>
                
                <div className="detail-item">
                <span className="detail-label">Member Since:</span>
                <span className="detail-value">
                    {new Date(user.joinDate).toLocaleDateString()}
                </span>
                </div>
                
                <div className="detail-item">
                <span className="detail-label">Common Groups:</span>
                <span className="detail-value">
                    {user.commonGroups?.length || 0}
                </span>
                </div>
            </div>
            
            <div className="user-actions">
                <button className={`action-btn ${theme}`}>
                <FaVideo /> Video Call
                </button>
                <button className={`action-btn ${theme}`}>
                <FaPhone /> Voice Call
                </button>
            </div>
            
            <div className="shared-media">
                <h5>Shared Media</h5>
                <div className="media-grid">
                {user.sharedMedia?.slice(0, 4).map((media, index) => (
                    <div key={index} className="media-thumbnail">
                    {media.type === 'image' ? (
                        <img src={media.url} alt={`Shared ${index}`} />
                    ) : media.type === 'video' ? (
                        <FaVideo />
                    ) : (
                        <FaFile />
                    )}
                    </div>
                ))}
                {(!user.sharedMedia || user.sharedMedia.length === 0) && (
                    <p className="no-media">No shared media yet</p>
                )}
                </div>
            </div>
            
            <div className="user-bio">
                <h5>About</h5>
                <p>{user.bio || 'No bio available'}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateChatScreen;
// ************************************

// import React, { useState, useRef, useEffect, useContext } from 'react';
// import { FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, FaUser, FaFile, FaPhone } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import { ThemeContext } from '../App';

// const PrivateChatScreen = ({ user, onClose }) => {
//   const { theme } = useContext(ThemeContext);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'info'

//   const handleSendMessage = () => {
//     if (message.trim()) {
//       setMessages([...messages, {
//         id: Date.now(),
//         text: message,
//         sender: 'You',
//         timestamp: new Date().toLocaleTimeString()
//       }]);
//       setMessage('');
//     }
//   };

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   return (
//     <div className={`private-chat-container ${theme}`}>
//       <div className={`chat-header ${theme}`}>
//         <h3>Chat with {user.name}</h3>
//         <button onClick={onClose}>✕</button>
//       </div>
      
//       {/* Mobile Tabs */}
//       <div className={`mobile-tabs ${theme}`}>
//         <button 
//           className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
//           onClick={() => setActiveTab('chat')}
//         >
//           <FaPaperPlane /> Chat
//         </button>
//         <button 
//           className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
//           onClick={() => setActiveTab('info')}
//         >
//           <FaUser /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         {/* Messages Section - now conditionally rendered */}
//         <div className={`messages-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
//           <div className="messages-container">
//             {messages.map(msg => (
//               <div 
//                 key={msg.id} 
//                 className={`message ${msg.sender === 'You' ? 'sent' : 'received'} ${theme}`}
//               >
//                 <div className="message-content">{msg.text}</div>
//                 <div className="message-time">{msg.timestamp}</div>
//               </div>
//             ))}
//             <div ref={messagesEndRef} />
//           </div>

//           <div className="message-input">
//             <button 
//               className={`emoji-btn ${theme}`}
//               onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//             >
//               <FaSmile />
//             </button>
//             {showEmojiPicker && (
//               <div className="emoji-picker">
//                 <EmojiPicker onEmojiClick={(e) => {
//                   setMessage(m => m + e.emoji);
//                   setShowEmojiPicker(false);
//                 }} />
//               </div>
//             )}
//             <input
//               type="text"
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//               placeholder="Type a message..."
//               className={theme}
//             />
//             <div className="media-buttons">
//               <button className={theme}><FaImage /></button>
//               <button className={theme}><FaVideo /></button>
//               <button className={theme}><FaMusic /></button>
//             </div>
//             <button 
//               onClick={handleSendMessage} 
//               className={`send-button ${theme}`}
//             >
//               <FaPaperPlane />
//             </button>
//           </div>
//         </div>

//         {/* User Info Section - now conditionally rendered */}
//         <div className={`user-info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//             <div className="user-avatar">
//                 {user.avatar ? (
//                 <img src={user.avatar} alt={user.name} />
//                 ) : (
//                 <FaUser size={80} />
//                 )}
//             </div>
//             <h4>{user.name}</h4>
//             <p className={`status ${user.online ? 'online' : 'offline'}`}>
//                 {user.online ? 'Online' : 'Offline'}
//             </p>
            
//             <div className="user-details">
//                 <div className="detail-item">
//                 <span className="detail-label">Last Seen:</span>
//                 <span className="detail-value">
//                     {user.lastSeen || (user.online ? 'Now' : 'Unknown')}
//                 </span>
//                 </div>
                
//                 <div className="detail-item">
//                 <span className="detail-label">Member Since:</span>
//                 <span className="detail-value">
//                     {new Date(user.joinDate).toLocaleDateString()}
//                 </span>
//                 </div>
                
//                 <div className="detail-item">
//                 <span className="detail-label">Common Groups:</span>
//                 <span className="detail-value">
//                     {user.commonGroups?.length || 0}
//                 </span>
//                 </div>
//             </div>
            
//             <div className="user-actions">
//                 <button className={`action-btn ${theme}`}>
//                 <FaVideo /> Video Call
//                 </button>
//                 <button className={`action-btn ${theme}`}>
//                 <FaPhone /> Voice Call
//                 </button>
//             </div>
            
//             <div className="shared-media">
//                 <h5>Shared Media</h5>
//                 <div className="media-grid">
//                 {user.sharedMedia?.slice(0, 4).map((media, index) => (
//                     <div key={index} className="media-thumbnail">
//                     {media.type === 'image' ? (
//                         <img src={media.url} alt={`Shared ${index}`} />
//                     ) : media.type === 'video' ? (
//                         <FaVideo />
//                     ) : (
//                         <FaFile />
//                     )}
//                     </div>
//                 ))}
//                 {(!user.sharedMedia || user.sharedMedia.length === 0) && (
//                     <p className="no-media">No shared media yet</p>
//                 )}
//                 </div>
//             </div>
            
//             <div className="user-bio">
//                 <h5>About</h5>
//                 <p>{user.bio || 'No bio available'}</p>
//             </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PrivateChatScreen;


// ****************************************************

// import React, { useState, useEffect, useRef, useContext } from 'react';
// import axios from 'axios';
// import { 
//   FaPaperPlane, 
//   FaSmile, 
//   FaImage, 
//   FaVideo, 
//   FaUser, 
//   FaFile, 
//   FaPhone,
//   FaCheck,
//   FaExclamationTriangle,
//   FaSpinner
// } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import { ThemeContext } from '../App';
// import io from 'socket.io-client';
// import useSound from '../hooks/useSound';
// import VideoCall from '../components/VideoCall';
// import './PrivateChatScreen.css'; // Make sure to create this CSS file

// const PrivateChatScreen = ({ user, onClose }) => {
//   const { theme } = useContext(ThemeContext);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [remoteIsTyping, setRemoteIsTyping] = useState(false);
//   const [isOnline, setIsOnline] = useState(user.online);
//   const [inCall, setInCall] = useState(false);
//   const [callType, setCallType] = useState(null);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat');
//   const socketRef = useRef();
//   const playNotification = useSound();
//   const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
//   const roomId = [currentUserId, user.id].sort().join('-');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const [pendingMessages, setPendingMessages] = useState([]);
//   const [failedMessages, setFailedMessages] = useState({});

//   // Initialize socket connection
//   useEffect(() => {
//     socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
//       withCredentials: true,
//       transports: ['websocket']
//     });

//     // Join private chat room
//     socketRef.current.emit('joinRoom', { 
//       roomId, 
//       userId: currentUserId 
//     });

//     // Load existing messages
//     const loadMessages = async () => {
//       setIsLoading(true);
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/messages/${roomId}`,
//           {
//             headers: { 
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
//             }
//           }
//         );
//         setMessages(response.data.map(msg => ({
//           ...msg,
//           status: 'delivered' // Mark all loaded messages as delivered
//         })));
//       } catch (error) {
//         console.error('Error loading messages:', error);
//         if (error.response?.status === 401) {
//           // Handle unauthorized
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadMessages();

//     // Socket event listeners
//     socketRef.current.on('newMessage', (message) => {
//       setMessages(prev => [
//         ...prev.filter(msg => msg.id !== message.tempId && msg.id !== message.id),
//         { ...message, status: 'delivered' }
//       ]);
      
//       if (message.senderId !== currentUserId) {
//         playNotification();
//       }
//       scrollToBottom();
//     });

//     socketRef.current.on('sendMessageError', ({ tempId, error }) => {
//       setMessages(prev => prev.map(msg => 
//         msg.id === tempId ? { ...msg, status: 'failed' } : msg
//       ));
//       setFailedMessages(prev => ({ ...prev, [tempId]: true }));
//     });

//     socketRef.current.on('typing', ({ userId, isTyping }) => {
//       if (userId === user.id) {
//         setRemoteIsTyping(isTyping);
//       }
//     });

//     socketRef.current.on('userStatus', ({ userId, online }) => {
//       if (userId === user.id) {
//         setIsOnline(online);
//       }
//     });

//     return () => {
//       socketRef.current.disconnect();
//     };
//   }, [roomId, user.id, currentUserId]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleSendMessage = async () => {
//     if (!message.trim() || isSending) return;

//     const tempId = Date.now();
//     const newMessage = {
//       id: tempId,
//       content: message,
//       type: 'text',
//       senderId: currentUserId,
//       createdAt: new Date().toISOString(),
//       status: 'sending'
//     };

//     // Optimistic update
//     setMessages(prev => [...prev, newMessage]);
//     setPendingMessages(prev => [...prev, tempId]);
//     setIsSending(true);
//     setMessage('');
//     setIsTyping(false);
//     scrollToBottom();

//     try {
//       socketRef.current.emit('sendMessage', {
//         roomId,
//         message: {
//           ...newMessage,
//           tempId
//         }
//       });
//     } catch (error) {
//       console.error('Failed to send message:', error);
//       setMessages(prev => prev.map(msg => 
//         msg.id === tempId ? { ...msg, status: 'failed' } : msg
//       ));
//       setFailedMessages(prev => ({ ...prev, [tempId]: true }));
//     } finally {
//       setIsSending(false);
//     }
//   };

//   const retryFailedMessage = (messageId) => {
//     const message = messages.find(msg => msg.id === messageId);
//     if (!message) return;

//     setFailedMessages(prev => ({ ...prev, [messageId]: false }));
//     setMessages(prev => prev.map(msg => 
//       msg.id === messageId ? { ...msg, status: 'sending' } : msg
//     ));

//     socketRef.current.emit('sendMessage', {
//       roomId,
//       message: {
//         ...message,
//         tempId: messageId
//       }
//     });
//   };

//   const handleTyping = (typing) => {
//     setIsTyping(typing);
//     socketRef.current.emit('typing', { 
//       roomId, 
//       userId: currentUserId,
//       isTyping: typing 
//     });
//   };

//   const startCall = (type) => {
//     setCallType(type);
//     setInCall(true);
//   };

//   const endCall = () => {
//     setInCall(false);
//     setCallType(null);
//   };

//   return (
//     <div className={`private-chat-container ${theme}`}>
//       {inCall && (
//         <VideoCall 
//           roomId={roomId}
//           userId={currentUserId}
//           otherUserId={user.id}
//           callType={callType}
//           onEndCall={endCall}
//         />
//       )}

//       <div className={`chat-header ${theme}`}>
//         <div className="header-user-info">
//           <h3>Chat with {user.name}</h3>
//           <div className={`status ${isOnline ? 'online' : 'offline'}`}>
//             {isOnline ? 'Online' : 'Offline'}
//             {remoteIsTyping && isOnline && ' • Typing...'}
//           </div>
//         </div>
//         <div className="header-actions">
//           <button 
//             className={`call-btn ${theme}`}
//             onClick={() => startCall('video')}
//           >
//             <FaVideo />
//           </button>
//           <button 
//             className={`call-btn ${theme}`}
//             onClick={() => startCall('audio')}
//           >
//             <FaPhone />
//           </button>
//           <button onClick={onClose}>✕</button>
//         </div>
//       </div>
      
//       <div className={`mobile-tabs ${theme}`}>
//         <button 
//           className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
//           onClick={() => setActiveTab('chat')}
//         >
//           <FaPaperPlane /> Chat
//         </button>
//         <button 
//           className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
//           onClick={() => setActiveTab('info')}
//         >
//           <FaUser /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         <div className={`messages-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
//           <div className="messages-container">
//             {isLoading ? (
//               <div className="loading-messages">Loading messages...</div>
//             ) : (
//               messages.map(msg => (
//                 <div 
//                   key={msg.id} 
//                   className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'} ${theme}`}
//                 >
//                   <div className="message-content">
//                     {msg.content}
//                     {msg.senderId === currentUserId && (
//                       <span className="message-status">
//                         {msg.status === 'sending' && (
//                           <FaSpinner className="spinner" />
//                         )}
//                         {msg.status === 'delivered' && (
//                           <FaCheck className="delivered" />
//                         )}
//                         {msg.status === 'failed' && (
//                           <div className="failed-message">
//                             <FaExclamationTriangle className="failed-icon" />
//                             <span className="failed-text">Couldn't send</span>
//                             <button 
//                               onClick={() => retryFailedMessage(msg.id)} 
//                               className="retry-btn"
//                             >
//                               Retry
//                             </button>
//                           </div>
//                         )}
//                       </span>
//                     )}
//                   </div>
//                   <div className="message-time">
//                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   </div>
//                 </div>
//               ))
//             )}
//             <div ref={messagesEndRef} />
//           </div>

//           <div className="message-input">
//             <button 
//               className={`emoji-btn ${theme}`}
//               onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//             >
//               <FaSmile />
//             </button>
//             {showEmojiPicker && (
//               <div className="emoji-picker">
//                 <EmojiPicker onEmojiClick={(e) => {
//                   setMessage(m => m + e.emoji);
//                   setShowEmojiPicker(false);
//                 }} />
//               </div>
//             )}
//             <input
//               type="text"
//               value={message}
//               onChange={(e) => {
//                 setMessage(e.target.value);
//                 handleTyping(!!e.target.value);
//               }}
//               onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//               onFocus={() => handleTyping(true)}
//               onBlur={() => handleTyping(false)}
//               placeholder="Type a message..."
//               className={theme}
//             />
//             <div className="media-buttons">
//               <button className={theme}><FaImage /></button>
//               <button className={theme}><FaFile /></button>
//             </div>
//             <button 
//               onClick={handleSendMessage} 
//               className={`send-button ${theme}`}
//               disabled={!message.trim() || isSending}
//             >
//               {isSending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
//             </button>
//           </div>
//         </div>

//         <div className={`user-info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//           {/* User info section remains the same */}
//           {/* ... */}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PrivateChatScreen;