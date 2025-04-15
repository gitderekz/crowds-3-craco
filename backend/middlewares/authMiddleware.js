const jwt = require('jsonwebtoken');
const db = require('../models');

exports.authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Update last seen
    await db.user.update(
      { lastSeen: new Date() },
      { where: { id: decoded.id } }
    );
    
    next();
  } catch (error) {
    // Check if token is expired specifically
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        expiredAt: error.expiredAt 
      });
    }
    console.error('Token verification error:', error.message);
    res.status(400).json({ message: 'Invalid token.' });
  }
};

exports.authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Unauthorized role.' });
  }
  next();
};

// Add this new middleware for refresh token validation
exports.authenticateRefresh = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};