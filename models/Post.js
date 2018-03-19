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
  preview: String,
  photoCollection: [String],
  likes: [ObjectId],
  comments: [{ userId: ObjectId, comment: String }]
});

module.exports = mongoose.model('Post', postSchema);