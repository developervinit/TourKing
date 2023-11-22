//here functions are being exporeted to viewRoutes.js file

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');


exports.getOverview = catchAsync(async (req, res, next) => {
    //get tour data from collection 
    const tours = await Tour.find();

    //build template (we built the template in overview.pug file)

    //render that template using tur data from step 1.
    //in 'render()' 1st argumnt is 'overview.pug' file & 2nd is 'object' to send tours data to overview.pug 
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    //1) get the data for the requested tour(including reviews and guide)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return  next(new AppError('There is no tour with that name', 404));
    }
    //2) build template

    //3) render template using data from step 1
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});


exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    });
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
};


exports.getMyTours = catchAsync(async (req, res, next) => {
    //1) find all bookings 
    const bookings = await Booking.find({ user: req.user.id });

    //2) find tour with the returned IDs
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
    req.user.id,     
    {
        name: req.body.name,
        email: req.body.email
    },
    {
        new: true,
        runValidators: true
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser
});
});