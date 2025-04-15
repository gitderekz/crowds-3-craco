// models/category.js
module.exports = (sequelize, DataTypes) => {
    const category = sequelize.define('category', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'categories', // Explicitly set the table name to lowercase
    });
  
    category.associate = (models) => {
      category.belongsTo(models.category, { foreignKey: 'parentId', as: 'parent' });
      category.hasMany(models.category, { foreignKey: 'parentId', as: 'children' });
    };
  
    return category;
  };