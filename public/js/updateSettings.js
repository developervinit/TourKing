import axios from 'axios';
import { showAlert } from './alert';

//exporting updateSettings from here to index.js. this 'export' syntax belongs to es6
export const updateSettings = async (data, type) => {
    try{
        //accordin condition on type data will be updated on route 
        const url = type === 'password'
         ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword' 
         : 'http://127.0.0.1:3000/api/v1/users/updateMe'

        const res = await axios({
        method: 'PATCH',
        url,
        data
    });

    if(res.data.status === 'success') {
        showAlert('success', `${type.toUpperCase()} Data updated successfully!`);
    }

    }catch(err){
        showAlert('error', err.response.data.message);
    }
  
};