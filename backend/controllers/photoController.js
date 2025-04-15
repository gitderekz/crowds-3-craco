const db = require('../models');

exports.uploadPhotos = async (req, res) => {
  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const { name, category, mediaType, clientId, event, displayOnHome, userId } = req.body;

  try {
    // Map uploaded files to their URLs
    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);

    // Create photo records in the database
    const photos = await db.photo.bulkCreate(
      imageUrls.map((url) => ({
        name,
        category,
        clientId,
        event,
        displayOnHome: displayOnHome === 'true',
        userId,
        mediaType,
        imageUrl: url,
        likes: 0,
      }))
    );

    res.status(201).json({ message: 'Photos uploaded successfully', photos });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ message: 'Error uploading photos', error });
  }
};

exports.getClientPhotos = async (req, res) => {
  const { category, userId } = req.query;
  const where = {};
  if (category) where.category = category;
  if (userId) where.userId = userId;

  try {
    const photos = await db.photo.findAll({ where });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching photos', error });
  }
};

exports.getCategoryPhotos = async (req, res) => {
  const { category, page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const where = category ? { category } : {};
    const photos = await db.photo.findAll({
      where,
      limit,
      offset,
      include: [
        {
          model: db.user,  // Ensure 'User' is properly associated in your models
          as: 'user',  // Use the alias defined in the association
          attributes: ['id', 'username', 'email', 'role', 'avatar'] // Select only needed fields
        },
        {
          model: db.like,  // Ensure 'User' is properly associated in your models
          as: 'likes',  // Use the alias defined in the association
          attributes: ['id', 'userId', 'photoId'] // Select only needed fields
        }
      ]
    });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching photos', error });
  }
};

exports.getSponsorPhotos = async (req, res) => {
  try {
    const sponsorPhotos = await db.photo.findAll({ 
      where: { category: 1/*'sponsor'*/ },
      include: [
        {
          model: db.user,  // Ensure 'User' is properly associated in your models
          as: 'user',  // Use the alias defined in the association
          attributes: ['id', 'username', 'email', 'role', 'avatar'] // Select only needed fields
        },
        {
          model: db.like,  // Ensure 'User' is properly associated in your models
          as: 'likes',  // Use the alias defined in the association
          attributes: ['id', 'userId', 'photoId'] // Select only needed fields
        }
      ]
    });
    res.json(sponsorPhotos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sponsor photos', error });
  }
};

exports.getHomePhotos = async (req, res) => {
  try {
    const homePhotos = await db.photo.findAll({ 
      where: { displayOnHome: true },
      include: [
        {
          model: db.user,  // Ensure 'User' is properly associated in your models
          as: 'user',  // Use the alias defined in the association
          attributes: ['id', 'username', 'email', 'role', 'avatar'] // Select only needed fields
        },
        {
          model: db.like,  // Ensure 'User' is properly associated in your models
          as: 'likes',  // Use the alias defined in the association
          attributes: ['id', 'userId', 'photoId'] // Select only needed fields
        }
      ]
    });
    res.json(homePhotos);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching home photos', error });
  }
};

exports.likePhoto = async (req, res) => {
  const { id } = req.params; // Photo ID
  const userId = req.user.id; // User ID from the JWT token

  try {
    // Step 1: Find the photo
    const photo = await db.photo.findByPk(id);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Step 2: Check if the user has already liked the photo
    const existingLike = await db.like.findOne({
      where: { userId, photoId: id },
    });

    if (existingLike) {
      return res.status(400).json({ message: 'You have already liked this photo' });
    }

    // Step 3: Update the likes count in the photos table
    photo.photoLikes += 1; // Assuming the column is named `photoLikes`
    await photo.save();

    // Step 4: Create a new entry in the likes table
    await db.like.create({ userId, photoId: id });

    // Step 5: Return the updated photo
    res.json({ message: 'Photo liked', photo });
  } catch (error) {
    console.error('Error liking photo:', error);
    res.status(500).json({ message: 'Error liking photo', error });
  }
};

// controllers/photoController.js
exports.getPhotoLikes = async (req, res) => {
  const { id } = req.params;

  try {
    const likes = await db.like.findAll({
      where: { photoId: id },
      include: [
        { 
          model: db.user, 
          attributes: ['id', 'username'] 
        }
      ],
    });
    res.json(likes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching likes', error });
  }
};

// updatePhoto
exports.updatePhoto = async (req, res) => {
  const { id } = req.params;
  
  try {
    const photo = await db.photo.findByPk(id);
    if (!photo) {
      // Clean up uploaded files if photo doesn't exist
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(path.join(uploadsDir, file.filename));
        });
      }
      return res.status(404).json({ message: 'Photo not found' });
    }

    // Process uploaded files
    const newGalleryItems = req.files?.map(file => `/uploads/gallery/${file.filename}`) || [];

    // Update photo data
    const updates = {};
    if (req.body.schedule) updates.schedule = JSON.parse(req.body.schedule);
    if (req.body.location) updates.location = JSON.parse(req.body.location);
    if (req.body.services) updates.services = JSON.parse(req.body.services);
    if (newGalleryItems.length > 0) {
      updates.gallery = [...(photo.gallery || []), ...newGalleryItems];
    }

    await photo.update(updates);
    
    res.status(200).json({ 
      message: 'Photo updated successfully',
      photo: await db.photo.findByPk(id) // Return fresh data
    });
  } catch (error) {
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file.filename));
      });
    }
    res.status(500).json({ 
      message: 'Error updating photo',
      error: error.message 
    });
  }
};