const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');

// multiple image uploads to tours as images / imageCover
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

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// middleware for multiple uploads
exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

/*
upload multiple imgs to a single field
upload.array('images', 3);
*/

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  // cover image
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // tour images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, index) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;
      await sharp(req.files.images[index].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);

      req.body.images.push(fileName);
    })
  );
  // only reach here when all the promises are consumed & req.body.images is updated.
  next();
});
//////////   Testing json file ///////
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

//to check the validity of the id of the tour. - a param middleware.
//Only required to demo a middleware woriking & checking data credibility.
/*
exports.checkId = (req, res, next, val) => {
  console.log(`Tour id is : ${val}`);
  //   to convert the id string into number for comparision in find()
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'Invalid ID',
    });
  }
  next();
};
*/

//^^^to check the checkBody validity (req in body)- a param middleware
/*
exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price) {
    return res.status(400).json({
      status: 'failed',
      message: 'Missing name or price.',
    });
  }
  next();
};
*/

//////// API route handle functions ///////

exports.getAliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAvg,price';
  req.query.fields = 'name,price,ratingAvg,summary,difficulty';
  next();
};

exports.getTours = factory.getAll(Tour);

// exports.getTours = catchAsync(async (req, res, next) => {
// The query strings in use.

/*The find method gets an array of all the tours list.
    const tours = await Tour.find({
      duration: 5,
      difficulty: 'easy',
    });

    const tours = await Tour.find()
      .where('duration')
      .equals(5)
      .where('difficulty')
      .equals('easy');*/

// 1. Query Filtering
/*
const queryObj = { ...req.query };
const execludedFields = ['pages', 'sort', 'limit', 'fields'];
execludedFields.forEach((el) => delete queryObj[el]);
console.log(req.query, queryObj);
*/
//////^^^^^ 2. Advanced Filtering  ^^^^^^////
/*
let queryStr = JSON.stringify(queryObj);
queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
console.log(JSON.parse(queryStr));

{difficulty: 'easy', duration: {&gte: '5'}}

let query = Tour.find(JSON.parse(queryStr));
*/
////^^^^^^^ 3. Sorting ^^^^^^^^^////
/*
if (req.query.sort) {
  const sortBy = req.query.sort.split(',').join(' ');
  // console.log(sortBy);
  query = query.sort(sortBy);
} else {
  query = query.sort('-createdAt');
}
*/
///////^^^^^^^^^ 4. Field limiting   ^^^^^^^///////
/*
if (req.query.fields) {
  const fields = req.query.fields.split(',').join(' ');
  query = query.select(fields);
} else {
  query = query.select('-__v');
}
*/

// 5. Pagination >> page field gives page number & limit gives results/page.
// const page = req.query.page * 1 || 2;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;
// console.log(skip, page, limit);

// // ?page=2&limit=10 >> 1-10:page1, 11-20:page2
// query = query.skip(page).limit(limit);

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip >= numTours) throw new Error('This page does not exist!');
// }

//^^^^^^^^^ Execute query ^^^^^^^^^^////
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const tours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tour: tours,
//     },
//   });
// });

exports.getTour = factory.getOne(Tour, { path: 'reviews' });
/*
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');

  //^^^^^^^^^^^^^ populate the guide data into the tour data ^^^^^^^^^^^////
  const tour = await Tour.findById(req.params.id).populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetToken -passwordResetExpires',
  });
  // Tour.findOne((_id: req.params.id));

  if (!tour) {
    return next(new AppError('No tour found with the ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
*/

exports.createTour = factory.createOne(Tour);

// exports.createTour = catchAsync(async (req, res, next) => {
//   // const newTours = new Tour({});
//   // newTours.save();
//   const newTour = await Tour.create(req.body);

//   if (!newTour) {
//     return next(new AppError('No tour found with the ID', 404));
//   }

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });

exports.updateTour = factory.updateOne(Tour);

// exports.updateTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with the ID', 404));
//   }
//   res.status(200).json({
//     status: 'succes',
//     data: {
//       tour: tour,
//     },
//   });
// });

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with the ID', 404));
//   }
//   res.status(204).json({
//     status: 'succes',
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAvg: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$ratingAvg',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingQty' },
        avgRating: { $avg: '$ratingAvg' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  // console.log(stats);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// get the busiest month out of year to plan for business logic of an API
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: plan.length,
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // distance as radius conv into radians.
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError('Please provide latitude, longitude in format lat,lng', 400)
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // get multiplier for conversion to miles
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError('Please provide latitude, longitude in format lat,lng', 400)
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
