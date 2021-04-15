/* eslint - disable */
// create an alert to display successful logging in

export const hideAlert = () => {
  const ele = document.querySelector('.alert');
  if (ele) ele.parentElement.removeChild(ele);
};

// type = 'success' or 'error'
export const showAlert = (type, msg, time = 7) => {
  hideAlert();
  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, time * 1000);
};
