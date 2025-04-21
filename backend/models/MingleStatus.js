module.exports = (sequelize, DataTypes) => {
    const MingleStatus = sequelize.define('mingle_status', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      isMingling: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'mingle_status',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId']
        }
      ]
    });
  
    MingleStatus.associate = (models) => {
      MingleStatus.belongsTo(models.user, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE'
      });
    };
  
    return MingleStatus;
  };

//   -- New table to track mingle status and matches
//   CREATE TABLE mingle_status (
//     id SERIAL PRIMARY KEY,
//     userId INTEGER NOT NULL REFERENCES users(id),
//     isMingling BOOLEAN DEFAULT FALSE,
//     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     UNIQUE(userId)
//   );