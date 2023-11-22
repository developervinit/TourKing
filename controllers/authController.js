const crypto = require('crypto');
const { promisify } = require('util'); //destructuring 
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

//creating token for sending response to client in login function in this file below
const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    }); 
}

//this function is for response and being called in everyfunction below to give response 
const createSendToken = (user, statusCodde, res) => {
    const token = signToken(user._id);

    //variable for res.cookie's third option which is cookieOptions
    const cookieOptions = {
        //cookie will expire in 90 days
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    
        httpOnly: true //stops cross site scripting attacks 
    }

    //only in production mode secure=true will run 
    //'secure = true' it means cookie only be sent in encrypt connection(only run in https) 
    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions) //cookie taking three perameters 

    //remove the password from output as response in postman 
    user.password = undefined;

    res.status(statusCodde).json({  //sending response to user
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signUp = catchAsync(async (req,res, next) => {
     //creating new user 
    const newUser = await User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcom();

    //calling the signToken() fun to create token 
    createSendToken(newUser, 201, res); //createSendToken() is defined above 
});


exports.logIn = catchAsync(async (req, res, next) => {
    const { email, password } = req.body; //destructuring

    //1. check if email and password exist
    if(!email || !password){
        return next( new AppError('Please provide email and password!s', 400));
    } 

    //2. check if user exist and password is correct 
    //findtOne() is checking if incoming email exist in data base or not 
    const user = await User.findOne({ email }).select('+password'); // User.findOne({email: email })
    
                       
    if(!user || !(await user.correctPassword(password, user.password))){  //calling correctPassword()
        return next( new AppError('Incorrect email or password', 401));
    }

    
    //3. if everything ok, send token to client
    createSendToken(user, 200, res); //createSendToken() is defined above 
    
});

//logging out the user. to logout sending empty jwt token
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({status: 'success'});
};

// it is to give logged in users access to protected routes
exports.protect = catchAsync(async (req, res, next) => {
    //1) getting token and check of it's there 
    let token;
    if(
        req.headers.authorization && req.headers.authorization.startsWith('Bearer')
        ) {
        token = req.headers.authorization.split(' ')[1]; //getting token value 
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if(!token){
        return next(new AppError('You are not logged in! please log in to get access.', 401));
    }

    //2) verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('The user belonging to this Token does no longer exist', 401));
    }

    //4) check if user change password after the token was issued
    if(currentUser.changePasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }

    //grant access to protected route 
    //current role of user
    req.user = currentUser; //putting entire user data on the request
    res.locals.user = currentUser;
    next();
});


//only for the rendered pages 
exports.isLoggedIn = async (req, res, next) => {
    
    if (req.cookies.jwt) {
        try{
            //1) verify the token
    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

    //2) check if user still exists
    const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next();
    }

    //3) check if user change password after the token was issued
    if(currentUser.changePasswordAfter(decoded.iat)) {
        return next();
    }

    //4)there is a logged in user
    res.locals.user = currentUser; //res.locals is accessable by any pug template. it is like global var 
    return next();
        
   }catch(err){
       return next();
   }
    
  }
  next();
};



//authorising 'admin' and 'lead-guide' to delete tour 
//miidleware function can not have arguments since we use rest perameter(...roles)
//then closure funtion accessing rest perameters value as arguments 
exports.restrictTo = (...roles) => {
    return (req, res, next) => {    //this is closure function 
        //'req.user.role' is current role of user coming from exports.protect fun
        if (!roles.includes(req.user.role)){ 
            return next(new AppError('Yo do not have permission to perform this action', 404));
        }
        next();
    };
    
};

//functionality for forgotPassword 
exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1. get user based on posted email

    const user = await User.findOne({ email: req.body.email }); //checking email existance in database 
    if(!user){
        return next(new AppError('there is no user with this email address.', 404));
    }
     
    //2. generate the random reset token (it will be instance method in 'userModel.js')
    const resetToken = user.createPasswordResetToken(); //calling createPasswordResetToken() function
    await user.save({ validateBeforeSave: false });//all validation(in database schema) will be false  

    //3. send it to user email
    try{
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending an email, Try again later', 500));

    }
    
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    //1. get userbased on the token 
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');//encryptin token

    
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });//getting user's token and checking if token is expired 
     
    //2. if token has not expired, and there is user, set the new password 
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400));
    }
    //taking values from body 
    user.password = req.body.password; 
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined; 
    await user.save();

    //3. update changePasswordAt property for the user
      //third step is in userModel.js file as pre middleware function 

    //4. log the user in, send JWT
    createSendToken(user, 200, res); //createSendToken() is defined above 
});


exports.updatePassword = catchAsync(async (req, res, next) => {
    //1. get user from collection 
    const user = await User.findById(req.user.id).select('+password');

    //2. check if posted current password is correct 
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
       return next(new AppError('Your current password is wrong', 401));
    }

    //3. if posted current password is correct then update password 
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //4. log user in, send JWT token 
    createSendToken(user, 200, res); //createSendToken() is defined above 
});