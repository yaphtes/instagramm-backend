const { app } = require('./app');
const multer = require('multer');
const upload = multer();
const { users, posts } = require('./controllers');

// app.use(users.jwtCheck);

// users
app.post('/api/user', users.postUser);
app.get('/api/user', users.getUser);
app.put('/api/user', users.putUser);
app.put('/api/avatar', upload.single('avatar'), users.putAvatar);
app.delete('/api/avatar', users.deleteAvatar);
app.get('/api/user-by-token', users.getUserByToken);

// posts
app.post('/api/article', upload.fields([{ name: 'preview' }, { name: 'collection'}]), posts.postArticle);
app.get('/api/post-preview', posts.getArticlePreview);
app.get('/api/post', posts.getArticle);
app.delete('/api/post', posts.deleteArticle);