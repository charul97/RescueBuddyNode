/**
  * Libraries import
*/
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const fs = require('./')

/**
  * Files import
*/
const {mongoose} = require('./../db/mongoose');

/**
  * keys
*/
var privateKey = fs.readFileSync('./keys/private.key', 'utf8');
var publicKey = fs.readFileSync('./keys/public.key', 'utf8');

/**
  * Schema defination
*/
var UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
  },
  age:{
    type: String,
    minlength: 1,
  },
  gender:{
    type: String,
    minlength: 1
  },
  date: {
    type: Date,
    required: true,
    default: new Date(),
  },
  lon:{
    type: Number,
    required: true,
    minlength: 1
  },
  lat:{
    type: Number,
    required: true,
    minlength: 1
  },
  email: {
    type: String,
    minlength: 1,
    unique: true,
    trim: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid E-Mail'
    }
  },
  regDevice: {
    type: String,
  },
  contact: {
    type: String,
    required: true,
    unique: true,
    length: 10,
  },
  password: {
    type: String,
    minlength: 6,
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

UserSchema.methods.generateAuthToken = function () {
  var user = this;
  var access = 'auth';
  var signOptions = {
    algorithm:  "RS512"
  };
  var token = jwt.sign({_id: user._id.toHexString(), access}, privateKey, signOptions).toString();
  user.tokens.push({access, token});

  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.toJSON = function () {
  var user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ['_id', 'contact']);
};


UserSchema.methods.removeToken = function (token) {
  var user = this;

  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

UserSchema.statics.findByToken = function (token) {
  var User = this;
  var decoded;
  var verifyOptions={
    'algorithm': ["RSA256", "RSA512"];
  }
  try {
    decoded = jwt.verify(token, publicKey, verifyOptions);
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.findByCredentials = function (contact) {
  var User = this;
  return User.findOne({contact}).then((user) => {
    if (!user) {
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      // Use bcrypt.compare to compare password and user.password
      // bcrypt.compare(password, user.password, (err, res) => {
      //   if (res) {
      //     resolve(user);
      //   } else {
      //     reject();
      //   }
          resolve(user);
      });
    });
  });
};

// UserSchema.pre('save', function (next) {
//   var user = this;
//
//   if (user.isModified('password')) {
//     bcrypt.genSalt(10, (err, salt) => {
//       bcrypt.hash(user.password, salt, (err, hash) => {
//         user.password = hash;
//         next();
//       });
//     });
//   } else {
//     next();
//   }
// });

var User = mongoose.model('User', UserSchema);

module.exports = {User};
