require('dotenv').config();
const http = require('http');
const socketio = require('socket.io');
const { Op } = require('sequelize');

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const db = require('./models');
const authRoutes = require('./routes/authRoutes');
const photoRoutes = require('./routes/photoRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const messageRoutes = require('./routes/messageRoutes');
const roomRoutes = require('./routes/roomRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const uploadMiddleware = require('./middlewares/uploadMiddleware');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Server } = require('socket.io');
const WebRTCService = require('./services/webrtcService');

const app = express();

// // Security middlewares
// app.use(helmet()); // Adds various security headers
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Rate limiting for API routes
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use('/api/', apiLimiter);

const server = http.createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,//['http://localhost:3000', 'http://192.168.8.102:3000', 'http://192.168.56.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize WebRTC service
const webRTCService = new WebRTCService(io);

// app.use(cors({
//   origin: ['http://localhost:3000','http://192.168.8.102:3000','http://192.168.56.1:3000','http://localhost:3001'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,
// }));

// @@@@@Security middlewares
app.use(helmet()); // Adds various security headers
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    // : 'http://localhost:3000',
    : 'http://192.168.85.117:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Cross-Origin-Resource-Policy']
};

app.use(cors(corsOptions));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use('/api/', apiLimiter);
// @@@@@End Security middlewares


app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Create upload directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Add this before your static file middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/uploads/')) {
    res.set({
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*'
    });
  }
  next();
});
// static file saving middleware
// app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));


// UPLOADING MEDIA FROM CHATS
// Configure storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'media');
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Add this route before your socket.io initialization
app.post('/api/upload-media', /*uploadMiddleware,*/ upload.array('media'), async (req, res) => {
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const urls = req.files.map(file => 
      `/uploads/media/${file.filename}`
    );

    res.json({ urls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});
// END UPLOADING MEDIA FROM CHATS

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// After all routes, add error middleware
app.use(errorMiddleware);

// Socket.io connection handler
io.on('connection', (socket) => {
  // console.log(`User connected: ${socket.id}`);

  // Join room handler
  socket.on('joinRoom', async ({ roomId, userId }) => {
    try {
      // Join the socket room
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;
      
      // Update user status
      await db.user.update(
        { online: true, lastSeen: new Date() },
        { where: { id: userId } }
      );
      
      // Notify room participants
      const room = await db.room.findByPk(roomId, {
        include: [{
          model: db.user,
          attributes: ['id'],
          through: { attributes: [] },
          as: 'members'
        }]
      });

      if (room) {
        const participantIds = room.members.map(u => u.id);
        io.to(roomId).emit('userStatus', { 
          userId, 
          online: true,
          roomId
        });
        
        // Send current online status of all participants
        const onlineUsers = await db.user.findAll({
          where: { 
            id: { [Op.in]: participantIds },
            online: true
          },
          attributes: ['id']
        });
        
        socket.emit('presenceUpdate', {
          onlineUsers: onlineUsers.map(u => u.id)
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // socket.on('joinRoom', async ({ roomId, userId }) => {
  //   socket.join(roomId);
  //   socket.roomId = roomId;
  //   socket.userId = userId;
    
  //   // Update user status
  //   await db.user.update(
  //     { online: true, lastSeen: new Date() },
  //     { where: { id: userId } }
  //   );
    
  //   // Notify others in the room
  //   socket.to(roomId).emit('userStatus', { userId, online: true });
  // });

  // Typing indicator handler
  
  socket.on('typing', ({ roomId, userId, isTyping }) => {
    socket.to(roomId).emit('typing', { userId, isTyping });
  });

  // Message handler
  socket.on('sendMessage', async ({ roomId, message }) => {
    // console.log('message = ',message);
    
    try {
      // Save to database
      const newMessage = await db.message.create({
        content: message.content,
        type: message.type,
        mediaUrls: message.mediaUrls,
        roomId,
        senderId: message.senderId
      });
      
      // Include the tempId in the response if it exists
      const responseMessage = {
        ...newMessage.toJSON(),
        tempId: message.tempId // Add this line
      };
      
      
      // Broadcast to room
      io.to(roomId).emit('newMessage', responseMessage); // Updated this line
      console.log('Message successfully broadcasted'); // Add this
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  // WebRTC signaling handlers
  socket.on('call-offer', (data) => {
    const targetSocketId = userSocketMap[data.targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-offer', {
        ...data,
        senderId: socket.userId
      });
    }
  });
  
  socket.on('call-answer', (data) => {
    const targetSocketId = userSocketMap[data.targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-answer', {
        ...data,
        senderId: socket.userId
      });
    }
  });
  
  socket.on('ice-candidate', (data) => {
    const targetSocketId = userSocketMap[data.targetUserId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        ...data,
        senderId: socket.userId
      });
    }
  });
  

  const userSocketMap = {};

  socket.on('join-call-room', ({ roomId, userId }) => {
    socket.join(roomId);
    socket.userId = userId;
    userSocketMap[userId] = socket.id; // <-- Save the mapping
    console.log(`User ${userId} joined room ${roomId}`);
  });

  // Disconnect handler
  socket.on('disconnect', async () => {
    if (socket.roomId && socket.userId) {
      try {
        await db.user.update(
          { online: false, lastSeen: new Date() },
          { where: { id: socket.userId } }
        );
        
        io.to(socket.roomId).emit('userStatus', { 
          userId: socket.userId, 
          online: false,
          roomId: socket.roomId
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
  });
  // socket.on('disconnect', async () => {
  //   if (socket.roomId && socket.userId) {
  //     // Update user status
  //     await db.user.update(
  //       { online: false, lastSeen: new Date() },
  //       { where: { id: socket.userId } }
  //     );
      
  //     // Notify others in the room
  //     socket.to(socket.roomId).emit('userStatus', { 
  //       userId: socket.userId, 
  //       online: false 
  //     });
  //   }
  //   // console.log(`User disconnected: ${socket.id}`);
  // });
});

// Database sync and server start
db.sequelize.sync().then(() => {
  server.listen(5000, () => {
    console.log('Server running on port 5000');
    console.log('WebSocket server running');
  });
});