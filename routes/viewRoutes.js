//all view routes are here and this file is bieng exported to app.js file 

const express = require('express');
const router = express.Router();
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');



//route for overview page 
router.get(
    '/', 
    bookingController.createBookingCheckout, 
    authController.isLoggedIn, 
    viewsController.getOverview); //this is the overview page 
//route for tour page 
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
//route for login
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

router.post('/submit-user-data', authController.protect, viewsController.updateUserData);



module.exports = router;