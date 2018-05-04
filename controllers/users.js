const fs = require('fs');
const path = require('path');
const stream = require('stream');
const jwt = require('jsonwebtoken');
const { app, db } = require('../app');
const { User, Post } = require('../models');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const fileType = require('file-type');
const { promisify } = require('util');
const config = require('../config.json');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const { uploads, makeSignature } = require('../variables');
const rimraf = require('rimraf');
const WebSocket = require('ws');
const util = require('util');


module.exports = {
  // также реализовать обновление документов
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

  // также реализовать обновление документов
  addSubscription(req, res) {
    const { myId, subscriptionId } = req.body;
    User.findById(myId, (err, me) => {
      if (err) throw err;

      for (const sub of me.mySubscriptions) {
        if (sub._id == subscriptionId) {
          return res.status(409).send();
        }
      }


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
          mySubscriptions: [ ...me.mySubscriptions, addingSub ] };

        User.findByIdAndUpdate(myId, update, { new: true }, (err, me) => {
          if (err) throw err;
          User.findById(subscriptionId, (err, doc) => {
            if (err) throw err;
            const meData = {
              _id: me._id,
              username: me.username,
              firstname: me.firstname,
              lastname: me.lastname,
              avatar: me.avatar
            };
            const update = { subscribers: [ ...doc.subscribers, meData ] };
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

  // также реализовать обновление документов
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

    try {
      if (currentAvatar) await unlink(path.join(uploads, id, currentAvatar));
      const options = { new: true };
      const update = { avatar: "" };

      User.findByIdAndUpdate(id, update, options, async (err, me) => {
        if (err) throw err;
        await me.updateSubs();
        res.status(200).send();
      });
    } catch(err) {
      console.log(err);
    }
  },

  async putAvatar(req, res) {
    const { id, currentAvatar } = req.body;
    const { file: avatar } = req;
    const signature = makeSignature();

    try {
      if (currentAvatar) await unlink(path.join(uploads, id, currentAvatar));
      const name = `avatar-${signature}`;
      await writeFile(path.join(uploads, id, name), avatar.buffer);
      const update = { avatar: name };
      const options = { new: true };
      User.findByIdAndUpdate(id, update, options, async (err, me) => {
        if (err) throw err;
        await me.updateSubs();
        res.status(200).send({ avatar: name });
      });
    } catch (err) {
      console.log(err);
    }
  },

  putUser(req, res) {
    const { id, username, firstname, lastname, about, gender } = req.body;
    User.findOne({ username }, (err, me) => {
      if (err) throw err;
      const options = { new: true };
      let update = {
        username,
        firstname,
        lastname,
        about,
        gender
      };
      if (me) delete update.username;;
      User.findByIdAndUpdate(id, update, options, async (err, me) => {
        if (err) throw err;
        const data = {
          _id: id,
          username,
          firstname,
          lastname,
          avatar: me.avatar || ''
        };
        me = await me.updateSubs(data);
        res.status(200).send(me);
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