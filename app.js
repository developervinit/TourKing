//This is app.js file receiving request from the client depending on the route 



//importing express module in 'express' variable in this file 
const path = require('path');
const express = require('express');
//Requiring module for middleware
const morgan = require('morgan');
const cors = require("cors");

//requiring a modules created by us 
const AppError = require('./utils/appError');
const globalErrorHandller = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const cookieParser = require('cookie-parser');

//to test git repository 

//express is a function which upon calling will add bunch of methods to our app variable
const app = express();



app.use(cors({ origin: "*" }))

//setting the view-engine in express. here view-engine is pug.
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1)----GLOBAL MIDDLEWARES----
//serving static file 
app.use(express.static(path.join(__dirname, 'public')));

//set security http headers
app.use(helmet());

//development logging 
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//it is limiting incoming request from user 
const limiter = rateLimit({
    max: 100, //100 req from same ip in 1 hour 
    windowMs: 60 * 60 * 1000,  //this denotes 1 hour 
    message: 'Too many request from this IP, please try again in an hour!'//error message 
});

//limiter miidleware will apply only the route which star with '/api'
app.use('/api', limiter);

//body parser, reading data from the body into req.body
//limit: '10kb' - data more then 10kb can not come from body 
app.use(express.json( { limit: '10kb'})); 
//parsing the data coming from url-encoded form which is in account.pug
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//parsing the data from cookie 
app.use(cookieParser());

//data sanitization against NoSQL query injection
app.use(mongoSanitize()); 

//data sanitization against (xss)cross-site scripting attacks 
app.use(xss());

//prevent perameter pollution 
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']  
}));




//Defining our own middleware. it is test middleware 
app.use((req, res, next) => {
    //'req.requestTime' is a property and 'toISOString()' to convert Date into readable form
    req.requestTime = new Date().toISOString();
    //console.log(req.cookies);
    next();
})


//defining the routes with express
//When someone hits the url('/') with get request then the second argument which is callback function will execute which have two arguments req and res.
//status(200) showing the status  
//  app.get('/', (req, res) => {
//    res.status(200)
//    .json({ message: 'Hi this is from server in json', app: 'natours' });
    
//  });

//  app.post('/', (req, res) => {
//    res.send('Now you can post to this endpoint...');
//  })





//We have refactor all these routes through app.route and brought them in compact way 
//app.get('/api/v1/tours', getAllTours);
//app.get('/api/v1/tours/:id', getTour);
//app.post('/api/v1/tours', createTour);
//app.patch('/api/v1/tours/:id', updateTour);
//app.delete('/api/v1/tours/:id', deleteTour);


// 3)----ROUTES----


//these two routers(tourRouter & userRouter) are actually middleware 
//we are mounting routers here (please watch the video 62, 63)
app.use('/', viewRouter); //added after wards 
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
//on this '/api/v1/review' path this 'reviewRouter' middleware(or file) will run
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);   


//route handler to handle undefined routes 
//AppError is a class created by us getting values 
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
//error handling middleware(globalErrorHandller) importing from errorController.js file to show error 
app.use(globalErrorHandller);

//Exporting app var which is getting express module functionality
module.exports = app;