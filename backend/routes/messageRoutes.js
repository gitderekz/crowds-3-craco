const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post('/', authenticate, messageController.createMessage);
router.get('/:roomId', authenticate, messageController.getRoomMessages);

// Group chat messages
router.post('/group', authenticate, messageController.createGroupMessage);
router.get('/group/:roomId', authenticate, messageController.getGroupMessages);

module.exports = router;