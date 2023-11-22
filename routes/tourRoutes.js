//this file is creating route for tours resource


//Importing express module 
const express = require('express');
//Importing route handllers from tourController.js file 
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');


//this is part of the way creating route
const router = express.Router();

//commented out this becoz it was messy code for nested routing 
//nested route to create review 
//router.route('/:tourId/reviews')
//.post(
    //authController.protect, 
    //authController.restrictTo('user'), 
    //reviewController.createReview
    //);

//exporting this file tour route 
//We exports one thing since we used 'module.exports' 

router.use('/:tourId/reviews', reviewRouter);


//This is param middleware calling the 'checkId' from tourController.js file
//'id' is parameter for which it is gonna run
//not using it anymore since commented out   
//router.param('id', tourController.checkId);

//middleware for making alias 
//just hiting '127.0.0.1:3000/api/v1/tours/top-5-cheap' route in postman 'aliasTopTours' fun will run 
router.route('/top-5-cheap') 
.get(tourController.aliasTopTours, tourController.aliasTopTours);

router.route('/tour-stats').get(tourController.getTourStats);  

router.route('/monthly-plan/:year').get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

//route to find the tour within radius  
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

//route to find distance of all tours fron certain distance 
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistance);

router
.route('/')
.get(authController.protect, tourController.getAllTours)
.post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

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