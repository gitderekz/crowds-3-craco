module.exports = (sequelize, DataTypes) => {
    const message = sequelize.define('message', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'location', 'sticker', 'gif'),
        defaultValue: 'text',
      },
      mediaUrls: {
        type: DataTypes.JSON,
      },
      roomId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isGroup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'messages', // Explicitly set the table name to lowercase
    });
  
    message.associate = (models) => {
      message.belongsTo(models.User, { foreignKey: 'senderId' });
    };
  
    return message;
  };

// CREATE TABLE messages (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   content TEXT NOT NULL,
//   type ENUM('text', 'image', 'video', 'audio', 'file', 'location', 'sticker', 'gif') DEFAULT 'text',
//   mediaUrls JSON,
//   roomId VARCHAR(255) NOT NULL,
//   isGroup BOOLEAN DEFAULT FALSE,
//   senderId INT,
//   createdAt DATETIME,
//   updatedAt DATETIME,
//   FOREIGN KEY (senderId) REFERENCES Users(id) ON DELETE SET NULL
// );
