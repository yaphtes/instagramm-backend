const mongoose = require('mongoose');

// TODO: сделать хэш, где поле пользователя выступает в качестве соли.
// посмотреть на виртуальные поля.
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
  avatar: String
});

module.exports = mongoose.model('User', userSchema);
