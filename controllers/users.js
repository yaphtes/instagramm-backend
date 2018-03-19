const fs = require('fs');
const path = require('path');
const stream = require('stream');
const jwt = require('jsonwebtoken');
const { app, db } = require('../app');
const { User, Post } = require('../models');
const fileType = require('file-type');
const { promisify } = require('util');
const config = require('../config.json');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const { uploads, makeSignature } = require('../variables');
const rimraf = require('rimraf');


module.exports = {
  removeSubscription(req, res) {
    const { myId, subscriptionId } = req.body;
    User.findById(myId, (err, me) => {
      if (err) throw err;
      const update = { mySubscriptions: me.mySubscriptions.filter(obj => obj._id.toString() !== subscriptionId) };
      User.findByIdAndUpdate(myId, update, err => {
        if (err) throw err;
        User.findById(subscriptionId, (err, sub) => {
          if (err) throw err;
          const update = { subscribers: sub.subscribers.filter(obj => obj._id.toString() !== myId) };
          User.findByIdAndUpdate(subscriptionId, update, (err, doc) => {
            if (err) throw err;
            const removedSub = {
              _id: sub._id,
              username: sub.username,
              firstname: sub.firstname,
              lastname: sub.lastname,
              avatar: sub.avatar
            };

            res.status(200).send(removedSub);
          });
        });
      });
    });
  },

  getUserFragmentById(req, res) {
    const { id } = req.query;
    User.findById(id, (err, { username, avatar, firstname, lastname }) => {
      if (err) throw err;
      const data = {
        id,
        username,
        avatar,
        firstname,
        lastname
      };
      res.status(200).send(data);
    });
  },

  addSubscription(req, res) {
    const { myId, subscriptionId } = req.body;
    User.findById(myId, (err, me) => {
      if (err) throw err;
      User.findById(subscriptionId, (err, sub) => {
        if (err) throw err;
        const addingSub = {
          _id: sub._id,
          username: sub.username,
          firstname: sub.firstname,
          lastname: sub.lastname,
          avatar: sub.avatar
        };

        const update = {
          mySubscriptions: [ ...me.mySubscriptions, addingSub ]
        };
        User.findByIdAndUpdate(myId, update, (err, me) => {
          if (err) throw err;
          User.findById(subscriptionId, (err, doc) => {
            if (err) throw err;
            const update = {
              subscribers: [
                ...doc.subscribers,
                {
                  _id: me._id,
                  username: me.username,
                  firstname: me.firstname,
                  lastname: me.lastname,
                  avatar: me.avatar
                }
              ]
            };
            User.findByIdAndUpdate(subscriptionId, update, (err, doc) => {
              if (err) throw err;
              res.status(200).send(addingSub);
            });
          });
        });
      });
    });
  },

  outerUserById(req, res) {
    const { id } = req.query;
    User.findById(id, (err, doc) => {
      if (err) throw err;
      res.status(200).send(doc);
    });
  },

  getUsersByFragment(req, res) {
    const { fragment } = req.query;
    User.find({ username: {$regex: new RegExp(`.*${fragment}.*`)} }, (err, docs) => {
      if (err) throw err;
      res.send(docs);
    })
  },

  deleteUser(req, res) {
    const { id } = req.body;
    // todo нужно учесть чтобы token и userId были одной сущности
    // реализуем после фикса jwt

    User.findById(id, async (err, doc) => {
      if (err) throw err;
      const { posts } = doc;
      let promises = [];
      posts.forEach(({ postId }) => {
        const pr = new Promise((resolve, reject) => {
          Post.findByIdAndRemove(postId, err => {
            if (err) throw err;
            resolve();
          });
        });
        promises.push(pr);
      });

      await Promise.all(promises);
      User.findByIdAndRemove(id, err => {
        if (err) throw err;
        rimraf(path.join(uploads, id), err => {
          if (err) throw err;
          res.status(200).send();
        });
      });
    });
  },

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
    const signature = makeSignature();

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
    User.findOne({ username }, (err, doc) => {
      if (err) throw err;
      const options = { new: true };
      let update = {
        username,
        firstname,
        lastname,
        about,
        gender
      };
      if (doc) delete update.username;;
      User.findByIdAndUpdate({ _id: id }, update, options, (err, doc) => {
        if (err) throw err;
        res.status(200).send(doc);
      });
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