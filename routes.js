const { app } = require('./app');
const multer = require('multer');
const upload = multer();
const { users, posts, stuffs } = require('./controllers');
// const { URLSearchParams } = require('url');

// app.get('wss').on('connection', (ws, req) => {
//   const params = new URLSearchParams(req.url.slice(2));
//   const uid = params.get('uid');
//   ws.on('message', ({ data }) => {

//   })
// });


// app.use(users.jwtCheck);

// users
app.get('/api/outer-user-by-id', users.outerUserById);
app.get('/api/users-by-fragment', users.getUsersByFragment);
app.post('/api/user', users.postUser);
app.get('/api/user', users.getUser);
app.put('/api/user', users.putUser);
app.put('/api/avatar', upload.single('avatar'), users.putAvatar);
app.delete('/api/avatar', users.deleteAvatar);
app.get('/api/user-by-token', users.getUserByToken);
app.delete('/api/user', users.deleteUser);
app.post('/api/add-subscription', users.addSubscription);
app.get('/api/user-fragment-by-id', users.getUserFragmentById);
app.delete('/api/remove-subscription', users.removeSubscription);

// posts
app.post('/api/article', upload.fields([{ name: 'preview' }, { name: 'collection' }]), posts.postArticle);
app.get('/api/post-info-by-id', posts.getPostInfoById);
app.get('/api/post', posts.getArticle);
app.delete('/api/post', posts.deleteArticle);
app.put('/api/likes', posts.putLikes);

// stuffs
app.get('/api/user-avatar-by-post-id', stuffs.getUserAvatarByPostId);
app.get('/api/feed', stuffs.getFeed);