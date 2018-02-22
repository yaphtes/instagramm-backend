const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  
  hash: {
    type: String,
    required: true
  },

  firstname: String,
  lastname: String,
  about: String,
  
  avatar: {
    type: String,
    default: null
  },

  gender: {
    type: String,
    default: 'none'
  },

  posts: [ObjectId]
});

module.exports = mongoose.model('User', userSchema);
