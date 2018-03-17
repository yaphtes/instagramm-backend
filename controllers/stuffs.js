const path = require('path');
const { app, db } = require('../app');
const { User, Post } = require('../models');
const { uploads } = require('../variables');

module.exports = {
  getUserAvatarByPostId(req, res) {
    const { postId } = req.query;
    Post.findById(postId, (err, post) => {
      if (err) throw err;
      const { userId } = post;
      User.findById(userId, (err, user) => {
        if (err) throw err;
        const { avatar } = user;
        res.status(200).send({ avatar });
      });
    });
  }
};
