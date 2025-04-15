// const { v4: uuidv4 } = require('uuid');
// const peers = {};

// const createPeer = (userId, stream) => {
//   const peerId = uuidv4();
//   const peer = new SimplePeer({
//     initiator: true,
//     trickle: false,
//     stream,
//   });

//   peers[peerId] = { peer, userId };
//   return peerId;
// };

// module.exports = {
//   createPeer,
//   getPeer: (peerId) => peers[peerId],
//   removePeer: (peerId) => delete peers[peerId],
// };

// const { v4: uuidv4 } = require('uuid');

// class WebRTCService {
//   constructor(io) {
//     this.io = io;
//     this.peers = {};
//     this.setupSocketListeners();
//   }

//   setupSocketListeners() {
//     this.io.on('connection', (socket) => {
//       socket.on('joinCall', ({ roomId, userId }) => {
//         socket.join(`call-${roomId}`);
//         socket.callRoomId = roomId;
//         socket.userId = userId;
        
//         // Notify others in the call
//         socket.to(`call-${roomId}`).emit('userJoined', { userId });
//       });

//       socket.on('offer', ({ offer, targetUserId, roomId }) => {
//         socket.to(`call-${roomId}`).emit('offer', { 
//           offer, 
//           senderId: socket.userId,
//           targetUserId 
//         });
//       });

//       socket.on('answer', ({ answer, targetUserId, roomId }) => {
//         socket.to(`call-${roomId}`).emit('answer', { 
//           answer, 
//           senderId: socket.userId,
//           targetUserId 
//         });
//       });

//       socket.on('ice-candidate', ({ candidate, targetUserId, roomId }) => {
//         socket.to(`call-${roomId}`).emit('ice-candidate', { 
//           candidate, 
//           senderId: socket.userId,
//           targetUserId 
//         });
//       });

//       socket.on('disconnect', () => {
//         if (socket.callRoomId) {
//           this.io.to(`call-${socket.callRoomId}`).emit('userLeft', { 
//             userId: socket.userId 
//           });
//         }
//       });
//     });
//   }
// }

// module.exports = WebRTCService;

const { v4: uuidv4 } = require('uuid');
const Peer = require('simple-peer');

class WebRTCService {
  constructor(io) {
    this.io = io;
    this.activeCalls = new Map(); // roomId -> { caller: peer, callee: peer }
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.io.on('connection', (socket) => {
      console.log(`User connected for WebRTC: ${socket.id}`);

      // Join a call room
      socket.on('join-call-room', ({ roomId, userId }) => {
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;
        console.log(`User ${userId} joined call room ${roomId}`);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', { userId });
      });

      // Handle offer signal
      socket.on('call-offer', ({ offer, roomId, targetUserId }) => {
        console.log(`Offer received in room ${roomId} for ${targetUserId}`);
        socket.to(roomId).emit('call-offer', { 
          offer, 
          senderId: socket.userId,
          targetUserId 
        });
      });

      // Handle answer signal
      socket.on('call-answer', ({ answer, roomId, targetUserId }) => {
        console.log(`Answer received in room ${roomId} for ${targetUserId}`);
        socket.to(roomId).emit('call-answer', { 
          answer, 
          senderId: socket.userId,
          targetUserId 
        });
      });

      // Handle ICE candidates
      socket.on('ice-candidate', ({ candidate, roomId, targetUserId }) => {
        socket.to(roomId).emit('ice-candidate', { 
          candidate, 
          senderId: socket.userId,
          targetUserId 
        });
      });

      // Handle call rejection
      socket.on('reject-call', ({ roomId, targetUserId }) => {
        socket.to(roomId).emit('call-rejected', { 
          senderId: socket.userId,
          targetUserId 
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        if (socket.roomId) {
          console.log(`User ${socket.userId} left call room ${socket.roomId}`);
          socket.to(socket.roomId).emit('user-left', { userId: socket.userId });
          
          // Clean up peer connections
          if (this.activeCalls.has(socket.roomId)) {
            const { caller, callee } = this.activeCalls.get(socket.roomId);
            if (caller) caller.destroy();
            if (callee) callee.destroy();
            this.activeCalls.delete(socket.roomId);
          }
        }
      });
    });
  }

  // Helper method to create a new peer connection
  createPeer(initiator, stream) {
    const peer = new Peer({
      initiator,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    return peer;
  }
}

module.exports = WebRTCService;