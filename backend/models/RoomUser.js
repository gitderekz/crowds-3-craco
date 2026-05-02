// models/roomuser.js
module.exports = (sequelize, DataTypes) => {
    const roomuser = sequelize.define('roomuser', {
      roomId: {
        type: DataTypes.STRING,
        // type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'rooms',
          key: 'id'
        }
      },
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id'
        }
      }
    }, {
      tableName: 'roomusers',
      timestamps: true
    });
  
    return roomuser;
  };