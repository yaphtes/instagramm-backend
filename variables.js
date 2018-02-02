const path = require('path');
const uploads = path.resolve(__dirname, 'uploads');

module.exports = {
  uploads,
  makeSignature() {
    return String(Math.random()).slice(3, 8).split('').reverse().join('');
  }
};
