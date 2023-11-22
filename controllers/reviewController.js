const Review = require('../models/reviewModel');
//const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');





//it is ruuning before the createreview() funtion. we added it in the ReviewRoute before createreview() funtion
exports.setTourUserIds = (req, res, next) => {
    //allow nested route 
    if(!req.body.tour) req.body.tour = req.params.tourId; //nested route
    if(!req.body.user) req.body.user = req.user.id; //nested route
    next();
}

//getting all reviews from review data set in mongodb. getAll is defined in factoryhandller.js file 
exports.getAllReviews = factory.getAll(Review);

//getting review. getOne is defined in factoryhandller.js file 
exports.getReview = factory.getOne(Review);

//creating reviews from data coming from req.body. createOne is defined in factoryhandller.js file  
exports.createReview = factory.createOne(Review);

//updating review using handller factory funtion. updateOne is defined in factoryhandller.js file    
exports.updateReview = factory.updateOne(Review);

//deleting review using handller factory funtion deleteOne is defined in factoryhandller.js file 
exports.deleteReview = factory.deleteOne(Review);