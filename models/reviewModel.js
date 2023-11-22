const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty!'] 
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            require: [true, 'Review must belong to a tour']
        },
    
    user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user!']
        },
    
  },
  {                             //this object for schema option 
    toJSON: {virtuals: true}, //to add virtual property in schema 
    toObject: {virtuals: true} //to add virtual property in schema 
});

//indexing to prevent duplicate review 
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//all of the queries starting with 'find' will then automatically populate the 'tour' and 'user fields.
//learn populate in 152 populate tour guide or see wht_i_learned5 
reviewSchema.pre(/^find/, function(next){
    //because of chain populate we turned off it. see in video 156
    //this.populate({
        //path: 'tour',
        //select: 'name' //only name will show in result 
    //}).populate({
        //path: 'user',
        //select: 'name photo' //only name and phot will show in result 
    //})

    this.populate({
        path: 'user',
        select: 'name photo' //only name and phot will show in result 
    })

  next();
});




//calculating 'ratingAverage' and 'ratingQuantity' of tourModel when create new review  
reviewSchema.statics.calcAverageRatings = async function(tourId){
    //'this' keyword targets to the current model which is reviewModel. calling aggregate() on model 
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: {$avg: '$rating'}
            }
        }
    ])
    
    //console.log(stats); 

    //when stats has no value which is review 
    if(stats.length > 0){
        await Tour.findByIdAndUpdate(tourId, {
         ratingsQuantity: stats[0].nRating,
         ratingsAverage: stats[0].avgRating
        });
    }else {
        await Tour.findByIdAndUpdate(tourId, {
         ratingsQuantity: 0,
         ratingsAverage: 4.5
        });
    }  
};


//this middleware is to call 'reviewSchema.statics.calcAverageRatings'. just above 
reviewSchema.post('save', function(){
    //'this' keyword points to the document currently being saved
    //'this' is the model and 'constructor' who created the model 
    this.constructor.calcAverageRatings(this.tour);
    
});

reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne(); //accessing the document 
    //console.log(this.r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function(){
    //await this.findOne(); does not work here bcoz query already executed.
    await this.r.constructor.calcAverageRatings(this.r.tour);
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

