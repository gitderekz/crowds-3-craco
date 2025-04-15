// import { useEffect, useRef, useState } from 'react';
// import Peer from 'simple-peer';

// const VideoCall = ({ roomId, userId, onClose }) => {
//   const [stream, setStream] = useState(null);
//   const [peers, setPeers] = useState([]);
//   const userVideo = useRef();
//   const peersRef = useRef([]);
//   const socketRef = useRef();

//   useEffect(() => {
//     socketRef.current = io('http://localhost:5000');
    
//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then(stream => {
//         setStream(stream);
//         if (userVideo.current) {
//           userVideo.current.srcObject = stream;
//         }
        
//         socketRef.current.emit('joinCall', { roomId, userId });
        
//         socketRef.current.on('userJoined', ({ signal, callerId }) => {
//           const peer = createPeer(callerId, roomId, stream);
          
//           peer.signal(signal);
//           peersRef.current.push({ peerId: callerId, peer });
//           setPeers(users => [...users, { id: callerId, peer }]);
//         });
        
//         socketRef.current.on('receivingSignal', ({ signal, callerId }) => {
//           const peer = peersRef.current.find(p => p.peerId === callerId)?.peer;
//           peer.signal(signal);
//         });
//       });
      
//     return () => {
//       stream?.getTracks().forEach(track => track.stop());
//       socketRef.current.disconnect();
//     };
//   }, [roomId, userId]);

//   const createPeer = (userId, roomId, stream) => {
//     const peer = new Peer({ initiator: true, trickle: false, stream });
    
//     peer.on('signal', signal => {
//       socketRef.current.emit('sendingSignal', { signal, userId, roomId });
//     });
    
//     return peer;
//   };

//   return (
//     <div className="video-call-container">
//       <video ref={userVideo} autoPlay muted />
//       {peers.map(peer => (
//         <video key={peer.id} autoPlay />
//       ))}
//       <button onClick={onClose}>End Call</button>
//     </div>
//   );
// };

// import React, { useEffect, useRef, useState } from 'react';
// import { FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
// import Peer from 'simple-peer';

// const VideoCall = ({ roomId, userId, otherUserId, callType, onEndCall }) => {
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [videoEnabled, setVideoEnabled] = useState(callType === 'video');
//   const [audioEnabled, setAudioEnabled] = useState(true);
//   const peerRef = useRef();
//   const localVideoRef = useRef();
//   const remoteVideoRef = useRef();
//   const socketRef = useRef();

//   useEffect(() => {
//     // Initialize socket connection
//     socketRef.current = io('http://localhost:5000', {
//       withCredentials: true,
//       transports: ['websocket']
//     });

//     // Join call room
//     socketRef.current.emit('joinCall', { roomId, userId });

//     // Get user media
//     navigator.mediaDevices.getUserMedia({
//       video: callType === 'video',
//       audio: true
//     }).then(stream => {
//       setLocalStream(stream);
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       // Initialize peer connection
//       peerRef.current = new Peer({
//         initiator: true,
//         trickle: false,
//         stream
//       });

//       // Handle peer events
//       peerRef.current.on('signal', signal => {
//         socketRef.current.emit('offer', {
//           offer: signal,
//           targetUserId: otherUserId,
//           roomId
//         });
//       });

//       peerRef.current.on('stream', stream => {
//         setRemoteStream(stream);
//         if (remoteVideoRef.current) {
//           remoteVideoRef.current.srcObject = stream;
//         }
//       });

//       peerRef.current.on('error', err => {
//         console.error('Peer error:', err);
//         onEndCall();
//       });

//       // Listen for answers
//       socketRef.current.on('answer', ({ answer, senderId }) => {
//         if (senderId === otherUserId && peerRef.current) {
//           peerRef.current.signal(answer);
//         }
//       });

//       // Listen for ICE candidates
//       socketRef.current.on('ice-candidate', ({ candidate, senderId }) => {
//         if (senderId === otherUserId && peerRef.current) {
//           peerRef.current.signal(candidate);
//         }
//       });
//     }).catch(err => {
//       console.error('Failed to get media:', err);
//       onEndCall();
//     });

//     return () => {
//       if (peerRef.current) {
//         peerRef.current.destroy();
//       }
//       if (localStream) {
//         localStream.getTracks().forEach(track => track.stop());
//       }
//       socketRef.current.disconnect();
//     };
//   }, [roomId, userId, otherUserId, callType]);

//   const toggleVideo = () => {
//     if (localStream) {
//       const videoTrack = localStream.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setVideoEnabled(videoTrack.enabled);
//       }
//     }
//   };

//   const toggleAudio = () => {
//     if (localStream) {
//       const audioTrack = localStream.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setAudioEnabled(audioTrack.enabled);
//       }
//     }
//   };

