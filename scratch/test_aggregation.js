const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('./models/User');
const Booking = require('./models/Booking');
const Package = require('./models/Package');

const testAggregation = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const guide = await User.findOne({ role: 'guide' });
        if (!guide) {
            console.log('No guide found');
            process.exit(0);
        }

        const guideId = guide._id;
        console.log('Testing aggregation for guide:', guideId);

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
        console.log('Earnings:', earnings);

        const monthlyEarnings = await Booking.aggregate([
            {
              $match: {
                guide: guideId,
                status: { $in: ['confirmed', 'completed'] },
                paymentStatus: 'paid',
                createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
              },
            },
            {
              $group: {
                _id: {
                  month: { $month: '$createdAt' },
                  year: { $year: '$createdAt' },
                },
                total: { $sum: { $subtract: ["$totalAmount", { $ifNull: ["$commission", { $multiply: ["$totalAmount", 0.1] }] }] } },
                gross: { $sum: "$totalAmount" }
              },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
          ]);
        console.log('Monthly Earnings:', monthlyEarnings);

        process.exit(0);
    } catch (err) {
        console.error('Aggregation failed:', err);
        process.exit(1);
    }
};

testAggregation();
