const Sequelize = require('sequelize');
const config = require('../config/config');
const user = require('./User');
const photo = require('./Photo');
const like = require('./Like');
const category = require('./Category');
const message = require('./Message');
const room = require('./Room');
const roomuser = require('./RoomUser');
const refresh_token = require('./RefreshToken');
const mingleStatus = require('./MingleStatus');
const mingleChoice = require('./MingleChoice');
const MingleChoice = require('./MingleChoice');

// const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
//   host: dbConfig.HOST,
//   dialect: dbConfig.dialect,
//   pool: {
//     max: dbConfig.pool.max,
//     min: dbConfig.pool.min,
//     acquire: dbConfig.pool.acquire,
//     idle: dbConfig.pool.idle,
//   },
// });
const sequelize = new Sequelize(config.development);

const db = {
  sequelize,
  Sequelize,
  user: user(sequelize, Sequelize),
  photo: photo(sequelize, Sequelize),
  like: like(sequelize, Sequelize),
  category: category(sequelize, Sequelize),
  message: message(sequelize, Sequelize),
  room: room(sequelize, Sequelize),
  roomuser: roomuser(sequelize, Sequelize),
  refresh_token: refresh_token(sequelize, Sequelize),
  mingleStatus: mingleStatus(sequelize, Sequelize),
  mingleChoice: mingleChoice(sequelize, Sequelize),
};

// Define associations
// USER PHOTO
db.user.hasMany(db.photo, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.user.hasMany(db.photo, { foreignKey: 'clientId', onDelete: 'CASCADE' });
db.photo.belongsTo(db.user, { foreignKey: 'userId', onDelete: 'CASCADE' });

// USER LIKE
db.user.hasMany(db.like, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.like.belongsTo(db.user, { foreignKey: 'userId', onDelete: 'CASCADE' });

// PHOTO LIKE
db.photo.hasMany(db.like, { foreignKey: 'photoId', onDelete: 'CASCADE' });
db.like.belongsTo(db.photo, { foreignKey: 'photoId', onDelete: 'CASCADE' });

// PHOTO CATEGORY
db.photo.belongsTo(db.category, { foreignKey: 'categoryId', onDelete: 'CASCADE' });
db.category.hasMany(db.photo, { foreignKey: 'categoryId', onDelete: 'CASCADE' });

// PHOTO ROOM
db.photo.hasOne(db.room, { foreignKey: 'photoId', onDelete: 'CASCADE' });
db.room.belongsTo(db.photo, { foreignKey: 'photoId', onDelete: 'CASCADE' });

// Self-referencing associations for category
// CATEGORY CATEGORY
db.category.belongsTo(db.category, { foreignKey: 'parentId', as: 'parent' });
db.category.hasMany(db.category, { foreignKey: 'parentId', as: 'children' });

// USER REFRESH-TOKEN
db.user.hasMany(db.refresh_token, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.refresh_token.belongsTo(db.user, { foreignKey: 'userId', onDelete: 'CASCADE' });

// db.photo.belongsTo(db.user, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
// db.photo.hasMany(db.like, { foreignKey: 'photoId', as: 'likes', onDelete: 'CASCADE' });


// ======================
// MESSAGE ASSOCIATIONS
// ======================
db.message.belongsTo(db.user, { 
  foreignKey: 'senderId', 
  as: 'sender', 
  onDelete: 'CASCADE' 
});

db.user.hasMany(db.message, { 
  foreignKey: 'senderId', 
  as: 'messages', 
  onDelete: 'CASCADE' 
});

db.message.belongsTo(db.room, { 
  foreignKey: 'roomId', 
  as: 'room', 
  onDelete: 'CASCADE' 
});

// ======================
// ROOM ASSOCIATIONS  
// ======================
db.room.hasMany(db.message, { 
  foreignKey: 'roomId', 
  as: 'messages', 
  onDelete: 'CASCADE' 
});

// Room-User many-to-many through roomusers
db.room.belongsToMany(db.user, {
  through: 'roomusers',
  foreignKey: 'roomId',
  otherKey: 'userId',
  as: 'members'
});

db.user.belongsToMany(db.room, {
  through: 'roomusers',
  foreignKey: 'userId', 
  otherKey: 'roomId',
  as: 'rooms'
});

// MINGLE
// User to MingleStatus (one-to-one)
db.user.hasOne(db.mingleStatus, {
  foreignKey: 'userId',
  as: 'mingleStatus',
  onDelete: 'CASCADE'
});

db.mingleStatus.belongsTo(db.user, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE'
});

// User to MingleChoice as chooser (one-to-many)
db.user.hasMany(db.mingleChoice, {
  foreignKey: 'chooserId',
  as: 'choicesMade',
  onDelete: 'CASCADE'
});

db.mingleChoice.belongsTo(db.user, {
  foreignKey: 'chooserId',
  as: 'chooser',
  onDelete: 'CASCADE'
});

// User to MingleChoice as chosen (one-to-many)
db.user.hasMany(db.mingleChoice, {
  foreignKey: 'chosenId',
  as: 'choicesReceived',
  onDelete: 'CASCADE'
});

db.mingleChoice.belongsTo(db.user, {
  foreignKey: 'chosenId',
  as: 'chosen',
  onDelete: 'CASCADE'
});

// ROOM - MINGLECHOICE
db.mingleChoice.belongsTo(db.room, {
  foreignKey: 'roomId'
});
db.room.hasMany(db.mingleChoice, {
  foreignKey: 'roomId'
});

module.exports = db;