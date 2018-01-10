const { app, db } = require('./app.js');

app.get('/', async (req, res) => {
  let text = await Promise.resolve('Hello, world');
  res.send(text);
});