const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

async function test() {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to SGMS Database');
        
        const guide = await User.findOne({ role: 'guide' });
        if (!guide) {
            console.log('No guide found in the database. Please register as a guide first.');
            process.exit(0);
        }

        const guideId = guide._id;
        console.log(`Testing analytics for Guide: ${guide.name} (${guideId})`);

        // Test the exact logic from the route
        const earnings = await Booking.aggregate([
          { 
            $match: { 
              guide: guideId, 
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
          },
        ]);

        console.log('Earnings Result:', JSON.stringify(earnings, null, 2));

        const potentialEarnings = await Booking.aggregate([
          { 
            $match: { 
              guide: guideId, 
              status: 'confirmed',
              paymentStatus: 'pending'
            } 
          },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        console.log('Potential Earnings Result:', JSON.stringify(potentialEarnings, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Aggregation Engine Failed:', err);
        process.exit(1);
    }
}

test();
