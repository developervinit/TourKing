//this file is creating route for users resource


const express = require('express');
//Importing route handllers from userController.js file 
const userController = require('../controllers/userController');
const authController = require('../controllers/authController')





//this is part of the way creating route
const router = express.Router();

//Routes for user
router.post('/signup', authController.signUp); //route for signup 
router.post('/login', authController.logIn); //route for login
router.get('/logout', authController.logout); //route for login 

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//this middleware apply on all below routers to authenticate them.
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

//this middleware apply on all below routers to restrict them only to admin.
router.use(authController.restrictTo('admin'));

router
.route('/')
.get(userController.getAllUsers)
.post(userController.createUser);

router
.route('/:id')
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);

//exporting this file user route
//We exports one thing since we used 'module.exports'  
module.exports = router;

