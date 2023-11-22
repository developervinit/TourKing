//fs module to read file 
const fs = require('fs');
//mongose driver to manipulate mongoDB database 
var mongoose = require('mongoose');
//for enviroment variable 
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

//setting environment var path in config.env file 
dotenv.config({ path: './config.env' });




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

//Read json file 
//JSON.parse converting json file into js object
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));


//Importing all data from db
const importData = async () => {
    try{
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log('Data sucessfuly loaded');
    }catch (err){
        console.log(err);
    }
    process.exit();
};

//Deleting all database 
const deleteData = async () => {
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfulsy deleted');
    }catch (err){
        console.log(err);
    }
    process.exit();
};

if(process.argv[2] === '--import') {
    importData();
}else if(process.argv[2] === '--delete') {
    deleteData();
}

