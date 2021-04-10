// review / rating / createdAt / ref to tour / ref to user.

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty.'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      requirerd: [true, 'Review must belong to user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// index to avoid duplicating reviews. combined userId + tourId is always to be unique.
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Document middlewares >>> To populate data from ObjectId
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// A static method to calculate the avg rating % number.
reviewSchema.statics.calcAvgRating = async function (tourId) {
  // this keyword points to the current model.
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  // Make the avg rating persisting to the database.
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQty: stats[0].nRating,
      ratingAvg: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQty: 0,
      ratingAvg: 4.5,
    });
  }
};

// a middleware to call the static method above to cal avg rating when creating a review.
reviewSchema.post('save', function () {
  // this points to the current review

  // Review.calcAvgRating(this.tour);
  this.constructor.calcAvgRating(this.tour);
});

// a middleware to call static method to cal avg rating when updating/deleting a review.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // this points to the current review
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //this.r = await this.findOne(); DOES NOT work here, query has already executed.
  await this.r.constructor.calcAvgRating(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
