//**** in this file we are creating session ****//

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //1)get currently booked tour
    const tour = await Tour.findById(req.params.tourId); 

    //2)create checkout session
    //information about the session itself
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'], //payment medium will be card
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, //when payment success then redirect url 
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,// on payment cancel redirect url
        customer_email: req.user.email, 
        client_reference_id: req.params.tourId, 
        //information about the product the user about to purchase 
        line_items: [  
            {
            name: `${tour.name} Tour`,
            description: tour.summery,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            amount: tour.price * 100,
            currency: 'usd',
            quantity: 1
            }
            
        ] 
    });

    //3)create session as response (sending back to the client)
    res.status(200).json({
        status: 'success',
        session
    });
});


exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // this is only temporary because it's unsecure. Everyone can make bookings without paying.
    const { tour, user, price } = req.query;

    if(!tour && !user && !price) return next();
    await Booking.create({tour, user, price});

    res.redirect(req.originalUrl.split('?')[0]);
});


exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

