const express = require('express');

const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

// sub-application router //
const router = express.Router();

////// API routes //////

// Auth routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// forgot & reset passwords & update password & data
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// routes from this point are protected.
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);

/// ^^^ /me end-point for the retrieving user data ^^^ ///
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/update-me',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/delete-me', userController.deleteMe);

// rouutes from this point are restricted to only admin
router.use(authController.restrictTo('admin'));
// User Routes
router.route('/').get(userController.getUsers).post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
