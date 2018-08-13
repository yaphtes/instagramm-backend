const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const serverPort = 8000;


app.use(cors());
app.use(morgan('tiny'));
app.use(express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw({
  limit: 52428800,
  type: 'application/octet-stream'
}));

mongoose.connect(config.mongoose.uri);
const db = mongoose.connection;
db.on('error', () => console.log('mongodb error'));
db.once('open', () => {
  console.log('mongodb started');
  require('./routes');
  app.listen(serverPort, () => console.log('server started'));
});

module.exports = { app, db };
