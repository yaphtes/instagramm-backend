const { app } = require('./app');
const { users } = require('./controllers');

app.post('/api/user', users.postUser);
app.get('/api/user', users.getUser);
app.get('/api/user-by-token', users.getUserByToken);