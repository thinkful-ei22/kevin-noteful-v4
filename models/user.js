'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema ({
  fullname: {type: String},
  username: {type: String, required: true, unique: true},
  password: {type: String, require: true}
});

userSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.password;
  }
});

userSchema.methods.validatePassword = function(pass){
  return bcrypt.compare(pass, this.password);
//   return pass === this.password;
};

userSchema.statics.hashPassword = function(pass){
  return bcrypt.hash(pass, 10);
};

module.exports = mongoose.model('User', userSchema);