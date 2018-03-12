const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  gender: { type: String, default: 'none' },
  hash: { type: String, required: true },
  avatar: { type: String, default: '' },
  mySubscriptions: [ObjectId],
  subscribers: [ObjectId],
  firstname: String,
  posts: [ObjectId],
  lastname: String,
  about: String,
});

module.exports = mongoose.model('User', userSchema);
