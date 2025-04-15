module.exports = {
    development: {
        username: process.env.DB_USERNAME || 'root',  // Load from .env
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'crowds',
        host: process.env.DB_HOST || 'localhost',
        dialect: process.env.DB_DIALECT || 'mysql',  // Ensure the dialect is set here
    },
  };