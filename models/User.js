const mongoose = require('mongoose');

// Посмотреть в сторону Virtual полей
const userSchema = mongoose.Schema({
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
  avatar: String,
  gender: String,

  posts: [{
    date: Date,
    title: String,
    content: String,
    preview: String,
    photoCollection: [String]
  }]
});

module.exports = mongoose.model('User', userSchema);
