import mongoose  from 'mongoose';


const userSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  }
});

module.exports = mongoose.model('User', userSchema);
