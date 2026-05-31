const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Package = require('./models/Package');
require('dotenv').config({ path: './.env' });

async function runTest() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyp');
    console.log('Connected!');

    // Find a guide and a tourist to test
    const guide = await User.findOne({ role: 'guide' });
    const tourist = await User.findOne({ role: 'tourist' });

    if (guide) {
      console.log(`Found Guide: ${guide.name} (${guide._id})`);
      const userId = guide._id;
      
      console.log('Running Guide queries...');
      const [bookings, packages, stats, monthly] = await Promise.all([
        Booking.find({ guide: userId }).populate('tourist', 'name email avatar').populate('package', 'name').sort({ createdAt: -1 }),
        Package.find({ guide: userId }),
        Booking.aggregate([
          { 
            $match: { 
              guide: userId, 
              status: { $in: ['confirmed', 'completed'] },
              paymentStatus: 'paid'
            } 
          },
          { 
            $group: { 
              _id: null, 
              gross: { $sum: '$totalAmount' },
              net: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } } 
            } 
          }
        ]),
        Booking.aggregate([
          {
            $match: {
              guide: userId,
              status: { $in: ['confirmed', 'completed'] },
              paymentStatus: 'paid',
            },
          },
          {
            $group: {
              _id: {
                month: { $month: '$createdAt' },
                year: { $year: '$createdAt' },
              },
              total: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } }
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ])
      ]);

      console.log('Guide Queries Succeeded!');
      console.log('Stats:', stats);
      console.log('Monthly:', monthly);
    } else {
      console.log('No guide found in DB.');
    }

    if (tourist) {
      console.log(`Found Tourist: ${tourist.name} (${tourist._id})`);
      const userId = tourist._id;

      console.log('Running Tourist queries...');
      const bookings = await Booking.find({ tourist: userId })
        .populate('guide', 'name email avatar')
        .populate('package', 'name')
        .sort({ createdAt: -1 });
      
      const totalSpent = bookings.reduce((acc, b) => acc + (b.paymentStatus === 'paid' ? b.totalAmount : 0), 0);
      console.log('Tourist Queries Succeeded!');
      console.log(`Total Spent: ${totalSpent}`);
    } else {
      console.log('No tourist found in DB.');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

runTest();
