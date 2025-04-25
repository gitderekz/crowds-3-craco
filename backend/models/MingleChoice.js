module.exports = (sequelize, DataTypes) => {
    const MingleChoice = sequelize.define('mingle_choice', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      chooserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      chosenId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      roomId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.ENUM('pending', 'ignored', 'matched'),
        allowNull: false,
        defaultValue: 'pending'
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
      tableName: 'mingle_choices',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['chooserId', 'chosenId']
        },
        {
          fields: ['chosenId']
        },
        {
          fields: ['status']
        }
      ]
    });
  
    MingleChoice.associate = (models) => {
      MingleChoice.belongsTo(models.user, {
        foreignKey: 'chooserId',
        as: 'chooser',
        onDelete: 'CASCADE'
      });
      
      MingleChoice.belongsTo(models.user, {
        foreignKey: 'chosenId',
        as: 'chosen',
        onDelete: 'CASCADE'
      });
      
      MingleChoice.belongsTo(models.room, {
        foreignKey: 'roomId'
      });
    };
  
    return MingleChoice;
  };
  
  //   -- Table to track who has chosen whom
  //   CREATE TABLE mingle_choices (
  //     id SERIAL PRIMARY KEY,
  //     chooserId INTEGER NOT NULL REFERENCES users(id),
  //     chosenId INTEGER NOT NULL REFERENCES users(id),
  //     status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'ignored', 'matched'
  //     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  //     UNIQUE(chooserId, chosenId)
  //   );