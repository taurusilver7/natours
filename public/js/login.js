/*eslint-disable */
import axios from 'axios';
import '@babel/polyfill';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  // console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully.');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    // console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// export const logout = async () => {
//   try {
//     console.log('Logout initiated');
//     const res = await axios({
//       method: 'GET',
//       url: 'http://localhost:8000/api/v1/users/logout',
//     });
//     if (res.data.status === 'success') location.reload(true);
//   } catch (error) {
//     console.log(error.response);
//     showAlert('error', 'Error logging out. Try again');
//   }
// };

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    // Tried res.data.status & res.data.message.
    if ((res.data.message = 'success')) location.reload();
  } catch (err) {
    // console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
