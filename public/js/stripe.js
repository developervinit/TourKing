import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe('pk_test_51Hev6NLgZUJ3DKG68LXkc220uscBYzM0GJ5kYhs4F1QR0YlcMBOMR0y2J2CSq1RXK8TIWPcB3sk7Br8ATsGIfyxX00plR6Sid8');


//when in tour.pug you click 'Book tour now!' btn then this 'tourId' function triggers 
export const bookTour = async tourId => {
    try{
        //1) get checkout session from api
    const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    //2) create checkout form + charge credit card
    await stripe.redirectToCheckout({
        sessionId: session.data.session.id
    }); 
    }catch(err){
        console.log(err);
        showAlert('error', err);
    }
    
}