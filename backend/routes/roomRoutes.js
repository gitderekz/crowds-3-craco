const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.post('/', authenticate, roomController.createRoom);
router.get('/', authenticate, roomController.getUserRooms);
router.get('/:roomId/:name/participants', authenticate, roomController.getRoomParticipants);
router.post('/:roomId/join', authenticate, roomController.joinRoom);

module.exports = router;