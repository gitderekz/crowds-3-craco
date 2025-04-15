module.exports = (sequelize, DataTypes) => {
    const refresh_token = sequelize.define('refresh_token', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // Reference the 'user' table
          key: 'id',
        },
        onDelete: 'CASCADE', // Delete refresh tokens when the associated user is deleted
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        onUpdate: DataTypes.NOW,
      },
    });
  
    // Define the association with the User model
    refresh_token.associate = (models) => {
      refresh_token.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
    };
  
    return refresh_token;
  };