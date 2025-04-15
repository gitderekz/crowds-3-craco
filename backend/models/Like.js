// models/like.js
module.exports = (sequelize, DataTypes) => {
  const like = sequelize.define('like', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users', // References the Users table
        key: 'id',
      },
    },
    photoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Photos', // References the Photos table
        key: 'id',
      },
    },
  },
  {
    tableName: 'likes', // Explicitly set the table name to lowercase
  });

  // Define associations
  like.associate = (models) => {
    // A like belongs to a user
    like.belongsTo(models.User, { foreignKey: 'userId', onDelete: 'CASCADE' });

    // A like belongs to a photo
    like.belongsTo(models.Photo, { foreignKey: 'photoId', onDelete: 'CASCADE' });
  };

  return like;
};