//   return (
//     <div className="video-call-overlay">
//       <div className="video-call-container">
//         <div className="video-container">
//           {remoteStream && (
//             <video 
//               ref={remoteVideoRef} 
//               autoPlay 
//               playsInline 
//               className="remote-video"
//             />
//           )}
//           {localStream && (
//             <video 
//               ref={localVideoRef} 
//               autoPlay 
//               playsInline 
//               muted 
//               className="local-video"
//             />
//           )}
//         </div>
        
//         <div className="call-controls">
//           <button onClick={toggleVideo} className="control-btn">
//             {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
//           </button>
//           <button onClick={toggleAudio} className="control-btn">
//             {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
//           </button>
//           <button onClick={onEndCall} className="end-call-btn">
//             <FaPhoneSlash />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoCall;

import React, { useEffect, useRef, useState } from 'react';
import { FaPhoneSlash, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import './VideoCall.css'; // Create this CSS file for styling

const VideoCall = ({ roomId, userId, otherUserId, callType, onEndCall }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(callType === 'video');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting');
  const [error, setError] = useState(null);
  
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const callStartedRef = useRef(false);

  

  const handleOffer = ({ offer, senderId }) => {
    console.log("Imeitika..");
    
    if (senderId === otherUserId && peerRef.current) {
      peerRef.current.signal(offer);
    }
  };
  
  const handleEndCall = () => {
    if (!callStartedRef.current) return;
  
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }
  
    socketRef.current = null;
  
    onEndCall();
  };
  
  

  const handleAnswer = ({ answer, senderId }) => {
    if (senderId === otherUserId && peerRef.current) {
      peerRef.current.signal(answer);
    }
  };

  const handleICECandidate = ({ candidate, senderId }) => {
    if (senderId === otherUserId && peerRef.current) {
      peerRef.current.signal(candidate);
    }
  };

  const handleCallRejected = () => {
    setError('Call was rejected by the other user');
    setCallStatus('rejected');
  };

  const handleUserLeft = () => {
    setError('Other user has left the call');
    setCallStatus('ended');
  };

  // Initialize media stream and WebRTC connection
  useEffect(() => {
    const initCall = async () => {
      try {
        // Initialize socket connection
        socketRef.current = io(`${process.env.REACT_APP_SOCKET_SERVER}`, {
          transports: ['websocket'],
          query: { userId, roomId }
        });

        // Get user media
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera/microphone access not supported.');
          setCallStatus('failed');
          return;
        }        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        peerRef.current = new Peer({
          initiator: userId < otherUserId, // Simple way to determine who initiates
          trickle: false,
          stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        // Set up peer event handlers
        peerRef.current.on('signal', (data) => {
          if (data.type === 'offer') {
            socketRef.current.emit('call-offer', {
              offer: data,
              roomId,
              targetUserId: otherUserId
            });
          } else if (data.type === 'answer') {
            socketRef.current.emit('call-answer', {
              answer: data,
              roomId,
              targetUserId: otherUserId
            });
          }
        });

        peerRef.current.on('stream', (stream) => {
          setRemoteStream(stream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
          setCallStatus('connected');
          callStartedRef.current = true;  // ✅ set to true
        });
        

        peerRef.current.on('error', (err) => {
          console.error('Peer error:', err);
          setError('Connection failed. Please try again.');
          setCallStatus('failed');
        });

        peerRef.current.on('close', () => {
          handleEndCall();
        });

        // if (socketRef.current) {
          // Set up socket event handlers
          socketRef.current.on('call-offer', handleOffer);
          socketRef.current.on('call-answer', handleAnswer);
          socketRef.current.on('ice-candidate', handleICECandidate);
          socketRef.current.on('call-rejected', handleCallRejected);
          socketRef.current.on('user-left', handleUserLeft);
        // }

        // Join the call room
        // socketRef.current.emit('join-call-room', { roomId, userId });
        socketRef.current.on('connect', () => {
          console.log('Socket connected join-call-room:', socketRef.current.id);
          socketRef.current.emit('join-call-room', { roomId, userId });
        });

      } catch (err) {
        console.error('Error initializing call:', err);
        setError('Failed to access camera/microphone. Please check permissions.');
        setCallStatus('failed');
      }
    };

    initCall();

    return () => {
      handleEndCall();
    };
  }, [roomId, userId, otherUserId, callType, handleEndCall]);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-container">
        {error && (
          <div className="call-error">
            {error}
            <button onClick={handleEndCall} className="close-btn">
              Close
            </button>
          </div>
        )}

        {callStatus === 'connecting' && (
          <div className="call-status">
            <div className="spinner"></div>
            <p>Connecting...</p>
          </div>
        )}

        <div className="video-container">
          {remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
          )}
          
          {localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
          )}
        </div>

        <div className="call-controls">
          <button 
            onClick={toggleVideo} 
            className={`control-btn ${videoEnabled ? '' : 'disabled'}`}
            aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
          </button>
          
          <button 
            onClick={toggleAudio} 
            className={`control-btn ${audioEnabled ? '' : 'disabled'}`}
            aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>
          
          <button 
            onClick={handleEndCall} 
            className="end-call-btn"
            aria-label="End call"
          >
            <FaPhoneSlash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;