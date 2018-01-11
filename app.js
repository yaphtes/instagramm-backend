const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const formidable = require('formidable');
const morgan = require('morgan');
const mongoose = require('mongoose');
const app = express();

app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.Promise = global.Promise;
mongoose.connect(config.mongoose.uri, { useMongoClient: true });
mongoose.connection.on('error', () => console.log('connection error'));
mongoose.connection.once('open', () => {
  require('./routes');
  app.listen(3000);
});