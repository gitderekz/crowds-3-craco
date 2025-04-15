const express = require('express');
const photoController = require('../controllers/photoController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {upload, galleryUpload} = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/upload', authenticate, authorize(['publisher']), upload, photoController.uploadPhotos);
router.get('/client', photoController.getClientPhotos);
router.get('/', photoController.getCategoryPhotos);
router.get('/sponsor', photoController.getSponsorPhotos);
router.get('/home', photoController.getHomePhotos);
router.post('/:id/like', authenticate, photoController.likePhoto);
router.put('/:id', authenticate, galleryUpload, photoController.updatePhoto);
// routes/photoRoutes.js
router.get('/:id/likes', photoController.getPhotoLikes);
module.exports = router;
