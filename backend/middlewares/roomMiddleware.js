// middlewares/roomMiddleware.js
const db = require('../models');

const ensureRoomExists = async (req, res, next) => {
  const { roomId } = req.params;
  
  try {
    const room = await db.room.findByPk(roomId);
    
    if (!room) {
      // Create a new room if it doesn't exist
      const newRoom = await db.room.create({
        id: roomId,
        name: `Room ${roomId}`,
        isGroup: true
      });
      
      // Add current user to the room
      await newRoom.addUser(req.user.id);
    }
    
    next();
  } catch (error) {
    console.error('Error ensuring room exists:', error);
    res.status(500).json({ error: 'Failed to initialize room' });
  }
};

module.exports = { ensureRoomExists };