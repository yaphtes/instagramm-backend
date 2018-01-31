const salt = 'secret';
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const jwt = require('jsonwebtoken');
const { app, db } = require('../app');
const { User } = require('../models');
const config = require('../config.json');
const { IncomingForm } = require('formidable');
const createGridFS = require('mongoose-gridfs');
const pathToAvatars = path.resolve(__dirname, '../', 'uploads', 'avatars');

const avatarGridfs = createGridFS({
  colleciton: 'avatars',
  model: 'Avatar',
  mongooseConneciton: db
});

const AvatarModel = avatarGridfs.model;

module.exports = {
  postArticle(req, res) {
    const form = new IncomingForm();
    form.multiples = true;

    form.parse(req, (err, fields, files) => {
      if (err) throw err;
      console.log("preview", files.preveiw);
      console.log("collection", files.collection);
    });
  },

  deleteAvatar(req, res) {
    const { id, oldAvatar } = req.body;

    if (oldAvatar) {
      fs.unlink(path.join(pathToAvatars, oldAvatar), err => {
        if (err) throw err;
        const update = { avatar: '' };
        User.findByIdAndUpdate({ _id: id }, update, (err, doc) => {
          if (err) throw err;
          res.status(200).send();
        });
      });
    } else {
      res.status(204).send();
    }
  },

  // TODO: реализовать
  putAvatar(req, res) {
    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) throw err;
      const { id, oldAvatar } = fields;
      const { avatar } = files;
    });
  },

  putUser(req, res) {
    const { id, username, firstname, lastname, about, gender } = req.body;

    const options = { new: true };
    const update = {
      username,
      firstname,
      lastname,
      about,
      gender
    };

    User.findByIdAndUpdate({ _id: id }, update, options, (err, doc) => {
      if (err) throw err;
      res.status(200).send(doc);
    });
  },

  postUser(req, res) {
    const { username, password } = req.body;
    User.findOne({ username }, (err, doc) => {
      if (err) throw err;
      if (doc) return res.status(422).send('User already exists');
      let user = new User({ username });
      let id = String(user._id);
      user.hash = jwt.sign({ password }, id, { expiresIn: config.jwt.expiresIn });
      user.save((err, user) => {
        if (err) throw err;
        res.status(200).send(user);
      });
    });
  },

  getUser(req, res) {
    const { username, password } = req.query;

    User.findOne({ username }, (err, doc) => {
      if (err) throw err;
      if (!doc) return res.status(404).send();
      let { _id: id, hash } = doc;
      const { password: decodedPassword } = jwt.decode(hash);
      
      if (decodedPassword !== password) {
        res.status(404).send();
      } else {
        id = String(id);
        const newHash = jwt.sign({ password }, id, { expiresIn: config.jwt.expiresIn });
        const update = { hash: newHash };
        const options = { new: true };
        User.findByIdAndUpdate(id, update, options, (err, doc) => {
          if (err) throw err;
          res.status(200).send(doc);
        });
      }
    });
  },

  getUserByToken(req, res) {
    const { token } = req.query;
    User.findOne({ hash: token }, (err, doc) => {
      if (err) throw err;
      res.send(doc);
    });
  },

  jwtCheck(req, res, next) {
    const { path, method } = req;
    
    if (path === '/api/user' && method === 'GET' || method === 'POST') {
      next();
    } else {
      const hash = req.headers['x-jwt'];
      User.findOne({ hash }, (err, doc) => {
        if (err) throw err;
        const id = String(doc._id);
        jwt.verify(hash, id, (err, decoded) => {
          if (err) {
            return res.status(401).redirect('/login');
          } else {
            next();
          }
        });
      });
    }
  }
};