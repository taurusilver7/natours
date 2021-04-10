// create an alert to display successful logging in
import '@babel/polyfill';

export const hideAlert = () => {
  const ele = document.querySelector('.alert');
  if (ele) ele.parentElement.removeChild(ele);
};

// type = 'success' or 'error'
export const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};
