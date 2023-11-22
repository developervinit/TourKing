//all route handller functions are in this file(module) and we exporting them to userRoutes.js file
//here we used 'exports' sevral times becoz we have to export them separatly not as one file 

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');


//multer storage to store the img file, we comented all it bcoz we saving photo in buffer before resize
//const multerStorsge = multer.diskStorage({
//    destination: (req, file, cb) => {
 //       cb(null, 'public/img/users'); //null defines that there is no error
  //  },
  //  filename: (req, file, cb) => {
   //     const ext = file.mimetype.split('/')[1];
    //    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); //null defines that there is no error
    //}
//});

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

//middleware for multer 
exports.uploadUserPhoto = upload.single('photo');



//resizing user photo
exports.resizeUserPhoto = async (req, res, next) => {
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

    next();
}



//filterObj() is called updateMe() function below and filtering the inputs
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};

    //Object.keys loop through obj(incoming value) and returning array
    Object.keys(obj).forEach(el => {  
        if(allowedFields.includes(el)) newObj[el] = obj[el]; //if allowedFields inculdes el's values then
    });
    return newObj;
};




exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'Error',
        message: 'This route is not yet defined!. please use signUp instead'
    });
};

//middleware running before getOne function. (see in the userRoutes)
//in url parameter which is a 'id', getMe it puts user id who is logged in
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

//user itself can update name and email address
exports.updateMe = catchAsync(async (req, res, next) => {
    

    //1. create error if user try to update password data 
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is not for passwordUpdate please use /updateMyPassword.', 401));
    }

    
    //2. filtered out unwanted fields names that are not alowed to be updated 
      //filterObj() filtering incoming data. only 'name' and 'email' can come through req.body.
      //filterObj() is definitioned above  
    const filterBody = filterObj(req.body, 'name', 'email');

    //saving the image name corresponding updated user name 
    if(req.file) filterBody.photo = req.file.filename;

    //3. update usere document
    const updateUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updateUser
        }
    });
});


//deleting(inactivating) the user. user deleting(inactivating) itself
//a query middleware function is also running in userModel.js file on find query 
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(200).json({
        status: 'success',
        data: null
    });
});

//User route handller funtions. getAll is defined in factoryhandller.js file 
exports.getAllUsers = factory.getAll(User); 

//getting user. getOne is defined in factoryhandller.js file 
exports.getUser = factory.getOne(User);

//it is to admin to update user data. handller factory function updating the user
//dont udate password with this  
exports.updateUser = factory.updateOne(User);

//administrator deleting the user. handller factory function deleting the user 
exports.deleteUser = factory.deleteOne(User);

