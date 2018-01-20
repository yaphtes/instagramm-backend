const { app } = require('./app');
const { users } = require('./controllers');

app.post('/api/user', users.postUser);
app.get('/api/user', users.getUser);
app.put('/api/user', users.putUser);
app.put('/api/avatar', users.putAvatar);
app.get('/api/user-by-token', users.getUserByToken);