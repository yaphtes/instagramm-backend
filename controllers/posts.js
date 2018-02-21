const fs = require('fs');
const path = require('path');
const { app, db } = require('../app');
const { User, Post } = require('../models');
const { uploads, makeSignature } = require('../variables');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);


module.exports = {
  async postArticle(req, res) {
    const previewIsLoaded = Boolean(req.files.preview);
    const collectionIsLoaded = Boolean(req.files.collection);

    if (previewIsLoaded) var preview = req.files.preview[0];
    if (collectionIsLoaded) var { collection: photoCollection } = req.files;

    let { id: userId, title, content, date } = req.body;
    console.log(userId);
    date = new Date(Number(date));    

    let post = new Post({
      userId,
      date,
      title,
      content
    });
    
    const postId = post._id.toString();
    const pathToPostDir = path.join(uploads, userId, 'posts', postId);
    try {
      await mkdir(pathToPostDir);
      const signature = makeSignature();
      if (previewIsLoaded) {
        const previewName = `preview-${signature}`;
        await writeFile(path.join(pathToPostDir, previewName), preview.buffer);
        post.preview = previewName;
      }
      await mkdir(path.join(pathToPostDir, 'collection'));
      if (collectionIsLoaded) {
        const collection = [];
        let promises = [];
        photoCollection.forEach((photo, i) => {
          const photoName = `photo_${i}-${signature}`;
          collection.push(photoName);
          const pr = writeFile(path.join(pathToPostDir, 'collection', photoName), photo.buffer);
          promises.push(pr);
        });
        await Promise.all(promises);
        post.photoCollection = collection;
      }
      await post.save();

      User.findById(userId, (err, doc) => {
        if (err) throw err;
        const userUpdate = { posts: [...doc.posts, postId] };
        const options = { new: true };
        User.findByIdAndUpdate(userId, userUpdate, options, (err, doc) => {
          if (err) throw err;
          res.status(200).send({ postId });
        });
      });
    } catch(err) {
      console.log(err);
      res.status(500).send();
    }
  },

  getPostPreview(req, res) {
    const { postId } = req.query;
    Post.findById(postId, (err, doc) => {
      if (err) throw err;
      const { preview, title, content, date } = doc;
      const postPreview = {
        preview,
        title,
        content,
        date
      };
      
      res.status(200).send(postPreview);
    });
  }
};