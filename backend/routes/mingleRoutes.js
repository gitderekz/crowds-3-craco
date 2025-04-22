module.exports = (io, connectedUsers) =>{
  
const express = require('express');
const router = express.Router();
const db = require('../models');
const { Op } = require('sequelize');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Toggle mingle status
router.post('/toggle', authenticate, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find or create mingle status
    const [mingleStatus, created] = await db.mingleStatus.findOrCreate({
      where: { userId },
      defaults: { isMingling: true }
    });

    // Toggle if already exists
    if (!created) {
      mingleStatus.isMingling = !mingleStatus.isMingling;
      await mingleStatus.save();
    }

    res.json({ isMingling: mingleStatus.isMingling });
  } catch (error) {
    console.error('Error toggling mingle status:', error);
    res.status(500).json({ message: 'Error toggling mingle status' });
  }
});

// Choose a match
router.post('/choose', authenticate, async (req, res) => {
  const { chooserId, chosenId } = req.body;
  const t = await db.sequelize.transaction(); // Start transaction

  try {
    // Validation checks
    if (chooserId === chosenId) {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot choose yourself' });
    }

    // Check if chosen user is mingling
    const isMingling = await db.mingleStatus.findOne({
      where: { userId: chosenId, isMingling: true },
      transaction: t
    });
    
    if (!isMingling) {
      await t.rollback();
      return res.status(400).json({ message: 'This user is not currently mingling' });
    }

    // Find any existing relationships in either direction
    const existingRelationships = await db.mingleChoice.findAll({
      where: {
        [Op.or]: [
          { chooserId, chosenId },
          { chooserId: chosenId, chosenId: chooserId }
        ]
      },
      transaction: t
    });

    let isMatch = false;
    let status = 'pending';

    // Case 1: Already matched
    const existingMatch = existingRelationships.find(r => r.status === 'matched');
    if (existingMatch) {
      await t.rollback();
      return res.json({ 
        status: 'matched',
        isMatch: true 
      });
    }

    // Case 2: Existing pending relationship in either direction
    if (existingRelationships.length > 0) {
      const reciprocalChoice = existingRelationships.find(r => 
        r.chooserId === chosenId && r.chosenId === chooserId
      );

      if (reciprocalChoice) {
        // It's a match - update both records
        await Promise.all([
          db.mingleChoice.update(
            { status: 'matched' },
            { 
              where: { id: reciprocalChoice.id },
              transaction: t 
            }
          ),
          // Update or create the reverse relationship
          db.mingleChoice.update(
            { status: 'matched' },
            { 
              where: { chooserId, chosenId },
              transaction: t 
            }
          )
        ]);
        isMatch = true;
        status = 'matched';
      } else {
        // Just update the existing pending record
        await db.mingleChoice.update(
          { status: 'pending' },
          { 
            where: { id: existingRelationships[0].id },
            transaction: t 
          }
        );
      }
    } 
    // Case 3: No existing relationship - create new one
    else {
      await db.mingleChoice.create({
        chooserId,
        chosenId,
        status: 'pending'
      }, { transaction: t });
    }

    // If it's a match, notify both users
    if (isMatch) {
      const [chooser, chosen] = await Promise.all([
        db.user.findByPk(chooserId, { transaction: t }),
        db.user.findByPk(chosenId, { transaction: t })
      ]);

      if (!chooser || !chosen) {
        await t.rollback();
        return res.status(404).json({ message: 'User not found' });
      }

      io.to(`mingle-${chooserId}`).emit('mingle-match', { 
        matchedUserId: chosenId,
        matchedUserName: chosen.username 
      });
      
      io.to(`mingle-${chosenId}`).emit('mingle-match', { 
        matchedUserId: chooserId,
        matchedUserName: chooser.username 
      });
    }

    await t.commit();
    res.json({ status, isMatch });
  } catch (error) {
    await t.rollback();
    console.error('Error choosing match:', error);
    res.status(500).json({ message: 'Error choosing match' });
  }
});

// Ignore a match
router.post('/ignore', authenticate, async (req, res) => {
  try {
    const { chooserId, chosenId } = req.body;
    
    // Update choice status to ignored
    await db.mingleChoice.update(
      { status: 'ignored' },
      { where: { chooserId, chosenId } }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error ignoring match:', error);
    res.status(500).json({ message: 'Error ignoring match' });
  }
});

// Get potential matches (opposite sex who are mingling)
router.get('/potential-matches/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current user's gender
    const currentUser = await db.user.findByPk(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all existing choices involving this user
    const existingChoices = await db.mingleChoice.findAll({
      where: {
        [Op.or]: [
          { chooserId: userId },
          { chosenId: userId }
        ]
      }
    });

    const excludedIds = [
      userId,
      ...existingChoices.map(c => 
        parseInt(c.chooserId) === parseInt(userId) ? c.chosenId : c.chooserId
      )
    ];
    console.log("excludedIds",excludedIds);
    

    // Get opposite gender users who are mingling
    const potentialMatches = await db.user.findAll({
      include: [{
        model: db.mingleStatus,
        where: { isMingling: true },
        required: true,
        as:'mingleStatus'
      }],
      where: {
        // id: { [Op.ne]: userId },
        id: { 
          [Op.notIn]: excludedIds 
        },
        gender: currentUser.gender === 'Male' ? 'Female' : 'Male'
      }
    });

    res.json(potentialMatches);
  } catch (error) {
    console.error('Error getting potential matches:', error);
    res.status(500).json({ message: 'Error getting potential matches' });
  }
});

// Get admired
router.get('/admired/:userId', async (req, res) => {
  try {
    const admired = await db.mingleChoice.findAll({
      where: {
        chooserId: req.params.userId,
        status: 'pending'
      },
      include: [{
        model: db.user,
        as: 'chosen',
        attributes: ['id', 'username', 'avatar']
      }]
    });
    res.json(admired.map(a => a.chosen));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admirers' });
  }
});

// Get admirers
router.get('/admirers/:userId', async (req, res) => {
  try {
    const admirers = await db.mingleChoice.findAll({
      where: {
        chosenId: req.params.userId,
        status: 'pending'
      },
      include: [{
        model: db.user,
        as: 'chooser',
        attributes: ['id', 'username', 'avatar']
      }]
    });
    res.json(admirers.map(a => a.chooser));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admirers' });
  }
});

// Get all admirers
router.get('/all-admirers/:userId', async (req, res) => {
  try {
    const allAdmirers = await db.mingleChoice.findAll({
      where: {
        [Op.or]:[
          {chosenId: req.params.userId},
          {chooserId: req.params.userId, status: 'matched'}
        ]
      },
      include: [{
        model: db.user,
        as: 'chooser',
        attributes: ['id', 'username', 'avatar']
      }]
    });
    res.json(allAdmirers.map(a => a.chooser));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admirers' });
  }
});

// Get admirers
router.get('/matches/:userId', async (req, res) => {
  try {
    const matches = await db.mingleChoice.findAll({
      where: {
        [Op.or]: [
          { chooserId: req.params.userId, status: 'matched' },
          { chosenId: req.params.userId, status: 'matched' }
        ]
      },
      include: [
        {
          model: db.user,
          as: 'chooser',
          attributes: ['id', 'username', 'avatar']
        },
        {
          model: db.user,
          as: 'chosen',
          attributes: ['id', 'username', 'avatar']
        }
      ]
    });
    
    const formattedMatches = matches.map(match => {
      return parseInt(match.chooserId) === parseInt(req.params.userId) ? match.chosen : match.chooser;
    });
    
    res.json(formattedMatches);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching matches' });
  }
});

// module.exports = router;
  return router;
}