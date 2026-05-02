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
        model: 'users', // Changed from 'Users' to 'users' (lowercase)
        key: 'id',
      },
    },
    photoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'photos', // Changed from 'Photos' to 'photos' (lowercase)
        key: 'id',
      },
    },
  },
  {
    tableName: 'likes',
  });

  // Define associations
  like.associate = (models) => {
    like.belongsTo(models.user, { foreignKey: 'userId', onDelete: 'CASCADE' });
    like.belongsTo(models.photo, { foreignKey: 'photoId', onDelete: 'CASCADE' });
  };

  return like;
};