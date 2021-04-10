/* eslint-disable */
// update the user data calling the API from the front-end
/* create a funciton to update the data, call the function from the index.js.*/

import axios from 'axios';
import { showAlert } from './alerts';

// type is password or data..
export const updateSettings = async (data, type) => {
  try {
    //   use a terinary to determine the data type.
    const url =
      type === 'password'
        ? '/api/v1/users/update-password'
        : '/api/v1/users/update-me';
    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });

    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
