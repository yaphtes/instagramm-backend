const fs = require('fs');
const path = require('path');
const { app, db } = require('../app');
const { User, Post } = require('../models');
const { uploads, makeSignature } = require('../variables');
const util = require('util');

module.exports = {
  postArticle(req, res) {
    const preview = req.files.preview[0];
    const { collection: photoCollection } = req.files;
    const { id: userId, title, content, date } = req.body;

    const post = new Post({
      userId,
      date,
      title,
      content
    });
    
    const postId = post._id.toString();
    fs.mkdir(path.join(uploads, userId, 'posts', postId), err => {
      if (err) throw err;
      const signature = makeSignature();
      const previewName = `preview-${signature}`;
      fs.writeFile(path.join(uploads, userId, 'posts', postId, previewName), preview.buffer, err => {
        if (err) throw err;
        post.preveiw = previewName;
        fs.mkdir(path.join(uploads, userId, 'posts', postId, 'collection'), err => {
          if (err) throw err;
          const writeFile = util.promisify(fs.writeFile);
          const collection = [];
          let writesPromises = [];
          photoCollection.forEach((photo, i) => {
            const photoName = `photo${i}-${signature}`;
            collection.push(photoName);
            writesPromises.push(writeFile(path.join(uploads, userId, 'posts', postId, 'collection', photoName)));
          });

          Promise.all(writesPromises)
            .then(() => {
              post.collection = collection
              console.log('here');
            });
        })
      });
    });

    // const update = {};
    // const options = {};
    // User.findById(userId, (err, doc) => {
    //   if (err) throw err;
    //   let currentPosts = doc.posts;
    // });
  }
};