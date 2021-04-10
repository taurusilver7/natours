const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
// const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');

// create a storage & filter to upload file at multer
/*
const multerStorage = multer.diskStorage({
  destination: (req, file, calbck) => {
    calbck(null, 'public/img/users');
  },
  filename: (req, file, calbck) => {
    const extsn = file.mimetype.split('/')[1];
    calbck(null, `user-${req.user._id}-${Date.now()}.${extsn}`);
  },
});
*/
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, calbck) => {
  // test if the uploaded file is image. (boolean)
  if (file.mimetype.startsWith('image')) {
    calbck(null, true);
  } else
    calbck(
      new AppError('Not an image! Please upload only images.', 400),
      false
    );
};

// upload feature: dest: where all the uploaded profile pic are saved.
// const upload = multer({ dest: 'public/img/users' });
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// a middleware to upload the images to the server
exports.uploadUserPhoto = upload.single('photo');

// a middleware to resize the image to get a square photo before displaying it as circle
exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;

  // sharp package for image resizing
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//////// API route handle functions ///////

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create an error if user posts password data
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates. Please use update-password',
        400
      )
    );
  // filteredBody is object which contains filtered non-sensitive data to update. name,email..,
  // sensitive data like passwordResetToken, role must never be handed to user to modify.
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;

  // 2. update user document.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// exports.getUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   res.status(500).json({
//     status: 'success',
//     result: users.length,
//     data: {
//       users,
//     },
//   });
// });

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'success',
//     message: 'This getUser route is not yet defined',
//   });
// };

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'success',
    message: 'This route is not defined! Please use /signup instead.',
  });
};

// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'success',
//     message: 'This updateUser route is not yet defined',
//   });
// };

// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'success',
//     message: 'This deleteUser route is not yet defined',
//   });
// };

exports.getUser = factory.getOne(User);
exports.getUsers = factory.getAll(User);

// Do Not update the password with this handle functions.
//findByIdAndUpdate calls off all the middlewares next to it. So password changing is impossible.
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
