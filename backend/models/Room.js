module.exports = (sequelize, DataTypes) => {
  const room = sequelize.define('room', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    photoId: {
      type: DataTypes.INTEGER,
      // primaryKey: true,
      allowNull: false,
      references: {
        model: 'Photos',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
    },
    isGroup: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'rooms', // explicit table name
    timestamps: true // ensure createdAt and updatedAt are added
  });

  room.associate = (models) => {
    room.belongsToMany(models.User, {
      through: 'roomusers', // explicit junction table name
      foreignKey: 'roomId',
      otherKey: 'userId',
      as: 'members' // consistent alias
    });
    room.belongsTo(models.Photo, { foreignKey: 'photoId', onDelete: 'CASCADE' });

    // room.belongsToMany(models.User, {
    //   through: models.RoomUser,
    //   foreignKey: 'roomId',
    //   otherKey: 'userId',
    //   as: 'members'
    // });
    room.hasMany(models.Message, {
      foreignKey: 'roomId',
      as: 'messages' // consistent alias
    });
  };
  

  // room.associate = (models) => {
  //   room.belongsToMany(models.User, { through: 'RoomUsers' });
  //   room.hasMany(models.Message);
  // };

  return room;
};


//     id INT AUTO_INCREMENT PRIMARY KEY,      
// CREATE TABLE roomusers (
//     roomId INT,
//     userId INT,
//     createdAt DATETIME,
//     updatedAt DATETIME,
//     PRIMARY KEY (roomId, userId),
//     FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
//     FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
// );

// CREATE TABLE roomusers (
//   roomId INT,
//   userId INT,
//   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Use TIMESTAMP for automatic timestamping
//   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Automatically update the timestamp when modified
//   PRIMARY KEY (roomId, userId),  -- Composite primary key for the many-to-many relationship
//   FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
//   FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
// );
