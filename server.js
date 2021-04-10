const mongoose = require('mongoose');
const dotenv = require('dotenv');

// All error / bugs occur in sync code but not handled anywhere are uncaught exceptions.
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

// console.log(process.env);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(process.env.APPLICATION_CONNECTION_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // console.log(con.connection);
    console.log('DB connection was successful..');
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port: ${port}`);
});

// handling unhandled promise rejection in the application.
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  // to avoid the aborting all programs (req currently runnin/pending) immediately
  server.close(() => {
    process.exit(1);
  });
});
