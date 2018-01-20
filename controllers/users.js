const fs = require('fs');
const stream = require('stream');
const fileType = require('file-type');
const path = require('path');
const app = require('../app');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const salt = 'secret';
const avatarsUploads = path.resolve(__dirname, '../', 'uploads', 'avatars');

module.exports = {
  putAvatar(req, res) {
    const id = req.headers['user-id'];
    const blob = req.body;
    const type = fileType(blob);
    const pathToAvatar = path.join(avatarsUploads, `${id}.${type.ext}`);
    const writeStream = fs.createWriteStream(pathToAvatar);

    const bufferStream = new stream.PassThrough();
    bufferStream.end(blob);
    bufferStream.pipe(writeStream);
    bufferStream.on('end', () => {
      const avatar = path.basename(pathToAvatar);
      const update = { avatar };
      User.findByIdAndUpdate({ _id: id }, update, (err, doc) => {
        if (err) throw err;
        return res.status(200).send({ avatar });
      });
    });
  },

  putUser(req, res) {
    const { id, username, firstname, lastname, about } = req.body;

    const options = { new: true };
    const update = {
      username,
      firstname,
      lastname,
      about
    };

    User.findByIdAndUpdate({ _id: id }, update, options, (err, doc) => {
      if (err) throw err;
      return res.status(200).send(doc);
    });
  },

  postUser(req, res) {
    const { username, password } = req.body;
    User.findOne({ username }, (err, doc) => {
      if (err) throw err;
      if (doc) return res.status(422).send('User already exists');
      let user = new User({ username });
      user.hash = jwt.sign({ id: user._id }, salt, { expiresIn: '7d' });
      user.save((err, user) => {
        if (err) throw err;
        res.send(user);
      });
    });
  },

  getUser(req, res) {
    const { username, password } = req.query;
    User.findOne({ username }, (err, doc) => {
      if (err) throw err;
      res.send(doc);
    });
  },

  getUserByToken(req, res) {
    const { token } = req.query;
    User.findOne({ hash: token }, (err, doc) => {
      if (err) throw err;
      res.send(doc);
    });
  }
};