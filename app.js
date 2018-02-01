const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

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
db.on('error', () => console.log('connection error'));
db.once('open', () => {
  console.log('mongodb connected');
  require('./routes');
  app.listen(8000, () => console.log('express started'));
});

module.exports = { app, db };
