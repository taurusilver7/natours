const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

// schema for data recienved & sent to the database

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have <= 40 characters'],
      minlength: [10, 'A tour name must have >= 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters.'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a upper limit'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour needs a difficulty scale'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficylty is either easy, medium, diffcult',
      },
    },
    ratingAvg: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be > 1.0'],
      max: [5, 'Rating must be < 5.0'],
      set: (val) => Math.round(val * 10) / 10, //(4.6555 => 5) 46.66 => 47 , 4.7
    },
    ratingQty: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on new docs creation.
          return val < this.price;
        },
        message: 'Discont price ({VALUE}) should be below regualr price',
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          emn: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// creating index at most used field to improve the query performance speed.
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingAvg: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// a virtual property to get the tour duration in weeks. A vir.prop is a fields that doesn't get to stored in database.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate..
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document Middleware
// middleware called function b4 save command & .create() cmd.
tourSchema.pre('save', function (next) {
  // console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

/*
retrieve the documents corresponding to the ID >>> embedded technique.
tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next();
});
*/

/*
tourSchema.post('save', function (doc, next) {
  console.log(this);
  console.log(doc);
  next();
});
*/

// Query middleware
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// to populate data in the guide fields
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetToken -passwordResetExpires',
  });
  next();
});

/*
tourSchema.post(/^find/, function (doc, next) {
  console.log(`Query took ${Date.now() - this.start} ms `);
  // console.log(doc);
  next();
});
*/
/*
Aggregate middleware -- applies b4 / after a aggregate
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this);
  next();
});
*/

// mongoose model based on the schema to get/send data to db.
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
