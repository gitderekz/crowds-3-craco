// module.exports = (sequelize, DataTypes) => {
//     const photo = sequelize.define('photo', {
//       name: DataTypes.STRING,
//       category: DataTypes.STRING,
//       event: DataTypes.STRING,
//       displayOnHome: DataTypes.BOOLEAN,
//       userId: DataTypes.INTEGER,
//       imageUrl: DataTypes.STRING,
//       likes: DataTypes.INTEGER,
//     });
//     return photo;
//   };
  // models/photo.js
module.exports = (sequelize, DataTypes) => {
    const photo = sequelize.define('photo', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // References the users table
          key: 'id',
        },
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // References the users table
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      event: {
        type: DataTypes.STRING,
        defaultValue: 'none',
      },
      displayOnHome: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mediaType: {
        type: DataTypes.ENUM('video','audio','image','gif'),
        allowNull: false,
      },

      gallery: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      location: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      schedule: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      services: {
        type: DataTypes.JSON,
        allowNull: true,
      },

      photoLikes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'photos', // Explicitly set the table name to lowercase
    });
  
    // Define associations
    photo.associate = (models) => {
      // A photo belongs to a user
      photo.belongsTo(models.user, { foreignKey: 'userId', onDelete: 'CASCADE' });
  
      // A photo belongs to a client
      photo.belongsTo(models.user, { foreignKey: 'clientId', onDelete: 'CASCADE' });
  
      // A photo can have many likes
      photo.hasMany(models.like, { foreignKey: 'photoId', onDelete: 'CASCADE' });
    };
  
    return photo;
  };