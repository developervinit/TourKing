const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//creating userschema 
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tellus your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid emial']
    },
    photo: {
        type: String,
        default: 'default.jpg' 
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide the password'],
        minlength: 8,
        select: false // this will prevent password to show in results 
    },
    passwordConfirm:{
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            //this only works on SAVE()
            validator: function(el){
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
        
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false //it will not let the active field show in response 
    }
    
});

//pre middleware running befor save command 
userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next(); //if password field not modified thn fun wont run ahead 

    //hashing password and '12' is a cost perameter
    this.password = await bcrypt.hash(this.password, 12); 

    //deletig passwordConfrim field
    this.passwordConfirm = undefined; 
    next();
});

//pre middleware running before save command 
//running for resetPassword() fun in third step in authController.js file 
userSchema.pre('save', function(next){
    //if password is modified or if document is new then next() will return
    if(!this.isModified('password') || this.isNew) return next();

    //we minus - 1000 1 second to ensure that the token is always created after the pass has been changed 
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

//this queryMiidleware runig on query which starts from 'find'. '/^find/' - it means query start from 'find' word 
//it show only those user which active field are not set to false 
//it is running for deleteMe() function which is in userController.js file
userSchema.pre(/^find/, function(next){
    //this points to the current query 
    this.find({ active: { $ne: false }});
    next();
});

//intance method for comparing password when user login 
//this function is calling in authController.js file 
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
};

//comparing JWTTimestamp with passwordChangedAt
userSchema.methods.changePasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        //converting passwordChangedAt date format to timestamp format, 10 is a base 
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        console.log(changedTimeStamp, changedTimeStamp);
        //JWTTimestamp and changedTimeStamp both are time 
        //JWTTimestamp recorded when user was crated and changedTimeStamp recorded when user changed pass
        return JWTTimestamp < changedTimeStamp; //it means pass was changed
    }
    //false means passwordChangedAt not changed
    return false
}

//this is being called in authController.js file in exports.forgotPassword function
//intance method for reseting password when user forgot password.  
//using crypto module which is inbuilt in nodejs for random bytes function(normal encryption)  
userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex'); //creating token

    //'this.passwordResetToken' is a field in database
    this.passwordResetToken =  crypto.createHash('sha256').update(resetToken).digest('hex');//password rest token
    
    //creating expiration time. 'this.passwordResetExpires' is a field in database
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
};


//creating model out of userschema
const User = mongoose.model('User', userSchema);

//exporting it 
module.exports = User;

