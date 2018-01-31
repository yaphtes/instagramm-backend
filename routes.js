const { app } = require('./app');
const { users } = require('./controllers');

app.use(users.jwtCheck);

app.post('/api/user', users.postUser);
app.get('/api/user', users.getUser);
app.put('/api/user', users.putUser);
app.put('/api/avatar', users.putAvatar);
app.delete('/api/avatar', users.deleteAvatar);
app.get('/api/user-by-token', users.getUserByToken);
app.post('/api/article', users.postArticle);