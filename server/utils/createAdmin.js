const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'admin@sgms.com' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@sgms.com',
      password: 'admin123', // Change this password after first login!
      role: 'admin',
      isVerified: true,
      isActive: true,
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@sgms.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  createAdmin();
}

module.exports = createAdmin;

