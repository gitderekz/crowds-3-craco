const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const { authenticate, authenticateRefresh } = require('../middlewares/authMiddleware');
const { avatarUpload } = require('../middlewares/uploadMiddleware');


// Rate limiting setup
const rateLimit = require('express-rate-limit');
const upload = require('../middlewares/uploadMiddleware');

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 20, // limit each IP to 20 requests per windowMs
//   message: 'Too many requests from this IP, please try again later'
// });

router.post('/register-client', /*authLimiter, avatarUpload ,*/ authController.registerClient);
router.post('/register', /*authLimiter,*/ avatarUpload,  authController.register);
router.post('/login', /*authLimiter,*/ authController.login);
router.get('/validate', authenticate, authController.validate);
router.post('/refresh-token', authenticateRefresh, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);


module.exports = router;