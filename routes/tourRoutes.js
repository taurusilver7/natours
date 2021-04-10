const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');
const reviewRoutes = require('./reviewRoutes');

// sub-application router //
const router = express.Router();

// eslint-disable-next-line prettier/prettier
// param-middleware - to check the validity of the id

// router.param('id', tourController.checkId);

// param-middleware :- checkBody middleware
// router
//   .route('/')
//   .get(tourController.getTours)
//   .post(tourController.checkBody, tourController.createTour);

////// API routes //////

// POST /tour/tourId/review
// GET /tour/tourId/review
// GET /tour/tourId/review/reviewId

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

// ^^^  Redirecting to reviewRouter ^^^^
router.use('/:tourId/reviews', reviewRoutes);

router
  .route('/top-5-tours')
  .get(tourController.getAliasTopTours, tourController.getTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistance);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/')
  .get(tourController.getTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
