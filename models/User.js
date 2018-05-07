const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  gender: { type: String, default: 'none' },
  hash: { type: String, required: true },
  avatar: { type: String, default: '' },
  mySubscriptions: [{
    _id: { type: ObjectId, required: true },
    username: { type: String, required: true },
    firstname: String,
    lastname: String,
    avatar: String
  }],
  subscribers: [{
    _id: { type: ObjectId, required: true },
    username: { type: String, required: true },
    firstname: String,
    lastname: String,
    avatar: String
  }],
  firstname: { type: String, default: '' },
  posts: [{
    _id: ObjectId,
    date: Date,
    title: String,
    content: String,
    userId: ObjectId,
    preview: String
  }],
  lastname: { type: String, default: '' },
  about: String
});

userSchema.methods.updateSubs = function(puttingData) {
  const myId = this._id.toString();
  return new Promise((resolve, reject) => {
    let promises = [];
    this.subscribers.forEach(subscriber => {
      const subscriberId = subscriber._id.toString();
      const pr = new Promise(resolve => {
        this.model('User').findById(subscriberId, (err, subscriber) => {
          if (err) throw err;
          const data = puttingData ? puttingData : {
            _id: myId,
            username: this.username,
            firstname: this.firstname || '',
            lastname: this.lastname || '',
            avatar: this.avatar || ''
          };

          const update = {
            subscribers: [ ...subscriber.subscribers.filter(item => item._id.toString() !== myId), data ],
            mySubscriptions: [ ...subscriber.mySubscriptions.filter(item => item._id.toString() !== myId), data ]
          };

          this.model('User').findByIdAndUpdate(subscriber, update, { new: true }, err => {
            if (err) throw err;
            resolve();
          });
        });
      });
      promises.push(pr);
    });

    Promise.all(promises).then(() => resolve(this));
  });
};

// оптимизировать, если будут пользоваться много людей
userSchema.methods.updateCommentsItems = function({ avatar, username }) {
  const myId = this._id.toString();
  let promises = [];
  return new Promise(resolve => {
    this.model('Post').find({}, (err, posts) => {
      if (err) throw err;
  
      posts.forEach(post => {
        const pr = new Promise(resolve => {
          const comments = post.comments;
          const postId = post._id.toString();
          if (comments.find(comment => comment.userId.toString() === myId)) {
            const update = {
              comments: comments.map(comment => {
                if (avatar || avatar === '') comment.avatar = avatar;
                if (username) comment.username = username;
                return comment;
              })
            };
  
            this.model('Post').findByIdAndUpdate(postId, update, err => {
              if (err) throw err;
              resolve();
            });
          } else {
            resolve();
          }
        });
        promises.push(pr);
      });
    });

    Promise.all(promises).then(() => resolve());
  });
};

module.exports = mongoose.model('User', userSchema);
