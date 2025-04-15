const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const galleryDir = path.join(uploadsDir, 'gallery');
const avatarDir = path.join(uploadsDir, 'avatar');

[uploadsDir, galleryDir, avatarDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, galleryDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Common file filter
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|webm|mp3|wav|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Only images (jpeg, jpg, png, gif), videos and audio files are allowed!'));
  }
};

const upload = multer({ 
  storage, 
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter
}).array('images', 10); // Max 10 files for multiple files

const galleryUpload = multer({ 
  storage: galleryStorage, 
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter
}).array('images', 10); // Max 10 files for multiple files

const avatarUpload = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
}).single('avatar'); // For single avatar upload

module.exports = { upload, avatarUpload, galleryUpload };