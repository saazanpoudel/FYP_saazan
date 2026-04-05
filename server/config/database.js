const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.error('Error: MONGODB_URI is not defined in the .env file');
      console.error('Please add MONGODB_URI=your_mongodb_connection_string to server/.env');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('\nPlease check your server/.env file:');
    console.error('1. Ensure MONGODB_URI is correct');
    console.error('2. Ensure your IP address is whitelisted in MongoDB Atlas');
    process.exit(1);
  }
};

module.exports = connectDB;

