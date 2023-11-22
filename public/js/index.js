//this file is taking data from userinterface and dalegate the action 

import '@babel/polyfill';
import { displayMap } from './mapbox';
//importing login functionality from index.js file. this 'import' syntax belongs to es6
import { login, logout } from './login'
import { updateSettings } from './updateSettings'
import { bookTour } from './stripe'


//selecting DOM Element 
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//delegation
//getting location data from tour.pug file through trick please watch the video
if(mapBox){
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if(loginForm){
      loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      login(email, password);
    }); 
}

if(logOutBtn) logOutBtn.addEventListener('click', logout);

if(userDataForm) userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData(); //multi form 
    form.append('name', document.getElementById('name').value);//appending new data(name) on multiform
    form.append('email', document.getElementById('email').value);//appending new data(email) on multiform
    form.append('photo', document.getElementById('photo').files[0]); ////appending new data(photo) on multiform
    console.log(form);

    updateSettings(form, 'data');
});

if(userPasswordForm) userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    //on clicking save password btn, btn's textContent will change to 'Upadating....'
    document.querySelector('.btn--save-password').textContent = 'Upadating....';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    //updateSettings() is awaited then further code will not block to execute. it is asynchronous way 
    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

    //when pass is upadated, btn's textContent will restore to 'Save Password'
    document.querySelector('.btn--save-password').textContent = 'Save Password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
});

if(bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing....'
        const { tourId } = e.target.dataset;
        bookTour(tourId); //bookTour function is in stripe.js
    });
