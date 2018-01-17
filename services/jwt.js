import { inspect } from 'util';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

class JWT {
  static instance;
  constructor() {
    // Singleton pattern
    if (typeof JWT.instance === 'object') return JWT.instance;
    JWT.instance = this;
  }

  use() {}

  check() {}

  getUserIdByToken(token) {}
}

const instance = new (JWT);
module.exports = instance;