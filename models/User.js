const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  gender: { type: String, default: 'none' },
  hash: { type: String, required: true },
  avatar: { type: String, default: '' },
  mySubscriptions: [{
    _id: { type: ObjectId, required: true },
    username: { type: String, required: true },
    firstname: String,
    lastname: String,
    avatar: String,
    private: Boolean
  }],
  subscribers: [{
    _id: { type: ObjectId, required: true },
    username: { type: String, required: true },
    firstname: String,
    lastname: String,
    avatar: String,
    private: Boolean
  }],
  firstname: String,
  posts: [{ _id: ObjectId, date: Date }],
  lastname: String,
  about: String,
  private: { type: Boolean, default: false}
});

module.exports = mongoose.model('User', userSchema);
