const db = require('../models');
const { Op } = require('sequelize');

exports.createMessage = async (req, res) => {
  try {
    const { content, type, fileUrl, roomId } = req.body;
    const senderId = req.user.id;

    const message = await db.message.create({
      content,
      type,
      mediaUrls:fileUrl,
      roomId,
      senderId
    });

    // Populate sender info
    const messageWithSender = await db.message.findByPk(message.id, {
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'name', 'avatar']
      }]
    });

    res.status(201).json(messageWithSender);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await db.message.findAll({
      where: { roomId },
      include: [{
        model: db.user,
        as: 'sender',
        attributes: ['id', 'username', 'lastSeen', 'avatar', 'createdAt']
      }],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

exports.getGroupMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }

    const messages = await db.message.find({ roomId })
      .populate('senderId', 'username avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createGroupMessage = async (req, res) => {
  try {
    const { content, roomId } = req.body;
    const senderId = req.user.id;

    if (!roomId || !content) {
      return res.status(400).json({ error: 'Room ID and content are required' });
    }

    // Verify user has access to this room
    const room = await db.room.findById(roomId);
    if (!room || !room.members.includes(senderId)) {
      return res.status(403).json({ error: 'Not authorized for this room' });
    }

    const newMessage = new db.message({
      content,
      senderId,
      roomId,
      type: 'group'
    });

    await newMessage.save();
    
    // Populate sender info before sending back
    const populatedMessage = await db.message.populate(newMessage, {
      path: 'senderId',
      select: 'username avatar'
    });

    res.status(201).json(populatedMessage);
    
    // Emit to Socket.IO
    req.io.to(roomId).emit('newGroupMessage', populatedMessage);
    
  } catch (error) {
    console.error('Error creating group message:', error);
    res.status(500).json({ error: 'Server error' });
  }
};