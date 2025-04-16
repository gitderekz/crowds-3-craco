// frontend/src/pages/ClubChatScreen.jsx (updated)
import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, FaFile, FaUserFriends, FaInfoCircle, FaCheck, FaSpinner, FaPhone } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';
import io from 'socket.io-client';
import { ThemeContext, SocketContext, NotificationContext } from '../App';
import useSound from '../hooks/useSound';
import axios from 'axios';
import useMediaUpload from '../hooks/useMediaUpload';
import MediaControls from '../components/media/MediaControls';
import MediaPreview from '../components/media/MediaPreview';
import VideoCall from '../components/media/VideoCall';

const ClubChatScreen = ({ room, onClose, onOpenPrivateChat, setIsAuthModalOpen }) => {
  const { theme } = useContext(ThemeContext);
  const socket = useContext(SocketContext);
  const { setIncomingCall } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [attendees, setAttendees] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef();
  const { 
    playNotification, 
    playGroupChat, 
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
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const tempMessagesRef = useRef({});
  const [tempMessages, setTempMessages] = useState({});
  const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
  const token = localStorage.getItem('accessToken');
  const [id,setId] = useState(room.photoId);
  const [isTyperPresent,setIsTyperPresent] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState(null);

  // Handle incoming calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (callData) => {
      if (callData.roomId === room.photoId) {
        const confirmCall = window.confirm(`Incoming ${callData.callType} call. Accept?`);
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
        setIncomingCall(null);
      }
    };

    socket.on('incoming-call', handleIncomingCall);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
    };
  }, [socket, room.photoId, currentUserId, setIncomingCall]);

  const startGroupCall = (type) => {
    setCallType(type);
    setInCall(true);
    
    // Notify all participants
    const calleeIds = participants
      .filter(p => p.id !== currentUserId)
      .map(p => p.id);
    
    socket.emit('call-notification', {
      callType: type,
      callerId: currentUserId,
      calleeIds,
      roomId: room.photoId
    });
  };

  const endGroupCall = () => {
    setInCall(false);
    setCallType(null);
  };

  // Rest of the existing ClubChatScreen code remains the same...
  
  // Fetch participants from server
  useEffect(() => {
    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/rooms/${room.photoId}/${room.name}/participants`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        // If room exists, use its participants
        if (response.data) {
          console.log('EXIST');
          setParticipants(response.data);
        } else {
          // If room doesn't exist, create it first
          await createRoom();
          // Then fetch participants again
          const newResponse = await axios.get(
            `${process.env.REACT_APP_API_URL}/rooms/${room.photoId}/participants`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('accessToken')}`
              }
            }
          );
          setParticipants(newResponse.data);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // Room doesn't exist, create it
          try {
            await createRoom();
            const newResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/rooms/${room.photoId}/participants`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                }
              }
            );
            setParticipants(newResponse.data);
          } catch (creationError) {
            console.error('Error creating room:', creationError);
          }
        } else {
          console.error('Error fetching participants:', error);
        }
      } finally {
        setLoadingParticipants(false);
      }
    };

    const createRoom = async () => {
      console.log('NOT EXIST');
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/rooms`,
          {
            roomId: room.photoId, // Pass the photoId as the room ID
            name: room.name,
            isGroup: true,
            userIds: [] // Add initial participants if needed
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
      } catch (error) {
        console.error('Error creating room:', error);
        throw error;
      }
    };

    fetchParticipants();
  }, [/*room.photoId, room.name */isTyperPresent]);

  // Load initial messages
  useEffect(() => {
    console.log('room => ',id,room);
    
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/messages/${id}`,
          {
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          }
        );
        setMessages(response.data);
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
  }, [room.photoId, token]);

  // Socket connection and event handlers
  useEffect(() => {
    console.log('Initializing socket connection for club chat...');
    socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
      withCredentials: true,
      transports: ['websocket']
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    // Join room
    socketRef.current.emit('joinRoom', { 
      roomId: room.photoId, 
      userId: currentUserId 
    });
    
    // Presence handler
    const handlePresenceUpdate = ({ onlineUsers }) => {
      setParticipants(prev => prev.map(user => ({
        ...user,
        online: onlineUsers.includes(user.id)
      })));
    };

    // User online status of all participants handler
    const handleUserStatus = ({ userId, online }) => {
      setParticipants(prev => prev.map(user => 
        user.id === userId ? { ...user, online } : user
      ));
    };

    // Message handler
    const handleNewMessage = (message) => {
      console.log('SOCKET RECEIVE', message.tempId, tempMessagesRef.current);
      
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
        playNotification();
      }
      scrollToBottom();
    };

    // Typing handler
    const handleTypingEvent = ({ userId, isTyping }) => {
      var typer = participants.filter((user) => parseInt(user.id) === parseInt(typingUsers[0])).map(user => (user.username))
      console.log('typer',typer)
      if (typer.length <  1) {
        console.log('typer imepita',typer.length)
        setIsTyperPresent(!isTyperPresent);
        // setIsTyperPresent((change) => !change);
      }
      setTypingUsers(prev => {
        if (isTyping) {
          return [...new Set([...prev, userId])]; // Ensure unique users
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    };

    // Set up event listeners
    socketRef.current.on('presenceUpdate', handlePresenceUpdate);
    socketRef.current.on('userStatus', handleUserStatus);
    socketRef.current.on('newMessage', handleNewMessage);
    socketRef.current.on('typing', handleTypingEvent);

    return () => {
      console.log('Cleaning up club chat socket...');
      socketRef.current.off('presenceUpdate', handlePresenceUpdate);
      socketRef.current.off('userStatus', handleUserStatus);
      socketRef.current.off('newMessage', handleNewMessage);
      socketRef.current.off('typing', handleTypingEvent);
      socketRef.current.disconnect();
    };
  }, [room.photoId, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (typing) => {
    setIsTyping(typing);
    socketRef.current.emit('typing', { 
      roomId: room.photoId, 
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
        const type = mediaFiles[0].type.split('/')[0]; // 'image', 'video', 'audio'
        const uploadResponse = await uploadMedia(room.photoId, type);
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
        // fileUrl: mediaUrls.length ? mediaUrls : undefined
      };
    
      // Store temporary message
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
        roomId: room.photoId,
        message: {
          ...newMessage,
          tempId: tempId
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

  // Format typing indicator text
  const typingText = 
    typingUsers.length === 1? 
    `${participants.filter((user) => parseInt(user.id) === parseInt(typingUsers[0])).map(user => (user.username))} is typing...`
    :
    typingUsers.length > 0 
    ? `${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`
    : '';

  // Just add the call buttons to the header:

  return (
    <div className={`club-chat-container ${theme}`}>
      {inCall && (
        <VideoCall 
          roomId={room.photoId}
          userId={currentUserId}
          otherUserIds={participants.map(p => p.id)}
          callType={callType}
          onEndCall={endGroupCall}
        />
      )}

      <div className={`chat-header ${theme}`}>
        <h3>{room.name.toUpperCase()} CHAT</h3>
        <div className={`typing-indicator ${typingUsers.length > 0?'':'active'} ${theme}`}>
          {typingText}
        </div>
        <div className="call-buttons">
          <button 
            className={`call-btn ${theme}`}
            onClick={() => startGroupCall('video')}
          >
            <FaVideo />
          </button>
          <button 
            className={`call-btn ${theme}`}
            onClick={() => startGroupCall('audio')}
          >
            <FaPhone />
          </button>
        </div>
        <button onClick={onClose}>✕</button>
      </div>

      {/* Mobile Tabs */}
      <div className={`mobile-tabs ${theme}`}>
        <button 
          className={`tab-button ${activeTab === 'participants' ? 'active' : ''} ${theme}`}
          onClick={() => setActiveTab('participants')}
        >
          <FaUserFriends /> Participants
        </button>
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''} ${theme}`}
          onClick={() => setActiveTab('chat')}
        >
          <FaPaperPlane /> Chat
        </button>
        <button 
          className={`tab-button ${activeTab === 'info' ? 'active' : ''} ${theme}`}
          onClick={() => setActiveTab('info')}
        >
          <FaInfoCircle /> Info
        </button>
      </div>

      <div className="chat-layout">
        {/* Participants Section */}
        <div className={`participants-section ${theme} ${activeTab === 'participants' ? 'mobile-active' : ''}`}>
          <div className="section-header">
            <FaUserFriends className="section-icon" />
            <h4>Participants ({participants.length})</h4>
          </div>
          {loadingParticipants ? (
            <div className="loading-participants">Loading participants...</div>
            ) : (
            <div className="participants-list">
              {participants
              .filter((user) => parseInt(user.id) !== parseInt(currentUserId))
              .map(user => (
                <div 
                  key={user.id} 
                  className="participant-card"
                  onClick={() => onOpenPrivateChat(user)}
                >
                  <div className="participant-avatar">
                    {user.avatar ? (
                      <img className="user-avatar" src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user?.avatar??"/uploads/avatar/default-avatar.png"}`} alt={user.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className={`status-bubble ${user.online ? 'online' : 'offline'}`} />
                  </div>
                  <div className="participant-info">
                    <span className="participant-name">{user.username || 'Unknown User'}</span>
                    <span className="participant-status">
                      {user.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <FaPaperPlane className="message-icon" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className={`chat-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
          <div className="attendance-buttons">
            <button 
              className={`attendance-btn present ${theme}`}
              onClick={() => {
                setAttendees(a => a + 1);
                if (window.navigator.vibrate) window.navigator.vibrate(50);
              }}
            >
              <span role="img" aria-label="Present">👍</span> 
              Present <span className="count">({attendees})</span>
            </button>
            
            <button 
              className={`attendance-btn absent ${theme}`}
              onClick={() => {
                setAttendees(a => Math.max(0, a - 1));
                if (window.navigator.vibrate) window.navigator.vibrate(50);
              }}
            >
              <span role="img" aria-label="Absent">👎</span> 
              Absent
            </button>
          </div>
          <div className="messages-container">
            {isLoading ? (
              <div className="loading-messages">Loading messages...</div>
            ) : (
              messages.map(msg => (
                <div 
                key={msg.id || msg.tempId} 
                className={`message ${parseInt(msg.senderId) === parseInt(currentUserId) ? 'sent' : 'received'} ${theme} ${msg.isPending ? 'pending' : ''}`}
              >
                {renderMessageContent(msg)}
                <div className="message-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  <span className="message-status">
                    {msg.isPending ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      <FaCheck className="check-icon" />
                    )}
                  </span>
                </div>
              </div>
              ))
            )}
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

        {/* Club Info Section */}
        <div className={`info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
          <div className="section-header">
            <FaInfoCircle className="section-icon" />
            <h4>Club Details</h4>
          </div>
          <div className="info-card">
            <div className="club-header">
              <h3>{room.name}</h3>
              <div className="attendees-count">
                <span role="img" aria-label="attendees">👥</span> {attendees} going
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-label">📍 Location:</span>
              <span className="info-value">{room.location || 'Unknown'}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">🕒 Hours:</span>
              <span className="info-value">{room.hours || 'Not specified'}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">📅 Events:</span>
              <span className="info-value">Weekly meetups</span>
            </div>
            
            <div className="club-description">
              {room.description || 'Join our vibrant community for great experiences!'}
            </div>
          </div>
        </div>
      </div>
      </div>
      );
};
export default ClubChatScreen;
// ***********************

// import React, { useState, useRef, useEffect, useContext } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, FaFile, FaUserFriends, FaInfoCircle, FaCheck, FaSpinner } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import io from 'socket.io-client';
// import { ThemeContext } from '../App';
// import useSound from '../hooks/useSound';
// import axios from 'axios';
// import useMediaUpload from '../hooks/useMediaUpload';
// import MediaControls from '../components/media/MediaControls';
// import MediaPreview from '../components/media/MediaPreview';

// const ClubChatScreen = ({ room, onClose, onOpenPrivateChat, setIsAuthModalOpen }) => {
//   const { theme } = useContext(ThemeContext);
//   const navigate = useNavigate();
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [attendees, setAttendees] = useState(0);
//   const [participants, setParticipants] = useState([]);
//   const [loadingParticipants, setLoadingParticipants] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat');
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const socketRef = useRef();
//   const { 
//     playNotification, 
//     playGroupChat, 
//     playSent 
//   } = useSound();
//   const {
//     mediaFiles,
//     setMediaFiles,
//     uploadProgress,
//     uploadError,
//     setUploadError,
//     isUploading,
//     handleFileChange,
//     uploadMedia,
//     clearFiles
//   } = useMediaUpload();
//   const [isSending, setIsSending] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const tempMessagesRef = useRef({});
//   const [tempMessages, setTempMessages] = useState({});
//   const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
//   const token = localStorage.getItem('accessToken');
//   const [id,setId] = useState(room.photoId);
//   const [isTyperPresent,setIsTyperPresent] = useState(true);

//   // Fetch participants from server
//   useEffect(() => {
//     const fetchParticipants = async () => {
//       setLoadingParticipants(true);
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/rooms/${room.photoId}/${room.name}/participants`,
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}`
//             }
//           }
//         );
        
//         // If room exists, use its participants
//         if (response.data) {
//           console.log('EXIST');
//           setParticipants(response.data);
//         } else {
//           // If room doesn't exist, create it first
//           await createRoom();
//           // Then fetch participants again
//           const newResponse = await axios.get(
//             `${process.env.REACT_APP_API_URL}/rooms/${room.photoId}/participants`,
//             {
//               headers: {
//                 Authorization: `Bearer ${localStorage.getItem('accessToken')}`
//               }
//             }
//           );
//           setParticipants(newResponse.data);
//         }
//       } catch (error) {
//         if (error.response?.status === 404) {
//           // Room doesn't exist, create it
//           try {
//             await createRoom();
//             const newResponse = await axios.get(
//               `${process.env.REACT_APP_API_URL}/rooms/${room.photoId}/participants`,
//               {
//                 headers: {
//                   Authorization: `Bearer ${localStorage.getItem('accessToken')}`
//                 }
//               }
//             );
//             setParticipants(newResponse.data);
//           } catch (creationError) {
//             console.error('Error creating room:', creationError);
//           }
//         } else {
//           console.error('Error fetching participants:', error);
//         }
//       } finally {
//         setLoadingParticipants(false);
//       }
//     };

//     const createRoom = async () => {
//       console.log('NOT EXIST');
//       try {
//         await axios.post(
//           `${process.env.REACT_APP_API_URL}/rooms`,
//           {
//             roomId: room.photoId, // Pass the photoId as the room ID
//             name: room.name,
//             isGroup: true,
//             userIds: [] // Add initial participants if needed
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}`
//             }
//           }
//         );
//       } catch (error) {
//         console.error('Error creating room:', error);
//         throw error;
//       }
//     };

//     fetchParticipants();
//   }, [/*room.photoId, room.name */isTyperPresent]);

//   // Load initial messages
//   useEffect(() => {
//     console.log('room => ',id,room);
    
//     const loadMessages = async () => {
//       setIsLoading(true);
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/messages/${id}`,
//           {
//             headers: { 
//               Authorization: `Bearer ${token}` 
//             }
//           }
//         );
//         setMessages(response.data);
//       } catch (error) {
//         console.error('Error loading messages:', error);
//         // Optional: Add error handling for 401/403/404
//         if (error.response) {
//           console.error('Server responded with:', error.response.status);
//           if (error.response.status === 401) {
//             // Handle unauthorized (e.g., redirect to login)
//             onClose();
//             setIsAuthModalOpen(true);
//           }
//         }
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadMessages();
//   }, [room.photoId, token]);

//   // Socket connection and event handlers
//   useEffect(() => {
//     console.log('Initializing socket connection for club chat...');
//     socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
//       withCredentials: true,
//       transports: ['websocket']
//     });

//     // Connection events
//     socketRef.current.on('connect', () => {
//       console.log('Socket connected:', socketRef.current.id);
//     });

//     socketRef.current.on('disconnect', () => {
//       console.log('Socket disconnected');
//     });

//     socketRef.current.on('connect_error', (err) => {
//       console.error('Socket connection error:', err);
//     });

//     // Join room
//     socketRef.current.emit('joinRoom', { 
//       roomId: room.photoId, 
//       userId: currentUserId 
//     });
    
//     // Presence handler
//     const handlePresenceUpdate = ({ onlineUsers }) => {
//       setParticipants(prev => prev.map(user => ({
//         ...user,
//         online: onlineUsers.includes(user.id)
//       })));
//     };

//     // User online status of all participants handler
//     const handleUserStatus = ({ userId, online }) => {
//       setParticipants(prev => prev.map(user => 
//         user.id === userId ? { ...user, online } : user
//       ));
//     };

//     // Message handler
//     const handleNewMessage = (message) => {
//       console.log('SOCKET RECEIVE', message.tempId, tempMessagesRef.current);
      
//       // Check if this is a response to our own message
//       if (message.tempId && tempMessagesRef.current[message.tempId]) {
//         // Replace the temporary message with the actual one from server
//         setMessages(prev => prev.map(msg => 
//           msg.tempId === message.tempId ? { ...message, isPending: false } : msg
//         ));
        
//         // Remove from temp storage
//         delete tempMessagesRef.current[message.tempId];
//         playSent();
//         setTempMessages(prev => {
//           const newTemp = {...prev};
//           delete newTemp[message.tempId];
//           return newTemp;
//         });
//       } 
//       // If it's a new message from other user
//       else if (message.senderId !== currentUserId) {
//         setMessages(prev => [...prev, { ...message, isPending: false }]);
//         playNotification();
//       }
//       scrollToBottom();
//     };

//     // Typing handler
//     const handleTypingEvent = ({ userId, isTyping }) => {
//       var typer = participants.filter((user) => parseInt(user.id) === parseInt(typingUsers[0])).map(user => (user.username))
//       console.log('typer',typer)
//       if (typer.length <  1) {
//         console.log('typer imepita',typer.length)
//         setIsTyperPresent(!isTyperPresent);
//         // setIsTyperPresent((change) => !change);
//       }
//       setTypingUsers(prev => {
//         if (isTyping) {
//           return [...new Set([...prev, userId])]; // Ensure unique users
//         } else {
//           return prev.filter(id => id !== userId);
//         }
//       });
//     };

//     // Set up event listeners
//     socketRef.current.on('presenceUpdate', handlePresenceUpdate);
//     socketRef.current.on('userStatus', handleUserStatus);
//     socketRef.current.on('newMessage', handleNewMessage);
//     socketRef.current.on('typing', handleTypingEvent);

//     return () => {
//       console.log('Cleaning up club chat socket...');
//       socketRef.current.off('presenceUpdate', handlePresenceUpdate);
//       socketRef.current.off('userStatus', handleUserStatus);
//       socketRef.current.off('newMessage', handleNewMessage);
//       socketRef.current.off('typing', handleTypingEvent);
//       socketRef.current.disconnect();
//     };
//   }, [room.photoId, currentUserId]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleTyping = (typing) => {
//     setIsTyping(typing);
//     socketRef.current.emit('typing', { 
//       roomId: room.photoId, 
//       userId: currentUserId,
//       isTyping: typing 
//     });
//   };

//   const handleSendMessage = async () => {
//     if ((!message.trim() && !mediaFiles.length) || isSending) return;
    
//     setIsSending(true);
//     const tempId = Date.now().toString();
    
//     try {
//       let mediaUrls = [];
//       if (mediaFiles.length) {
//         const type = mediaFiles[0].type.split('/')[0]; // 'image', 'video', 'audio'
//         const uploadResponse = await uploadMedia(room.photoId, type);
//         if (uploadResponse) {
//           mediaUrls = uploadResponse.urls;
//         }
//       }      

//       const newMessage = {
//         content: message,
//         type: mediaFiles.length ? mediaFiles[0].type.split('/')[0] : 'text',
//         senderId: currentUserId,
//         createdAt: new Date().toISOString(),
//         tempId: tempId,
//         isPending: true,
//         mediaUrls: mediaUrls.length ? mediaUrls : undefined
//         // fileUrl: mediaUrls.length ? mediaUrls : undefined
//       };
    
//       // Store temporary message
//       tempMessagesRef.current[tempId] = newMessage;
//       setTempMessages(prev => ({...prev, [tempId]: newMessage}));
    
//       // Optimistic update
//       setMessages(prev => [...prev, {
//         ...newMessage,
//         id: tempId,
//         sender: 'You'
//       }]);
      
//       // Emit to server
//       socketRef.current.emit('sendMessage', {
//         roomId: room.photoId,
//         message: {
//           ...newMessage,
//           tempId: tempId
//         }
//       });
    
//       setMessage('');
//       clearFiles();
//       setIsTyping(false);
//       scrollToBottom();
//     } catch (error) {
//       console.error('Error sending message:', error);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   // Update message rendering to handle media
//   const renderMessageContent = (msg) => {
//     // if (msg.mediaUrls?.length) {
//     if (msg.mediaUrls?.length > 0 && (Array.isArray(msg.mediaUrls) || Array.isArray(JSON.parse(msg.mediaUrls)))) {
//       const mediaUrl = Array.isArray(msg.mediaUrls)?msg.mediaUrls:JSON.parse(msg.mediaUrls);
//       return (
//         <div className="message-media">
//           {mediaUrl.map((url, index) => {
//             if (msg.type === 'image') {
//               return <img key={index} src={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} alt={`Media ${index}`} className="message-media-item" />;
//             } else if (msg.type === 'video') {
//               return (
//                 <video key={index} controls className="message-media-item">
//                   <source src={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} type={`video/${url.split('.').pop()}`} />
//                 </video>
//               );
//             } else if (msg.type === 'audio') {
//               return (
//                 <audio key={index} controls className="message-media-item">
//                   <source src={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} type={`audio/${url.split('.').pop()}`} />
//                 </audio>
//               );
//             } else {
//               return (
//                 <a 
//                   key={index} 
//                   href={`${process.env.REACT_APP_API_URL.replace('/api','')}${url}`} 
//                   target="_blank" 
//                   rel="noopener noreferrer"
//                   className="message-file"
//                 >
//                   <FaFile /> Download File
//                 </a>
//               );
//             }
//           })}
//           {msg.content && <div className="message-text">{msg.content}</div>}
//         </div>
//       );
//     }
//     return <div className="message-content">{msg.content}</div>;
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Format typing indicator text
//   const typingText = 
//     typingUsers.length === 1? 
//     `${participants.filter((user) => parseInt(user.id) === parseInt(typingUsers[0])).map(user => (user.username))} is typing...`
//     :
//     typingUsers.length > 0 
//     ? `${typingUsers.length} user${typingUsers.length > 1 ? 's' : ''} typing...`
//     : '';

//   return (
//     <div className={`club-chat-container ${theme}`}>
//       <div className={`chat-header ${theme}`}>
//         <h3>{room.name.toUpperCase()} CHAT</h3>
//         <div className={`typing-indicator ${typingUsers.length > 0?'':'active'} ${theme}`}>
//           {typingText}
//         </div>
//         <button onClick={onClose}>✕</button>
//       </div>

//       {/* Mobile Tabs */}
//       <div className={`mobile-tabs ${theme}`}>
//         <button 
//           className={`tab-button ${activeTab === 'participants' ? 'active' : ''} ${theme}`}
//           onClick={() => setActiveTab('participants')}
//         >
//           <FaUserFriends /> Participants
//         </button>
//         <button 
//           className={`tab-button ${activeTab === 'chat' ? 'active' : ''} ${theme}`}
//           onClick={() => setActiveTab('chat')}
//         >
//           <FaPaperPlane /> Chat
//         </button>
//         <button 
//           className={`tab-button ${activeTab === 'info' ? 'active' : ''} ${theme}`}
//           onClick={() => setActiveTab('info')}
//         >
//           <FaInfoCircle /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         {/* Participants Section */}
//         <div className={`participants-section ${theme} ${activeTab === 'participants' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaUserFriends className="section-icon" />
//             <h4>Participants ({participants.length})</h4>
//           </div>
//           {loadingParticipants ? (
//             <div className="loading-participants">Loading participants...</div>
//             ) : (
//             <div className="participants-list">
//               {participants
//               .filter((user) => parseInt(user.id) !== parseInt(currentUserId))
//               .map(user => (
//                 <div 
//                   key={user.id} 
//                   className="participant-card"
//                   onClick={() => onOpenPrivateChat(user)}
//                 >
//                   <div className="participant-avatar">
//                     {user.avatar ? (
//                       <img className="user-avatar" src={`${process.env.REACT_APP_API_URL.replace('/api', '')}${user?.avatar??"/uploads/avatar/default-avatar.png"}`} alt={user.username} />
//                     ) : (
//                       <div className="avatar-placeholder">
//                         {user.username?.charAt(0)?.toUpperCase() || 'U'}
//                       </div>
//                     )}
//                     <span className={`status-bubble ${user.online ? 'online' : 'offline'}`} />
//                   </div>
//                   <div className="participant-info">
//                     <span className="participant-name">{user.username || 'Unknown User'}</span>
//                     <span className="participant-status">
//                       {user.online ? 'Online' : 'Offline'}
//                     </span>
//                   </div>
//                   <FaPaperPlane className="message-icon" />
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Main Chat Area */}
//         <div className={`chat-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
//           <div className="attendance-buttons">
//             <button 
//               className={`attendance-btn present ${theme}`}
//               onClick={() => {
//                 setAttendees(a => a + 1);
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Present">👍</span> 
//               Present <span className="count">({attendees})</span>
//             </button>
            
//             <button 
//               className={`attendance-btn absent ${theme}`}
//               onClick={() => {
//                 setAttendees(a => Math.max(0, a - 1));
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Absent">👎</span> 
//               Absent
//             </button>
//           </div>
//           <div className="messages-container">
//             {isLoading ? (
//               <div className="loading-messages">Loading messages...</div>
//             ) : (
//               messages.map(msg => (
//                 <div 
//                 key={msg.id || msg.tempId} 
//                 className={`message ${parseInt(msg.senderId) === parseInt(currentUserId) ? 'sent' : 'received'} ${theme} ${msg.isPending ? 'pending' : ''}`}
//               >
//                 {renderMessageContent(msg)}
//                 <div className="message-time">
//                   {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   <span className="message-status">
//                     {msg.isPending ? (
//                       <FaSpinner className="spinner" />
//                     ) : (
//                       <FaCheck className="check-icon" />
//                     )}
//                   </span>
//                 </div>
//               </div>
//               ))
//             )}
//             <div ref={messagesEndRef} />
//           </div>

//           {mediaFiles.length > 0 && (
//             <MediaPreview 
//               mediaFiles={mediaFiles}
//               onRemove={(index) => {
//                 const newFiles = [...mediaFiles];
//                 newFiles.splice(index, 1);
//                 setMediaFiles(newFiles);
//               }}
//               uploadProgress={uploadProgress}
//             />
//           )}

//           {uploadError && (
//             <div className="upload-error">
//               {uploadError}
//               <button onClick={() => setUploadError(null)}>×</button>
//             </div>
//           )}

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
//             <MediaControls 
//               onFileChange={handleFileChange}
//               theme={theme}
//             />
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
//             <button 
//               onClick={handleSendMessage} 
//               className={`send-button ${theme}`}
//               disabled={isSending || isUploading}
//             >
//               {isSending || isUploading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
//             </button>
//           </div>
//         </div>

//         {/* Club Info Section */}
//         <div className={`info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaInfoCircle className="section-icon" />
//             <h4>Club Details</h4>
//           </div>
//           <div className="info-card">
//             <div className="club-header">
//               <h3>{room.name}</h3>
//               <div className="attendees-count">
//                 <span role="img" aria-label="attendees">👥</span> {attendees} going
//               </div>
//             </div>
            
//             <div className="info-item">
//               <span className="info-label">📍 Location:</span>
//               <span className="info-value">{room.location || 'Unknown'}</span>
//             </div>
            
//             <div className="info-item">
//               <span className="info-label">🕒 Hours:</span>
//               <span className="info-value">{room.hours || 'Not specified'}</span>
//             </div>
            
//             <div className="info-item">
//               <span className="info-label">📅 Events:</span>
//               <span className="info-value">Weekly meetups</span>
//             </div>
            
//             <div className="club-description">
//               {room.description || 'Join our vibrant community for great experiences!'}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClubChatScreen;
// // ***************************************

// import React, { useState, useRef, useEffect, useContext } from 'react';
// import { FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, FaUserFriends, FaInfoCircle } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import io from 'socket.io-client';
// import { ThemeContext } from '../App'; // Assume you have this context
// import useSound from '../hooks/useSound'

// const ClubChatScreen = ({ room, onClose, onOpenPrivateChat }) => {
//   const { theme } = useContext(ThemeContext);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [attendees, setAttendees] = useState(0);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat'); // 'participants', 'chat', 'info'
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const socketRef = useRef();
//   const playNotificationSound = useSound();

//   useEffect(() => {
//     // Connect to WebSocket
//     socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`);
    
//     // Join room
//     socketRef.current.emit('joinRoom', { 
//       roomId: room.photoId, 
//       userId: localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null 
//     });

//     // Listen for typing events
//     socketRef.current.on('typing', ({ userId, isTyping }) => {
//       setTypingUsers(prev => {
//         if (isTyping) {
//           return [...prev, userId];
//         } else {
//           return prev.filter(id => id !== userId);
//         }
//       });
//     });

//     // Listen for new messages
//     socketRef.current.on('newMessage', (message) => {
//       setMessages(prev => [...prev, message]);
//       playNotificationSound();
//     });

//     return () => {
//       socketRef.current.disconnect();
//     };
//   }, [room.photoId]);

//   const handleTyping = (isTyping) => {
//     setIsTyping(isTyping);
//     socketRef.current.emit('typing', { 
//       roomId: room.photoId, 
//       userId: localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null,
//       isTyping 
//     });
//   };

// //   const handleSendMessage = () => {
// //     if (message.trim()) {
// //       setMessages([...messages, {
// //         id: Date.now(),
// //         text: message,
// //         sender: 'You',
// //         timestamp: new Date().toLocaleTimeString()
// //       }]);
// //       setMessage('');
// //     }
// //   };

//   const handleSendMessage = () => {
//     if (message.trim()) {
//       const newMessage = {
//         id: Date.now(),
//         text: message,
//         sender: 'You',
//         timestamp: new Date().toLocaleTimeString()
//       };
      
//       // Emit to server
//       socketRef.current.emit('newMessage', {
//         roomId: room.photoId,
//         message: newMessage
//       });
      
//       setMessages(prev => [...prev, newMessage]);
//       setMessage('');
//       handleTyping(false);
//     }
//   };

//   const participants = [
//     { id: 1, name: 'User1', avatar: '', online: true },
//     { id: 2, name: 'User2', avatar: '', online: false },
//     { id: 3, name: 'User3', avatar: '', online: true },
//     { id: 4, name: 'User4', avatar: '', online: false },
//     { id: 5, name: 'User5', avatar: '', online: true },
//     { id: 6, name: 'User6', avatar: '', online: false },
//     { id: 7, name: 'User7', avatar: '', online: true },
//     { id: 8, name: 'User8', avatar: '', online: true },
//     { id: 9, name: 'User9', avatar: '', online: true },
//     { id: 10, name: 'User10', avatar: '', online: true },
//     { id: 11, name: 'User11', avatar: '', online: true },
//     { id: 12, name: 'User12', avatar: '', online: false },
//     { id: 13, name: 'User13', avatar: '', online: false },
//     { id: 14, name: 'User14', avatar: '', online: true },
//     { id: 15, name: 'User15', avatar: '', online: true },
//     { id: 16, name: 'User16', avatar: '', online: false },
//   ];

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   return (
//     <div className={`club-chat-container ${theme}`}>
//       <div className={`chat-header ${theme}`}>
//       <h3>{room.name} Chat</h3>
//         <button onClick={onClose}>✕</button>
//       </div>

//       {/* Mobile Tabs */}
//       <div className={`mobile-tabs ${theme}`}>
//         <button 
//             className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
//             onClick={() => setActiveTab('participants')}
//         >
//             <FaUserFriends /> Participants
//         </button>
//         <button 
//             className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
//             onClick={() => setActiveTab('chat')}
//         >
//             <FaPaperPlane /> Chat
//         </button>
//         <button 
//             className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
//             onClick={() => setActiveTab('info')}
//         >
//             <FaInfoCircle /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         {/* Participants Section - now conditionally rendered */}
//         <div className={`participants-section ${theme} ${activeTab === 'participants' ? 'mobile-active' : ''}`}>
//             <div className="section-header">
//                 <FaUserFriends className="section-icon" />
//                 <h4>Participants ({participants.length})</h4>
//             </div>
//             <div className="participants-list">
//                 {participants.map(user => (
//                 <div 
//                     key={user.id} 
//                     className="participant-card"
//                     onClick={() => onOpenPrivateChat(user)}
//                 >
//                     <div className="participant-avatar">
//                     {user.avatar ? (
//                         <img src={user.avatar} alt={user.username} />
//                     ) : (
//                         <div className="avatar-placeholder">
//                         {user.username.charAt(0).toUpperCase()}
//                         </div>
//                     )}
//                     <span className={`status-bubble ${user.online ? 'online' : 'offline'}`} />
//                     </div>
//                     <div className="participant-info">
//                     <span className="participant-name">{user.username}</span>
//                     <span className="participant-status">
//                         {user.online ? 'Online' : 'Offline'}
//                     </span>
//                     </div>
//                     <FaPaperPlane className="message-icon" />
//                 </div>
//                 ))}
//             </div>
//         </div>

//         {/* Main Chat Area - now conditionally rendered */}
//         <div className={`chat-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
//             <div className="attendance-buttons">
//                 {/* Present alternatives: "✅" "🎉" "🙋" "🟢" */}
//                 {/* Absent alternatives: "❌" "😞" "🚫" "🔴" */}
//                 <button 
//                     className={`attendance-btn present ${theme}`}
//                     onClick={() => {
//                     setAttendees(a => a + 1);
//                     // Optional: Add haptic feedback on mobile
//                     if (window.navigator.vibrate) window.navigator.vibrate(50);
//                     }}
//                 >
//                     <span role="img" aria-label="Present">👍</span> 
//                     Present <span className="count">({attendees})</span>
//                 </button>
                
//                 <button 
//                     className={`attendance-btn absent ${theme}`}
//                     onClick={() => {
//                     setAttendees(a => Math.max(0, a - 1));
//                     if (window.navigator.vibrate) window.navigator.vibrate(50);
//                     }}
//                 >
//                     <span role="img" aria-label="Absent">👎</span> 
//                     Absent
//                 </button>
//             </div>
//             <div className="messages-container">
//                 {messages.map(msg => (
//                 <div 
//                     key={msg.id} 
//                     className={`message ${msg.sender === 'You' ? 'sent' : 'received'} ${theme}`}
//                 >
//                     <div className="message-content">{msg.text}</div>
//                     <div className="message-time">{msg.timestamp}</div>
//                 </div>
//                 ))}
//                 <div ref={messagesEndRef} />
//             </div>

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
//               onFocus={() => handleTyping(true)}
//               onBlur={() => handleTyping(false)}
//               onChange={(e) => {
//                 setMessage(e.target.value);
//                 handleTyping(!!e.target.value);
//               }}
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

//         {/* Club Info Section - now conditionally rendered */}
//         <div className={`info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//             <div className="section-header">
//                 <FaInfoCircle className="section-icon" />
//                 <h4>Club Details</h4>
//             </div>
//             <div className="info-card">
//                 <div className="club-header">
//                 <h3>{room.name}</h3>
//                 <div className="attendees-count">
//                     <span role="img" aria-label="attendees">👥</span> {attendees} going
//                 </div>
//                 </div>
                
//                 <div className="info-item">
//                 <span className="info-label">📍 Location:</span>
//                 <span className="info-value">{room.location || 'Unknown'}</span>
//                 </div>
                
//                 <div className="info-item">
//                 <span className="info-label">🕒 Hours:</span>
//                 <span className="info-value">{room.hours || 'Not specified'}</span>
//                 </div>
                
//                 <div className="info-item">
//                 <span className="info-label">📅 Events:</span>
//                 <span className="info-value">Weekly meetups</span>
//                 </div>
                
//                 <div className="club-description">
//                 {room.description || 'Join our vibrant community for great experiences!'}
//                 </div>
//             </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClubChatScreen;


// *********************************************

// import React, { useState, useRef, useEffect, useContext } from 'react';
// import { FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, FaUserFriends, FaInfoCircle, FaCheck, FaSpinner } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import io from 'socket.io-client';
// import { ThemeContext } from '../App';
// import useSound from '../hooks/useSound';
// import axios from 'axios';

// const ClubChatScreen = ({ room, onClose, onOpenPrivateChat }) => {
//   const { theme } = useContext(ThemeContext);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [attendees, setAttendees] = useState(0);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat');
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const socketRef = useRef();
//   const { playNotification, playSent } = useSound();
//   const [isSending, setIsSending] = useState(false);
//   const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
//   const tempMessagesRef = useRef({});
//   const [isSocketConnected, setIsSocketConnected] = useState(false);

//   useEffect(() => {
//     if (!room?.id) return;

//     const loadMessages = async () => {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/messages/group/${room.photoId}`,
//           { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
//         );
//         setMessages(response.data);
//       } catch (error) {
//         console.error('Error loading group messages:', error);
//         if (error.response?.status === 404) {
//           console.log('No messages found for this group');
//         }
//       }
//     };
//     loadMessages();

//     socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
//       withCredentials: true,
//       transports: ['websocket']
//     });

//     socketRef.current.on('connect', () => {
//       setIsSocketConnected(true);
//       socketRef.current.emit('joinRoom', {
//         roomId: room.photoId,
//         userId: currentUserId
//       });
//     });

//     socketRef.current.on('disconnect', () => {
//       setIsSocketConnected(false);
//     });
    
//     socketRef.current.emit('joinRoom', { 
//       roomId: room.photoId, 
//       userId: currentUserId 
//     });

//     socketRef.current.on('typing', ({ userId, isTyping }) => {
//       setTypingUsers(prev => isTyping 
//         ? [...new Set([...prev, userId])] 
//         : prev.filter(id => id !== userId))
//     });

//     const handleNewMessage = (message) => {
//       if (message.tempId && tempMessagesRef.current[message.tempId]) {
//         setMessages(prev => prev.map(msg => 
//           msg.tempId === message.tempId ? { ...message, isPending: false } : msg
//         ));
//         delete tempMessagesRef.current[message.tempId];
//         playSent();
//       } else {
//         setMessages(prev => [...prev, message]);
//         if (message.senderId !== currentUserId) playNotification();
//       }
//       scrollToBottom();
//     };

    
//     const handleNewGroupMessage = (message) => {
//       if (message.tempId && tempMessagesRef.current[message.tempId]) {
//         setMessages(prev => prev.map(msg => 
//           msg.tempId === message.tempId ? { ...message, isPending: false } : msg
//         ));
//         delete tempMessagesRef.current[message.tempId];
//         playSent();
//       } else {
//         setMessages(prev => [...prev, message]);
//         if (message.senderId !== currentUserId) playNotification();
//       }
//       scrollToBottom();
//     };

//     socketRef.current.on('newGroupMessage', handleNewGroupMessage);
//     socketRef.current.on('newMessage', handleNewMessage);

    
//     return () => {
//       socketRef.current.off('newGroupMessage', handleNewGroupMessage);
//       socketRef.current.off('newMessage', handleNewMessage);
//       socketRef.current.disconnect();
//     };
//   }, [room?.id, currentUserId]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleTyping = (typing) => {
//     if (!socketRef.current?.connected) {
//       console.warn('Socket not connected - cannot send typing indicator');
//       return;
//     }

//     setIsTyping(typing);
//     try {
//       socketRef.current.emit('typing', {
//         roomId: room.photoId,
//         userId: currentUserId,
//         isTyping: typing
//       });
//     } catch (error) {
//       console.error('Error sending typing indicator:', error);
//     }
//   };

//   const handleSendMessage = () => {
//     if (!message.trim() || isSending) return;
  
//     // Add this check
//     if (!socketRef.current?.connected) {
//       console.error('Cannot send message - socket not connected');
//       return;
//     }
    
//     setIsSending(true);
//     const tempId = Date.now().toString();
//     const newMessage = {
//       content: message,
//       type: 'text',
//       senderId: currentUserId,
//       createdAt: new Date().toISOString(),
//       tempId,
//       isPending: true,
//       roomId: room.photoId
//     };

//     tempMessagesRef.current[tempId] = newMessage;
//     const currentUser = JSON.parse(localStorage.getItem('user'));
//     setMessages(prev => [...prev, { ...newMessage, sender: { username: currentUser?.username??'You' }  }]);
    
//     try {
//       socketRef.current.emit('sendMessage', {
//         roomId: room.photoId,
//         message: newMessage
//       });
//     } catch (error) {
//       console.error('Error sending message:', error);
//       // Mark message as failed
//       setMessages(prev => prev.map(msg => 
//         msg.tempId === tempId ? { ...msg, isPending: false, failed: true } : msg
//       ));
//     }

//     setMessage('');
//     handleTyping(false);
//     scrollToBottom();
//     setIsSending(false);
//   };


//   const participants = [
//     { id: 1, name: 'User1', avatar: '', online: true },
//     { id: 2, name: 'User2', avatar: '', online: false },
//     { id: 3, name: 'User3', avatar: '', online: true },
//     { id: 4, name: 'User4', avatar: '', online: false },
//     { id: 5, name: 'User5', avatar: '', online: true },
//     { id: 6, name: 'User6', avatar: '', online: false },
//     { id: 7, name: 'User7', avatar: '', online: true },
//     { id: 8, name: 'User8', avatar: '', online: true },
//     { id: 9, name: 'User9', avatar: '', online: true },
//     { id: 10, name: 'User10', avatar: '', online: true },
//     { id: 11, name: 'User11', avatar: '', online: true },
//     { id: 12, name: 'User12', avatar: '', online: false },
//     { id: 13, name: 'User13', avatar: '', online: false },
//     { id: 14, name: 'User14', avatar: '', online: true },
//     { id: 15, name: 'User15', avatar: '', online: true },
//     { id: 16, name: 'User16', avatar: '', online: false },
//   ];

//   return (
//     <div className={`club-chat-container ${theme}`}>
//       <div className={`chat-header ${theme}`}>
//         <h3>{room.name} Chat</h3>
//         <button onClick={onClose}>✕</button>
//       </div>

//       <div className={`mobile-tabs ${theme}`}>
//         <button onClick={() => setActiveTab('participants')}>
//           <FaUserFriends /> Participants
//         </button>
//         <button onClick={() => setActiveTab('chat')}>
//           <FaPaperPlane /> Chat
//         </button>
//         <button onClick={() => setActiveTab('info')}>
//           <FaInfoCircle /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         {/* Participants Section - now conditionally rendered */}
//         <div className={`participants-section ${theme} ${activeTab === 'participants' ? 'mobile-active' : ''}`}>
//             <div className="section-header">
//                 <FaUserFriends className="section-icon" />
//                 <h4>Participants ({participants.length})</h4>
//             </div>
//             <div className="participants-list">
//                 {participants.map(user => (
//                 <div 
//                     key={user.id} 
//                     className="participant-card"
//                     onClick={() => onOpenPrivateChat(user)}
//                 >
//                     <div className="participant-avatar">
//                     {user.avatar ? (
//                         <img src={user.avatar} alt={user.username} />
//                     ) : (
//                         <div className="avatar-placeholder">
//                         {user.username.charAt(0).toUpperCase()}
//                         </div>
//                     )}
//                     <span className={`status-bubble ${user.online ? 'online' : 'offline'}`} />
//                     </div>
//                     <div className="participant-info">
//                     <span className="participant-name">{user.username}</span>
//                     <span className="participant-status">
//                         {user.online ? 'Online' : 'Offline'}
//                     </span>
//                     </div>
//                     <FaPaperPlane className="message-icon" />
//                 </div>
//                 ))}
//             </div>
//         </div>
        
//          {/* Main Chat Area - now conditionally rendered */}
//         <div className={`chat-section ${theme}`}>
//           <div className="messages-container">
//             {messages.map(msg => (
//               <div key={msg.id || msg.tempId} 
//                 className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'} ${theme}`}>
//                 {msg.senderId !== currentUserId && (
//                   <div className="sender-name">{msg.sender?.username}</div>
//                 )}
//                 <div className="message-content">{msg.content}</div>
//                 <div className="message-meta">
//                   <span className="message-time">
//                     {new Date(msg.createdAt).toLocaleTimeString()}
//                   </span>
//                   {msg.senderId === currentUserId && (
//                     <span className="message-status">
//                       {msg.isPending ? <FaSpinner /> : <FaCheck />}
//                     </span>
//                   )}
//                 </div>
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
//               onFocus={() => handleTyping(true)}
//               onBlur={() => handleTyping(false)}
//               onChange={(e) => {
//                 setMessage(e.target.value);
//                 handleTyping(!!e.target.value);
//               }}
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
//               onClick={handleSendMessage} disabled={isSending}
//               className={`send-button ${theme}`}
//             >
//               {isSending ? <FaSpinner /> : <FaPaperPlane />}
//             </button>
//           </div>
//         </div>

//         {/* Club Info Section - now conditionally rendered */}
//         <div className={`info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//             <div className="section-header">
//                 <FaInfoCircle className="section-icon" />
//                 <h4>Club Details</h4>
//             </div>
//             <div className="info-card">
//                 <div className="club-header">
//                 <h3>{room.name}</h3>
//                 <div className="attendees-count">
//                     <span role="img" aria-label="attendees">👥</span> {attendees} going
//                 </div>
//                 </div>
                
//                 <div className="info-item">
//                 <span className="info-label">📍 Location:</span>
//                 <span className="info-value">{room.location || 'Unknown'}</span>
//                 </div>
                
//                 <div className="info-item">
//                 <span className="info-label">🕒 Hours:</span>
//                 <span className="info-value">{room.hours || 'Not specified'}</span>
//                 </div>
                
//                 <div className="info-item">
//                 <span className="info-label">📅 Events:</span>
//                 <span className="info-value">Weekly meetups</span>
//                 </div>
                
//                 <div className="club-description">
//                 {room.description || 'Join our vibrant community for great experiences!'}
//                 </div>
//             </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClubChatScreen;

// **********************************************


// import React, { useState, useEffect, useRef, useContext } from 'react';
// import { 
//   FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, 
//   FaUserFriends, FaInfoCircle, FaCheck, FaSpinner, FaExclamationTriangle 
// } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import io from 'socket.io-client';
// import { ThemeContext } from '../App';
// import useSound from '../hooks/useSound';
// import axios from 'axios';

// const ClubChatScreen = ({ room, onClose, onOpenPrivateChat }) => {
//   const { theme } = useContext(ThemeContext);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [attendees, setAttendees] = useState(0);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat');
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const socketRef = useRef(null);
//   const { playNotification, playSent } = useSound();
//   const [isSending, setIsSending] = useState(false);
//   const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
//   const tempMessagesRef = useRef({});
//   const [connectionStatus, setConnectionStatus] = useState('connecting');
//   const [failedMessages, setFailedMessages] = useState({});

//   const participants = [
//     { id: 1, name: 'User1', avatar: '', online: true },
//     { id: 2, name: 'User2', avatar: '', online: false },
//     { id: 3, name: 'User3', avatar: '', online: true },
//     { id: 4, name: 'User4', avatar: '', online: false },
//     { id: 5, name: 'User5', avatar: '', online: true },
//     { id: 6, name: 'User6', avatar: '', online: false },
//     { id: 7, name: 'User7', avatar: '', online: true },
//     { id: 8, name: 'User8', avatar: '', online: true },
//     { id: 9, name: 'User9', avatar: '', online: true },
//     { id: 10, name: 'User10', avatar: '', online: true },
//     { id: 11, name: 'User11', avatar: '', online: true },
//     { id: 12, name: 'User12', avatar: '', online: false },
//     { id: 13, name: 'User13', avatar: '', online: false },
//     { id: 14, name: 'User14', avatar: '', online: true },
//     { id: 15, name: 'User15', avatar: '', online: true },
//     { id: 16, name: 'User16', avatar: '', online: false },
//   ];

//   useEffect(() => {
//     if (!room?.id) return;

//     const loadMessages = async () => {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/messages/group/${room.photoId}`,
//           { 
//             headers: { 
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
//             } 
//           }
//         );
//         setMessages(response.data);
//       } catch (error) {
//         console.error('Error loading group messages:', error);
//       }
//     };

//     socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
//       withCredentials: true,
//       transports: ['websocket'],
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000
//     });

//     socketRef.current.on('connect', () => {
//       setConnectionStatus('connected');
//       socketRef.current.emit('joinRoom', {
//         roomId: room.photoId,
//         userId: currentUserId
//       });
//     });

//     socketRef.current.on('disconnect', () => {
//       setConnectionStatus('disconnected');
//     });

//     socketRef.current.on('connect_error', () => {
//       setConnectionStatus('error');
//     });

//     const handleNewMessage = (message) => {
//       if (message.tempId && tempMessagesRef.current[message.tempId]) {
//         setMessages(prev => prev.map(msg => 
//           msg.tempId === message.tempId ? { ...message, isPending: false } : msg
//         ));
//         delete tempMessagesRef.current[message.tempId];
//         playSent();
//       } else {
//         setMessages(prev => [...prev, message]);
//         if (message.senderId !== currentUserId) playNotification();
//       }
//       scrollToBottom();
//     };

//     socketRef.current.on('newGroupMessage', handleNewMessage);
//     socketRef.current.on('typing', ({ userId, isTyping }) => {
//       setTypingUsers(prev => isTyping 
//         ? [...new Set([...prev, userId])] 
//         : prev.filter(id => id !== userId)
//       );
//     });

//     loadMessages();

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.off('newGroupMessage');
//         socketRef.current.disconnect();
//       }
//     };
//   }, [room?.id, currentUserId]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleTyping = (typing) => {
//     if (!socketRef.current?.connected) return;
    
//     setIsTyping(typing);
//     try {
//       socketRef.current.emit('typing', {
//         roomId: room.photoId,
//         userId: currentUserId,
//         isTyping: typing
//       });
//     } catch (error) {
//       console.error('Error sending typing indicator:', error);
//     }
//   };

//   const handleSendMessage = () => {
//     if (!message.trim() || isSending) return;
//     console.log('socketRef.current',socketRef.current);
    
//     if (!socketRef.current?.connected) {
//       console.error('Cannot send message - socket not connected');
//       return;
//     }

//     setIsSending(true);
//     const tempId = Date.now().toString();
//     const currentUser = JSON.parse(localStorage.getItem('user')) || {};
//     const newMessage = {
//       content: message,
//       type: 'text',
//       senderId: currentUserId,
//       sender: {
//         username: currentUser.username || 'You',
//         avatar: currentUser.avatar
//       },
//       createdAt: new Date().toISOString(),
//       tempId,
//       isPending: true,
//       roomId: room.photoId
//     };

//     tempMessagesRef.current[tempId] = newMessage;
//     setMessages(prev => [...prev, newMessage]);
    
//     try {
//       socketRef.current.emit('sendMessage', {
//         roomId: room.photoId,
//         message: newMessage
//       });
//     } catch (error) {
//       console.error('Error sending message:', error);
//       setMessages(prev => prev.map(msg => 
//         msg.tempId === tempId ? { ...msg, isPending: false, failed: true } : msg
//       ));
//       setFailedMessages(prev => ({ ...prev, [tempId]: true }));
//     }

//     setMessage('');
//     handleTyping(false);
//     scrollToBottom();
//     setIsSending(false);
//   };

//   const retryFailedMessage = (tempId) => {
//     const failedMessage = messages.find(msg => msg.tempId === tempId);
//     if (!failedMessage) return;

//     setFailedMessages(prev => ({ ...prev, [tempId]: false }));
//     setMessages(prev => prev.map(msg => 
//       msg.tempId === tempId ? { ...msg, isPending: true, failed: false } : msg
//     ));

//     socketRef.current.emit('sendMessage', {
//       roomId: room.photoId,
//       message: failedMessage
//     });
//   };

//   return (
//     <div className={`club-chat-container ${theme}`}>
//       {connectionStatus !== 'connected' && (
//         <div className={`connection-status ${connectionStatus}`}>
//           {connectionStatus === 'connecting' && 'Connecting to chat...'}
//           {connectionStatus === 'disconnected' && 'Disconnected - attempting to reconnect...'}
//           {connectionStatus === 'error' && 'Connection error - please refresh'}
//         </div>
//       )}

//       <div className={`chat-header ${theme}`}>
//         <h3>{room.name} Chat</h3>
//         <button onClick={onClose}>✕</button>
//       </div>

//       <div className={`mobile-tabs ${theme}`}>
//         <button 
//           className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
//           onClick={() => setActiveTab('participants')}
//         >
//           <FaUserFriends /> Participants
//         </button>
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
//           <FaInfoCircle /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         <div className={`participants-section ${theme} ${activeTab === 'participants' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaUserFriends className="section-icon" />
//             <h4>Participants ({participants.length})</h4>
//           </div>
//           <div className="participants-list">
//             {participants.map(user => (
//               <div 
//                 key={user.id} 
//                 className="participant-card"
//                 onClick={() => onOpenPrivateChat(user)}
//               >
//                 <div className="participant-avatar">
//                   {user.avatar ? (
//                     <img src={user.avatar} alt={user.username} />
//                   ) : (
//                     <div className="avatar-placeholder">
//                       {user.username.charAt(0).toUpperCase()}
//                     </div>
//                   )}
//                   <span className={`status-bubble ${user.online ? 'online' : 'offline'}`} />
//                 </div>
//                 <div className="participant-info">
//                   <span className="participant-name">{user.username}</span>
//                   <span className="participant-status">
//                     {user.online ? 'Online' : 'Offline'}
//                   </span>
//                 </div>
//                 <FaPaperPlane className="message-icon" />
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className={`chat-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
//           <div className="attendance-buttons">
//             <button 
//               className={`attendance-btn present ${theme}`}
//               onClick={() => {
//                 setAttendees(a => a + 1);
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Present">👍</span> 
//               Present <span className="count">({attendees})</span>
//             </button>
//             <button 
//               className={`attendance-btn absent ${theme}`}
//               onClick={() => {
//                 setAttendees(a => Math.max(0, a - 1));
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Absent">👎</span> 
//               Absent
//             </button>
//           </div>

//           <div className="messages-container">
//             {messages.map(msg => (
//               <div 
//                 key={msg.id || msg.tempId} 
//                 className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'} ${theme} ${msg.isPending ? 'pending' : ''}`}
//               >
//                 {msg.senderId !== currentUserId && msg.sender?.username && (
//                   <div className="sender-name">{msg.sender.username}</div>
//                 )}
//                 <div className="message-content">{msg.content}</div>
//                 <div className="message-meta">
//                   <span className="message-time">
//                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   </span>
//                   {msg.senderId === currentUserId && (
//                     <span className="message-status">
//                       {msg.isPending ? (
//                         <FaSpinner className="spinner" />
//                       ) : msg.failed ? (
//                         <div className="failed-message">
//                           <FaExclamationTriangle className="failed-icon" />
//                           <button 
//                             onClick={() => retryFailedMessage(msg.tempId)} 
//                             className="retry-btn"
//                           >
//                             Retry
//                           </button>
//                         </div>
//                       ) : (
//                         <FaCheck className="check-icon" />
//                       )}
//                     </span>
//                   )}
//                 </div>
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
//               <button className={theme}><FaVideo /></button>
//               <button className={theme}><FaMusic /></button>
//             </div>
//             <button 
//               onClick={handleSendMessage} 
//               className={`send-button ${theme}`}
//               disabled={isSending || !message.trim()}
//             >
//               {isSending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
//             </button>
//           </div>
//         </div>

//         <div className={`info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaInfoCircle className="section-icon" />
//             <h4>Club Details</h4>
//           </div>
//           <div className="info-card">
//             <div className="club-header">
//               <h3>{room.name}</h3>
//               <div className="attendees-count">
//                 <span role="img" aria-label="attendees">👥</span> {attendees} going
//               </div>
//             </div>
//             <div className="info-item">
//               <span className="info-label">📍 Location:</span>
//               <span className="info-value">{room.location || 'Unknown'}</span>
//             </div>
//             <div className="info-item">
//               <span className="info-label">🕒 Hours:</span>
//               <span className="info-value">{room.hours || 'Not specified'}</span>
//             </div>
//             <div className="info-item">
//               <span className="info-label">📅 Events:</span>
//               <span className="info-value">Weekly meetups</span>
//             </div>
//             <div className="club-description">
//               {room.description || 'Join our vibrant community for great experiences!'}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClubChatScreen;

// ********************************************

// import React, { useState, useEffect, useRef, useContext } from 'react';
// import { 
//   FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, 
//   FaUserFriends, FaInfoCircle, FaCheck, FaSpinner, FaExclamationTriangle 
// } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import io from 'socket.io-client';
// import { ThemeContext } from '../App';
// import useSound from '../hooks/useSound';
// import axios from 'axios';

// const ClubChatScreen = ({ room, onClose, onOpenPrivateChat }) => {
//   const { theme } = useContext(ThemeContext);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [attendees, setAttendees] = useState(0);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat');
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const socketRef = useRef(null);
//   const { playNotification, playSent } = useSound();
//   const [isSending, setIsSending] = useState(false);
//   const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
//   const tempMessagesRef = useRef({});
//   const [connectionStatus, setConnectionStatus] = useState('connecting');
//   const [failedMessages, setFailedMessages] = useState({});

//   const participants = [
//     { id: 1, name: 'User1', avatar: '', online: true },
//     { id: 2, name: 'User2', avatar: '', online: false },
//     { id: 3, name: 'User3', avatar: '', online: true },
//     { id: 4, name: 'User4', avatar: '', online: false },
//     { id: 5, name: 'User5', avatar: '', online: true },
//     { id: 6, name: 'User6', avatar: '', online: false },
//     { id: 7, name: 'User7', avatar: '', online: true },
//     { id: 8, name: 'User8', avatar: '', online: true },
//     { id: 9, name: 'User9', avatar: '', online: true },
//     { id: 10, name: 'User10', avatar: '', online: true },
//     { id: 11, name: 'User11', avatar: '', online: true },
//     { id: 12, name: 'User12', avatar: '', online: false },
//     { id: 13, name: 'User13', avatar: '', online: false },
//     { id: 14, name: 'User14', avatar: '', online: true },
//     { id: 15, name: 'User15', avatar: '', online: true },
//     { id: 16, name: 'User16', avatar: '', online: false },
//   ];

//   useEffect(() => {
//     if (!room?.id) return;

//     console.log('Initializing socket connection for club chat...');
    
//     const socket = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
//       withCredentials: true,
//       transports: ['websocket'],
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       autoConnect: true
//     });

//     socketRef.current = socket;

//     const handleConnect = () => {
//       console.log('Club chat socket connected:', socket.id);
//       setConnectionStatus('connected');
//       socket.emit('joinRoom', {
//         roomId: room.photoId,
//         userId: currentUserId
//       });
      
//       // Resend any pending messages
//       Object.values(tempMessagesRef.current).forEach(msg => {
//         if (msg.isPending) {
//           socket.emit('sendMessage', {
//             roomId: room.photoId,
//             message: msg
//           });
//         }
//       });
//     };

//     const handleDisconnect = () => {
//       console.log('Club chat socket disconnected');
//       setConnectionStatus('disconnected');
//     };

//     const handleConnectError = (err) => {
//       console.error('Club chat connection error:', err);
//       setConnectionStatus('error');
//     };

//     socket.on('connect', handleConnect);
//     socket.on('disconnect', handleDisconnect);
//     socket.on('connect_error', handleConnectError);

//     // Add reconnection listeners
//     socket.on('reconnecting', (attempt) => {
//       console.log(`Reconnecting attempt ${attempt}`);
//       setConnectionStatus('reconnecting');
//     });

//     socket.on('reconnect_failed', () => {
//       console.error('Reconnection failed');
//       setConnectionStatus('failed');
//     });

//     const loadMessages = async () => {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/messages/group/${room.photoId}`,
//           { 
//             headers: { 
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
//             } 
//           }
//         );
//         setMessages(response.data);
//       } catch (error) {
//         console.error('Error loading group messages:', error);
//       }
//     };

//     const handleNewMessage = (message) => {
//       console.log('Received group message:', message);
      
//       if (message.tempId && tempMessagesRef.current[message.tempId]) {
//         // Update our own pending message
//         setMessages(prev => prev.map(msg => 
//           msg.tempId === message.tempId ? { ...message, isPending: false } : msg
//         ));
//         delete tempMessagesRef.current[message.tempId];
//         playSent();
//       } else if (message.senderId !== currentUserId) {
//         // New message from others
//         setMessages(prev => [...prev, message]);
//         playNotification();
//       }
//       scrollToBottom();
//     };

//     socket.on('newGroupMessage', handleNewMessage);

//     socket.on('typing', ({ userId, isTyping }) => {
//       setTypingUsers(prev => isTyping 
//         ? [...new Set([...prev, userId])] 
//         : prev.filter(id => id !== userId)
//       );
//     });

//     loadMessages();

//     return () => {
//       console.log('Cleaning up club chat socket...');
//       socket.off('connect', handleConnect);
//       socket.off('disconnect', handleDisconnect);
//       socket.off('connect_error', handleConnectError);
//       socket.off('newGroupMessage', handleNewMessage);
//       socket.off('typing');
//       socket.disconnect();
//     };
//   }, [room?.id, currentUserId]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleTyping = (typing) => {
//     if (!socketRef.current?.connected) return;
    
//     setIsTyping(typing);
//     try {
//       socketRef.current.emit('typing', {
//         roomId: room.photoId,
//         userId: currentUserId,
//         isTyping: typing
//       });
//     } catch (error) {
//       console.error('Error sending typing indicator:', error);
//     }
//   };

//   const handleSendMessage = () => {
//     if (!message.trim() || isSending) return;

//     if (!socketRef.current?.connected) {
//       console.error('Cannot send message - socket not connected', {
//         socketExists: !!socketRef.current,
//         connected: socketRef.current?.connected,
//         connectionStatus
//       });
      
//       // Queue the message for when connection is restored
//       const tempId = Date.now().toString();
//       const currentUser = JSON.parse(localStorage.getItem('user')) || {};
//       const newMessage = {
//         content: message,
//         type: 'text',
//         senderId: currentUserId,
//         sender: {
//           username: currentUser.username || 'You',
//           avatar: currentUser.avatar
//         },
//         createdAt: new Date().toISOString(),
//         tempId,
//         isPending: true,
//         roomId: room.photoId,
//         failed: true
//       };

//       tempMessagesRef.current[tempId] = newMessage;
//       setMessages(prev => [...prev, newMessage]);
//       setMessage('');
//       return;
//     }

//     setIsSending(true);
//     const tempId = Date.now().toString();
//     const currentUser = JSON.parse(localStorage.getItem('user')) || {};
    
//     const newMessage = {
//       content: message,
//       type: 'text',
//       senderId: currentUserId,
//       sender: {
//         username: currentUser.username || 'You',
//         avatar: currentUser.avatar
//       },
//       createdAt: new Date().toISOString(),
//       tempId,
//       isPending: true,
//       roomId: room.photoId
//     };

//     tempMessagesRef.current[tempId] = newMessage;
//     setMessages(prev => [...prev, newMessage]);

//     try {
//       socketRef.current.emit('sendMessage', {
//         roomId: room.photoId,
//         message: newMessage
//       });
//     } catch (error) {
//       console.error('Error sending message:', error);
//       setMessages(prev => prev.map(msg => 
//         msg.tempId === tempId ? { ...msg, isPending: false, failed: true } : msg
//       ));
//       setFailedMessages(prev => ({ ...prev, [tempId]: true }));
//     }

//     setMessage('');
//     handleTyping(false);
//     scrollToBottom();
//     setIsSending(false);
//   };

//   const retryFailedMessage = (tempId) => {
//     const failedMessage = messages.find(msg => msg.tempId === tempId);
//     if (!failedMessage) return;

//     if (!socketRef.current?.connected) {
//       console.error('Cannot retry - socket not connected');
//       return;
//     }

//     setFailedMessages(prev => ({ ...prev, [tempId]: false }));
//     setMessages(prev => prev.map(msg => 
//       msg.tempId === tempId ? { ...msg, isPending: true, failed: false } : msg
//     ));

//     try {
//       socketRef.current.emit('sendMessage', {
//         roomId: room.photoId,
//         message: {
//           ...failedMessage,
//           isPending: true
//         }
//       });
//     } catch (error) {
//       console.error('Error retrying message:', error);
//       setMessages(prev => prev.map(msg => 
//         msg.tempId === tempId ? { ...msg, isPending: false, failed: true } : msg
//       ));
//     }
//   };

//   return (
//     <div className={`club-chat-container ${theme}`}>
//       {connectionStatus !== 'connected' && (
//         <div className={`connection-status ${connectionStatus}`}>
//           {connectionStatus === 'connecting' && 'Connecting to chat...'}
//           {connectionStatus === 'reconnecting' && 'Reconnecting...'}
//           {connectionStatus === 'disconnected' && 'Disconnected - attempting to reconnect...'}
//           {connectionStatus === 'error' && 'Connection error - please refresh'}
//           {connectionStatus === 'failed' && 'Connection failed - please refresh'}
//         </div>
//       )}

//       <div className={`chat-header ${theme}`}>
//         <h3>{room.name} Chat</h3>
//         <button onClick={onClose}>✕</button>
//       </div>

//       <div className={`mobile-tabs ${theme}`}>
//         <button 
//           className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
//           onClick={() => setActiveTab('participants')}
//         >
//           <FaUserFriends /> Participants
//         </button>
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
//           <FaInfoCircle /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         <div className={`participants-section ${theme} ${activeTab === 'participants' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaUserFriends className="section-icon" />
//             <h4>Participants ({participants.length})</h4>
//           </div>
//           <div className="participants-list">
//             {participants.map(user => (
//               <div 
//                 key={user.id} 
//                 className="participant-card"
//                 onClick={() => onOpenPrivateChat(user)}
//               >
//                 <div className="participant-avatar">
//                   {user.avatar ? (
//                     <img src={user.avatar} alt={user.username} />
//                   ) : (
//                     <div className="avatar-placeholder">
//                       {user.username.charAt(0).toUpperCase()}
//                     </div>
//                   )}
//                   <span className={`status-bubble ${user.online ? 'online' : 'offline'}`} />
//                 </div>
//                 <div className="participant-info">
//                   <span className="participant-name">{user.username}</span>
//                   <span className="participant-status">
//                     {user.online ? 'Online' : 'Offline'}
//                   </span>
//                 </div>
//                 <FaPaperPlane className="message-icon" />
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className={`chat-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
//           <div className="attendance-buttons">
//             <button 
//               className={`attendance-btn present ${theme}`}
//               onClick={() => {
//                 setAttendees(a => a + 1);
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Present">👍</span> 
//               Present <span className="count">({attendees})</span>
//             </button>
//             <button 
//               className={`attendance-btn absent ${theme}`}
//               onClick={() => {
//                 setAttendees(a => Math.max(0, a - 1));
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Absent">👎</span> 
//               Absent
//             </button>
//           </div>

//           <div className="messages-container">
//             {messages.map(msg => (
//               <div 
//                 key={msg.id || msg.tempId} 
//                 className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'} ${theme} ${msg.isPending ? 'pending' : ''}`}
//               >
//                 {msg.senderId !== currentUserId && msg.sender?.username && (
//                   <div className="sender-name">{msg.sender.username}</div>
//                 )}
//                 <div className="message-content">{msg.content}</div>
//                 <div className="message-meta">
//                   <span className="message-time">
//                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   </span>
//                   {msg.senderId === currentUserId && (
//                     <span className="message-status">
//                       {msg.isPending ? (
//                         <FaSpinner className="spinner" />
//                       ) : msg.failed ? (
//                         <div className="failed-message">
//                           <FaExclamationTriangle className="failed-icon" />
//                           <button 
//                             onClick={() => retryFailedMessage(msg.tempId)} 
//                             className="retry-btn"
//                           >
//                             Retry
//                           </button>
//                         </div>
//                       ) : (
//                         <FaCheck className="check-icon" />
//                       )}
//                     </span>
//                   )}
//                 </div>
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
//               <button className={theme}><FaVideo /></button>
//               <button className={theme}><FaMusic /></button>
//             </div>
//             <button 
//               onClick={handleSendMessage} 
//               className={`send-button ${theme}`}
//               disabled={isSending || !message.trim()}
//             >
//               {isSending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
//             </button>
//           </div>
//         </div>

//         <div className={`info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaInfoCircle className="section-icon" />
//             <h4>Club Details</h4>
//           </div>
//           <div className="info-card">
//             <div className="club-header">
//               <h3>{room.name}</h3>
//               <div className="attendees-count">
//                 <span role="img" aria-label="attendees">👥</span> {attendees} going
//               </div>
//             </div>
//             <div className="info-item">
//               <span className="info-label">📍 Location:</span>
//               <span className="info-value">{room.location || 'Unknown'}</span>
//             </div>
//             <div className="info-item">
//               <span className="info-label">🕒 Hours:</span>
//               <span className="info-value">{room.hours || 'Not specified'}</span>
//             </div>
//             <div className="info-item">
//               <span className="info-label">📅 Events:</span>
//               <span className="info-value">Weekly meetups</span>
//             </div>
//             <div className="club-description">
//               {room.description || 'Join our vibrant community for great experiences!'}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClubChatScreen;


// ***********************************************

// import React, { useState, useEffect, useRef, useContext } from 'react';
// import { 
//   FaPaperPlane, FaSmile, FaImage, FaVideo, FaMusic, 
//   FaUserFriends, FaInfoCircle, FaCheck, FaSpinner, FaExclamationTriangle 
// } from 'react-icons/fa';
// import EmojiPicker from 'emoji-picker-react';
// import io from 'socket.io-client';
// import { ThemeContext } from '../App';
// import useSound from '../hooks/useSound';
// import axios from 'axios';

// const ClubChatScreen = ({ room, onClose, onOpenPrivateChat }) => {
//   const { theme } = useContext(ThemeContext);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [attendees, setAttendees] = useState(0);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const messagesEndRef = useRef(null);
//   const [activeTab, setActiveTab] = useState('chat');
//   const [isTyping, setIsTyping] = useState(false);
//   const [typingUsers, setTypingUsers] = useState([]);
//   const socketRef = useRef();
//   const { playNotification, playSent } = useSound();
//   const [isSending, setIsSending] = useState(false);
//   const currentUserId = localStorage.getItem('user')!==null?JSON.parse(localStorage.getItem('user'))?.id:null;
//   const tempMessagesRef = useRef({});
//   const [connectionStatus, setConnectionStatus] = useState('connecting');
//   const [failedMessages, setFailedMessages] = useState({});
//   const [messageQueue, setMessageQueue] = useState([]);

//   const participants = [
//     { id: 1, name: 'User1', avatar: '', online: true },
//     { id: 2, name: 'User2', avatar: '', online: false },
//     { id: 3, name: 'User3', avatar: '', online: true },
//     { id: 4, name: 'User4', avatar: '', online: false },
//     { id: 5, name: 'User5', avatar: '', online: true },
//     { id: 6, name: 'User6', avatar: '', online: false },
//     { id: 7, name: 'User7', avatar: '', online: true },
//     { id: 8, name: 'User8', avatar: '', online: true },
//     { id: 9, name: 'User9', avatar: '', online: true },
//     { id: 10, name: 'User10', avatar: '', online: true },
//     { id: 11, name: 'User11', avatar: '', online: true },
//     { id: 12, name: 'User12', avatar: '', online: false },
//     { id: 13, name: 'User13', avatar: '', online: false },
//     { id: 14, name: 'User14', avatar: '', online: true },
//     { id: 15, name: 'User15', avatar: '', online: true },
//     { id: 16, name: 'User16', avatar: '', online: false },
//   ];

//   // Initialize socket connection with retry logic
//   const initializeSocket = () => {
//     console.log('Initializing socket connection...');
//     const socket = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
//       withCredentials: true,
//       transports: ['websocket'],
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       reconnectionDelayMax: 5000,
//       autoConnect: true
//     });

//     socketRef.current = socket;

//     socket.on('connect', () => {
//       console.log('Socket connected:', socket.id);
//       setConnectionStatus('connected');
//       socket.emit('joinRoom', {
//         roomId: room.photoId,
//         userId: currentUserId
//       });
//       processMessageQueue();
//     });

//     socket.on('disconnect', () => {
//       console.log('Socket disconnected');
//       setConnectionStatus('disconnected');
//     });

//     socket.on('connect_error', (err) => {
//       console.error('Connection error:', err);
//       setConnectionStatus('error');
//       setTimeout(() => {
//         if (!socket.connected) {
//           socket.connect();
//         }
//       }, 2000);
//     });

//     socket.on('reconnecting', (attempt) => {
//       console.log(`Reconnection attempt ${attempt}`);
//       setConnectionStatus('reconnecting');
//     });

//     socket.on('reconnect_failed', () => {
//       console.error('Reconnection failed');
//       setConnectionStatus('failed');
//     });

//     return socket;
//   };

//   // Process queued messages when connection is restored
//   const processMessageQueue = () => {
//     if (messageQueue.length > 0 && socketRef.current?.connected) {
//       messageQueue.forEach(msg => {
//         socketRef.current.emit('sendMessage', {
//           roomId: room.photoId,
//           message: msg
//         });
//       });
//       setMessageQueue([]);
//     }
//   };

//   useEffect(() => {
//     if (!room?.id) return;

//     const socket = initializeSocket();

//     const loadMessages = async () => {
//       try {
//         const response = await axios.get(
//           `${process.env.REACT_APP_API_URL}/messages/group/${room.photoId}`,
//           { 
//             headers: { 
//               Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
//             } 
//           }
//         );
//         setMessages(response.data);
//       } catch (error) {
//         console.error('Error loading group messages:', error);
//       }
//     };

//     const handleNewMessage = (message) => {
//       if (message.tempId && tempMessagesRef.current[message.tempId]) {
//         setMessages(prev => prev.map(msg => 
//           msg.tempId === message.tempId ? { ...message, isPending: false } : msg
//         ));
//         delete tempMessagesRef.current[message.tempId];
//         playSent();
//       } else if (message.senderId !== currentUserId) {
//         setMessages(prev => [...prev, message]);
//         playNotification();
//       }
//       scrollToBottom();
//     };

//     socket.on('newGroupMessage', handleNewMessage);
//     socket.on('typing', ({ userId, isTyping }) => {
//       setTypingUsers(prev => isTyping 
//         ? [...new Set([...prev, userId])] 
//         : prev.filter(id => id !== userId)
//       );
//     });

//     loadMessages();

//     // Add offline/online detection
//     const handleOnline = () => {
//       if (socket && !socket.connected) {
//         socket.connect();
//       }
//     };

//     window.addEventListener('online', handleOnline);

//     return () => {
//       console.log('Cleaning up socket...');
//       socket.off('newGroupMessage', handleNewMessage);
//       socket.off('typing');
//       socket.disconnect();
//       window.removeEventListener('online', handleOnline);
//     };
//   }, [room?.id, currentUserId]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const handleTyping = (typing) => {
//     if (!socketRef.current?.connected) return;
    
//     setIsTyping(typing);
//     socketRef.current.emit('typing', {
//       roomId: room.photoId,
//       userId: currentUserId,
//       isTyping: typing
//     });
//   };

//   const handleSendMessage = () => {
//     if (!message.trim() || isSending) return;

//     const tempId = Date.now().toString();
//     const currentUser = JSON.parse(localStorage.getItem('user')) || {};
//     const newMessage = {
//       content: message,
//       type: 'text',
//       senderId: currentUserId,
//       sender: {
//         username: currentUser.username || 'You',
//         avatar: currentUser.avatar
//       },
//       createdAt: new Date().toISOString(),
//       tempId,
//       isPending: true,
//       roomId: room.photoId
//     };

//     tempMessagesRef.current[tempId] = newMessage;
//     setMessages(prev => [...prev, newMessage]);
//     setMessage('');
//     setIsSending(true);

//     if (socketRef.current?.connected) {
//       try {
//         socketRef.current.emit('sendMessage', {
//           roomId: room.photoId,
//           message: newMessage
//         });
//         setIsSending(false);
//       } catch (error) {
//         console.error('Error sending message:', error);
//         handleFailedMessage(tempId);
//       }
//     } else {
//       console.warn('Socket not connected, adding to queue');
//       setMessageQueue(prev => [...prev, newMessage]);
//       handleFailedMessage(tempId);
//     }

//     handleTyping(false);
//     scrollToBottom();
//   };

//   const handleFailedMessage = (tempId) => {
//     setMessages(prev => prev.map(msg => 
//       msg.tempId === tempId ? { ...msg, isPending: false, failed: true } : msg
//     ));
//     setFailedMessages(prev => ({ ...prev, [tempId]: true }));
//     setIsSending(false);
//   };

//   const retryFailedMessage = (tempId) => {
//     const failedMessage = messages.find(msg => msg.tempId === tempId);
//     if (!failedMessage) return;

//     setFailedMessages(prev => ({ ...prev, [tempId]: false }));
//     setMessages(prev => prev.map(msg => 
//       msg.tempId === tempId ? { ...msg, isPending: true, failed: false } : msg
//     ));

//     if (socketRef.current?.connected) {
//       socketRef.current.emit('sendMessage', {
//         roomId: room.photoId,
//         message: {
//           ...failedMessage,
//           isPending: true
//         }
//       });
//     } else {
//       setMessageQueue(prev => [...prev, failedMessage]);
//     }
//   };

//   return (
//     <div className={`club-chat-container ${theme}`}>
//       {connectionStatus !== 'connected' && (
//         <div className={`connection-status ${connectionStatus}`}>
//           {connectionStatus === 'connecting' && 'Connecting to chat...'}
//           {connectionStatus === 'reconnecting' && 'Reconnecting...'}
//           {connectionStatus === 'disconnected' && 'Disconnected - attempting to reconnect...'}
//           {connectionStatus === 'error' && 'Connection error - please refresh'}
//           {connectionStatus === 'failed' && 'Connection failed - please refresh'}
//         </div>
//       )}

//       <div className={`chat-header ${theme}`}>
//         <h3>{room.name} Chat</h3>
//         <button onClick={onClose}>✕</button>
//       </div>

//       <div className={`mobile-tabs ${theme}`}>
//         <button 
//           className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
//           onClick={() => setActiveTab('participants')}
//         >
//           <FaUserFriends /> Participants
//         </button>
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
//           <FaInfoCircle /> Info
//         </button>
//       </div>

//       <div className="chat-layout">
//         <div className={`participants-section ${theme} ${activeTab === 'participants' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaUserFriends className="section-icon" />
//             <h4>Participants ({participants.length})</h4>
//           </div>
//           <div className="participants-list">
//             {participants.map(user => (
//               <div 
//                 key={user.id} 
//                 className="participant-card"
//                 onClick={() => onOpenPrivateChat(user)}
//               >
//                 <div className="participant-avatar">
//                   {user.avatar ? (
//                     <img src={user.avatar} alt={user.username} />
//                   ) : (
//                     <div className="avatar-placeholder">
//                       {user.username.charAt(0).toUpperCase()}
//                     </div>
//                   )}
//                   <span className={`status-bubble ${user.online ? 'online' : 'offline'}`} />
//                 </div>
//                 <div className="participant-info">
//                   <span className="participant-name">{user.username}</span>
//                   <span className="participant-status">
//                     {user.online ? 'Online' : 'Offline'}
//                   </span>
//                 </div>
//                 <FaPaperPlane className="message-icon" />
//               </div>
//             ))}
//           </div>
//         </div>

//         <div className={`chat-section ${theme} ${activeTab === 'chat' ? 'mobile-active' : ''}`}>
//           <div className="attendance-buttons">
//             <button 
//               className={`attendance-btn present ${theme}`}
//               onClick={() => {
//                 setAttendees(a => a + 1);
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Present">👍</span> 
//               Present <span className="count">({attendees})</span>
//             </button>
//             <button 
//               className={`attendance-btn absent ${theme}`}
//               onClick={() => {
//                 setAttendees(a => Math.max(0, a - 1));
//                 if (window.navigator.vibrate) window.navigator.vibrate(50);
//               }}
//             >
//               <span role="img" aria-label="Absent">👎</span> 
//               Absent
//             </button>
//           </div>

//           <div className="messages-container">
//             {messages.map(msg => (
//               <div 
//                 key={msg.id || msg.tempId} 
//                 className={`message ${msg.senderId === currentUserId ? 'sent' : 'received'} ${theme} ${msg.isPending ? 'pending' : ''}`}
//               >
//                 {msg.senderId !== currentUserId && msg.sender?.username && (
//                   <div className="sender-name">{msg.sender.username}</div>
//                 )}
//                 <div className="message-content">{msg.content}</div>
//                 <div className="message-meta">
//                   <span className="message-time">
//                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                   </span>
//                   {msg.senderId === currentUserId && (
//                     <span className="message-status">
//                       {msg.isPending ? (
//                         <FaSpinner className="spinner" />
//                       ) : msg.failed ? (
//                         <div className="failed-message">
//                           <FaExclamationTriangle className="failed-icon" />
//                           <button 
//                             onClick={() => retryFailedMessage(msg.tempId)} 
//                             className="retry-btn"
//                           >
//                             Retry
//                           </button>
//                         </div>
//                       ) : (
//                         <FaCheck className="check-icon" />
//                       )}
//                     </span>
//                   )}
//                 </div>
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
//               <button className={theme}><FaVideo /></button>
//               <button className={theme}><FaMusic /></button>
//             </div>
//             <button 
//               onClick={handleSendMessage} 
//               className={`send-button ${theme}`}
//               disabled={isSending || !message.trim()}
//             >
//               {isSending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
//             </button>
//           </div>
//         </div>

//         <div className={`info-section ${theme} ${activeTab === 'info' ? 'mobile-active' : ''}`}>
//           <div className="section-header">
//             <FaInfoCircle className="section-icon" />
//             <h4>Club Details</h4>
//           </div>
//           <div className="info-card">
//             <div className="club-header">
//               <h3>{room.name}</h3>
//               <div className="attendees-count">
//                 <span role="img" aria-label="attendees">👥</span> {attendees} going
//               </div>
//             </div>
//             <div className="info-item">
//               <span className="info-label">📍 Location:</span>
//               <span className="info-value">{room.location || 'Unknown'}</span>
//             </div>
//             <div className="info-item">
//               <span className="info-label">🕒 Hours:</span>
//               <span className="info-value">{room.hours || 'Not specified'}</span>
//             </div>
//             <div className="info-item">
//               <span className="info-label">📅 Events:</span>
//               <span className="info-value">Weekly meetups</span>
//             </div>
//             <div className="club-description">
//               {room.description || 'Join our vibrant community for great experiences!'}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClubChatScreen;

// ******************************************