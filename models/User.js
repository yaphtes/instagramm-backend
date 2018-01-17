const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    dropDups: true
  },

  hash: {
    type: String,
    unique: true
  }
});

module.exports = mongoose.model('User', userSchema);
