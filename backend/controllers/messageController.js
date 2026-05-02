
const db = require('../models');
const { Op } = require('sequelize');

exports.createMessage = async (req, res) => {
  try {
    const { content, type, mediaUrls, roomId, isGroup } = req.body;
    const senderId = req.user.id;

    console.log('Creating message:', { roomId, senderId, isGroup, content });

    const message = await db.message.create({
      content,
      type: type || 'text',
      mediaUrls: mediaUrls || null,
      roomId,
      senderId,
      isGroup: isGroup || false
    });

    // Populate sender info
    const messageWithSender = await db.message.findByPk(message.id, {
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'username', 'avatar', 'createdAt', 'lastSeen']
      }]
    });

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
};

exports.getRoomMessages = async (req, res) => {
  console.log('getRoomMessages params:', req.params);
  
  try {
    const { roomId } = req.params;
    
    // Just fetch messages - room should already exist
    const messages = await db.message.findAll({
      where: { roomId },
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'username', 'lastSeen', 'avatar', 'createdAt']
      }],
      order: [['createdAt', 'ASC']]
    });

    console.log('Found messages count:', messages.length);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const messages = await db.message.findAll({
      where: { 
        roomId,
        isGroup: true 
      },
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'username', 'avatar', 'createdAt']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

exports.createGroupMessage = async (req, res) => {
  try {
    const { content, roomId, type, mediaUrls } = req.body;
    const senderId = req.user.id;

    if (!roomId || !content) {
      return res.status(400).json({ error: 'Room ID and content are required' });
    }

    // Verify room exists and user has access
    const room = await db.room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    const isMember = await db.roomuser.findOne({
      where: { roomId, userId: senderId }
    });
    
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized for this room' });
    }

    const newMessage = await db.message.create({
      content,
      senderId,
      roomId,
      type: type || 'text',
      mediaUrls: mediaUrls || null,
      isGroup: true
    });
    
    // Populate sender info
    const populatedMessage = await db.message.findByPk(newMessage.id, {
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'username', 'avatar', 'createdAt']
      }]
    });

    res.status(201).json(populatedMessage);
    
  } catch (error) {
    console.error('Error creating group message:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};


// -------------------------------------------
// const db = require('../models');
// const { Op } = require('sequelize');

// exports.createMessage = async (req, res) => {
//   try {
//     const { content, type, fileUrl, roomId, isGroup } = req.body;
//     const senderId = req.user.id;

//     // First, ensure room exists
//     let room = await db.room.findByPk(roomId);
//     if (!room) {
//       // Create the room if it doesn't exist
//       room = await db.room.create({
//         id: roomId,
//         name: roomId,
//         isGroup: isGroup || false,
//         photoId: 1, // Default photoId for private chats
//         presentUsers: []
//       });
      
//       // Add the sender as a member
//       await db.roomuser.create({
//         roomId,
//         userId: senderId,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });
      
//       // If it's a private chat (roomId format like "1-2"), add the other user
//       if (!isGroup && roomId.includes('-')) {
//         const otherUserId = parseInt(roomId.split('-').find(id => parseInt(id) !== senderId));
//         if (otherUserId) {
//           await db.roomuser.create({
//             roomId,
//             userId: otherUserId,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           });
//         }
//       }
//     }

//     const message = await db.message.create({
//       content,
//       type: type || 'text',
//       mediaUrls: fileUrl,
//       roomId,
//       senderId,
//       isGroup: isGroup || false
//     });

//     // Populate sender info
//     const messageWithSender = await db.message.findByPk(message.id, {
//       include: [{
//         model: db.user,
//         as: 'sender',
//         attributes: ['id', 'username', 'avatar', 'createdAt', 'lastSeen']
//       }]
//     });

//     res.status(201).json(messageWithSender);
//   } catch (error) {
//     console.error('Error creating message:', error);
//     res.status(500).json({ error: 'Failed to send message', details: error.message });
//   }
// };

// exports.getRoomMessages = async (req, res) => {
//   console.log('getRoomMessages params:', req.params);
  
//   try {
//     const { roomId } = req.params;
//     const userId = req.user.id;
    
//     console.log('Getting messages for roomId:', roomId);
    
//     // Check if room exists, if not create it
//     let room = await db.room.findByPk(roomId);
//     if (!room) {
//       console.log('Room not found, creating:', roomId);
      
//       // Determine if this is a group chat or private chat
//       const isGroup = roomId.includes('-') ? false : true;
      
//       room = await db.room.create({
//         id: roomId,
//         name: roomId,
//         isGroup: isGroup,
//         photoId: isGroup ? parseInt(roomId) || 1 : 1,
//         presentUsers: []
//       });
      
//       // Add current user as member
//       await db.roomuser.create({
//         roomId,
//         userId: userId,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });
      
//       // If it's a private chat (format like "1-2"), add the other user
//       if (!isGroup && roomId.includes('-')) {
//         const userIds = roomId.split('-').map(id => parseInt(id));
//         const otherUserId = userIds.find(id => id !== userId);
//         if (otherUserId) {
//           await db.roomuser.create({
//             roomId,
//             userId: otherUserId,
//             createdAt: new Date(),
//             updatedAt: new Date()
//           });
//         }
//       }
//     } else {
//       // Room exists, check if user is a member
//       const isMember = await db.roomuser.findOne({
//         where: { roomId, userId }
//       });
      
//       // If not a member, add them
//       if (!isMember) {
//         console.log('User not a member, adding to room:', userId);
//         await db.roomuser.create({
//           roomId,
//           userId: userId,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         });
//       }
//     }
    
//     // Now fetch messages
//     const messages = await db.message.findAll({
//       where: { roomId },
//       include: [{
//         model: db.user,
//         as: 'sender',
//         attributes: ['id', 'username', 'lastSeen', 'avatar', 'createdAt']
//       }],
//       order: [['createdAt', 'ASC']]
//     });

//     console.log('Found messages count:', messages.length);
//     res.json(messages);
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
//   }
// };

// exports.getGroupMessages = async (req, res) => {
//   try {
//     const { roomId } = req.params;
//     if (!roomId) {
//       return res.status(400).json({ error: 'Room ID is required' });
//     }

//     const messages = await db.message.findAll({
//       where: { 
//         roomId,
//         isGroup: true 
//       },
//       include: [{
//         model: db.user,
//         as: 'sender',
//         attributes: ['id', 'username', 'avatar', 'createdAt']
//       }],
//       order: [['createdAt', 'ASC']]
//     });

//     res.json(messages);
//   } catch (error) {
//     console.error('Error fetching group messages:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };

// exports.createGroupMessage = async (req, res) => {
//   try {
//     const { content, roomId, type, mediaUrls } = req.body;
//     const senderId = req.user.id;

//     if (!roomId || !content) {
//       return res.status(400).json({ error: 'Room ID and content are required' });
//     }

//     // Verify room exists and user has access
//     let room = await db.room.findByPk(roomId);
//     if (!room) {
//       return res.status(404).json({ error: 'Room not found' });
//     }
    
//     const isMember = await db.roomuser.findOne({
//       where: { roomId, userId: senderId }
//     });
    
//     if (!isMember) {
//       return res.status(403).json({ error: 'Not authorized for this room' });
//     }

//     const newMessage = await db.message.create({
//       content,
//       senderId,
//       roomId,
//       type: type || 'text',
//       mediaUrls: mediaUrls || null,
//       isGroup: true
//     });
    
//     // Populate sender info
//     const populatedMessage = await db.message.findByPk(newMessage.id, {
//       include: [{
//         model: db.user,
//         as: 'sender',
//         attributes: ['id', 'username', 'avatar', 'createdAt']
//       }]
//     });

//     res.status(201).json(populatedMessage);
    
//   } catch (error) {
//     console.error('Error creating group message:', error);
//     res.status(500).json({ error: 'Server error', details: error.message });
//   }
// };


// // ---------------------------------------
// // const db = require('../models');
// // const { Op } = require('sequelize');

// // exports.createMessage = async (req, res) => {
// //   try {
// //     const { content, type, fileUrl, roomId } = req.body;
// //     const senderId = req.user.id;

// //     const message = await db.message.create({
// //       content,
// //       type,
// //       mediaUrls:fileUrl,
// //       roomId,
// //       senderId
// //     });

// //     // Populate sender info
// //     const messageWithSender = await db.message.findByPk(message.id, {
// //       include: [{
// //         model: db.user,
// //         as: 'sender',
// //         attributes: ['id', 'name', 'avatar']
// //       }]
// //     });

// //     res.status(201).json(messageWithSender);
// //   } catch (error) {
// //     console.error('Error creating message:', error);
// //     res.status(500).json({ error: 'Failed to send message' });
// //   }
// // };

// // exports.getRoomMessages = async (req, res) => {
// //   console.log(' params:', req.params);
// //   console.log(' params:', req.path);
  
// //   try {
// //     const { roomId } = req.params;
// //     console.log('roomId',roomId)
// //     const messages = await db.message.findAll({
// //       where: { roomId },
// //       include: [{
// //         model: db.user,
// //         as: 'sender',
// //         attributes: ['id', 'username', 'lastSeen', 'avatar', 'createdAt']
// //       }],
// //       order: [['createdAt', 'ASC']]
// //     });

// //     console.log('messages',messages);
// //     res.json(messages);
// //   } catch (error) {
// //     console.error('Error fetching messages:', error);
// //     res.status(500).json({ error: 'Failed to fetch messages' });
// //   }
// // };

// // exports.getGroupMessages = async (req, res) => {
// //   try {
// //     const { roomId } = req.params;
// //     if (!roomId) {
// //       return res.status(400).json({ error: 'Room ID is required' });
// //     }

// //     const messages = await db.message.find({ roomId })
// //       .populate('senderId', 'username avatar')
// //       .sort({ createdAt: 1 });

// //     res.json(messages);
// //   } catch (error) {
// //     console.error('Error fetching group messages:', error);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // };

// // exports.createGroupMessage = async (req, res) => {
// //   try {
// //     const { content, roomId } = req.body;
// //     const senderId = req.user.id;

// //     if (!roomId || !content) {
// //       return res.status(400).json({ error: 'Room ID and content are required' });
// //     }

// //     // Verify user has access to this room
// //     const room = await db.room.findById(roomId);
// //     if (!room || !room.members.includes(senderId)) {
// //       return res.status(403).json({ error: 'Not authorized for this room' });
// //     }

// //     const newMessage = new db.message({
// //       content,
// //       senderId,
// //       roomId,
// //       type: 'group'
// //     });

// //     await newMessage.save();
    
// //     // Populate sender info before sending back
// //     const populatedMessage = await db.message.populate(newMessage, {
// //       path: 'senderId',
// //       select: 'username avatar'
// //     });

// //     res.status(201).json(populatedMessage);
    
// //     // Emit to Socket.IO
// //     req.io.to(roomId).emit('newGroupMessage', populatedMessage);
    
// //   } catch (error) {
// //     console.error('Error creating group message:', error);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // };