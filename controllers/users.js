const app = require('../app');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const salt = 'secret';

module.exports = {
  postUser(req, res) {
    const { username, password } = req.body;
    User.findOne({ username }, (err, doc) => {
      if (err) throw err;
      if (doc) return res.status(301).send('User already exists');
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