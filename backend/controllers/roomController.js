const db = require('../models');

// exports.createRoom = async (req, res) => {
//   try {
//     const { userIds, isGroup, name } = req.body;
//     const creatorId = req.user.id;

//     // Validate input
//     if (!userIds || !Array.isArray(userIds)) {
//       return res.status(400).json({ error: 'Invalid user IDs' });
//     }

//     // For private chats, ensure room doesn't already exist
//     if (!isGroup && userIds.length === 1) {
//       const existingRoom = await db.room.findOne({
//         include: [{
//           model: db.user,
//           where: { id: { [Op.in]: [...userIds, creatorId] } },
//           through: { where: { userId: { [Op.in]: [...userIds, creatorId] } } },
//           as: 'members'    // Use the alias defined in the association
//         }],
//         group: ['db.room.id'],
//         having: db.sequelize.literal('COUNT(DISTINCT Users.id) = 2')
//       });

//       if (existingRoom) {
//         return res.status(200).json(existingRoom);
//       }
//     }

//     const room = await db.room.create({ isGroup, name });
//     await room.addUsers([...userIds, creatorId]);

//     res.status(201).json(room);
//   } catch (error) {
//     console.error('Error creating room:', error);
//     res.status(500).json({ error: 'Failed to create room' });
//   }
// };

  exports.createRoom = async (req, res) => {
    console.log('KUITWA X');
    try {
      const { userIds, isGroup, name } = req.body;
      const creatorId = req.user.id;

      // Validate input
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ error: 'Invalid user IDs' });
      }

      // For private chats (1:1)
      if (!isGroup && userIds.length === 1) {
        const [user1, user2] = [creatorId, userIds[0]].sort();
        
        // Check for existing private chat
        const existingRoom = await db.room.findOne({
          include: [{
            model: db.user,
            where: { id: { [Op.in]: [user1, user2] } },
            through: { where: { userId: { [Op.in]: [user1, user2] } } },
            as: 'members'    // Use the alias defined in the association
          }],
          group: ['room.id'],
          having: db.sequelize.literal('COUNT(DISTINCT users.id) = 2'),
          where: { isGroup: false }
        });

        if (existingRoom) {
          return res.status(200).json(existingRoom);
        }

        // Create new private chat
        const room = await db.room.create({ 
          isGroup: false,
          name: `${user1}-${user2}` // Or fetch user names
        });
        console.log('MMOJA');
        // await room.addUsers([user1, user2]);
        await room.addMembers([user1, user2]);
        return res.status(201).json(room);
      }

      // For group chats
      if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
      }

      const room = await db.room.create({ 
        isGroup: true,
        name
      });
      
      console.log('KUNDI');
      // await room.addUsers([...userIds, creatorId]);
      await room.addMembers([...userIds, creatorId]);
      res.status(201).json(room);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  };

// exports.createRoom = async (req, res) => {
//   const transaction = await db.sequelize.transaction();
//   try {
//     const { userIds = [], isGroup, name } = req.body;
//     const creatorId = req.user.id;

//     // Normalize and deduplicate user IDs
//     const allUserIds = [...new Set([
//       ...userIds.map(id => parseInt(id)),
//       parseInt(creatorId)
//     ].filter(id => !isNaN(id)))];

//     // For private chats (exactly 2 users)
//     if (!isGroup && allUserIds.length === 2) {
//       const [user1, user2] = allUserIds.sort((a, b) => a - b);

//       // Check for existing room
//       const existingRoom = await db.room.findOne({
//         include: [{
//           model: db.user,
//           as: 'members',
//           where: { id: { [Op.in]: [user1, user2] } },
//           through: { where: { userId: { [Op.in]: [user1, user2] } } }
//         }],
//         where: { isGroup: false },
//         transaction
//       });

//       if (existingRoom) {
//         await transaction.commit();
//         return res.status(200).json(existingRoom);
//       }

//       // Create new room
//       const room = await db.room.create({
//         isGroup: false,
//         name: name || `Private Chat ${user1}-${user2}`
//       }, { transaction });

//       // Add members in a single operation
//       await db.roomuser.bulkCreate(
//         [user1, user2].map(userId => ({
//           roomId: room.id,
//           userId,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         })),
//         { transaction }
//       );

//       await transaction.commit();
//       return res.status(201).json(room);
//     }

