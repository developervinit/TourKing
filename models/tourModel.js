/** this is tourModel file which is to create schema and model then diffining some pre and post middleware **/

//mongose driver to manipulate mongoDB database 
var mongoose = require('mongoose');
//this is to add slug in schema 
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel');



//Mongoose schema(describing it and doing validation) for our data  
const tourSchema = new mongoose.Schema(
    {               //this object is for schema defination
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A tour name must have less or equal then 40 cherechters'],
        minlength: [10, 'A tour name must have more or equal then 10 cherechters'],
        //validate: [validator.isAlpha, 'Tour name must only contain cherechter']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have group size']
    }, 
    difficulty: {
        type: String,
        required: [true, 'A tour must have difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 1.0'],
        set: val => Math.round(val * 10) / 10 //rounding value from 4.666666 to 4.7
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
            return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular value'
    }
        
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have cover image']
    },
    images:[String],
    createdAt: {
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {   //embeded object 
        //GeoJSON
        type: {
            type: String,
            default: 'Point', //defining geomatry in mongodb
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {type: mongoose.Schema.ObjectId,
        ref: 'User' //establish reference btwn different datasets in mogoose. not need to imoprt 'User'
        }
    ]   
},
{                             //this object for schema option 
    toJSON: {virtuals: true}, //to add virtual property in schema 
    toObject: {virtuals: true} //to add virtual property in schema 
}
);

//index to improve read performence
//tourSchema.index({price: 1});
//compound index
tourSchema.index({price: 1, ratingsAverage: -1 });
//index for tour slug
tourSchema.index({slug: 1});
//index geospecial data
tourSchema.index({ startLocation: '2dsphere' });

//defining virtual properties to schema
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

//virtual populate: populating the reviewModel in tourModel 
//this reviews in as first perameter will show in result as field 
tourSchema.virtual('reviews', {
    ref: 'Review',  //name of a model that we want to reference 
    //name of the field in reviewModel, it is a reference of tourModel stored in reviewModel as field 
    foreignField: 'tour', 
    //it is 'id' of current 'tourModel' stored in foreign 'reviewModel'.
    localField: '_id'
});

//pre document middleware & and 'save' is a hook. this middleware is called pre save hook & save is an event
tourSchema.pre('save', function(next) {
    //this.slug is a property, this.name is a string that we want to create slaug out of    
    //lower: true, is option to convert everything in lower case
    this.slug = slugify(this.name, { lower: true});
    next();
});

//including ids to the tourSchema in guides field. it only work for creating new doc not updting doc
//tourSchema.pre('save', async function(next){
    //const guidesPromises = this.guides.map(async id => User.findById(id));
    //this.guides = await Promise.all(guidesPromises);//awaitin promises of gudesPromise
    //next();
//}); 


//tourSchema.pre('save', function(next) {
  //  console.log('will save document...');
   // next();
//})

//post middleware 
//tourSchema.post('save', function(doc, next) {
  //  console.log(doc);
  //  next();
//});

//pre query middleware. it will not show the doc which field(secretTour) is set to true
// this is regex(/^find/).it means it will work on all query fun & model which start with 'find'
tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true }});

    this.start = Date.now();
    next();
});

//all of the queries staring with 'find' will then populate the 'guides' field with the referenced user.
//learn populate in 152 populate tour guide or see wht_i_learned5 
tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangeAt' //in output will display only -__v nad -passwordChangeAt 
    });
    next();
});

//post query middleware. it is calculting the time between pre and post middleware 
tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
    //console.log(docs);  //it is showing all tour documents
    next();
});



//Aggregation middleware
//'this' keyword will point to the aggegation object  
//tourSchema.pre('aggregate', function(next) {
 //   this.pipeline().unshift({ $match: { secretTour: { $ne: true }}})

    //console.log(this.pipeline());
    //next();
//});


//this is model from schema(tourSchema) to create document 
//Tour will become tours in mongodb database and will be a 'collection' and it will have documents
const Tour = mongoose.model('Tour', tourSchema);

//this file exporting to 'tourController' file 
module.exports = Tour; 