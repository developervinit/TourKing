const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

//mergeParams: true 
const router = express.Router({ mergeParams: true });

//this middleware apply on all below routers to authenticate them.
router.use(authController.protect)

//it is route for reviews and will be mount on api/reviews 
router.route('/')
.get(reviewController.getAllReviews)
.post( 
    authController.restrictTo('user'), 
    reviewController.setTourUserIds, 
    reviewController.createReview
    );

//route to delete review    
router.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
.delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);    

module.exports = router;

