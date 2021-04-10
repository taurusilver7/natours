## Natours

> A tour details web-api created using node-js, express-js as web-server
> The database used is mongodb with mongoose as ODM.

> The node project follows the MVC architecture.
> The model handles the business logic, the controller handles the app logic & view controls the presentation logic of the node application.

> The JSON web tokens issued by the server can be tested (here)[https://jwt.io/#debugger-io]

> The router carries the users, tours, reviews, bookings
> The controllers hold the respective handle functions to perform CRUD operations & other business logic controls.
> The view directory holds the template literals of the various end-points of the API.
> The models carry the basic architecture of the data-type they hold & inter-data relations.

## Dependencies && Dev Dependencies.

- axios, express
- database
  bcryptjs, mongoose
- env variable
  dotenv
- security header
  helmet, jsonwebtoken
- parsers
  cookie-parser, express-rate-limit
- create slugs -- slugify
- Dev logging -- morgan
- img upload -- multer
- e-mail sending
  nodemailer, html-to-text, sendgrid, mailsac
- template creation
  pug, sharp
- payments - stripe
- Sanitization & data pollutions
  strip, express-mongo-sanitize, validator, xss-clean, hpp

- The API documentation is published [here](https://documenter.getpostman.com/view/13840071/TzCMdTRY)
