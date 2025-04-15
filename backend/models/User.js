// models/user.js
module.exports = (sequelize, DataTypes) => {
    const user = sequelize.define('user', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('publisher', 'visitor'),
        allowNull: false,
        defaultValue: 'visitor',
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      online: {
        type: DataTypes.STRING,
        allowNull: true,
      }
    },{
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    },
    {
      tableName: 'users', // Explicitly set the table name to lowercase
    });
  
    // Define associations
    user.associate = (models) => {
      // A user can upload many photos
      user.hasMany(models.Photo, { foreignKey: 'userId', onDelete: 'CASCADE' });
  
      // A user can like many photos
      user.hasMany(models.Like, { foreignKey: 'userId', onDelete: 'CASCADE' });

      user.belongsToMany(models.Room, {
        through: 'roomusers',
        foreignKey: 'userId',
        otherKey: 'roomId',
        as: 'rooms'
      });
      // user.belongsToMany(models.Room, {
      //   through: models.RoomUser,
      //   foreignKey: 'userId',
      //   otherKey: 'roomId',
      //   as: 'rooms'
      // });
      
      user.hasMany(models.refresh_token, {
        foreignKey: 'userId',
        as: 'refresh_tokens',
      });
    };
  
    return user;
  };