//     // For group chats
//     if (isGroup) {
//       if (!name) {
//         await transaction.rollback();
//         return res.status(400).json({ error: 'Group name is required' });
//       }

//       console.log('allUserIds CR=',allUserIds);
//       const room = await db.room.create({
//         isGroup: true,
//         name
//       }, { transaction });
//       console.log('allUserIds CB=',allUserIds);
//       // Add all members in one operation
//       await db.roomuser.bulkCreate(
//         allUserIds.map(userId => ({
//           roomId: room.id,
//           userId,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         })),
//         { transaction }
//       );

//       await transaction.commit();
//       return res.status(201).json(room);
//     }

//     await transaction.rollback();
//     return res.status(400).json({ error: 'Invalid room configuration' });
//   } catch (error) {
//     await transaction.rollback();
//     console.error('Error creating room:', error);
//     res.status(500).json({ 
//       error: 'Failed to create room',
//       details: error.message 
//     });
//   }
// };

exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await db.room.findAll({
      include: [
        {
          model: db.user,
          where: { id: userId },
          as: 'members'    // Use the alias defined in the association
        },
        {
          model: db.message,
          order: [['createdAt', 'DESC']],
          limit: 1,
          as: 'messages'    // Use the alias defined in the association
        }
      ],
      order: [[db.message, 'createdAt', 'DESC']]
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

exports.getRoomParticipants = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 1. Check if room exists
    let room = await db.room.findByPk(roomId, {
      include: [{
        model: db.user,
        as: 'members',
        through: { attributes: [] },
        attributes: ['id', 'username', 'avatar', 'online', 'lastSeen']
      }],
      transaction
    });

    // 2. If room doesn't exist, create it (first user)
    if (!room) {
      room = await db.room.create({
        id: roomId,
        name: `Room ${roomId}`,
        isGroup: true
      }, { transaction });

      // Add creator as first member
      await db.roomuser.create({
        roomId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction });
    }

    // 3. Check if current user is already a member
    const isMember = await db.roomuser.findOne({
      where: { roomId, userId },
      transaction
    });

    // 4. If not a member, add them
    if (!isMember) {
      await db.roomuser.create({
        roomId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { transaction });

      // Refresh room data after adding member
      room = await db.room.findByPk(roomId, {
        include: [{
          model: db.user,
          as: 'members',
          through: { attributes: [] },
          attributes: ['id', 'username', 'avatar', 'online', 'lastSeen']
        }],
        transaction
      });
    }

    await transaction.commit();

    // Format response
    const participants = room.members.map(member => ({
      ...member.toJSON(),
      online: member.online || false,
      lastSeen: member.lastSeen || null
    }));

    res.json(participants);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in getRoomParticipants:', error);
    res.status(500).json({ 
      error: 'Failed to get participants',
      details: error.message 
    });
  }
};

// exports.getRoomParticipants = async (req, res) => {
//   try {
//     const { roomId } = req.params;
    
//     const room = await db.room.findByPk(roomId, {
//       include: [{
//         model: db.user,
//         attributes: ['id', 'username', 'avatar', 'online', 'lastSeen'],
//         through: { attributes: [] }, // Exclude join table attributes
//         as: 'members'    // Use the alias defined in the association
//       }]
//     });

//     if (!room) {
//       console.log('room=',room);
//       // return res.status(404).json({ error: 'Room not found' });
//       // return res.json([]);
//       return res.json(room);
//     }

//     // Format participants with online status
//     const participants = room.members.map(user => ({
//       ...user.toJSON(),
//       online: user.online || false,
//       lastSeen: user.lastSeen || null
//     }));

//     res.json(participants);
//   } catch (error) {
//     console.error('Error fetching participants:', error);
//     res.status(500).json({ error: 'Failed to fetch participants' });
//   }
// };


// roomController.js
exports.joinRoom = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is already a member
    const existingMembership = await db.roomuser.findOne({
      where: { roomId, userId },
      transaction
    });

    if (existingMembership) {
      await transaction.commit();
      return res.status(200).json({ message: 'Already a member' });
    }

    // Add user to room
    await db.roomuser.create({
      roomId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { transaction });

    await transaction.commit();
    res.status(200).json({ success: true });
  } catch (error) {
    await transaction.rollback();
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
};