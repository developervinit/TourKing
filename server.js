/** this is server.js file here we connecting database and starting server */

//mongose driver to manipulate mongoDB database 
var mongoose = require('mongoose');
//for enviroment variable 
const dotenv = require('dotenv');

//it should be above of all code to catch error
//catching uncaught exception
process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED EXCEPTION SHUTTING DOWN');
  process.exit(1)
});

//setting environment var path in config.env file 
dotenv.config({ path: './config.env' });
const app = require('./app');

//console.log(process.env);





//replacing <PASSWORD> placeholder with enviroment variable which has password and puting in DB var 
//DB is a connection string 
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

//connecting our app with database(mongoDB) using mongoose 
//passing connection string(DB) and options in object for dealing with deprecation warnings
//.then using to consume the promise
mongoose.connect(DB, {
    useNewUrlParser: true, 
    useCreateIndex: true, 
    useFindAndModify: false})
    .then(() => console.log('DB connection succesful'));
    
    

//creating 'testTour' which is the instance of Tour  
//const testTour = new Tour({
  //  name: 'The Park Camper',
    //price: 997,
    //
//});

//saving the testTour and thereafter consuming the promise using '.then' method promise is returning the 
//data which we saved, thereafter handling the error using '.catch'
//testTour.save().then(doc => {
  //  console.log(doc);
//}).catch(err => {
  //  console.log('ERROR :', err);
//});




//This will show all enviroment variable 
//console.log(process.env);

// 4)----STARTING THE SERVER----
//this is the express syntax of starting the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

//error outside express: handling unhandeled promise rejection
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION SHUTTING DOWN');
  server.close(() => {
    process.exit(1)
  });
});



