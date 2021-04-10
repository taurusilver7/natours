const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// creating jwt tokens in http only format.
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // sending a jwt as a browser cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove the password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

//// 1. SIGN-UP middleware.
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);

  /*
    const token = signToken(newUser._id);
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  */
});

//// 2. LOGIN middleware
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //   1. check email &^& password exists
  if (!email || !password) {
    return next(new AppError('Please provide a email & password', 400));
  }
  // 2.check user && password is correct
  const user = await User.findOne({ email }).select('+password');
  //   console.log(user);
  //   const correct = await user.correctPassword(password, user.password);

  //   use the user & correct to determine the existance of user.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //send token to client if everything is ok..
  createSendToken(user, 200, res);

  //   const token = signToken(user._id);
  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

//  5. a logout function to override the cookie in the browser with a same name w/o jwt to log out the user.
exports.logout = (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

//// 3. A middleware to protect the routes
exports.protect = catchAsync(async (req, res, next) => {
  //1. get token & check its existence
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  //   console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access', 401)
    );
  }

  //2. verification the token (jwt signature matching with test signature)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //3.check if user still exists..
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does not exist', 401)
    );
  }
  //4. check changes in password after jwt was issued. Another instance method.
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again', 401)
    );
  }

  // Grant access to the protected route.
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages in the website, with no errors.
exports.isLoggedIn = async (req, res, next) => {
  //1. get token & check its existence from the cookies
  if (req.cookies.jwt) {
    try {
      //2. verification the token (jwt signature matching with test signature)
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //3.check if user still exists..
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //4. check changes in password after jwt was issued. Another instance method.
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user. Grant access to the template.
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  // if no token in cookie exists, no user is logged in & move fwd to next mdlwr.
  next();
};

//// 4. A authorized function to restrict privilage to certain user type only.
// Deleting a tour is only accessed to only admin & lead-guide.
exports.restrictTo = (...roles) => (req, res, next) => {
  // roles is an array
  if (!roles.includes(req.user.role))
    next(new AppError('You do not have permission to perform the action', 403));
  next();
};

// forgotten password recovery step-1
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1.get user based info(email addrs) to post email
  const user = await User.findOne({ email: req.body.email });
  if (!user) next(new AppError('There is no user with the email address', 404));

  // 2.generate the random reset token. Another instance method
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3. Send it to the registered email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/reset-password/${resetToken}`;

    /*
    await Email({
      email: req.body.email,
      subject: 'Your password reset token. Valid only for 10mins.',
      message: message,
    });
    */
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email.',
    });
  } catch (error) {
    user.PasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email. Try again later', 500)
    );
  }
});

// forgotten password recovery step-2
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.Get user based info onthe token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2.if token isn't expired && user, set new password.
  if (!user) return next(new AppError('Token is expired or invalid', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.PasswordResetToken = undefined;
  user.PasswordResetExpires = undefined;

  await user.save();
  // 3.Update changePasswordAt property for the user
  // 4.Log the user in, send JWT
  createSendToken(user, 200, res);

  //   const token = signToken(user._id);
  //   res.status(200).json({
  //     status: 'success',
  //     token,
  //   });
});

// forgotten password recovery step-3
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1.Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if the posted current password is correct & met the conditions
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Your current password is wrong', 401));

  // 3. If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  // User.findByIdAndUpdate will not work as intended in the current scenario.

  // 4. Log user in, send the JWT for accessing the protected routes.
  createSendToken(user, 200, res);
});
