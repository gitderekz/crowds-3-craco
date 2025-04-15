const db = require('../models');

exports.getCategories = async (req, res) => {
    try {
        const categories = await db.category.findAll({
        //   where: { parentId: null }, // Fetch only top-level categories
          include: [{ model: db.category, as: 'children' }], // Include subcategories
        });
  
        if (!categories.length) {
          return res.status(404).json({ message: 'No categories found' });
        }
        res.json(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories', error });
      }
}