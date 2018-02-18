const fs = require('fs');
const path = require('path');
const stream = require('stream');
const jwt = require('jsonwebtoken');
const { app, db } = require('../app');
const { User } = require('../models');
const fileType = require('file-type');
const config = require('../config.json');
const { uploads, makeSignature } = require('../variables');
const { promisify } = require('util');
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);


// переписать mongoose в промисы, работать через ObjectID (?)

module.exports = {
  async deleteAvatar(req, res) {
    const { id, currentAvatar } = req.body;

    if (currentAvatar) {
      try {
        await unlink(path.join(uploads, id, currentAvatar));
        const options = { new: true };
        const update = { avatar: "" };

        User.findByIdAndUpdate(id, update, options, (err, doc) => {
          if (err) throw err;
          res.status(200).send();
        });
      } catch(err) {
        console.log(err);
      }
    } else {
      res.status(200).send();
    }
  },

  async putAvatar(req, res) {
    const { id, currentAvatar } = req.body;
    const { file: avatar } = req;
    const signature = makeSignature();;
    
    
    try {
      if (currentAvatar) {
        await unlink(path.join(uploads, id, currentAvatar));
        const avatar = await write();
        res.status(200).send({ avatar });
      } else {
        const avatar = await write();
        res.status(200).send({ avatar });
      }
    } catch(err) {
      console.log(err);
    }

    function write() {
      return new Promise(async (resolve, reject) => {
        const name = `avatar-${signature}`;
        await writeFile(path.join(uploads, id, name), avatar.buffer);
        const update = { avatar: name };
        User.findByIdAndUpdate(id, update, (err, doc) => {
          if (err) {
            reject(err)
          } else {
            resolve(name);
          }
        });
      });
    }
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
    User.findOne({ username }, async (err, doc) => {
      if (err) throw err;
      if (doc) return res.status(422).send('User already exists');
      let user = new User({ username });
      let id = String(user._id);
      await mkdir(path.join(uploads, id));
      await mkdir(path.join(uploads, id, 'posts'));
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
    const { method, originalUrl } = req;

    // if login or registation
    if (originalUrl.includes('/api/user') && method === 'GET' || method === 'POST') {
      next();
    } else {
      const hash = req.headers['x-jwt'];
      console.log(req.headers);
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