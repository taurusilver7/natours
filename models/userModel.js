const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// name, email, photo, password, confirmPassword.

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name to the user.'],
  },
  email: {
    type: String,
    require: [true, 'Please provide a email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please create a strong password.'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm the password'],
    select: false,
    validate: {
      // This only works on save when creating a user.
      validator: function (ele) {
        return ele === this.password;
      },
      message: 'Passwords are not the same.',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

///////////// MIDDLEWARES   //////////////////////
// Encrypt the password

userSchema.pre('save', async function (next) {
  // only run if password was modified.
  if (!this.isModified('password')) return next();

  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //to avoid the passwordConfirm to not persist to the database after saving the user.
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  // saving to database is a lil' slow than issuing jwt. The timestamps shouldn't alter in protect(), so the -1sec hack.
  next();
});

// filter out the find() with active status
userSchema.pre(/^find/, function (next) {
  // this points to the current query. filter out all active:false out of search
  this.find({ active: { $ne: false } });
  next();
});

//////////////  INSTANCE METHODS  /////////////////////

// the correctPassword method takes in w/o hashed password, hashed password as argument.
userSchema.methods.correctPassword = async function (
  candidPassword,
  userPassword
) {
  return await bcrypt.compare(candidPassword, userPassword);
};

// Another instance method to get the changes in passwords after logging in.
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  //false means password not changed.
  return false;
};

// instance method to get a password reset token
userSchema.methods.generatePasswordResetToken = function () {
  // it access like a pswrd, to change pswrd. never store a token in database as plain text. encrypted to avoid hackers.
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log(
  //   { resetToken },
  //   this.passwordResetToken,
  //   this.passwordResetExpires
  // );

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // the token expires in 10mins.
  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
