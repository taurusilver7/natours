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

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
};
const start = new Date();
console.log(`Connecting to Mongoose: ${start.toLocaleTimeString()}`);

const tm = (startTime, failVal) => {
  const end = new Date() - startTime;
  const fail = end <= failVal ? 'pass' : 'fail';
  return `${new Date().toLocaleTimeString()}: ${end
    .toString()
    .padStart(5, ' ')}ms: ${fail}`;
};

// console.log(process.env);

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(process.env.APPLICATION_CONNECTION_URL, options)
  .then(() => {
    // console.log(con.connection);
    console.log('DB connection was successful..', tm(start, 20000));
  });

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port: ${port}..`);
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

// handling sigterm signal to avoid abrupt application shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM RECIEVED. Shutting down gracefully.');
  server.close(() => {
    console.log('Process termianted!');
  });
});
