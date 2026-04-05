const mongoose = require('mongoose');
const Booking = require('./server/models/Booking');
const User = require('./server/models/User');
require('dotenv').config({path: './server/.env'});

mongoose.connect(process.env.MONGO_URI, {}).then(async () => {
    try {
        const guide = await User.findOne({role: 'guide'});
        const guideId = guide ? guide._id : new mongoose.Types.ObjectId();
        console.log('Testing with guideId:', guideId);
        
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
              net: { $sum: { $subtract: ['$totalAmount', { $ifNull: ['$commission', { $multiply: ['$totalAmount', 0.1] }] }] } } 
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
              total: { $sum: { $subtract: ['$totalAmount', { $ifNull: ['$commission', { $multiply: ['$totalAmount', 0.1] }] }] } },
              gross: { $sum: '$totalAmount' }
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);
        console.log('Monthly:', monthlyEarnings);
    } catch(e) {
        console.error('ERROR HERE:', e);
    } finally {
        process.exit(0);
    }
});
