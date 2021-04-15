/* eslint - disable */
/* the payment process on the front end, issued from the tour.pug
The downloaded script exposes a stripe object to the global scope 
*/

import axios from 'axios';
import { showAlert } from './alerts';

// stripe publish key for front-wend
export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(process.env.STRIPE_PUBLIC_KEY);
    // 1. get checkout session from end-point/api
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2. create a checkout-form + process(charge crdt card) using stripe object
    return await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
