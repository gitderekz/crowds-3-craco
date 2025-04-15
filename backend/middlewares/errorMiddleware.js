const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    // Validation errors
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
      return res.status(400).json({ errors });
    }
  
    // Unauthorized errors
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
  
    // File size limit exceeded
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File size exceeds 10MB limit' });
    }
  
    // Default server error
    res.status(500).json({ error: 'Something went wrong' });
  };
  
  module.exports = errorHandler;