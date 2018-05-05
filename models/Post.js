const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true
  },
  date: Date,
  title: String,
  content: String,
  preview: { type: String, default: '' },
  photoCollection: [ String ],
  likes: [ ObjectId ],
  comments: [{
    _id: ObjectId,
    userId: ObjectId,
    comment: String,
    avatar: String,
    username: String
  }]
});

module.exports = mongoose.model('Post', postSchema);