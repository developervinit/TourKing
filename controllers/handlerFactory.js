//this file containing handler factory function which is returning a function 

const catchAsync = require("../utils/catchAsync");
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

//handler factory function for deleting 
exports.deleteOne = Model => catchAsync(async (req, res, next) => {

    //saving result in doc var becoz we are using genereting error just below 
    const doc = await Model.findByIdAndDelete(req.params.id);

    //it will produce error if we find doc with id and that tour does not exist. 
    if(!doc){
        return next(new AppError('No document found with that ID', 404));
    }

res.status(204).json({
    status: 'success',
    data: null
});
})

//handler factory function for updating review, tour, and user 
exports.updateOne = Model => catchAsync(async (req, res, next) => {
    
    
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if(!doc){
        return next(new AppError('No tour found with that ID', 404))
    }
   
        res.status(200).json({
        status: 'success',
        data: {
            data: doc
        } 
     });
    
});

//handler factory function for crating tour, review  
exports.createOne = Model => catchAsync(async (req, res, next) => {

    //1st way of putting data into datbase 
    //const newTour = new Tour({});
    //newTour.save();

    //2nd way of putting data into database 
    const doc = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: { 
            data: doc
         }
    });
    
});

////handler factory function for getting tour, review and user 
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate('popOptions');
    const doc = await query;


    if(!doc){
        return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});


exports.getAll = (Model) => catchAsync(async (req, res, next) => { 
    
    //To allow for nested GET reviews on tour (it is a hack)
    let filter = {}; //empty object
    if(req.params.tourId) filter = { tour: req.params.tourId }; //finding review on tourId
    
    //inctace is created of class(APIFeatures) and doing method chaining
    //all methods are coming from apiFeatures file in utils folder 
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(); 

    //const doc = await features.query.explain();
    const doc = await features.query;

    //send response
    res.status(200).json({      //jsend format
        status: 'Success',
        results: doc.length,
        data: {
            data: doc
        }
     }); 
    

});