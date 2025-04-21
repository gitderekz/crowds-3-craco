module.exports = (io) =>{
  
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

// Get potential matches (opposite sex who are mingling)
router.get('/potential-matches/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current user's gender
    const currentUser = await db.user.findByPk(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get opposite gender users who are mingling
    const potentialMatches = await db.user.findAll({
      include: [{
        model: db.mingleStatus,
        where: { isMingling: true },
        required: true,
        as:'mingleStatus'
      }],
      where: {
        id: { [Op.ne]: userId },
        gender: currentUser.gender === 'Male' ? 'Female' : 'Male'
      }
    });

    res.json(potentialMatches);
  } catch (error) {
    console.error('Error getting potential matches:', error);
    res.status(500).json({ message: 'Error getting potential matches' });
  }
});

// Choose a match
router.post('/choose', authenticate, async (req, res) => {
  try {
    const { chooserId, chosenId } = req.body;
    
    // Check if chosen user is mingling
    const isMingling = await db.mingleStatus.findOne({
      where: { userId: chosenId, isMingling: true }
    });
    
    if (!isMingling) {
      return res.status(400).json({ message: 'This user is not currently mingling' });
    }

    // Create or update choice
    const [choice, created] = await db.mingleChoice.findOrCreate({
      where: { chooserId, chosenId },
      defaults: { status: 'pending' }
    });

    if (!created) {
      choice.status = 'pending';
      await choice.save();
    }

    // Check if it's a match (both have chosen each other)
    const reciprocalChoice = await db.mingleChoice.findOne({
      where: { chooserId: chosenId, chosenId: chooserId }
    });

    if (reciprocalChoice && reciprocalChoice.status === 'pending') {
      // It's a match!
      choice.status = 'matched';
      reciprocalChoice.status = 'matched';
      await Promise.all([choice.save(), reciprocalChoice.save()]);
      
      // Notify both users via socket
      io.to(connectedUsers.get(chooserId)).emit('mingle-match', { 
        matchedUserId: chosenId,
        matchedUserName: reciprocalChoice.user.username 
      });
      
      io.to(connectedUsers.get(chosenId)).emit('mingle-match', { 
        matchedUserId: chooserId,
        matchedUserName: choice.user.username 
      });
    }

    res.json({ 
      status: choice.status,
      isMatch: choice.status === 'matched'
    });
  } catch (error) {
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