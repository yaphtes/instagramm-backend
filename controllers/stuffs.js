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
  },

  getFeed(req, res) {
    let { myId } = req.query;
    
    User.findById(myId, (err, me) => {
      if (err) throw err;
      const mySubscriptions = me.mySubscriptions.map(sub => sub._id);
      let subscriptionPromises = [];

      mySubscriptions.forEach(subscriptionId => {
        const subscriptionPr = new Promise(resolveSubscription => {

          User.findById(subscriptionId, (err, subscription) => {
            if (err) throw err;
            const subscriptionPosts = subscription.posts.map(post => post._id);
            let postsPromises = [];

            subscriptionPosts.forEach(subscriptionPostId => {
              const postPr = new Promise(resolvePost => {
                Post.findById(subscriptionPostId, (err, fullPost) => {
                  User.findById(fullPost.userId, (err, user) => {
                    if (err) throw err;
                    const avatar = user.avatar;
                    const post = {
                      _id: fullPost._id,
                      userId: fullPost.userId,
                      preview: fullPost.preview,
                      title: fullPost.title,
                      content: fullPost.content,
                      date: fullPost.date,
                      postAvatar: avatar
                    };
                    resolvePost(post);
                  });
                });
              });
              postsPromises.push(postPr);
            });

            Promise.all(postsPromises)
              .then(posts => resolveSubscription(posts));
          });
        });

        subscriptionPromises.push(subscriptionPr);
      });

      Promise.all(subscriptionPromises)
      .then(result => {
          let feed = [];
          result.forEach(feedPerUser => {
            feed = [...feed, ...feedPerUser];
          });

          res.status(200).send(feed);
        });
    });
  }
};
