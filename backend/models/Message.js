module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
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
    });
  
    Message.associate = (models) => {
      Message.belongsTo(models.User, { foreignKey: 'senderId' });
    };
  
    return Message;
  };

// CREATE TABLE Messages (
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
