//all route handller functions are in this file(module) and we exporting them to tourRoutes.js file
//here we used 'exports' sevral times becoz we have to export them separatly not as one file 

/**removed fs module frome here becoz not using it in code **/

//importing from tour model file 
const Tour = require('../models/tourModel');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');


//to save image in buffer memmory 
const multerStorage = multer.memoryStorage();

//multer filter: checking uplaoded file is image or not.
const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image please upload only images.', 400), false);
    }
};


//uplaoded imges will be saved in storage created above and filtered 
const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter
 });

//when we have mix of images we use upload.fields()
exports.uploadTourImages = upload.fields([
     { name: 'imageCover', maxCount: 1 },
     { name: 'images', maxCount: 3 }
 ]);

//upload.single('image'); //when we have one image we use upload.single()
//upload.array('images', 5); //when we have multiplw images we use upload.array()

//middle ware to resize tour images 
exports.resizeTourImages =  catchAsync(async (req, res, next) => {

    if(!req.files.imageCover || !req.files.images) return next();

    // 1) cover image
    req.body.imageCover= `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
    
    //images
    req.body.images = [];
    
    await Promise.all( //promise.all awaiting all the promises then next() running 
        req.files.images.map(async (file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        
            await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);
        
            req.body.images.push(filename);
            })
    );
    
    console.log()
    next();
});

/*
//file reading through syncronous way 
//this file is for the testing purpose since it is COMMENTED OUT
const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'));
*/

/** we deleted 'checkId' middleware function from here bcoz mongodb check id itself if use wrong id **/


/** Check body middeleware function deleted from here **/


// 2)----ROUTE HANDLERS----

//middleware handler. it is prefilling the limit,sort,filds for /top-5-cheap url 
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingAverage,price';
    req.query.fields = 'name,price,ratingAverage,summery,difficulty';
    next();
}

//route handler for get request(callback function is a routhandler)
//getting tours with post method. and using handller factory function 
exports.getAllTours = factory.getAll(Tour);

//This is running as callback function in route wch is getting one ID
//path: 'reviews' is the value of populate  
exports.getTour = factory.getOne(Tour, { path: 'reviews'});

//creating tour with post method. and using handller factory function 
//Route handler for the Post request. With post request crearing new object with its new ID 
exports.createTour = factory.createOne(Tour);

//Upadating the data with 'patch' method. and using handller factory function  
exports.updateTour = factory.updateOne(Tour);

 //deleting the data with 'delete' method, and using handller factory function
exports.deleteTour = factory.deleteOne(Tour);



//aggregation pipeline 
exports.getTourStats =  catchAsync(async (req, res, next) => {
    
        const stats = await Tour.aggregate([
            {
                $match: { ratingsAverage: { $gte: 4.5 } }
            },
            {
                $group: {
                    _id: { $toUpper: '$difficulty'},
                    numTours: { $sum: 1 },
                    numRatings: { $sum: '$ratingsQuantity'},
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: { avgPrice: 1 }
            }

        ]);
        
        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });
    
});

//aggregation pipeline: unwinding ND PROJECTIN
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    
        const year = req.params.year * 1;

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {     //it will  result only from date 2021-01-01 to 2021-12-31 
                    startDates: {
                        $gte: new Date(`${year}-01-01`), //condition $gte
                        $lte: new Date(`${year}-12-01`) //condition $lte 
                    }   
                     
                }
            },
            {
                $group: {
                   _id: { $month: '$startDates' }, //showing month in number 
                   numTourStarts: {$sum: 1}, //showing number of tours
                   tours: {$push: '$name'}, //showing tour's name $push creates array 
                   
                }
            },
            {
                $addFields: { month: '$_id' }
            },
            {
                $project: { // to hide _id field  
                    _id: 0
                }
            },
            {
                $sort: { numTourStarts: -1 }// sorting in decending order
            },
            {
                $limit: 12 //it limit to show only 12 results(tours)
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                plan
            }
        });

    
});

//geospatial queries: finding tours with in radius 
exports.getToursWithin = async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');

    //convertion into radiance. if unit === miles then 'distance / 3963.2', if in km then 'distance / 6378.1' 
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; 

    if(!lat || !lng){
        next(new AppError('Please provide lattitude and longitue in format lat,lng', 400));
    }
    
    const tours = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });
     

    //console.log(distance, lat, lng, unit);
    
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
        
    });
};

//geospatioal aggregation: calculating distances to tours from point 
exports.getDistance = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [ lat, lng ] = latlng.split(',');

    //if unit's value in miles then 0.000621371(i meter in miles) otherwise 0.001
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

    if(!lat || !lng){
        next(new AppError('Please provide lattitude and longitue in format lat,lng', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type:'point', 
                    coordinates: [lng * 1, lat * 1]
            },
            distanceField: 'distance',
            distanceMultiplier: multiplier
            } 
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
        
    });

})