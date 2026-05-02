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
      // roomId: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // },
      roomId: {
        type: DataTypes.STRING, // Changed from STRING to INTEGER to match rooms.id
        // type: DataTypes.INTEGER, // Changed from STRING to INTEGER to match rooms.id
        allowNull: false,
        references: {
          model: 'rooms', // lowercase to match your table name
          key: 'id',
        },
      },
      isGroup: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // lowercase to match your table name
          key: 'id',
        },
      },
    },
    {
      tableName: 'messages', // Explicitly set the table name to lowercase
    });
  
    // message.associate = (models) => {
    //   message.belongsTo(models.User, { foreignKey: 'senderId' });
    // };
    message.associate = (models) => {
      message.belongsTo(models.user, { foreignKey: 'senderId', as: 'sender', onDelete: 'CASCADE' });
      message.belongsTo(models.room, { foreignKey: 'roomId', as: 'room', onDelete: 'CASCADE' });
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
