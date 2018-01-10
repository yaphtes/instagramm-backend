const express = require('express');
const bodyParser = require('body-parser');
const formidable = require('formidable');
const morgan = require('morgan');
const app = express();
const { MongoClient } = require('mongodb');

app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

MongoClient.connect('mongodb://localhost:27017/instagramm', (err, db) => {
  if (err) return console.log(err);
  module.exports = { app, db };
  console.log('Connected succesfully to mongodb server');
  require('./routes.js');
  app.listen(3000);
});